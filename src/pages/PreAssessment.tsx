import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Building2,
  CalendarClock,
  Check,
  Factory,
  ShieldCheck,
  User,
} from 'lucide-react';
import logo from '@/assets/logo.svg';
import type { ConsentRecord, UserIdentity } from '@/types';
import {
  DATA_CONTROLLER,
  LEGAL_BASIS,
  PRIVACY_NOTICE_VERSION,
  PURPOSE_LIMITATION,
  STORAGE_LOCATION,
  getConsentRecord,
  isConsentValid,
  nowJakartaISO,
  saveConsentRecord,
} from '@/core/utils/consent';
import { PrivacyNoticeContent } from '@/components/consent/PrivacyNoticeContent';
import { IdentityForm, ORG_SIZE_OPTIONS } from '@/components/consent/IdentityForm';
import { useOrgStore } from '@/store/orgStore';
import { driveService } from '@/services/driveService';

// ─── Step indicator ──────────────────────────────────────────────────────────

const STEPS = [
  { num: 1, label: 'Privacy Notice' },
  { num: 2, label: 'Identitas' },
  { num: 3, label: 'Persetujuan' },
];

function StepIndicator({ current }: { current: number }) {
  return (
    <nav aria-label="Langkah pre-assessment" className="mx-auto max-w-md">
      <ol className="flex items-center">
        {STEPS.map((step, i) => {
          const done = current > step.num;
          const active = current === step.num;
          return (
            <li key={step.num} className={`flex items-center ${i > 0 ? 'flex-1' : ''}`}>
              {i > 0 && (
                <div
                  className={`mx-2 h-px flex-1 transition-colors ${
                    current > i ? 'bg-accent' : 'bg-border'
                  }`}
                />
              )}
              <div className="flex flex-col items-center gap-1.5">
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-full border-2 font-mono text-sm font-bold transition-all ${
                    done
                      ? 'border-success bg-success text-background'
                      : active
                        ? 'border-accent bg-accent text-background shadow-glow-amber'
                        : 'border-border text-text-faint'
                  }`}
                  aria-current={active ? 'step' : undefined}
                >
                  {done ? <Check className="h-4 w-4" /> : step.num}
                </span>
                <span
                  className={`text-[11px] font-medium ${
                    active ? 'text-accent' : done ? 'text-success' : 'text-text-faint'
                  }`}
                >
                  {step.label}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// ─── Custom checkbox dengan checkmark SVG animasi ────────────────────────────

interface ConsentCheckboxProps {
  id: string;
  checked: boolean;
  required?: boolean;
  title: string;
  children: React.ReactNode;
  onChange: (checked: boolean) => void;
}

function ConsentCheckbox({ id, checked, required = true, title, children, onChange }: ConsentCheckboxProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-labelledby={`${id}-title`}
      onClick={() => onChange(!checked)}
      onKeyDown={(e) => {
        if (e.key === ' ') {
          e.preventDefault();
          onChange(!checked);
        }
      }}
      className={`flex w-full items-start gap-3.5 rounded-lg border p-4 text-left transition-all duration-150 ${
        checked
          ? 'border-accent/70 bg-accent/5'
          : required
            ? 'border-border-strong bg-subtle hover:border-accent/50'
            : 'border-border bg-subtle hover:border-border-strong'
      }`}
    >
      <span
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-all ${
          checked ? 'border-accent bg-accent' : required ? 'border-accent/60' : 'border-border-strong'
        }`}
        aria-hidden="true"
      >
        <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
          <path
            d="M5 13l4 4L19 7"
            stroke="#0E0F14"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              strokeDasharray: 24,
              strokeDashoffset: checked ? 0 : 24,
              transition: 'stroke-dashoffset 0.25s cubic-bezier(0.22, 1, 0.36, 1)',
            }}
          />
        </svg>
      </span>
      <span>
        <span id={`${id}-title`} className="block font-mono text-[11px] font-bold uppercase tracking-wider text-text-primary">
          {title}{' '}
          <span className={required ? 'text-accent' : 'text-text-faint'}>
            ({required ? 'wajib' : 'opsional'})
          </span>
        </span>
        <span className="mt-1 block text-xs leading-relaxed text-text-muted">{children}</span>
      </span>
    </button>
  );
}

// ─── Halaman utama ───────────────────────────────────────────────────────────

export default function PreAssessment() {
  const navigate = useNavigate();
  const { setOrganization, setUserName, organization } = useOrgStore();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [noticeRead, setNoticeRead] = useState(false);
  const [scrollPct, setScrollPct] = useState(0);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [noticeReadAt, setNoticeReadAt] = useState<string | null>(null);
  const [identity, setIdentity] = useState<UserIdentity | null>(null);
  const [formCompletedAt, setFormCompletedAt] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [checks, setChecks] = useState({
    mainConsent: false,
    privacyNoticeRead: false,
    usageLimitation: false,
    ageVerification: false,
    notificationOptIn: false,
  });
  const [notificationEmail, setNotificationEmail] = useState('');

  const scrollRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Jika sudah punya consent valid, langsung ke dashboard
  useEffect(() => {
    if (isConsentValid(getConsentRecord())) navigate('/dashboard', { replace: true });
  }, [navigate]);

  // IntersectionObserver pada sentinel akhir notice — verifikasi scroll penuh
  useEffect(() => {
    if (step !== 1 || noticeRead) return;
    const sentinel = sentinelRef.current;
    const root = scrollRef.current;
    if (!sentinel || !root) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setNoticeRead(true);
          setScrollPct(100);
          setNoticeReadAt(nowJakartaISO());
        }
      },
      { root, threshold: 0.9 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [step, noticeRead]);

  const handleNoticeScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    if (el.scrollTop > 24) setHasScrolled(true);
    const max = el.scrollHeight - el.clientHeight;
    if (max <= 0) return;
    const pct = Math.min(100, Math.round((el.scrollTop / max) * 100));
    setScrollPct((prev) => Math.max(prev, pct));
    // Fallback bila IntersectionObserver tidak menembak (zoom/rounding edge case)
    if (pct >= 98 && !noticeRead) {
      setNoticeRead(true);
      setScrollPct(100);
      setNoticeReadAt(nowJakartaISO());
    }
  };

  const requiredChecked =
    checks.mainConsent && checks.privacyNoticeRead && checks.usageLimitation && checks.ageVerification;

  const emailValid =
    !checks.notificationOptIn ||
    notificationEmail.trim() === '' ||
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(notificationEmail.trim());

  const nowDisplay = useMemo(
    () =>
      new Date().toLocaleString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    [step]
  );

  const handleIdentitySubmit = (values: UserIdentity) => {
    setIdentity(values);
    setFormCompletedAt(nowJakartaISO());
    setStep(3);
    window.scrollTo({ top: 0 });
  };

  const handleFinalSubmit = async () => {
    if (!identity || !requiredChecked || !emailValid || submitting) return;
    setSubmitting(true);
    try {
      const record: ConsentRecord = {
        version: PRIVACY_NOTICE_VERSION,
        consentId: crypto.randomUUID(),
        timestamp: nowJakartaISO(),
        timezone: 'Asia/Jakarta',
        userIdentity: identity,
        consents: {
          ...checks,
          notificationEmail:
            checks.notificationOptIn && notificationEmail.trim()
              ? notificationEmail.trim()
              : undefined,
        },
        privacyNoticeVersion: PRIVACY_NOTICE_VERSION,
        privacyNoticeReadAt: noticeReadAt ?? nowJakartaISO(),
        formCompletedAt: formCompletedAt ?? nowJakartaISO(),
        consentGivenAt: nowJakartaISO(),
        dataController: DATA_CONTROLLER,
        legalBasis: LEGAL_BASIS,
        purposeLimitation: PURPOSE_LIMITATION,
        storageLocation: STORAGE_LOCATION,
        userAgent: null,
        ipAddress: null,
      };
      saveConsentRecord(record);

      // Auto-populate profil organisasi dari identitas consent
      setOrganization({
        id: organization?.id ?? `org-${Date.now()}`,
        name: identity.organization,
        industry: identity.industry,
        size: identity.orgSize,
        dpoName: identity.jobTitle.toLowerCase().includes('data protection')
          ? identity.fullName
          : (organization?.dpoName ?? identity.fullName),
        createdAt: organization?.createdAt ?? new Date().toISOString(),
      });
      setUserName(identity.fullName);

      // Rekam bukti consent ke penyimpanan pengendali (backup)
      void driveService.saveConsent(record);

      navigate('/dashboard');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-surface px-4 py-10">
      <div className="mx-auto w-full max-w-[680px]">
        {/* Header */}
        <Link to="/" className="mb-8 flex items-center justify-center gap-2.5">
          <img src={logo} alt="XyberXecurity" className="h-9 w-9" />
          <span className="bg-gradient-to-br from-text-primary to-accent bg-clip-text font-display text-lg font-extrabold text-transparent">
            XyberXecurity
          </span>
        </Link>

        <StepIndicator current={step} />

        {/* ═══ STEP 1 — PRIVACY NOTICE ═══ */}
        {step === 1 && (
          <section className="mt-8 animate-fade-in" aria-labelledby="notice-title">
            <h1 id="notice-title" className="text-center font-display text-2xl font-bold text-text-primary">
              Pemberitahuan Pemrosesan Data Pribadi
            </h1>
            <p className="mt-1 text-center text-sm italic text-text-muted">
              Berdasarkan Pasal 20-21 UU PDP No. 27 Tahun 2022
            </p>

            <div className="relative mt-6">
              <div
                ref={scrollRef}
                onScroll={handleNoticeScroll}
                className="notice-scroll h-[55vh] overflow-y-auto rounded-xl border border-border border-l-[3px] border-l-accent bg-surface p-5 shadow-card sm:p-6"
                tabIndex={0}
                aria-label="Isi pemberitahuan pemrosesan data pribadi"
              >
                <PrivacyNoticeContent />
                <div ref={sentinelRef} className="h-1" />
              </div>
              {!hasScrolled && (
                <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 animate-float rounded-full border border-accent/40 bg-background/90 px-4 py-1.5 font-mono text-xs text-accent backdrop-blur">
                  <ArrowDown className="mr-1.5 inline h-3.5 w-3.5" />
                  Scroll untuk membaca
                </div>
              )}
            </div>

            {/* Scroll progress */}
            <div className="mt-4">
              <div className="mb-1.5 flex items-center justify-between font-mono text-[11px] text-text-muted">
                <span>Anda telah membaca {scrollPct}% dari pemberitahuan ini</span>
                {noticeRead && <span className="text-success">✓ Selesai dibaca</span>}
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-elevated">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-accent-500 to-accent-400 transition-all duration-300"
                  style={{ width: `${scrollPct}%` }}
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => {
                  setStep(2);
                  window.scrollTo({ top: 0 });
                }}
                disabled={!noticeRead}
                title={!noticeRead ? 'Harap baca seluruh pemberitahuan terlebih dahulu' : undefined}
                className="inline-flex h-11 items-center gap-2 rounded-lg bg-gradient-to-br from-accent-400 to-accent-500 px-6 text-sm font-semibold text-background shadow-btn-accent transition-all hover:shadow-btn-accent-hover disabled:cursor-not-allowed disabled:from-elevated disabled:to-elevated disabled:text-text-faint disabled:shadow-none"
              >
                Tutup dan Lanjutkan ke Formulir
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </section>
        )}

        {/* ═══ STEP 2 — FORM IDENTITAS ═══ */}
        {step === 2 && (
          <section className="mt-8 animate-fade-in" aria-labelledby="identity-title">
            <div className="card-surface p-6 sm:p-8">
              <h1 id="identity-title" className="font-display text-2xl font-bold text-text-primary">
                Identifikasi Pengguna Assessment
              </h1>
              <p className="mt-1.5 text-sm text-text-muted">
                Informasi ini akan ditampilkan pada laporan kepatuhan Anda. Semua field wajib
                diisi.
              </p>
              <div className="mt-6">
                <IdentityForm
                  initial={identity}
                  onSubmit={handleIdentitySubmit}
                  submitLabel={
                    <>
                      Lanjutkan ke Persetujuan
                      <ArrowRight className="h-4 w-4" />
                    </>
                  }
                  secondaryAction={
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="inline-flex h-11 items-center gap-2 rounded-lg border border-border px-5 text-sm text-text-muted transition-colors hover:border-border-strong hover:text-text-primary"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Baca Ulang Privacy Notice
                    </button>
                  }
                />
              </div>
            </div>
          </section>
        )}

        {/* ═══ STEP 3 — KONFIRMASI CONSENT ═══ */}
        {step === 3 && identity && (
          <section className="mt-8 animate-fade-in" aria-labelledby="consent-title">
            <h1 id="consent-title" className="text-center font-display text-2xl font-bold text-text-primary">
              Persetujuan Pemrosesan Data Pribadi
            </h1>
            <p className="mt-1 text-center text-sm italic text-text-muted">
              Pasal 20 ayat (2) huruf a UU PDP No. 27 Tahun 2022
            </p>

            {/* Summary box */}
            <div className="mt-6 rounded-xl border border-primary-500/40 bg-primary-500/5 p-5">
              <p className="font-mono text-[11px] font-bold uppercase tracking-wider text-text-muted">
                Data yang akan diproses:
              </p>
              <ul className="mt-3 space-y-2 text-sm text-text-primary">
                <li className="flex items-center gap-2.5">
                  <User className="h-4 w-4 shrink-0 text-primary-300" />
                  {identity.fullName}
                </li>
                <li className="flex items-center gap-2.5">
                  <Briefcase className="h-4 w-4 shrink-0 text-primary-300" />
                  {identity.jobTitle} di {identity.organization}
                </li>
                <li className="flex items-center gap-2.5">
                  <Factory className="h-4 w-4 shrink-0 text-primary-300" />
                  {identity.industry} ·{' '}
                  {ORG_SIZE_OPTIONS.find((o) => o.value === identity.orgSize)?.label}
                </li>
                <li className="flex items-center gap-2.5">
                  <CalendarClock className="h-4 w-4 shrink-0 text-primary-300" />
                  Assessment dimulai: {nowDisplay}
                </li>
              </ul>
              <div className="mt-4 space-y-1 border-t border-primary-500/30 pt-3 font-mono text-[11px] text-text-muted">
                <p>
                  Tujuan : <span className="text-text-primary">Menghasilkan laporan kepatuhan UU PDP</span>
                </p>
                <p>
                  Penyimpanan : <span className="text-text-primary">Browser Anda + backup terkendali pengendali data</span>
                </p>
              </div>
            </div>

            {/* Checkboxes */}
            <div className="mt-6 space-y-3">
              <ConsentCheckbox
                id="chk-main"
                title="Consent Utama"
                checked={checks.mainConsent}
                onChange={(v) => setChecks((c) => ({ ...c, mainConsent: v }))}
              >
                Saya menyetujui pemrosesan data pribadi saya (nama, jabatan, dan perusahaan) oleh
                XyberXecurity semata-mata untuk keperluan menghasilkan laporan kepatuhan UU PDP
                yang dipersonalisasi, sebagaimana dijelaskan dalam Pemberitahuan Pemrosesan Data
                Pribadi.
              </ConsentCheckbox>
              <ConsentCheckbox
                id="chk-notice"
                title="Konfirmasi Baca Privacy Notice"
                checked={checks.privacyNoticeRead}
                onChange={(v) => setChecks((c) => ({ ...c, privacyNoticeRead: v }))}
              >
                Saya menyatakan telah membaca, memahami, dan menyetujui Pemberitahuan Pemrosesan
                Data Pribadi yang disampaikan oleh XyberXecurity, termasuk hak-hak saya sebagai
                Subjek Data berdasarkan UU PDP No. 27 Tahun 2022.
              </ConsentCheckbox>
              <ConsentCheckbox
                id="chk-usage"
                title="Batasan Penggunaan"
                checked={checks.usageLimitation}
                onChange={(v) => setChecks((c) => ({ ...c, usageLimitation: v }))}
              >
                Saya memahami bahwa data saya TIDAK akan dibagikan kepada pihak ketiga dan TIDAK
                akan digunakan untuk tujuan pemasaran, profiling, atau tujuan lain di luar yang
                dinyatakan.
              </ConsentCheckbox>
              <ConsentCheckbox
                id="chk-age"
                title="Usia"
                checked={checks.ageVerification}
                onChange={(v) => setChecks((c) => ({ ...c, ageVerification: v }))}
              >
                Saya menyatakan bahwa saya berusia minimal 17 (tujuh belas) tahun atau telah
                mendapatkan persetujuan dari orang tua/wali, sesuai Pasal 24 UU PDP.
              </ConsentCheckbox>
              <ConsentCheckbox
                id="chk-notif"
                title="Notifikasi Perubahan"
                required={false}
                checked={checks.notificationOptIn}
                onChange={(v) => setChecks((c) => ({ ...c, notificationOptIn: v }))}
              >
                Saya bersedia dihubungi melalui email jika terdapat perubahan material pada
                Pemberitahuan Pemrosesan Data Pribadi.
              </ConsentCheckbox>
              {checks.notificationOptIn && (
                <div className="animate-fade-in pl-2">
                  <label htmlFor="notif-email" className="mb-1.5 block text-sm font-medium text-text-muted">
                    Email untuk notifikasi (opsional)
                  </label>
                  <input
                    id="notif-email"
                    type="email"
                    value={notificationEmail}
                    onChange={(e) => setNotificationEmail(e.target.value)}
                    placeholder="nama@perusahaan.co.id"
                    className={`h-10 w-full rounded-lg border bg-subtle px-3 text-sm text-text-primary placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-accent/30 ${
                      emailValid ? 'border-border focus:border-accent' : 'border-danger'
                    }`}
                  />
                  {!emailValid && <p className="mt-1 text-xs text-danger">Format email tidak valid</p>}
                </div>
              )}
            </div>

            {/* Metadata */}
            <div className="mt-5 rounded-lg border border-border-muted bg-subtle p-4 font-mono text-[11px] leading-loose text-text-faint">
              <p>
                Timestamp Persetujuan : <span className="text-text-muted">{nowJakartaISO()}</span>
              </p>
              <p>
                Versi Privacy Notice : <span className="text-text-muted">{PRIVACY_NOTICE_VERSION}</span>
              </p>
              <p>
                IP Address : <span className="text-text-muted">Tidak direkam (privacy by design)</span>
              </p>
              <p>
                User Agent : <span className="text-text-muted">Tidak direkam</span>
              </p>
            </div>

            {/* Tombol */}
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                onClick={() => setStep(2)}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-border px-5 text-sm text-text-muted transition-colors hover:border-border-strong hover:text-text-primary"
              >
                <ArrowLeft className="h-4 w-4" />
                Ubah Data Identitas
              </button>
              <button
                onClick={handleFinalSubmit}
                disabled={!requiredChecked || !emailValid || submitting}
                className={`inline-flex h-12 items-center justify-center gap-2 rounded-lg px-7 text-sm font-semibold transition-all ${
                  requiredChecked && emailValid
                    ? 'animate-pulse-glow bg-gradient-to-br from-accent-400 to-accent-500 text-background shadow-btn-accent hover:shadow-btn-accent-hover'
                    : 'cursor-not-allowed bg-elevated text-text-faint'
                }`}
              >
                <ShieldCheck className="h-5 w-5" />
                {submitting ? 'Menyimpan persetujuan…' : 'Saya Setuju & Mulai Assessment'}
              </button>
            </div>

            {/* Legal footer */}
            <p className="mt-5 text-center text-[11px] leading-relaxed text-text-faint">
              Dengan mengklik tombol di atas, Anda memberikan persetujuan yang sah secara hukum
              berdasarkan Pasal 20 ayat (2) huruf a UU No. 27 Tahun 2022 tentang Pelindungan Data
              Pribadi. Anda dapat menarik persetujuan ini kapan saja melalui Settings &gt; Tarik
              Persetujuan tanpa konsekuensi hukum bagi Anda.
            </p>
          </section>
        )}
      </div>
    </div>
  );
}
