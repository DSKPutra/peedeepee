import { create } from 'zustand';
import type { SyncStatus } from '@/types';

interface DriveState {
  status: SyncStatus;
  lastSyncedAt: string | null;
  queueCount: number;
  setStatus: (status: SyncStatus) => void;
  markSynced: () => void;
  setQueueCount: (count: number) => void;
}

function initialQueueCount(): number {
  try {
    return (JSON.parse(localStorage.getItem('pdp_drive_queue') ?? '[]') as unknown[]).length;
  } catch {
    return 0;
  }
}

export const useDriveStore = create<DriveState>((set) => ({
  status: 'idle',
  lastSyncedAt: null,
  queueCount: initialQueueCount(),
  setStatus: (status) => set({ status }),
  markSynced: () => set({ status: 'synced', lastSyncedAt: new Date().toISOString() }),
  setQueueCount: (queueCount) => set({ queueCount }),
}));
