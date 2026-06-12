import { useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, ClipboardList, FileDown, Plus, TrendingDown } from 'lucide-react';
import type { DomainId } from '@/types';
import { RISK_LEVEL_META } from '@/types';
import { DOMAINS, getDomain } from '@/core/constants/domains';
import { useAssessmentStore } from '@/store/assessmentStore';
import { useResultStore } from '@/store/resultStore';
import { useOrgStore } from '@/store/orgStore';
import { buildReportData } from '@/core/utils/reportFormatter';
import { generatePdfReport } from '@/core/utils/pdfGenerator';
import { classifyRiskLevel } from '@/core/utils/riskClassifier';
import { firstNameOf, getConsentRecord } from '@/core/utils/consent';
import { driveService } from '@/services/driveService';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ComplianceGaugeRing } from '@/components/dashboard/ComplianceGaugeRing';
import { ComplianceRadarChart } from '@/components/dashboard/ComplianceRadarChart';
import { DomainScoreBarChart } from '@/components/dashboard/DomainScoreBarChart';
import { RiskMatrixCard } from '@/components/dashboard/RiskMatrixCard';
import { FindingsSummaryTable } from '@/components/dashboard/FindingsSummaryTable';
import { RecommendationTimeline } from '@/components/dashboard/RecommendationTimeline';

