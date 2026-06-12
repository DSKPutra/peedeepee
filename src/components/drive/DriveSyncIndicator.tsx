import { AlertTriangle, Check, Cloud, CloudOff, Loader2 } from 'lucide-react';
import { useDriveStore } from '@/store/driveStore';
import { driveService } from '@/services/driveService';

/**
 * Badge mengambang status sinkronisasi Google Drive.
 * Hanya tampil bila VITE_APPS_SCRIPT_URL dikonfigurasi.
 */
export function DriveSyncIndicator() {
  const { status, lastSyncedAt, queueCount } = useDriveStore();

  if (!driveService.isConfigured()) return null;

  const config = {
    idle: { icon: Cloud, text: 'Drive siap', classes: 'border-border text-text-faint' },
    syncing: { icon: Loader2, text: 'Menyinkron…', classes: 'border-info/50 text-info' },
    synced: {
      icon: Check,
      text: lastSyncedAt
        ? `Tersinkron ${new Date(lastSyncedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`
        : 'Tersinkron',
      classes: 'border-success/50 text-success',
    },
    queued: {
      icon: CloudOff,
      text: `${queueCount} antrean offline`,
      classes: 'border-warning/50 text-warning',
    },
    error: { icon: AlertTriangle, text: 'Sync gagal', classes: 'border-danger/50 text-danger' },
  }[status];

  const Icon = config.icon;

  return (
    <div
      className={`fixed bottom-5 left-5 z-40 flex items-center gap-2 rounded-full border bg-surface/90 px-3.5 py-1.5 font-mono text-[11px] shadow-card backdrop-blur ${config.classes}`}
      role="status"
      aria-live="polite"
    >
      <Icon className={`h-3.5 w-3.5 ${status === 'syncing' ? 'animate-spin' : ''}`} />
      {config.text}
    </div>
  );
}
