import type { ConsentRecord, UserIdentity, WithdrawalRecord } from '@/types';

export const CONSENT_KEY = 'pdp_consent_record';
export const WITHDRAWAL_KEY = 'pdp_consent_withdrawal';
export const WITHDRAWAL_NOTICE_FLAG = 'pdp_withdrawal_notice';
export const PRIVACY_NOTICE_VERSION = '1.0' as const;
export const DATA_CONTROLLER = 'XyberXecurity' as const;
export const LEGAL_BASIS = 'Pasal 20 ayat (2) huruf a UU No. 27 Tahun 2022';
export const PURPOSE_LIMITATION = 'UU PDP Compliance Assessment Only';
export const STORAGE_LOCATION =
  'Browser localStorage + backup terkendali ke Google Drive Pengendali Data';

/** ISO 8601 dengan offset WIB (+07:00), mis. 2026-06-11T16:30:00.000+07:00 */
export function nowJakartaISO(date: Date = new Date()): string {
  const jakarta = new Date(date.getTime() + 7 * 3600 * 1000);
  return jakarta.toISOString().replace('Z', '+07:00');
}

export function getConsentRecord(): ConsentRecord | null {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ConsentRecord;
    if (!parsed || typeof parsed !== 'object' || !parsed.consentId) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function isConsentValid(record: ConsentRecord | null): boolean {
  if (!record) return false;
  return (
    record.version === PRIVACY_NOTICE_VERSION &&
    record.consents?.mainConsent === true &&
    record.consents?.privacyNoticeRead === true &&
    record.consents?.ageVerification === true
  );
}

export function saveConsentRecord(record: ConsentRecord): void {
  localStorage.setItem(CONSENT_KEY, JSON.stringify(record));
}

export function updateConsentIdentity(identity: UserIdentity): ConsentRecord | null {
  const record = getConsentRecord();
  if (!record) return null;
  const updated: ConsentRecord = { ...record, userIdentity: identity };
  saveConsentRecord(updated);
  return updated;
}

/** Hapus consent record saja (untuk re-consent versi baru). */
export function clearConsentRecord(): void {
  localStorage.removeItem(CONSENT_KEY);
}

/**
 * Penarikan persetujuan (Pasal 9): hapus SELURUH data subjek dari browser,
 * simpan hanya catatan penarikan minimal tanpa PII.
 */
export function withdrawConsent(): void {
  const withdrawal: WithdrawalRecord = {
    withdrawnAt: nowJakartaISO(),
    reason: 'user_initiated',
  };
  // Hapus seluruh data aplikasi
  const keysToRemove = [
    CONSENT_KEY,
    'pdp-org-store',
    'pdp-assessment-store',
    'pdp-result-store',
    'pdp-demo-seeded-v1',
    'pdp_drive_queue',
  ];
  keysToRemove.forEach((k) => localStorage.removeItem(k));
  localStorage.setItem(WITHDRAWAL_KEY, JSON.stringify(withdrawal));
  sessionStorage.setItem(WITHDRAWAL_NOTICE_FLAG, '1');
}

export function hasWithdrawalNotice(): boolean {
  return sessionStorage.getItem(WITHDRAWAL_NOTICE_FLAG) !== null;
}

export function clearWithdrawalNotice(): void {
  sessionStorage.removeItem(WITHDRAWAL_NOTICE_FLAG);
}

export function firstNameOf(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? fullName;
}
