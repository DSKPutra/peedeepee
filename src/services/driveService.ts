import type { Assessment, AssessmentResult, ConsentRecord, ExportType } from '@/types';
import { useDriveStore } from '@/store/driveStore';

/**
 * Sinkronisasi data ke Google Drive milik Pengendali Data melalui
 * Google Apps Script Web App (tanpa OAuth di sisi pengguna).
 *
 * - POST mode no-cors (fire & forget) — respons tidak terbaca, data tetap sampai.
 * - Offline / gagal → masuk antrean localStorage, di-flush saat online kembali.
 */
const SCRIPT_URL = (import.meta.env.VITE_APPS_SCRIPT_URL as string | undefined) ?? '';
const QUEUE_KEY = 'pdp_drive_queue';

interface QueueItem {
  type: ExportType;
  fileName: string;
  data: unknown;
}

function readQueue(): QueueItem[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(QUEUE_KEY) ?? '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeQueue(queue: QueueItem[]): void {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  useDriveStore.getState().setQueueCount(queue.length);
}

function enqueue(item: QueueItem): void {
  const queue = readQueue();
  // progress file di-overwrite — cukup simpan versi terakhir di antrean
  const filtered = queue.filter((q) => q.fileName !== item.fileName);
  filtered.push(item);
  writeQueue(filtered);
}

function sanitize(name: string): string {
  return name.replace(/[^a-zA-Z0-9-_]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'org';
}

function dt(): string {
  return new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
}

async function post(item: QueueItem): Promise<void> {
  await fetch(SCRIPT_URL, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify(item),
  });
}

async function send(
  type: ExportType,
  fileName: string,
  data: unknown
): Promise<{ success: boolean; queued?: boolean }> {
  if (!SCRIPT_URL) return { success: false };
  const store = useDriveStore.getState();
  const item: QueueItem = { type, fileName, data };

  if (!navigator.onLine) {
    enqueue(item);
    store.setStatus('queued');
    return { success: true, queued: true };
  }

  try {
    store.setStatus('syncing');
    await post(item);
    store.markSynced();
    return { success: true };
  } catch {
    enqueue(item);
    store.setStatus('queued');
    return { success: true, queued: true };
  }
}

export async function flushQueue(): Promise<void> {
  if (!SCRIPT_URL || !navigator.onLine) return;
  const queue = readQueue();
  if (queue.length === 0) return;

  const store = useDriveStore.getState();
  store.setStatus('syncing');
  const remaining: QueueItem[] = [];
  for (const item of queue) {
    try {
      await post(item);
    } catch {
      remaining.push(item);
    }
  }
  writeQueue(remaining);
  if (remaining.length === 0) store.markSynced();
  else store.setStatus('queued');
}

export const driveService = {
  isConfigured: () => Boolean(SCRIPT_URL),
  flushQueue,

  saveConsent: (record: ConsentRecord) =>
    send('consent', `consent_${record.consentId}.json`, record),

  saveProgress: (assessment: Assessment, orgName: string) =>
    send('assessment', `progress_${sanitize(orgName)}.json`, assessment),

  saveCompleted: (assessment: Assessment, result: AssessmentResult, orgName: string) =>
    send(
      'assessment',
      `assessment_${sanitize(orgName)}_${Math.round(result.totalComplianceIndex)}pct_${dt()}.json`,
      { assessment, result }
    ),

  saveReport: (result: AssessmentResult, orgName: string) =>
    send(
      'report',
      `report_${sanitize(orgName)}_${Math.round(result.totalComplianceIndex)}pct_${dt()}.json`,
      result
    ),

  saveFullExport: (data: object) => send('export', `full-export_${dt()}.json`, data),
};
