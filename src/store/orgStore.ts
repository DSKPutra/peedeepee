import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Organization, Permission, UserRole } from '@/types';
import { ROLE_PERMISSIONS } from '@/types';

interface OrgState {
  organization: Organization | null;
  role: UserRole;
  userName: string;
  setOrganization: (org: Organization) => void;
  setRole: (role: UserRole) => void;
  setUserName: (name: string) => void;
  hasPermission: (permission: Permission) => boolean;
  resetOrg: () => void;
}

export const useOrgStore = create<OrgState>()(
  persist(
    (set, get) => ({
      organization: null,
      role: 'DPO',
      userName: 'Pengguna',
      setOrganization: (org) => set({ organization: org }),
      setRole: (role) => set({ role }),
      setUserName: (name) => set({ userName: name }),
      hasPermission: (permission) => ROLE_PERMISSIONS[get().role].includes(permission),
      resetOrg: () => set({ organization: null, role: 'DPO', userName: 'Pengguna' }),
    }),
    { name: 'pdp-org-store' }
  )
);
