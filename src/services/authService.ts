import type { ApiResponse, ProfileInput, RegisterInput } from '@/types/auth';
import type { Assessment, AssessmentResult } from '@/types';

const BASE_URL = (import.meta.env.VITE_APPS_SCRIPT_URL as string | undefined) ?? '';

/**
 * Satu jalur pemanggilan ke Apps Script Web App.
 *
 * Kunci agar respons BISA dibaca (tidak opaque): POST dengan
 * Content-Type "text/plain" — ini "simple request" sehingga browser
 * TIDAK mengirim preflight OPTIONS (yang tidak didukung Apps Script),
 * dan respons akhir membawa header Access-Control-Allow-Origin: *.
 * Karena itu kita TIDAK memakai mode: 'no-cors'.
 */
async function call<T = unknown>(action: string, body: Record<string, unknown> = {}): Promise<ApiResponse<T>> {
  if (!BASE_URL) {
    return { success: false, error: 'Backend belum dikonfigurasi (VITE_APPS_SCRIPT_URL kosong).' };
  }
  try {
    const res = await fetch(BASE_URL, {
      method: 'POST',
      redirect: 'follow',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action, ...body }),
    });
    if (!res.ok) return { success: false, error: `HTTP ${res.status}` };

    const text = await res.text();
    // Apps Script mengembalikan halaman login Google bila akses deployment
    // BUKAN "Anyone" — deteksi & beri pesan yang actionable, bukan parse error.
    if (/accounts\.google\.com|<!doctype html|<html/i.test(text)) {
      return {
        success: false,
        error:
          'Backend menolak akses (meminta login Google). Buka Apps Script → Deploy → Manage deployments → Edit → set "Who has access" ke "Anyone", lalu deploy versi baru.',
      };
    }
    try {
      return JSON.parse(text) as ApiResponse<T>;
    } catch {
      return {
        success: false,
        error:
          'Respons backend tidak valid. Pastikan kode scripts/apps-script-backend.js sudah dipaste & di-deploy ulang.',
      };
    }
  } catch (e) {
    return {
      success: false,
      error:
        e instanceof Error
          ? `Gagal terhubung ke backend: ${e.message}`
          : 'Gagal terhubung ke backend',
    };
  }
}

export const authService = {
  isConfigured: () => Boolean(BASE_URL),
  ping: () => call('ping'),

  register: (data: RegisterInput) => call('register', { ...data }),
  login: (email: string, password: string) => call('login', { email, password }),
  logout: (sessionId: string) => call('logout', { sessionId }),
  validateSession: (sessionId: string) => call('validateSession', { sessionId }),

  getProfile: (sessionId: string) => call('getProfile', { sessionId }),
  updateProfile: (sessionId: string, data: ProfileInput) => call('updateProfile', { sessionId, ...data }),
  changePassword: (sessionId: string, currentPassword: string, newPassword: string) =>
    call('changePassword', { sessionId, currentPassword, newPassword }),
  logoutAllOthers: (sessionId: string) => call('logoutAllOthers', { sessionId }),
  forgotPassword: (email: string) => call('forgotPassword', { email }),
  resetPassword: (email: string, token: string, newPassword: string) =>
    call('resetPassword', { email, token, newPassword }),
  deleteAccount: (sessionId: string, confirmPassword: string) =>
    call('deleteAccount', { sessionId, confirmPassword }),

  saveAssessment: (sessionId: string, assessment: Assessment, result?: AssessmentResult) =>
    call('saveAssessment', { sessionId, assessment, result }),
  getAssessments: (sessionId: string) => call('getAssessments', { sessionId }),
  deleteAssessment: (sessionId: string, assessmentId: string) =>
    call('deleteAssessment', { sessionId, assessmentId }),
  exportUserData: (sessionId: string) => call('exportUserData', { sessionId }),
};
