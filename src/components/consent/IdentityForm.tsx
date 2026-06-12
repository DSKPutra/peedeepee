import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { ReactNode } from 'react';
import type { OrgSize, UserIdentity } from '@/types';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

export const JOB_TITLE_SUGGESTIONS = [
  'Chief Information Security Officer (CISO)',
  'Data Protection Officer (DPO)',
  'IT Manager',
  'Legal & Compliance Manager',
  'Internal Auditor',
  'Direktur Utama',
  'Kepala Divisi IT',
  'Staf Compliance',
  'Konsultan Eksternal',
  'Lainnya',
];

export const INDUSTRY_OPTIONS = [
  'Perbankan & Keuangan',
  'Asuransi',
  'Pasar Modal',
  'Teknologi Informasi & Komunikasi',
  'E-Commerce & Marketplace',
  'Kesehatan & Farmasi',
  'Pendidikan',
  'Pemerintahan & BUMN',
  'Energi & Pertambangan',
  'Manufaktur',
  'Retail & FMCG',
  'Logistik & Transportasi',
  'Media & Hiburan',
  'Lainnya',
];

export const ORG_SIZE_OPTIONS: { value: OrgSize; label: string; range: string }[] = [
  { value: 'STARTUP', label: 'Startup / UMKM', range: '< 50 karyawan' },
  { value: 'SMALL', label: 'Perusahaan Kecil', range: '50 - 250 karyawan' },
  { value: 'MEDIUM', label: 'Perusahaan Menengah', range: '251 - 1000 karyawan' },
  { value: 'LARGE', label: 'Perusahaan Besar', range: '1001 - 5000 karyawan' },
  { value: 'ENTERPRISE', label: 'Korporasi', range: '> 5000 karyawan' },
];

const identitySchema = z.object({
  fullName: z
    .string()
    .min(3, 'Nama lengkap minimal 3 karakter')
    .regex(/^[A-Za-zÀ-ÿ' .,-]+$/, 'Nama hanya boleh huruf, spasi, dan tanda baca nama'),
  jobTitleSelect: z.string().min(1, 'Pilih jabatan Anda'),
  jobTitleOther: z.string().optional(),
  organization: z.string().min(3, 'Nama organisasi minimal 3 karakter'),
  industry: z.string().min(1, 'Pilih sektor industri'),
  orgSize: z.enum(['STARTUP', 'SMALL', 'MEDIUM', 'LARGE', 'ENTERPRISE'], {
    errorMap: () => ({ message: 'Pilih ukuran organisasi' }),
  }),
});

type IdentityFormValues = z.infer<typeof identitySchema>;

interface IdentityFormProps {
  initial?: UserIdentity | null;
  submitLabel?: ReactNode;
  secondaryAction?: ReactNode;
  onSubmit: (identity: UserIdentity) => void;
}

export function IdentityForm({ initial, submitLabel, secondaryAction, onSubmit }: IdentityFormProps) {
  const initialIsSuggested = initial && JOB_TITLE_SUGGESTIONS.includes(initial.jobTitle);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<IdentityFormValues>({
    resolver: zodResolver(identitySchema),
    mode: 'onChange',
    defaultValues: {
      fullName: initial?.fullName ?? '',
      jobTitleSelect: initial ? (initialIsSuggested ? initial.jobTitle : 'Lainnya') : '',
      jobTitleOther: initial && !initialIsSuggested ? initial.jobTitle : '',
      organization: initial?.organization ?? '',
      industry: initial?.industry ?? '',
      orgSize: initial?.orgSize ?? undefined,
    },
  });
  const [touched, setTouched] = useState(false);

  const jobTitleSelect = watch('jobTitleSelect');
  const orgSize = watch('orgSize');
  const isOther = jobTitleSelect === 'Lainnya';

  const submit = (values: IdentityFormValues) => {
    const jobTitle = isOther ? (values.jobTitleOther ?? '').trim() : values.jobTitleSelect;
    if (isOther && jobTitle.length < 3) return;
    onSubmit({
      fullName: values.fullName.trim(),
      jobTitle,
      organization: values.organization.trim(),
      industry: values.industry,
      orgSize: values.orgSize,
    });
  };

  const otherInvalid = isOther && (watch('jobTitleOther') ?? '').trim().length < 3;

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
      <Input
        id="identity-fullname"
        label="Nama Lengkap"
        placeholder="Contoh: Budi Santoso, S.H."
        error={errors.fullName?.message}
        {...register('fullName')}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          id="identity-jobtitle"
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
            id="identity-jobtitle-other"
            label="Sebutkan Jabatan Anda"
            placeholder="Contoh: Data Protection Officer"
            error={touched && otherInvalid ? 'Jabatan minimal 3 karakter' : undefined}
            {...register('jobTitleOther', { onChange: () => setTouched(true) })}
          />
        )}
      </div>

      <Input
        id="identity-organization"
        label="Nama Perusahaan / Organisasi"
        placeholder="Contoh: PT Maju Bersama Tbk"
        error={errors.organization?.message}
        {...register('organization')}
      />

      <Select
        id="identity-industry"
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
        <div
          className="grid gap-2 sm:grid-cols-2"
          role="radiogroup"
          aria-label="Ukuran organisasi"
        >
          {ORG_SIZE_OPTIONS.map((opt) => {
            const selected = orgSize === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() =>
                  setValue('orgSize', opt.value, { shouldValidate: true, shouldDirty: true })
                }
                className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-all duration-150 ${
                  selected
                    ? 'border-accent bg-accent/10'
                    : 'border-border bg-subtle hover:border-border-strong'
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
        {errors.orgSize && <p className="mt-1 text-xs text-danger">{errors.orgSize.message}</p>}
      </div>

      <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
        {secondaryAction ?? <span />}
        <button
          type="submit"
          disabled={!isValid || otherInvalid}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-gradient-to-br from-accent-400 to-accent-500 px-6 text-sm font-semibold text-background shadow-btn-accent transition-all hover:shadow-btn-accent-hover disabled:cursor-not-allowed disabled:from-elevated disabled:to-elevated disabled:text-text-faint disabled:shadow-none"
        >
          {submitLabel ?? 'Simpan'}
        </button>
      </div>
    </form>
  );
}
