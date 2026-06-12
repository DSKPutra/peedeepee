import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthUser, ProfileInput, RegisterInput } from '@/types/auth';
import type { ConsentRecord, OrgSize } from '@/types';
import { authService } from '@/services/authService';
import { useOrgStore } from '@/store/orgStore';
import {
  CONSENT_KEY,
  DATA_CONTROLLER,
  LEGAL_BASIS,
  PRIVACY_NOTICE_VERSION,
  PURPOSE_LIMITATION,
  STORAGE_LOCATION,
  getConsentRecord,
  nowJakartaISO,
  saveConsentRecord,
} from '@/core/utils/consent';

const VALID_SIZES: OrgSize[] = ['STARTUP', 'SMALL', 'MEDIUM', 'LARGE', 'ENTERPRISE'];
function toOrgSize(v: string | OrgSize): OrgSize {
  return (VALID_SIZES as string[]).includes(v as string) ? (v as OrgSize) : 'MEDIUM';
}

/**
 * Cerminkan user terautentikasi ke orgStore + consent record lokal,
 * agar fitur lama (greeting dashboard, header laporan, privasi Settings)
 * tetap berfungsi. Consent yang sah direkam server-side saat registrasi;
 * salinan lokal ini murni untuk kontinuitas UI.
 */
function syncLocalFromUser(user: AuthUser): void {
  const org = useOrgStore.getState();
  org.setOrganization({
    id: `org-${user.id}`,
    name: user.organization,
    industry: user.industry || '—',
    size: toOrgSize(user.orgSize),
    dpoName: user.jobTitle?.toLowerCase().includes('data protection') ? user.fullName : user.fullName,
    createdAt: user.createdAt ?? new Date().toISOString(),
  });
  org.setUserName(user.fullName);

  if (!getConsentRecord()) {
    const now = nowJakartaISO();
    const record: ConsentRecord = {
      version: PRIVACY_NOTICE_VERSION,
      consentId: crypto.randomUUID(),
      timestamp: now,
      timezone: 'Asia/Jakarta',
      userIdentity: {
        fullName: user.fullName,
        jobTitle: user.jobTitle,
        organization: user.organization,
        industry: user.industry,
        orgSize: toOrgSize(user.orgSize),
      },
      consents: {
        mainConsent: true,
        privacyNoticeRead: true,
        usageLimitation: true,
        ageVerification: true,
        notificationOptIn: false,
      },
      privacyNoticeVersion: PRIVACY_NOTICE_VERSION,
      privacyNoticeReadAt: now,
      formCompletedAt: now,
      consentGivenAt: user.createdAt ?? now,
      dataController: DATA_CONTROLLER,
      legalBasis: LEGAL_BASIS,
      purposeLimitation: PURPOSE_LIMITATION,
      storageLocation: STORAGE_LOCATION,
      userAgent: null,
      ipAddress: null,
    };
    saveConsentRecord(record);
  }
}

interface AuthState {
  user: AuthUser | null;
  sessionId: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<boolean>;
  register: (data: RegisterInput) => Promise<boolean>;
  logout: () => Promise<void>;
  validateSession: () => Promise<boolean>;
  updateProfile: (data: ProfileInput) => Promise<boolean>;
  changePassword: (current: string, next: string) => Promise<boolean>;
  logoutAllOthers: () => Promise<boolean>;
  forgotPassword: (email: string) => Promise<{ ok: boolean; devToken?: string }>;
  resetPassword: (email: string, token: string, newPass: string) => Promise<boolean>;
  deleteAccount: (confirmPassword: string) => Promise<boolean>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      sessionId: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        const res = await authService.login(email, password);
        if (res.success && res.user && res.sessionId) {
          syncLocalFromUser(res.user);
          set({ user: res.user, sessionId: res.sessionId, isAuthenticated: true, isLoading: false });
          return true;
        }
        set({ error: res.error ?? 'Login gagal', isLoading: false });
        return false;
      },

      register: async (data) => {
        set({ isLoading: true, error: null });
        const res = await authService.register(data);
        if (res.success && res.user && res.sessionId) {
          syncLocalFromUser(res.user);
          set({ user: res.user, sessionId: res.sessionId, isAuthenticated: true, isLoading: false });
          return true;
        }
        set({ error: res.error ?? 'Registrasi gagal', isLoading: false });
        return false;
      },

      logout: async () => {
        const { sessionId } = get();
        if (sessionId) await authService.logout(sessionId);
        set({ user: null, sessionId: null, isAuthenticated: false, error: null });
      },

      validateSession: async () => {
        const { sessionId } = get();
        if (!sessionId) return false;
        const res = await authService.validateSession(sessionId);
        if (res.success && res.user) {
          syncLocalFromUser(res.user);
          set({ user: res.user, isAuthenticated: true });
          return true;
        }
        set({ user: null, sessionId: null, isAuthenticated: false });
        return false;
      },

      updateProfile: async (data) => {
        const { sessionId } = get();
        if (!sessionId) return false;
        set({ isLoading: true, error: null });
        const res = await authService.updateProfile(sessionId, data);
        if (res.success) {
          set((s) => {
            const updated = s.user ? { ...s.user, ...data } : null;
            if (updated) syncLocalFromUser(updated);
            return { user: updated, isLoading: false };
          });
          return true;
        }
        set({ error: res.error ?? 'Gagal memperbarui profil', isLoading: false });
        return false;
      },

      changePassword: async (current, next) => {
        const { sessionId } = get();
        if (!sessionId) return false;
        set({ isLoading: true, error: null });
        const res = await authService.changePassword(sessionId, current, next);
        set({ isLoading: false, error: res.success ? null : (res.error ?? 'Gagal mengubah password') });
        return res.success;
      },

      logoutAllOthers: async () => {
        const { sessionId } = get();
        if (!sessionId) return false;
        set({ isLoading: true, error: null });
        const res = await authService.logoutAllOthers(sessionId);
        set({ isLoading: false, error: res.success ? null : (res.error ?? 'Gagal') });
        return res.success;
      },

      forgotPassword: async (email) => {
        set({ isLoading: true, error: null });
        const res = await authService.forgotPassword(email);
        set({ isLoading: false, error: res.success ? null : (res.error ?? 'Gagal') });
        return { ok: res.success, devToken: res.devToken };
      },

      resetPassword: async (email, token, newPass) => {
        set({ isLoading: true, error: null });
        const res = await authService.resetPassword(email, token, newPass);
        set({ isLoading: false, error: res.success ? null : (res.error ?? 'Gagal reset password') });
        return res.success;
      },

      deleteAccount: async (confirmPassword) => {
        const { sessionId } = get();
        if (!sessionId) return false;
        set({ isLoading: true, error: null });
        const res = await authService.deleteAccount(sessionId, confirmPassword);
        if (res.success) {
          localStorage.removeItem(CONSENT_KEY);
          set({ user: null, sessionId: null, isAuthenticated: false, isLoading: false });
          return true;
        }
        set({ error: res.error ?? 'Gagal menghapus akun', isLoading: false });
        return false;
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'pdp-auth',
      partialize: (s) => ({ user: s.user, sessionId: s.sessionId, isAuthenticated: s.isAuthenticated }),
    }
  )
);
