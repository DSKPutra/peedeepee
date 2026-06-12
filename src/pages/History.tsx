import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ClipboardList, GitCompareArrows, Trash2 } from 'lucide-react';
import type { Assessment, RiskLevel } from '@/types';
import { RISK_LEVEL_META } from '@/types';
import { DOMAINS } from '@/core/constants/domains';
import { useAssessmentStore } from '@/store/assessmentStore';
import { useResultStore } from '@/store/resultStore';
import { useOrgStore } from '@/store/orgStore';
import { formatDateTime } from '@/core/utils/reportFormatter';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';

const riskVariant: Record<RiskLevel, 'danger' | 'warning' | 'info' | 'success'> = {
  CRITICAL: 'danger',
  HIGH: 'danger',
  MEDIUM: 'warning',
  LOW: 'info',
  COMPLIANT: 'success',
};

export default function History() {
  const { assessments, deleteAssessment } = useAssessmentStore();
  const { results, deleteResult } = useResultStore();
  const { hasPermission } = useOrgStore();

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Assessment | null>(null);

  const filtered = useMemo(() => {
    return [...assessments]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .filter((a) => {
        const result = results[a.id];
        if (statusFilter !== 'ALL' && a.status !== statusFilter) return false;
        if (riskFilter !== 'ALL' && result?.riskLevel !== riskFilter) return false;
        const date = a.completedAt ?? a.createdAt;
        if (dateFrom && date < new Date(dateFrom).toISOString()) return false;
        if (dateTo && date > new Date(`${dateTo}T23:59:59`).toISOString()) return false;
        return true;
      });
  }, [assessments, results, statusFilter, riskFilter, dateFrom, dateTo]);

  const trendData = useMemo(
    () =>
      assessments
        .filter((a) => a.status === 'COMPLETED' && results[a.id])
        .sort((a, b) => (a.completedAt ?? '').localeCompare(b.completedAt ?? ''))
        .map((a) => ({
          tanggal: new Date(a.completedAt!).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
          index: results[a.id].totalComplianceIndex,
        })),
    [assessments, results]
  );

  const toggleCompare = (id: string) => {
    setCompareIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 2 ? [...prev, id] : [prev[1], id]
    );
  };

  const compared = compareIds
    .map((id) => ({ assessment: assessments.find((a) => a.id === id), result: results[id] }))
    .filter((x) => x.assessment && x.result);

  if (assessments.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <ClipboardList className="h-14 w-14 text-text-muted" />
        <h1 className="mt-4 font-display text-2xl font-bold text-text-primary">Belum ada riwayat</h1>
        <p className="mt-2 max-w-md text-sm text-text-muted">
          Riwayat assessment akan muncul di sini setelah Anda memulai atau menyelesaikan assessment
          pertama.
        </p>
        {hasPermission('start_assessment') && (
          <Link to="/assessment" className="mt-6">
            <Button size="lg">Mulai Assessment</Button>
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-bold text-text-primary sm:text-3xl">
          Riwayat Assessment
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          {assessments.length} assessment tercatat · pilih 2 untuk mode perbandingan
        </p>
      </div>

      {/* Trend chart */}
      {trendData.length >= 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Tren Compliance Index</CardTitle>
            <CardDescription>Perkembangan indeks dari waktu ke waktu</CardDescription>
          </CardHeader>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trendData} margin={{ top: 8, right: 16, bottom: 4, left: -16 }}>
              <CartesianGrid stroke="#2A2D3E" strokeDasharray="3 3" />
              <XAxis dataKey="tanggal" tick={{ fill: '#A8AABE', fontSize: 11 }} stroke="#2A2D3E" />
              <YAxis domain={[0, 100]} tick={{ fill: '#666880', fontSize: 10, fontFamily: '"IBM Plex Mono"' }} stroke="#2A2D3E" />
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: '#1E2030',
                  border: '1px solid #2A2D3E',
                  borderRadius: 8,
                  color: '#F0F1FA',
                  fontSize: 12,
                }}
                formatter={(v: number) => [`${v.toFixed(1)}%`, 'Compliance Index']}
              />
              <Line
                type="monotone"
                dataKey="index"
                stroke="#6269ED"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#E8AC1A' }}
                isAnimationActive
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Filter */}
      <Card>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Input
            type="date"
            label="Dari tanggal"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
          <Input type="date" label="Sampai tanggal" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          <Select
            label="Risk level"
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            options={[
              { value: 'ALL', label: 'Semua' },
              { value: 'CRITICAL', label: 'KRITIS' },
              { value: 'HIGH', label: 'TINGGI' },
              { value: 'MEDIUM', label: 'SEDANG' },
              { value: 'LOW', label: 'RENDAH' },
              { value: 'COMPLIANT', label: 'PATUH' },
            ]}
          />
          <Select
            label="Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: 'ALL', label: 'Semua' },
              { value: 'COMPLETED', label: 'Selesai' },
              { value: 'IN_PROGRESS', label: 'Berjalan' },
            ]}
          />
        </div>
      </Card>

      {/* Tabel riwayat */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border font-mono text-[11px] uppercase tracking-wider text-text-muted">
                <th className="pb-2 pr-3 font-medium">Banding</th>
                <th className="pb-2 pr-3 font-medium">Tanggal</th>
                <th className="pb-2 pr-3 font-medium">Organisasi</th>
                <th className="pb-2 pr-3 font-medium">Compliance Index</th>
                <th className="pb-2 pr-3 font-medium">Risk Level</th>
                <th className="pb-2 pr-3 font-medium">Status</th>
                <th className="pb-2 font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => {
                const result = results[a.id];
                return (
                  <tr key={a.id} className="border-b border-border/50">
                    <td className="py-3 pr-3">
                      <input
                        type="checkbox"
                        checked={compareIds.includes(a.id)}
                        onChange={() => toggleCompare(a.id)}
                        disabled={!result}
                        aria-label={`Bandingkan ${a.id}`}
                        className="h-4 w-4 accent-[#E8AC1A]"
                      />
                    </td>
                    <td className="py-3 pr-3 text-xs text-text-muted whitespace-nowrap">
                      {formatDateTime(a.completedAt ?? a.createdAt)}
                    </td>
                    <td className="py-3 pr-3 text-text-primary">{a.orgName}</td>
                    <td className="py-3 pr-3 font-mono text-sm font-semibold tabular-nums text-text-primary">
                      {result ? `${result.totalComplianceIndex.toFixed(1)}%` : '—'}
                    </td>
                    <td className="py-3 pr-3">
                      {result ? (
                        <Badge variant={riskVariant[result.riskLevel]} dot>
                          {RISK_LEVEL_META[result.riskLevel].label}
                        </Badge>
                      ) : (
                        <span className="text-xs text-text-muted">—</span>
                      )}
                    </td>
                    <td className="py-3 pr-3">
                      <Badge variant={a.status === 'COMPLETED' ? 'success' : 'warning'}>
                        {a.status === 'COMPLETED' ? 'Selesai' : 'Berjalan'}
                      </Badge>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        {a.status === 'COMPLETED' && result && (
                          <Link to={`/report/${a.id}`} className="text-xs text-accent hover:underline">
                            Laporan
                          </Link>
                        )}
                        {hasPermission('delete_assessment') && (
                          <button
                            onClick={() => setDeleteTarget(a)}
                            aria-label="Hapus assessment"
                            className="rounded p-1 text-text-muted hover:text-danger"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-sm text-text-muted">
                    Tidak ada assessment yang cocok dengan filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {compareIds.length === 2 && (
          <div className="mt-4 flex justify-end">
            <Button onClick={() => setCompareOpen(true)}>
              <GitCompareArrows className="h-4 w-4" />
              Bandingkan 2 Assessment
            </Button>
          </div>
        )}
      </Card>

      {/* Modal perbandingan */}
      <Modal
        open={compareOpen && compared.length === 2}
        onClose={() => setCompareOpen(false)}
        title="Perbandingan Assessment"
        maxWidth="max-w-3xl"
      >
        {compared.length === 2 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {compared.map(({ assessment, result }) => (
                <div key={assessment!.id} className="rounded-md border border-border bg-background/40 p-4 text-center">
                  <p className="font-mono text-[11px] text-text-muted">
                    {formatDateTime(assessment!.completedAt ?? assessment!.createdAt)}
                  </p>
                  <p className="mt-1 font-display text-3xl font-bold tabular-nums text-text-primary">
                    {result!.totalComplianceIndex.toFixed(1)}%
                  </p>
                  <Badge variant={riskVariant[result!.riskLevel]} dot className="mt-2">
                    {RISK_LEVEL_META[result!.riskLevel].label}
                  </Badge>
                </div>
              ))}
            </div>
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border font-mono text-[11px] uppercase tracking-wider text-text-muted">
                  <th className="pb-2 pr-3 font-medium">Domain</th>
                  <th className="pb-2 pr-3 font-medium text-right">A</th>
                  <th className="pb-2 pr-3 font-medium text-right">B</th>
                  <th className="pb-2 font-medium text-right">Δ</th>
                </tr>
              </thead>
              <tbody>
                {DOMAINS.map((d) => {
                  const a = compared[0].result!.domainScores[d.id] ?? 0;
                  const b = compared[1].result!.domainScores[d.id] ?? 0;
                  const delta = b - a;
                  return (
                    <tr key={d.id} className="border-b border-border/50">
                      <td className="py-2.5 pr-3 text-text-primary">{d.shortName}</td>
                      <td className="py-2.5 pr-3 text-right font-mono text-xs tabular-nums text-text-muted">
                        {a.toFixed(1)}%
                      </td>
                      <td className="py-2.5 pr-3 text-right font-mono text-xs tabular-nums text-text-muted">
                        {b.toFixed(1)}%
                      </td>
                      <td
                        className={`py-2.5 text-right font-mono text-xs font-semibold tabular-nums ${
                          delta > 0 ? 'text-success' : delta < 0 ? 'text-danger' : 'text-text-muted'
                        }`}
                      >
                        {delta > 0 ? '+' : ''}
                        {delta.toFixed(1)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Modal>

      {/* Modal konfirmasi hapus */}
      <Modal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Hapus Assessment?"
        maxWidth="max-w-md"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Batal
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (deleteTarget) {
                  deleteAssessment(deleteTarget.id);
                  deleteResult(deleteTarget.id);
                  setCompareIds((prev) => prev.filter((id) => id !== deleteTarget.id));
                }
                setDeleteTarget(null);
              }}
            >
              Hapus Permanen
            </Button>
          </div>
        }
      >
        <p className="text-sm text-text-muted">
          Assessment{' '}
          <span className="font-mono text-text-primary">{deleteTarget?.id}</span> beserta hasil
          scoringnya akan dihapus permanen dari penyimpanan lokal. Tindakan ini tidak dapat
          dibatalkan.
        </p>
      </Modal>
    </div>
  );
}
