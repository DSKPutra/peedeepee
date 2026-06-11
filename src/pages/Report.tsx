import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FileDown, FileQuestion, Scale } from 'lucide-react';
import { RISK_LEVEL_META } from '@/types';
import { DOMAINS } from '@/core/constants/domains';
import { useAssessmentStore } from '@/store/assessmentStore';
import { useResultStore } from '@/store/resultStore';
import { useOrgStore } from '@/store/orgStore';
import {
  LEGAL_DISCLAIMER,
  ORG_SIZE_LABEL,
  buildReportData,
  formatDate,
} from '@/core/utils/reportFormatter';
import { generatePdfReport } from '@/core/utils/pdfGenerator';
import { classifyRiskLevel } from '@/core/utils/riskClassifier';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Alert } from '@/components/ui/Alert';
import { ComplianceGaugeRing } from '@/components/dashboard/ComplianceGaugeRing';
import { ComplianceRadarChart } from '@/components/dashboard/ComplianceRadarChart';

const impactVariant = { CRITICAL: 'danger', HIGH: 'warning', MEDIUM: 'warning', LOW: 'info', COMPLIANT: 'success' } as const;

export default function Report() {
  const { assessmentId } = useParams<{ assessmentId: string }>();
  const { assessments } = useAssessmentStore();
  const { results } = useResultStore();
  const { organization, hasPermission } = useOrgStore();
  const [exporting, setExporting] = useState(false);

  const assessment = useMemo(
    () => assessments.find((a) => a.id === assessmentId) ?? null,
    [assessments, assessmentId]
  );
  const result = assessmentId ? results[assessmentId] : undefined;

  const reportData = useMemo(() => {
    if (!assessment || !result) return null;
    const org = organization ?? {
      id: assessment.orgId,
      name: assessment.orgName,
      industry: '—',
      size: 'MEDIUM' as const,
      dpoName: '—',
      createdAt: assessment.createdAt,
    };
    return buildReportData(org, assessment, result);
  }, [assessment, result, organization]);

  if (!assessment || !result || !reportData) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <FileQuestion className="h-12 w-12 text-text-muted" />
        <h1 className="mt-4 font-display text-xl font-bold text-text-primary">
          Laporan tidak ditemukan
        </h1>
        <p className="mt-2 text-sm text-text-muted">
          Assessment belum selesai atau ID tidak valid.
        </p>
        <Link to="/history" className="mt-4 text-sm text-accent hover:underline">
          Lihat riwayat assessment →
        </Link>
      </div>
    );
  }

  const meta = RISK_LEVEL_META[result.riskLevel];
  const topGaps = result.gaps.slice(0, 3);
  const topRec = result.recommendations[0];

  const handleExport = async () => {
    setExporting(true);
    try {
      await new Promise((r) => setTimeout(r, 60));
      generatePdfReport(reportData);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-wider text-accent">
            Laporan Assessment · {assessment.id}
          </p>
          <h1 className="mt-1 font-display text-2xl font-bold text-text-primary sm:text-3xl">
            PDP Readiness Report
          </h1>
        </div>
        {hasPermission('export_pdf') && (
          <Button onClick={handleExport} disabled={exporting}>
            <FileDown className="h-4 w-4" />
            {exporting ? 'Membuat PDF…' : 'Export PDF'}
          </Button>
        )}
      </div>

      {/* ── Section 1: Executive Summary ── */}
      <section>
        <h2 className="mb-4 font-display text-lg font-semibold text-text-primary">
          1 · Executive Summary
        </h2>
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <dl className="space-y-3 text-sm">
              {[
                ['Organisasi', reportData.org.name],
                ['Industri', reportData.org.industry],
                ['Ukuran', ORG_SIZE_LABEL[reportData.org.size] ?? reportData.org.size],
                ['DPO', reportData.org.dpoName],
                ['Tanggal Assessment', formatDate(assessment.completedAt ?? assessment.createdAt)],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="font-mono text-[11px] uppercase tracking-wider text-text-muted">{k}</dt>
                  <dd className="mt-0.5 text-text-primary">{v}</dd>
                </div>
              ))}
            </dl>
          </Card>
          <Card className="flex flex-col items-center justify-center lg:col-span-1">
            <ComplianceGaugeRing value={result.totalComplianceIndex} riskLevel={result.riskLevel} size={190} />
            <p className="mt-3 text-center text-xs text-text-muted">{meta.description}</p>
          </Card>
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Temuan Kritis Teratas</CardTitle>
            </CardHeader>
            {topGaps.length === 0 ? (
              <p className="text-sm text-text-muted">Tidak ada gap kritis.</p>
            ) : (
              <ul className="space-y-2.5">
                {topGaps.map((gap) => (
                  <li key={gap.questionId} className="rounded-md border border-border bg-background/40 p-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="accent">{gap.pasalRef}</Badge>
                      <Badge variant={impactVariant[gap.riskImpact]} dot>
                        {RISK_LEVEL_META[gap.riskImpact].label}
                      </Badge>
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-text-primary line-clamp-2">
                      {gap.description}
                    </p>
                  </li>
                ))}
              </ul>
            )}
            {topRec && (
              <div className="mt-4 border-t border-border pt-3">
                <p className="font-mono text-[11px] uppercase tracking-wider text-text-muted">
                  Rekomendasi prioritas utama
                </p>
                <p className="mt-1.5 text-xs leading-relaxed text-text-primary">{topRec.action}</p>
              </div>
            )}
          </Card>
        </div>
      </section>

      {/* ── Section 2: Domain Analysis ── */}
      <section>
        <h2 className="mb-4 font-display text-lg font-semibold text-text-primary">
          2 · Domain Analysis
        </h2>
        <Card className="mb-4">
          <ComplianceRadarChart domainScores={result.domainScores} riskLevel={result.riskLevel} />
        </Card>
        <div className="space-y-4">
          {DOMAINS.map((domain) => {
            const score = result.domainScores[domain.id] ?? 0;
            const level = classifyRiskLevel(score);
            const rows = reportData.answerRows.find((r) => r.domainName === domain.name)?.rows ?? [];
            return (
              <Card key={domain.id} id={`domain-${domain.id}`}>
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="font-display text-base font-semibold text-text-primary">
                    {domain.name}
                  </h3>
                  <Badge variant="accent">{domain.pasalRange}</Badge>
                  <Badge variant={impactVariant[level]} dot>
                    {RISK_LEVEL_META[level].label}
                  </Badge>
                  <span className="ml-auto font-display text-xl font-bold tabular-nums" style={{ color: RISK_LEVEL_META[level].color }}>
                    {score.toFixed(1)}%
                  </span>
                </div>
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-border font-mono text-[11px] uppercase tracking-wider text-text-muted">
                        <th className="pb-2 pr-3 font-medium">Pasal</th>
                        <th className="pb-2 pr-3 font-medium">Pertanyaan</th>
                        <th className="pb-2 pr-3 font-medium">Jawaban</th>
                        <th className="pb-2 font-medium">Skor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row) => (
                        <tr
                          key={row.pasalRef + row.question}
                          className={`border-b border-border/50 align-top ${
                            row.isGap ? 'bg-danger/5' : ''
                          }`}
                        >
                          <td className="py-2.5 pr-3 font-mono text-xs text-accent whitespace-nowrap">
                            {row.pasalRef}
                          </td>
                          <td className="py-2.5 pr-3 text-xs leading-relaxed text-text-primary">
                            {row.question}
                          </td>
                          <td className="py-2.5 pr-3 text-xs text-text-muted">{row.answerLabel}</td>
                          <td className="py-2.5">
                            <span
                              className={`font-mono text-xs font-bold ${
                                row.isGap ? 'text-danger' : 'text-success'
                              }`}
                            >
                              {row.answer}/3
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* ── Section 3: Gap Analysis ── */}
      <section>
        <h2 className="mb-4 font-display text-lg font-semibold text-text-primary">
          3 · Gap Analysis
        </h2>
        <Card>
          {reportData.gapRows.length === 0 ? (
            <p className="py-6 text-center text-sm text-text-muted">
              Tidak terdapat gap dengan skor di bawah ambang batas.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border font-mono text-[11px] uppercase tracking-wider text-text-muted">
                    <th className="pb-2 pr-3 font-medium">Domain</th>
                    <th className="pb-2 pr-3 font-medium">Referensi Pasal</th>
                    <th className="pb-2 pr-3 font-medium">Deskripsi Gap</th>
                    <th className="pb-2 pr-3 font-medium">Risiko</th>
                    <th className="pb-2 font-medium">Prioritas</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.gapRows.map((row, i) => (
                    <tr key={i} className="border-b border-border/50 align-top">
                      <td className="py-2.5 pr-3 text-xs text-text-primary whitespace-nowrap">{row.domain}</td>
                      <td className="py-2.5 pr-3 font-mono text-xs text-accent whitespace-nowrap">{row.pasalRef}</td>
                      <td className="py-2.5 pr-3 text-xs leading-relaxed text-text-muted">{row.description}</td>
                      <td className="py-2.5 pr-3">
                        <span className="font-mono text-xs font-semibold" style={{ color: row.riskColor }}>
                          {row.risk}
                        </span>
                      </td>
                      <td className="py-2.5 font-mono text-xs font-bold text-text-primary">{row.priority}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </section>

      {/* ── Section 4: Remediation Roadmap ── */}
      <section>
        <h2 className="mb-4 font-display text-lg font-semibold text-text-primary">
          4 · Remediation Roadmap
        </h2>
        <div className="grid gap-4 lg:grid-cols-3">
          {reportData.roadmap.map((phase) => (
            <Card key={phase.phase}>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: phase.color }} />
                <CardTitle>{phase.phase}</CardTitle>
                <span className="ml-auto font-mono text-[11px] text-text-muted">{phase.range}</span>
              </div>
              <CardDescription className="mb-3">{phase.items.length} aksi remediasi</CardDescription>
              <ul className="space-y-2.5">
                {phase.items.map((item, i) => (
                  <li key={i} className="rounded-md border border-border bg-background/40 p-3">
                    <p className="text-xs leading-relaxed text-text-primary">{item.action}</p>
                    <p className="mt-2 font-mono text-[10px] text-text-muted">
                      {item.pasalRef} · PIC: {item.responsible} · Effort: {item.effort}
                    </p>
                  </li>
                ))}
                {phase.items.length === 0 && (
                  <li className="text-xs text-text-muted">Tidak ada aksi pada fase ini.</li>
                )}
              </ul>
            </Card>
          ))}
        </div>
      </section>

      {/* ── Section 5: Disclaimer ── */}
      <section>
        <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold text-text-primary">
          <Scale className="h-5 w-5 text-accent" />5 · Disclaimer Hukum
        </h2>
        <Alert variant="info">{LEGAL_DISCLAIMER}</Alert>
      </section>
    </div>
  );
}
