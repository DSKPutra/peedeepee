import type { Assessment, AssessmentResult, Organization } from '@/types';
import { RISK_LEVEL_META } from '@/types';
import { DOMAINS, getDomain } from '@/core/constants/domains';
import { getQuestion } from '@/core/constants/questions';
import { TIMELINE_META } from '@/core/constants/recommendations';
import { getConsentRecord } from '@/core/utils/consent';

export function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function formatDateTime(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatPercent(n: number): string {
  return `${n.toFixed(1)}%`;
}

export const ORG_SIZE_LABEL: Record<string, string> = {
  STARTUP: 'Startup / UMKM (< 50 karyawan)',
  SMALL: 'Perusahaan Kecil (50-250 karyawan)',
  MEDIUM: 'Perusahaan Menengah (251-1000 karyawan)',
  LARGE: 'Perusahaan Besar (1001-5000 karyawan)',
  ENTERPRISE: 'Korporasi (> 5000 karyawan)',
};

export interface ReportPreparedBy {
  fullName: string;
  jobTitle: string;
  organization: string;
  consentId: string;
  consentGivenAt: string;
}

export interface ReportExportData {
  org: Organization;
  assessment: Assessment;
  result: AssessmentResult;
  /** Identitas pemberi consent (Pasal 20-21 UU PDP) untuk header laporan. */
  preparedBy: ReportPreparedBy | null;
  domainRows: {
    name: string;
    pasalRange: string;
    weightLabel: string;
    score: number;
    riskLabel: string;
    riskColor: string;
  }[];
  gapRows: {
    domain: string;
    pasalRef: string;
    description: string;
    risk: string;
    riskColor: string;
    priority: string;
  }[];
  roadmap: {
    phase: string;
    range: string;
    color: string;
    items: { action: string; responsible: string; pasalRef: string; effort: string }[];
  }[];
  answerRows: {
    domainName: string;
    rows: { pasalRef: string; question: string; answer: number; answerLabel: string; isGap: boolean }[];
  }[];
}

/** Susun seluruh data laporan dalam bentuk siap-render (UI & PDF). */
export function buildReportData(
  org: Organization,
  assessment: Assessment,
  result: AssessmentResult
): ReportExportData {
  const domainRows = DOMAINS.map((d) => {
    const score = result.domainScores[d.id] ?? 0;
    const level =
      score < 40 ? 'CRITICAL' : score < 60 ? 'HIGH' : score < 80 ? 'MEDIUM' : score < 90 ? 'LOW' : 'COMPLIANT';
    return {
      name: d.name,
      pasalRange: d.pasalRange,
      weightLabel: d.weightLabel,
      score,
      riskLabel: RISK_LEVEL_META[level as keyof typeof RISK_LEVEL_META].label,
      riskColor: RISK_LEVEL_META[level as keyof typeof RISK_LEVEL_META].color,
    };
  });

  const gapRows = result.gaps.map((g) => ({
    domain: getDomain(g.domainId).shortName,
    pasalRef: g.pasalRef,
    description: g.description,
    risk: RISK_LEVEL_META[g.riskImpact].label,
    riskColor: RISK_LEVEL_META[g.riskImpact].color,
    priority: `P${g.priority}`,
  }));

  const roadmap = (['IMMEDIATE', 'SHORT_TERM', 'LONG_TERM'] as const).map((phase) => ({
    phase: TIMELINE_META[phase].label,
    range: TIMELINE_META[phase].range,
    color: TIMELINE_META[phase].color,
    items: result.recommendations
      .filter((r) => r.timeline === phase)
      .map((r) => ({
        action: r.action,
        responsible: r.responsibleParty,
        pasalRef: r.pasalRef,
        effort: r.estimatedEffort,
      })),
  }));

  const answerRows = DOMAINS.map((d) => ({
    domainName: d.name,
    rows: Object.entries(assessment.answers)
      .map(([qid, answer]) => ({ q: getQuestion(qid), answer }))
      .filter((x) => x.q && x.q.domainId === d.id)
      .map((x) => ({
        pasalRef: x.q!.pasalRef,
        question: x.q!.question,
        answer: x.answer,
        answerLabel: x.q!.options.find((o) => o.value === x.answer)?.label ?? '—',
        isGap: x.answer < 2,
      })),
  }));

  const consent = getConsentRecord();
  const preparedBy = consent
    ? {
        fullName: consent.userIdentity.fullName,
        jobTitle: consent.userIdentity.jobTitle,
        organization: consent.userIdentity.organization,
        consentId: consent.consentId,
        consentGivenAt: consent.consentGivenAt,
      }
    : null;

  return { org, assessment, result, preparedBy, domainRows, gapRows, roadmap, answerRows };
}

export const LEGAL_DISCLAIMER =
  'Laporan ini dihasilkan secara otomatis oleh PDP Readiness Assessment Tool dan bersifat indikatif berdasarkan jawaban self-assessment yang diberikan organisasi. Laporan ini bukan merupakan nasihat hukum dan tidak menggantikan konsultasi dengan penasihat hukum profesional maupun penilaian resmi oleh lembaga pengawas pelindungan data pribadi. XyberXecurity tidak bertanggung jawab atas keputusan yang diambil semata-mata berdasarkan laporan ini. Akurasi hasil bergantung sepenuhnya pada kejujuran dan ketepatan jawaban yang diberikan.';
