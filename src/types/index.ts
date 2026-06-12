// ─── Domain & Question Types ───────────────────────────────────────────────

export type DomainId =
  | 'governance'
  | 'subjectRights'
  | 'dataSecurity'
  | 'thirdParty'
  | 'incidentReporting'
  | 'training';

export type DomainWeightLabel = 'CRITICAL' | 'HIGH' | 'MEDIUM';

export interface Domain {
  id: DomainId;
  name: string;
  shortName: string;
  description: string;
  pasalRange: string;
  weight: number;
  weightLabel: DomainWeightLabel;
  icon: string;
}

export type AnswerValue = 0 | 1 | 2 | 3;

export interface QuestionOption {
  value: AnswerValue;
  label: string;
  description: string;
}

export interface Question {
  id: string;
  domainId: DomainId;
  pasalRef: string;
  question: string;
  weight: 1 | 2 | 3;
  options: QuestionOption[];
  hint: string;
  evidenceRequired: boolean;
}

// ─── Organization & Assessment ─────────────────────────────────────────────

export type OrgSize = 'STARTUP' | 'SMALL' | 'MEDIUM' | 'LARGE' | 'ENTERPRISE';

export interface Organization {
  id: string;
  name: string;
  industry: string;
  size: OrgSize;
  dpoName: string;
  createdAt: string;
}

export type AssessmentStatus = 'IN_PROGRESS' | 'COMPLETED';

export interface Assessment {
  id: string;
  orgId: string;
  orgName: string;
  createdAt: string;
  completedAt: string | null;
  status: AssessmentStatus;
  answers: Record<string, AnswerValue>;
  evidenceFiles: Record<string, string[]>;
}

// ─── Scoring & Results ─────────────────────────────────────────────────────

export type RiskLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'COMPLIANT';

export interface Gap {
  questionId: string;
  domainId: DomainId;
  pasalRef: string;
  description: string;
  currentScore: number;
  maxScore: number;
  gapScore: number;
  riskImpact: RiskLevel;
  priority: 1 | 2 | 3;
}

export type RemediationTimeline = 'IMMEDIATE' | 'SHORT_TERM' | 'LONG_TERM';
export type EffortLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface Recommendation {
  gapId: string;
  action: string;
  timeline: RemediationTimeline;
  responsibleParty: string;
  pasalRef: string;
  estimatedEffort: EffortLevel;
}

export interface AssessmentResult {
  assessmentId: string;
  totalComplianceIndex: number;
  riskLevel: RiskLevel;
  domainScores: Record<DomainId, number>;
  gaps: Gap[];
  recommendations: Recommendation[];
  generatedAt: string;
}

// ─── Consent & Privacy (UU PDP self-compliance) ────────────────────────────

export interface UserIdentity {
  fullName: string;
  jobTitle: string;
  organization: string;
  industry: string;
  orgSize: OrgSize;
}

export interface ConsentRecord {
  version: '1.0';
  consentId: string;
  timestamp: string; // ISO 8601 dengan offset +07:00
  timezone: 'Asia/Jakarta';
  userIdentity: UserIdentity;
  consents: {
    mainConsent: boolean;
    privacyNoticeRead: boolean;
    usageLimitation: boolean;
    ageVerification: boolean;
    notificationOptIn: boolean;
    notificationEmail?: string;
  };
  privacyNoticeVersion: '1.0';
  privacyNoticeReadAt: string;
  formCompletedAt: string;
  consentGivenAt: string;
  dataController: 'XyberXecurity';
  legalBasis: string;
  purposeLimitation: string;
  storageLocation: string;
  userAgent: null; // Tidak direkam (privacy by design)
  ipAddress: null; // Tidak direkam (privacy by design)
}

export interface WithdrawalRecord {
  withdrawnAt: string;
  reason: 'user_initiated';
}

// ─── Google Drive Sync ─────────────────────────────────────────────────────

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error' | 'queued';
export type ExportType = 'consent' | 'assessment' | 'report' | 'export';

// ─── RBAC ──────────────────────────────────────────────────────────────────

export type UserRole = 'ADMINISTRATOR' | 'DPO' | 'AUDITOR';

export type Permission =
  | 'view_dashboard'
  | 'start_assessment'
  | 'view_report'
  | 'export_pdf'
  | 'manage_settings'
  | 'view_history'
  | 'delete_assessment';

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  ADMINISTRATOR: [
    'view_dashboard',
    'start_assessment',
    'view_report',
    'export_pdf',
    'manage_settings',
    'view_history',
    'delete_assessment',
  ],
  DPO: ['view_dashboard', 'start_assessment', 'view_report', 'export_pdf', 'view_history'],
  AUDITOR: ['view_dashboard', 'view_report', 'view_history'],
};

// ─── Risk level metadata (warna & label Indonesia) ─────────────────────────

export interface RiskLevelMeta {
  label: string;
  color: string;
  textClass: string;
  bgClass: string;
  borderClass: string;
  description: string;
}

export const RISK_LEVEL_META: Record<RiskLevel, RiskLevelMeta> = {
  CRITICAL: {
    label: 'KRITIS',
    color: '#EF4444',
    textClass: 'text-danger',
    bgClass: 'bg-danger/15',
    borderClass: 'border-danger/40',
    description: 'Risiko sanksi pidana/denda signifikan',
  },
  HIGH: {
    label: 'TINGGI',
    color: '#FB923C',
    textClass: 'text-orange-400',
    bgClass: 'bg-orange-400/15',
    borderClass: 'border-orange-400/40',
    description: 'Perlu remediation plan segera',
  },
  MEDIUM: {
    label: 'SEDANG',
    color: '#EAB308',
    textClass: 'text-warning',
    bgClass: 'bg-warning/15',
    borderClass: 'border-warning/40',
    description: 'Gap signifikan, perlu perbaikan terstruktur',
  },
  LOW: {
    label: 'RENDAH',
    color: '#60A5FA',
    textClass: 'text-info',
    bgClass: 'bg-info/15',
    borderClass: 'border-info/40',
    description: 'Minor gaps, monitoring rutin cukup',
  },
  COMPLIANT: {
    label: 'PATUH',
    color: '#4ADE80',
    textClass: 'text-success',
    bgClass: 'bg-success/15',
    borderClass: 'border-success/40',
    description: 'Postur kepatuhan baik',
  },
};

/** Gradient ring per risk level (from → to) untuk gauge SVG. */
export const RISK_RING_GRADIENT: Record<RiskLevel, { from: string; to: string }> = {
  CRITICAL: { from: '#DC2626', to: '#EF4444' },
  HIGH: { from: '#EA580C', to: '#FB923C' },
  MEDIUM: { from: '#CA8A04', to: '#EAB308' },
  LOW: { from: '#2563EB', to: '#60A5FA' },
  COMPLIANT: { from: '#16A34A', to: '#4ADE80' },
};
