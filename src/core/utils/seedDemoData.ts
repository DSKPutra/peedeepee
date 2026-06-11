import type { AnswerValue, Assessment, Organization } from '@/types';
import { useAssessmentStore } from '@/store/assessmentStore';
import { useOrgStore } from '@/store/orgStore';
import { useResultStore } from '@/store/resultStore';

const SEED_FLAG = 'pdp-demo-seeded-v1';

/**
 * Jawaban demo dikalibrasi menghasilkan total compliance index ±61%
 * (risk level SEDANG) dengan gap kritis terkonsentrasi di domain
 * Hak Subjek Data dan Pelaporan Insiden.
 */
const DEMO_ANSWERS: Record<string, AnswerValue> = {
  // Tata Kelola — relatif matang (±78%)
  'gov-01': 3, 'gov-02': 2, 'gov-03': 2, 'gov-04': 2, 'gov-05': 3,
  'gov-06': 2, 'gov-07': 3, 'gov-08': 2, 'gov-09': 2, 'gov-10': 2,
  // Hak Subjek Data — lemah (±50%), beberapa gap kritis
  'sr-01': 3, 'sr-02': 1, 'sr-03': 1, 'sr-04': 1, 'sr-05': 1,
  'sr-06': 2, 'sr-07': 2, 'sr-08': 1, 'sr-09': 2, 'sr-10': 0,
  // Keamanan Data — cukup baik (±72%)
  'sec-01': 3, 'sec-02': 3, 'sec-03': 2, 'sec-04': 2, 'sec-05': 2,
  'sec-06': 2, 'sec-07': 2, 'sec-08': 2, 'sec-09': 1, 'sec-10': 2,
  // Pihak Ketiga — menengah (±61%)
  'tp-01': 2, 'tp-02': 2, 'tp-03': 2, 'tp-04': 2, 'tp-05': 2,
  'tp-06': 1, 'tp-07': 2, 'tp-08': 2, 'tp-09': 2, 'tp-10': 1,
  // Pelaporan Insiden — lemah (±45%), gap kritis pada notifikasi 3x24 jam
  'ir-01': 2, 'ir-02': 1, 'ir-03': 1, 'ir-04': 1, 'ir-05': 2,
  'ir-06': 1, 'ir-07': 1, 'ir-08': 2, 'ir-09': 1, 'ir-10': 2,
  // Pelatihan — cukup (±65%)
  'tr-01': 2, 'tr-02': 2, 'tr-03': 3, 'tr-04': 1, 'tr-05': 3,
  'tr-06': 2, 'tr-07': 2, 'tr-08': 2, 'tr-09': 1, 'tr-10': 2,
};

export function seedDemoDataIfNeeded(): void {
  if (localStorage.getItem(SEED_FLAG)) return;

  const org: Organization = {
    id: 'org-demo-001',
    name: 'PT Maju Bersama Tbk',
    industry: 'Perbankan',
    size: 'LARGE',
    dpoName: 'Ratna Wijayanti, S.H., CIPP/E',
    createdAt: new Date(Date.now() - 45 * 24 * 3600 * 1000).toISOString(),
  };

  const completedAt = new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString();
  const assessment: Assessment = {
    id: 'asmt-demo-001',
    orgId: org.id,
    orgName: org.name,
    createdAt: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString(),
    completedAt,
    status: 'COMPLETED',
    answers: DEMO_ANSWERS,
    evidenceFiles: {
      'gov-01': ['Kebijakan-Pelindungan-Data-Pribadi-v2.1.pdf'],
      'gov-05': ['SK-Penunjukan-DPO-2026.pdf'],
      'sec-01': ['Enkripsi-Database-Audit-Report.pdf'],
    },
  };

  const orgStore = useOrgStore.getState();
  if (!orgStore.organization) {
    orgStore.setOrganization(org);
    orgStore.setUserName('Ratna Wijayanti');
  }

  const assessmentStore = useAssessmentStore.getState();
  if (!assessmentStore.assessments.some((a) => a.id === assessment.id)) {
    assessmentStore.importAssessments([...assessmentStore.assessments, assessment]);
  }

  useResultStore.getState().computeAndStore(assessment);

  localStorage.setItem(SEED_FLAG, '1');
}