export default function Dashboard() {
  const navigate = useNavigate();
  const { assessments } = useAssessmentStore();
  const { results } = useResultStore();
  const { organization, hasPermission } = useOrgStore();
  const [exporting, setExporting] = useState(false);
  const domainSectionRef = useRef<HTMLDivElement>(null);

  // Assessment completed terbaru beserta hasilnya
  const latest = useMemo(() => {
    const completed = assessments
      .filter((a) => a.status === 'COMPLETED' && results[a.id])
      .sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''));
    return completed[0] ?? null;
  }, [assessments, results]);

  const result = latest ? results[latest.id] : null;

  const worstDomain = useMemo(() => {
    if (!result) return null;
    let worst: { id: DomainId; score: number } | null = null;
    for (const d of DOMAINS) {
      const score = result.domainScores[d.id] ?? 0;
      if (!worst || score < worst.score) worst = { id: d.id, score };
    }
    return worst;
  }, [result]);

  const consent = getConsentRecord();

  const handleExport = async () => {
    if (!latest || !result || !organization) return;
    setExporting(true);
    try {
      // beri waktu UI merender state loading sebelum proses sinkron jsPDF
      await new Promise((r) => setTimeout(r, 60));
      generatePdfReport(buildReportData(organization, latest, result));
      void driveService.saveReport(result, latest.orgName);
    } finally {
      setExporting(false);
    }
  };

  if (!latest || !result) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <ClipboardList className="h-14 w-14 text-text-muted" />
        <h1 className="mt-4 font-display text-2xl font-bold text-text-primary">
          Belum ada assessment selesai
        </h1>
        <p className="mt-2 max-w-md text-sm text-text-muted">
          Mulai assessment pertama Anda untuk melihat compliance index, analisis gap, dan
          rekomendasi remediasi di dashboard ini.
        </p>
        {hasPermission('start_assessment') && (
          <Link to="/assessment" className="mt-6">
            <Button size="lg">
              <Plus className="h-4 w-4" />
              Mulai Assessment
            </Button>
          </Link>
        )}
      </div>
    );
  }

  const meta = RISK_LEVEL_META[result.riskLevel];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          {consent && (
            <p className="mb-1 text-sm text-text-muted">
              Selamat datang,{' '}
              <span className="font-semibold text-accent">
                {firstNameOf(consent.userIdentity.fullName)}
              </span>{' '}
              👋 — Anda mengakses sebagai {consent.userIdentity.jobTitle} dari{' '}
              {consent.userIdentity.organization}.
            </p>
          )}
          <h1 className="font-display text-2xl font-bold text-text-primary sm:text-3xl">
            Compliance Dashboard
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            {latest.orgName} · Assessment terakhir:{' '}
            {new Date(latest.completedAt ?? latest.createdAt).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>
        <Link to={`/report/${latest.id}`} className="text-sm text-accent hover:underline">
          Lihat laporan lengkap →
        </Link>
      </div>

      {/* ── Row 1: KPI Cards ── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border-l-[3px] border-l-accent">
          <p className="font-mono text-[11px] uppercase tracking-wider text-text-muted">
            Total Compliance Index
          </p>
          <div className="mt-3 flex items-center gap-4">
            <ComplianceGaugeRing
              value={result.totalComplianceIndex}
              riskLevel={result.riskLevel}
              size={72}
              strokeWidth={7}
              showRiskLabel={false}
            />
            <div>
              <p className="font-display text-3xl font-bold tabular-nums text-text-primary">
                {result.totalComplianceIndex.toFixed(1)}%
              </p>
              <p className="font-mono text-xs text-text-muted">dari 100%</p>
            </div>
          </div>
        </Card>

        <Card className="border-l-[3px]" style={{ borderLeftColor: meta.color }}>
          <p className="font-mono text-[11px] uppercase tracking-wider text-text-muted">
            Status Risiko
          </p>
          <div className="mt-3">
            <Badge
              variant={
                result.riskLevel === 'COMPLIANT'
                  ? 'success'
                  : result.riskLevel === 'LOW'
                    ? 'info'
                    : result.riskLevel === 'MEDIUM'
                      ? 'warning'
                      : 'danger'
              }
              dot
              className="text-sm"
            >
              {meta.label}
            </Badge>
            <p className="mt-3 text-xs leading-relaxed text-text-muted">{meta.description}</p>
          </div>
        </Card>

        <Card className="border-l-[3px] border-l-danger">
          <p className="font-mono text-[11px] uppercase tracking-wider text-text-muted">
            Total Temuan
          </p>
          <div className="mt-3 flex items-baseline gap-2">
            <p className="font-display text-4xl font-bold tabular-nums text-text-primary">
              {result.gaps.length}
            </p>
            <span className="text-sm text-text-muted">gap</span>
          </div>
          <p className="mt-2 flex items-center gap-1.5 text-xs text-danger">
            <AlertCircle className="h-3.5 w-3.5" />
            {result.gaps.filter((g) => g.priority === 1).length} prioritas tinggi (P1)
          </p>
        </Card>

        <Card className="border-l-[3px] border-l-orange-400">
          <p className="font-mono text-[11px] uppercase tracking-wider text-text-muted">
            Domain Paling Kritis
          </p>
          {worstDomain && (
            <div className="mt-3">
              <p className="font-display text-lg font-semibold leading-snug text-text-primary">
                {getDomain(worstDomain.id).shortName}
              </p>
              <p className="mt-1 flex items-center gap-1.5 font-mono text-sm tabular-nums text-danger">
                <TrendingDown className="h-4 w-4" />
                {worstDomain.score.toFixed(1)}%
              </p>
              <p className="mt-1 font-mono text-[11px] text-text-muted">
                {getDomain(worstDomain.id).pasalRange}
              </p>
            </div>
          )}
        </Card>
      </div>

      {/* ── Row 2: Radar + Gauge ── */}
      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Radar Kepatuhan 6 Domain</CardTitle>
            <CardDescription>Skor tiap domain terhadap target 100%</CardDescription>
          </CardHeader>
          <ComplianceRadarChart domainScores={result.domainScores} riskLevel={result.riskLevel} />
        </Card>
        <Card className="flex flex-col items-center justify-center lg:col-span-2">
          <CardHeader className="text-center">
            <CardTitle>Compliance Index</CardTitle>
            <CardDescription>Indeks tertimbang seluruh domain</CardDescription>
          </CardHeader>
          <ComplianceGaugeRing value={result.totalComplianceIndex} riskLevel={result.riskLevel} />
        </Card>
      </div>

      {/* ── Row 3: Domain Breakdown ── */}
      <Card>
        <div ref={domainSectionRef}>
          <CardHeader>
            <CardTitle>Skor per Domain</CardTitle>
            <CardDescription>
              Warna bar mengikuti risk level — klik bar untuk detail di laporan
            </CardDescription>
          </CardHeader>
          <DomainScoreBarChart
            domainScores={result.domainScores}
            onBarClick={() => navigate(`/report/${latest.id}`)}
          />
          <div className="mt-2 grid gap-2 border-t border-border pt-4 sm:grid-cols-2 lg:grid-cols-3">
            {DOMAINS.map((d) => {
              const score = result.domainScores[d.id] ?? 0;
              const level = classifyRiskLevel(score);
              return (
                <div key={d.id} className="flex items-center gap-2 text-xs">
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: RISK_LEVEL_META[level].color }}
                  />
                  <span className="truncate text-text-muted">{d.name}</span>
                  <span className="ml-auto font-mono tabular-nums text-text-primary">
                    {score.toFixed(1)}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* ── Row 4: Findings & Recommendations ── */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Temuan Kritis</CardTitle>
            <CardDescription>Gap teratas diurutkan berdasarkan prioritas risiko</CardDescription>
          </CardHeader>
          <FindingsSummaryTable gaps={result.gaps} />
        </Card>
        <div className="space-y-4">
          <RiskMatrixCard gaps={result.gaps} />
          <Card>
            <CardHeader>
              <CardTitle>Timeline Remediasi</CardTitle>
              <CardDescription>Aksi prioritas dalam 3 fase</CardDescription>
            </CardHeader>
            <RecommendationTimeline recommendations={result.recommendations} />
          </Card>
        </div>
      </div>

      {/* ── Floating Action Buttons ── */}
      <div className="fixed bottom-6 right-6 z-30 flex flex-col gap-3">
        {hasPermission('export_pdf') && (
          <Button
            variant="secondary"
            size="lg"
            className="shadow-2xl shadow-black/50"
            onClick={handleExport}
            disabled={exporting}
          >
            <FileDown className="h-4 w-4" />
            {exporting ? 'Membuat PDF…' : 'Export Laporan PDF'}
          </Button>
        )}
        {hasPermission('start_assessment') && (
          <Button size="lg" className="shadow-2xl shadow-black/50" onClick={() => navigate('/assessment')}>
            <Plus className="h-4 w-4" />
            Mulai Assessment Baru
          </Button>
        )}
      </div>
    </div>
  );
}
