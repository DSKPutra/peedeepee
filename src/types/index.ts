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

export type OrgSize = 'SMALL' | 'MEDIUM' | 'LARGE' | 'ENTERPRISE';

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
    color: '#FF3B3B',
    textClass: 'text-danger',
    bgClass: 'bg-danger/15',
    borderClass: 'border-danger/40',
    description: 'Risiko sanksi pidana/denda signifikan',
  },
  HIGH: {
    label: 'TINGGI',
    color: '#FF8A3B',
    textClass: 'text-orange-400',
    bgClass: 'bg-orange-400/15',
    borderClass: 'border-orange-400/40',
    description: 'Perlu remediation plan segera',
  },
  MEDIUM: {
    label: 'SEDANG',
    color: '#FFB800',
    textClass: 'text-warning',
    bgClass: 'bg-warning/15',
    borderClass: 'border-warning/40',
    description: 'Gap signifikan, perlu perbaikan terstruktur',
  },
  LOW: {
    label: 'RENDAH',
    color: '#4D9FFF',
    textClass: 'text-info',
    bgClass: 'bg-info/15',
    borderClass: 'border-info/40',
    description: 'Minor gaps, monitoring rutin cukup',
  },
  COMPLIANT: {
    label: 'PATUH',
    color: '#00C896',
    textClass: 'text-success',
    bgClass: 'bg-success/15',
    borderClass: 'border-success/40',
    description: 'Postur kepatuhan baik',
  },
};
