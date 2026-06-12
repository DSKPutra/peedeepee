import type { OrgSize } from '@/types';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  jobTitle: string;
  organization: string;
  industry: string;
  orgSize: OrgSize | string;
  role: string;
  lastLoginAt?: string;
  createdAt?: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  fullName: string;
  jobTitle: string;
  organization: string;
  industry: string;
  orgSize: OrgSize | string;
}

export interface ProfileInput {
  fullName: string;
  jobTitle: string;
  organization: string;
  industry: string;
  orgSize: OrgSize | string;
}

/** Bentuk respons standar dari Apps Script backend. */
export interface ApiResponse<T = unknown> {
  success: boolean;
  error?: string;
  message?: string;
  devToken?: string;
  sessionId?: string;
  user?: AuthUser;
  data?: T;
  assessments?: ServerAssessment[];
  assessmentId?: string;
}

export interface ServerAssessment {
  id: string;
  orgName: string;
  createdAt: string;
  completedAt: string;
  status: 'IN_PROGRESS' | 'COMPLETED' | string;
  totalScore: number | string;
  riskLevel: string;
  answers: Record<string, 0 | 1 | 2 | 3>;
  result: unknown;
}
