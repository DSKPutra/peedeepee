import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, ShieldCheck, UserPlus } from 'lucide-react';
import type { OrgSize } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/authService';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Alert } from '@/components/ui/Alert';
import { Modal } from '@/components/ui/Modal';
import { AuthShell } from '@/components/auth/AuthShell';
import { PasswordStrength } from '@/components/auth/PasswordStrength';
import { PrivacyNoticeContent } from '@/components/consent/PrivacyNoticeContent';
import {
  INDUSTRY_OPTIONS,
  JOB_TITLE_SUGGESTIONS,
  ORG_SIZE_OPTIONS,
} from '@/components/consent/IdentityForm';

const schema = z
  .object({
    email: z.string().email('Format email tidak valid'),
    password: z.string().min(8, 'Password minimal 8 karakter'),
    confirmPassword: z.string().min(1, 'Konfirmasi password wajib diisi'),
    fullName: z
      .string()
      .min(3, 'Nama lengkap minimal 3 karakter')
      .regex(/^[A-Za-zÀ-ÿ' .,-]+$/, 'Nama hanya boleh huruf, spasi, dan tanda baca nama'),
    jobTitleSelect: z.string().min(1, 'Pilih jabatan Anda'),
    jobTitleOther: z.string().optional(),
    organization: z.string().min(3, 'Nama organisasi minimal 3 karakter'),
    industry: z.string().min(1, 'Pilih sektor industri'),
    orgSize: z.enum(['STARTUP', 'SMALL', 'MEDIUM', 'LARGE', 'ENTERPRISE']),
    agree: z.literal(true, { errorMap: () => ({ message: 'Anda harus menyetujui Privacy Notice' }) }),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Konfirmasi password tidak cocok',
    path: ['confirmPassword'],
  })
  .refine((d) => d.jobTitleSelect !== 'Lainnya' || (d.jobTitleOther ?? '').trim().length >= 3, {
    message: 'Sebutkan jabatan minimal 3 karakter',
    path: ['jobTitleOther'],
  });

type RegisterForm = z.infer<typeof schema>;

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register: registerUser, isAuthenticated, isLoading, error, clearError } = useAuthStore();
  const [showPw, setShowPw] = useState(false);
  const [noticeOpen, setNoticeOpen] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(schema),
    defaultValues: { orgSize: 'MEDIUM' as OrgSize },
  });

  useEffect(() => {
    clearError();
  }, [clearError]);

  const password = watch('password') ?? '';
  const jobTitleSelect = watch('jobTitleSelect');
  const orgSize = watch('orgSize');
  const agree = watch('agree');
  const isOther = jobTitleSelect === 'Lainnya';

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const onSubmit = async (data: RegisterForm) => {
    const jobTitle = isOther ? (data.jobTitleOther ?? '').trim() : data.jobTitleSelect;
    const ok = await registerUser({
      email: data.email,
      password: data.password,
      fullName: data.fullName.trim(),
      jobTitle,
      organization: data.organization.trim(),
      industry: data.industry,
      orgSize: data.orgSize,
    });
    if (ok) navigate('/dashboard', { replace: true });
  };

  return (
    <AuthShell title="Buat Akun Baru" subtitle="Daftar untuk mulai menilai kesiapan PDP organisasi Anda" maxWidth="max-w-lg">
      {!authService.isConfigured() && (
        <Alert variant="warning" className="mb-4" title="Backend belum dikonfigurasi">
          Set <span className="font-mono">VITE_APPS_SCRIPT_URL</span> dan deploy Apps Script backend
          agar registrasi berfungsi.
        </Alert>
      )}
      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        {/* Section 1 — Akun */}
        <div>
          <p className="mb-3 font-mono text-[11px] font-semibold uppercase tracking-wider text-text-faint">
            1 · Informasi Akun
          </p>
          <div className="space-y-4">
            <Input
              id="reg-email"
              type="email"
              label="Email"
              placeholder="nama@perusahaan.co.id"
              autoComplete="email"
              error={errors.email?.message}
              {...register('email')}
            />
            <div>
              <div className="relative">
                <Input
                  id="reg-password"
                  type={showPw ? 'text' : 'password'}
                  label="Password"
                  placeholder="Minimal 8 karakter"
                  autoComplete="new-password"
                  error={errors.password?.message}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  aria-label={showPw ? 'Sembunyikan password' : 'Tampilkan password'}
                  className="absolute right-3 top-[34px] text-text-muted hover:text-text-primary"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <PasswordStrength password={password} />
            </div>
            <Input
              id="reg-confirm"
              type="password"
              label="Konfirmasi Password"
              placeholder="Ulangi password"
              autoComplete="new-password"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />
          </div>
        </div>

        {/* Section 2 — Identitas */}
        <div>
          <p className="mb-3 font-mono text-[11px] font-semibold uppercase tracking-wider text-text-faint">
            2 · Identitas
          </p>
          <div className="space-y-4">
            <Input
              id="reg-fullname"
              label="Nama Lengkap"
              placeholder="Contoh: Budi Santoso, S.H."
              error={errors.fullName?.message}
              {...register('fullName')}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                id="reg-jobtitle"
                label="Jabatan / Posisi"
                error={errors.jobTitleSelect?.message}
                options={[
                  { value: '', label: '— Pilih jabatan —' },
                  ...JOB_TITLE_SUGGESTIONS.map((j) => ({ value: j, label: j })),
                ]}
                {...register('jobTitleSelect')}
              />
              {isOther && (
                <Input
                  id="reg-jobtitle-other"
                  label="Sebutkan Jabatan"
                  placeholder="Contoh: Data Protection Officer"
                  error={errors.jobTitleOther?.message}
                  {...register('jobTitleOther')}
                />
              )}
            </div>
            <Input
              id="reg-org"
              label="Nama Perusahaan / Organisasi"
              placeholder="Contoh: PT Maju Bersama Tbk"
              error={errors.organization?.message}
              {...register('organization')}
            />
          </div>
        </div>

        {/* Section 3 — Profil Organisasi */}
        <div>
          <p className="mb-3 font-mono text-[11px] font-semibold uppercase tracking-wider text-text-faint">
            3 · Profil Organisasi
          </p>
          <div className="space-y-4">
            <Select
              id="reg-industry"
              label="Sektor Industri"
              error={errors.industry?.message}
              options={[
                { value: '', label: '— Pilih sektor industri —' },
                ...INDUSTRY_OPTIONS.map((i) => ({ value: i, label: i })),
              ]}
              {...register('industry')}
            />
            <div>
              <p className="mb-1.5 block text-sm font-medium text-text-muted">Ukuran Organisasi</p>
              <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Ukuran organisasi">
                {ORG_SIZE_OPTIONS.map((opt) => {
                  const selected = orgSize === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => setValue('orgSize', opt.value, { shouldValidate: true })}
                      className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-all ${
                        selected ? 'border-accent bg-accent/10' : 'border-border bg-subtle hover:border-border-strong'
                      }`}
                    >
                      <span
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
                          selected ? 'border-accent' : 'border-border-strong'
                        }`}
                      >
                        {selected && <span className="h-2 w-2 rounded-full bg-accent" />}
                      </span>
                      <span>
                        <span className={`block text-sm font-medium ${selected ? 'text-accent' : 'text-text-primary'}`}>
                          {opt.label}
                        </span>
                        <span className="block font-mono text-[11px] text-text-muted">{opt.range}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Privacy consent */}
        <div>
          <button
            type="button"
            role="checkbox"
            aria-checked={!!agree}
            onClick={() => setValue('agree', (!agree) as true, { shouldValidate: true })}
            className={`flex w-full items-start gap-3 rounded-lg border p-3.5 text-left transition-all ${
              agree ? 'border-accent/70 bg-accent/5' : 'border-border-strong bg-subtle hover:border-accent/50'
            }`}
          >
            <span
              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 ${
                agree ? 'border-accent bg-accent' : 'border-accent/60'
              }`}
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
                <path
                  d="M5 13l4 4L19 7"
                  stroke="#0E0F14"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ strokeDasharray: 24, strokeDashoffset: agree ? 0 : 24, transition: 'stroke-dashoffset 0.25s' }}
                />
              </svg>
            </span>
            <span className="text-xs leading-relaxed text-text-muted">
              Saya menyetujui{' '}
              <span
                role="link"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  setNoticeOpen(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.stopPropagation();
                    setNoticeOpen(true);
                  }
                }}
                className="font-semibold text-accent hover:underline"
              >
                Pemberitahuan Pemrosesan Data Pribadi
              </span>{' '}
              dan pemrosesan data saya sesuai UU PDP No. 27 Tahun 2022 (Pasal 20 ayat (2) huruf a).
            </span>
          </button>
          {errors.agree && <p className="mt-1 text-xs text-danger">{errors.agree.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-br from-accent-400 to-accent-500 text-sm font-semibold text-background shadow-btn-accent transition-all hover:shadow-btn-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-background/40 border-t-background" />
          ) : (
            <UserPlus className="h-4 w-4" />
          )}
          {isLoading ? 'Mendaftar…' : 'Daftar & Mulai'}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-text-muted">
        Sudah punya akun?{' '}
        <Link to="/login" className="font-semibold text-accent hover:underline">
          Masuk di sini
        </Link>
      </p>

      <Modal
        open={noticeOpen}
        onClose={() => setNoticeOpen(false)}
        title="Pemberitahuan Pemrosesan Data Pribadi"
        maxWidth="max-w-3xl"
        footer={
          <button
            onClick={() => {
              setValue('agree', true as true, { shouldValidate: true });
              setNoticeOpen(false);
            }}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-gradient-to-br from-accent-400 to-accent-500 px-5 text-sm font-semibold text-background shadow-btn-accent"
          >
            <ShieldCheck className="h-4 w-4" />
            Saya Setuju
          </button>
        }
      >
        <PrivacyNoticeContent />
      </Modal>
    </AuthShell>
  );
}
