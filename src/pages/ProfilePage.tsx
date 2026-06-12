import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Check,
  ClipboardList,
  Download,
  FileText,
  LogOut,
  Pencil,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  User as UserIcon,
} from 'lucide-react';
import type { RiskLevel } from '@/types';
import { RISK_LEVEL_META } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { useAssessmentStore } from '@/store/assessmentStore';
import { useResultStore } from '@/store/resultStore';
import { authService } from '@/services/authService';
import { getConsentRecord } from '@/core/utils/consent';
import { formatDateTime } from '@/core/utils/reportFormatter';
import {
  INDUSTRY_OPTIONS,
  JOB_TITLE_SUGGESTIONS,
  ORG_SIZE_OPTIONS,
} from '@/components/consent/IdentityForm';
import { PrivacyNoticeContent } from '@/components/consent/PrivacyNoticeContent';
import { PasswordStrength } from '@/components/auth/PasswordStrength';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';

type Tab = 'profile' | 'security' | 'assessments' | 'privacy';

const TABS: { id: Tab; label: string }[] = [
  { id: 'profile', label: 'Profil' },
  { id: 'security', label: 'Keamanan' },
  { id: 'assessments', label: 'Assessment Saya' },
  { id: 'privacy', label: 'Data & Privasi' },
];

const riskVariant: Record<RiskLevel, 'danger' | 'warning' | 'info' | 'success'> = {
  CRITICAL: 'danger',
  HIGH: 'danger',
  MEDIUM: 'warning',
  LOW: 'info',
  COMPLIANT: 'success',
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || 'U';
}

export default function ProfilePage() {
  const [tab, setTab] = useState<Tab>('profile');
  const { user } = useAuthStore();

  return (
    <div className="mx-auto max-w-4xl space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-700 font-display text-lg font-bold text-white">
          {initials(user?.fullName ?? 'User')}
        </div>
        <div className="min-w-0">
          <h1 className="truncate font-display text-2xl font-bold text-text-primary">
            {user?.fullName ?? 'Pengguna'}
          </h1>
          <p className="truncate text-sm text-text-muted">{user?.email}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === t.id
                ? 'border-accent text-accent'
                : 'border-transparent text-text-muted hover:text-text-primary'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'profile' && <ProfileTab />}
      {tab === 'security' && <SecurityTab />}
      {tab === 'assessments' && <AssessmentsTab />}
      {tab === 'privacy' && <PrivacyTab onGoTab={setTab} />}
    </div>
  );
}

// ─── Tab 1: Profil ───────────────────────────────────────────────────────────

const profileSchema = z.object({
  fullName: z.string().min(3, 'Nama lengkap minimal 3 karakter'),
  jobTitleSelect: z.string().min(1, 'Pilih jabatan'),
  jobTitleOther: z.string().optional(),
  organization: z.string().min(3, 'Nama organisasi minimal 3 karakter'),
  industry: z.string().min(1, 'Pilih sektor industri'),
  orgSize: z.enum(['STARTUP', 'SMALL', 'MEDIUM', 'LARGE', 'ENTERPRISE']),
});
type ProfileForm = z.infer<typeof profileSchema>;

function ProfileTab() {
  const { user, updateProfile, isLoading, error } = useAuthStore();
  const [saved, setSaved] = useState(false);
  const jobIsSuggested = user && JOB_TITLE_SUGGESTIONS.includes(user.jobTitle);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user?.fullName ?? '',
      jobTitleSelect: user ? (jobIsSuggested ? user.jobTitle : 'Lainnya') : '',
      jobTitleOther: user && !jobIsSuggested ? user.jobTitle : '',
      organization: user?.organization ?? '',
      industry: user?.industry ?? '',
      orgSize: (user?.orgSize as ProfileForm['orgSize']) ?? 'MEDIUM',
    },
  });

  const isOther = watch('jobTitleSelect') === 'Lainnya';
  const orgSize = watch('orgSize');

  const onSubmit = async (data: ProfileForm) => {
    const jobTitle = isOther ? (data.jobTitleOther ?? '').trim() : data.jobTitleSelect;
    const ok = await updateProfile({
      fullName: data.fullName.trim(),
      jobTitle,
      organization: data.organization.trim(),
      industry: data.industry,
      orgSize: data.orgSize,
    });
    if (ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Profil</CardTitle>
        <CardDescription>Informasi ini ditampilkan pada laporan kepatuhan Anda</CardDescription>
      </CardHeader>
      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input id="p-fullname" label="Nama Lengkap" error={errors.fullName?.message} {...register('fullName')} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            id="p-jobtitle"
            label="Jabatan / Posisi"
            error={errors.jobTitleSelect?.message}
            options={[
              { value: '', label: '— Pilih jabatan —' },
              ...JOB_TITLE_SUGGESTIONS.map((j) => ({ value: j, label: j })),
            ]}
            {...register('jobTitleSelect')}
          />
          {isOther && (
            <Input id="p-jobtitle-other" label="Sebutkan Jabatan" {...register('jobTitleOther')} />
          )}
        </div>
        <Input id="p-org" label="Perusahaan / Organisasi" error={errors.organization?.message} {...register('organization')} />
        <Select
          id="p-industry"
          label="Sektor Industri"
          error={errors.industry?.message}
          options={[
            { value: '', label: '— Pilih sektor industri —' },
            ...INDUSTRY_OPTIONS.map((i) => ({ value: i, label: i })),
          ]}
          {...register('industry')}
        />
        <Select
          id="p-orgsize"
          label="Ukuran Organisasi"
          options={ORG_SIZE_OPTIONS.map((o) => ({ value: o.value, label: `${o.label} (${o.range})` }))}
          value={orgSize}
          onChange={(e) => setValue('orgSize', e.target.value as ProfileForm['orgSize'])}
        />
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Menyimpan…' : 'Simpan Perubahan'}
          </Button>
          {saved && (
            <span className="flex items-center gap-1.5 text-sm text-success animate-fade-in">
              <Check className="h-4 w-4" /> Tersimpan
            </span>
          )}
        </div>
      </form>

      <div className="mt-6 grid gap-3 border-t border-border pt-5 sm:grid-cols-3">
        {[
          ['Email', user?.email ?? '—'],
          ['Bergabung', user?.createdAt ? formatDateTime(user.createdAt) : '—'],
          ['Login Terakhir', user?.lastLoginAt ? formatDateTime(user.lastLoginAt) : '—'],
        ].map(([k, v]) => (
          <div key={k}>
            <p className="font-mono text-[11px] uppercase tracking-wider text-text-faint">{k}</p>
            <p className="mt-0.5 text-sm text-text-primary">{v}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─── Tab 2: Keamanan ─────────────────────────────────────────────────────────

function SecurityTab() {
  const navigate = useNavigate();
  const { user, changePassword, logoutAllOthers, deleteAccount, isLoading } = useAuthStore();
  const [cur, setCur] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [pwMsg, setPwMsg] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);
  const [othersMsg, setOthersMsg] = useState('');

  const [delStep, setDelStep] = useState<0 | 1 | 2 | 3>(0);
  const [delPw, setDelPw] = useState('');
  const [delType, setDelType] = useState('');
  const [delErr, setDelErr] = useState('');

  const submitPw = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMsg(null);
    if (next.length < 8) return setPwMsg({ type: 'danger', text: 'Password baru minimal 8 karakter' });
    if (next !== confirm) return setPwMsg({ type: 'danger', text: 'Konfirmasi password tidak cocok' });
    const ok = await changePassword(cur, next);
    if (ok) {
      setPwMsg({ type: 'success', text: 'Password berhasil diubah. Sesi lain telah dikeluarkan.' });
      setCur('');
      setNext('');
      setConfirm('');
    } else {
      setPwMsg({ type: 'danger', text: useAuthStore.getState().error ?? 'Gagal mengubah password' });
    }
  };

  const doDelete = async () => {
    setDelErr('');
    const ok = await deleteAccount(delPw);
    if (ok) navigate('/');
    else setDelErr(useAuthStore.getState().error ?? 'Gagal menghapus akun');
  };

  return (
    <div className="space-y-6">
      {/* Ganti Password */}
      <Card>
        <CardHeader>
          <CardTitle>Ganti Password</CardTitle>
          <CardDescription>Setelah berhasil, semua sesi lain akan dikeluarkan otomatis</CardDescription>
        </CardHeader>
        {pwMsg && (
          <Alert variant={pwMsg.type} className="mb-4">
            {pwMsg.text}
          </Alert>
        )}
        <form onSubmit={submitPw} className="space-y-4">
          <Input
            id="cur-pw"
            type="password"
            label="Password Saat Ini"
            autoComplete="current-password"
            value={cur}
            onChange={(e) => setCur(e.target.value)}
          />
          <div>
            <Input
              id="new-pw"
              type="password"
              label="Password Baru"
              autoComplete="new-password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
            />
            <PasswordStrength password={next} />
          </div>
          <Input
            id="confirm-pw"
            type="password"
            label="Konfirmasi Password Baru"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
          <Button type="submit" disabled={isLoading || !cur || !next}>
            Ubah Password
          </Button>
        </form>
      </Card>

      {/* Sesi Aktif */}
      <Card>
        <CardHeader>
          <CardTitle>Sesi Aktif</CardTitle>
          <CardDescription>
            Sesi saat ini dimulai {user?.lastLoginAt ? formatDateTime(user.lastLoginAt) : '—'}
          </CardDescription>
        </CardHeader>
        {othersMsg && (
          <Alert variant="success" className="mb-3">
            {othersMsg}
          </Alert>
        )}
        <Button
          variant="outline"
          onClick={async () => {
            const ok = await logoutAllOthers();
            if (ok) setOthersMsg('Semua sesi lain telah dikeluarkan.');
          }}
        >
          <LogOut className="h-4 w-4" />
          Keluar dari Semua Sesi Lain
        </Button>
      </Card>

      {/* Zona Bahaya */}
      <Card className="border-danger/40">
        <CardHeader>
          <CardTitle className="text-danger">Zona Bahaya</CardTitle>
          <CardDescription>
            Menghapus akun akan menonaktifkan akun Anda dan mengeluarkan semua sesi. Data assessment
            di server tetap tersimpan namun tidak dapat diakses.
          </CardDescription>
        </CardHeader>
        <Button variant="danger" onClick={() => setDelStep(1)}>
          <ShieldAlert className="h-4 w-4" />
          Hapus Akun Secara Permanen
        </Button>
      </Card>

      {/* Modal hapus akun — 3 langkah */}
      <Modal
        open={delStep === 1}
        onClose={() => setDelStep(0)}
        title="Hapus Akun — Langkah 1 dari 3"
        maxWidth="max-w-md"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDelStep(0)}>
              Batal
            </Button>
            <Button variant="danger" onClick={() => setDelStep(2)}>
              Saya Mengerti, Lanjutkan
            </Button>
          </div>
        }
      >
        <Alert variant="danger" title="Yang akan terjadi:">
          <ul className="mt-1 list-disc space-y-1 pl-4">
            <li>Akun Anda dinonaktifkan permanen</li>
            <li>Semua sesi login dikeluarkan</li>
            <li>Anda tidak dapat lagi mengakses dashboard dan laporan</li>
          </ul>
        </Alert>
      </Modal>

      <Modal
        open={delStep === 2}
        onClose={() => {
          setDelStep(0);
          setDelPw('');
        }}
        title="Hapus Akun — Langkah 2 dari 3"
        maxWidth="max-w-md"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDelStep(0)}>
              Batal
            </Button>
            <Button variant="danger" disabled={!delPw} onClick={() => setDelStep(3)}>
              Lanjutkan
            </Button>
          </div>
        }
      >
        <p className="mb-3 text-sm text-text-muted">Masukkan password Anda untuk konfirmasi.</p>
        <Input
          id="del-pw"
          type="password"
          label="Password"
          value={delPw}
          onChange={(e) => setDelPw(e.target.value)}
        />
      </Modal>

      <Modal
        open={delStep === 3}
        onClose={() => {
          setDelStep(0);
          setDelType('');
          setDelErr('');
        }}
        title="Hapus Akun — Konfirmasi Final"
        maxWidth="max-w-md"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDelStep(0)}>
              Batal
            </Button>
            <Button variant="danger" disabled={delType !== 'HAPUS AKUN SAYA' || isLoading} onClick={doDelete}>
              Hapus Akun Permanen
            </Button>
          </div>
        }
      >
        {delErr && (
          <Alert variant="danger" className="mb-3">
            {delErr}
          </Alert>
        )}
        <p className="text-sm text-text-muted">
          Ketik <span className="font-mono font-bold text-danger">HAPUS AKUN SAYA</span> untuk
          mengonfirmasi.
        </p>
        <input
          type="text"
          value={delType}
          onChange={(e) => setDelType(e.target.value)}
          aria-label="Ketik HAPUS AKUN SAYA"
          className="mt-3 h-10 w-full rounded-lg border border-danger/50 bg-subtle px-3 font-mono text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-danger/30"
        />
      </Modal>
    </div>
  );
}

// ─── Tab 3: Assessment Saya ──────────────────────────────────────────────────

function AssessmentsTab() {
  const navigate = useNavigate();
  const { user, sessionId } = useAuthStore();
  const { assessments, deleteAssessment } = useAssessmentStore();
  const { results, deleteResult } = useResultStore();
  const [filter, setFilter] = useState<'ALL' | 'COMPLETED' | 'IN_PROGRESS'>('ALL');
  const [sort, setSort] = useState<'recent' | 'high' | 'low'>('recent');
  const [page, setPage] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const PER_PAGE = 10;

  const rows = useMemo(() => {
    let list = assessments.map((a) => ({
      id: a.id,
      orgName: a.orgName,
      date: a.completedAt ?? a.createdAt,
      status: a.status,
      score: results[a.id]?.totalComplianceIndex ?? null,
      risk: results[a.id]?.riskLevel ?? null,
    }));
    if (filter !== 'ALL') list = list.filter((r) => r.status === filter);
    list.sort((a, b) => {
      if (sort === 'recent') return b.date.localeCompare(a.date);
      const av = a.score ?? -1;
      const bv = b.score ?? -1;
      return sort === 'high' ? bv - av : av - bv;
    });
    return list;
  }, [assessments, results, filter, sort]);

  const paged = rows.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE);
  const totalPages = Math.max(1, Math.ceil(rows.length / PER_PAGE));

  if (assessments.length === 0) {
    return (
      <Card>
        <div className="flex flex-col items-center py-10 text-center">
          <ClipboardList className="h-12 w-12 text-text-faint" />
          <h3 className="mt-3 font-display text-base font-semibold text-text-primary">
            Belum ada assessment
          </h3>
          <p className="mt-1 max-w-sm text-sm text-text-muted">
            Mulai assessment pertama Anda untuk melihat hasil dan laporan kepatuhan di sini.
          </p>
          <Link to="/assessment" className="mt-5">
            <Button>Mulai Assessment</Button>
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <div className="w-40">
            <Select
              options={[
                { value: 'ALL', label: 'Semua status' },
                { value: 'COMPLETED', label: 'Selesai' },
                { value: 'IN_PROGRESS', label: 'Dalam proses' },
              ]}
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value as typeof filter);
                setPage(0);
              }}
            />
          </div>
          <div className="w-44">
            <Select
              options={[
                { value: 'recent', label: 'Terbaru' },
                { value: 'high', label: 'Skor tertinggi' },
                { value: 'low', label: 'Skor terendah' },
              ]}
              value={sort}
              onChange={(e) => setSort(e.target.value as typeof sort)}
            />
          </div>
        </div>
        {sessionId && user && (
          <span className="font-mono text-[11px] text-text-faint">{rows.length} assessment</span>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border font-mono text-[11px] uppercase tracking-wider text-text-faint">
              <th className="pb-2 pr-3 font-medium">Organisasi</th>
              <th className="pb-2 pr-3 font-medium">Tanggal</th>
              <th className="pb-2 pr-3 font-medium">Status</th>
              <th className="pb-2 pr-3 font-medium">Skor</th>
              <th className="pb-2 pr-3 font-medium">Risk</th>
              <th className="pb-2 font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {paged.map((r) => (
              <tr key={r.id} className="border-b border-border-muted">
                <td className="py-3 pr-3 text-text-primary">{r.orgName}</td>
                <td className="py-3 pr-3 text-xs text-text-muted whitespace-nowrap">{formatDateTime(r.date)}</td>
                <td className="py-3 pr-3">
                  <Badge variant={r.status === 'COMPLETED' ? 'success' : 'warning'}>
                    {r.status === 'COMPLETED' ? 'Selesai' : 'Proses'}
                  </Badge>
                </td>
                <td className="py-3 pr-3 font-mono text-sm font-semibold tabular-nums text-text-primary">
                  {r.score !== null ? `${r.score.toFixed(1)}%` : '—'}
                </td>
                <td className="py-3 pr-3">
                  {r.risk ? (
                    <Badge variant={riskVariant[r.risk]} dot>
                      {RISK_LEVEL_META[r.risk].label}
                    </Badge>
                  ) : (
                    <span className="text-xs text-text-faint">—</span>
                  )}
                </td>
                <td className="py-3">
                  <div className="flex items-center gap-2">
                    {r.status === 'COMPLETED' && r.risk && (
                      <button
                        onClick={() => navigate(`/report/${r.id}`)}
                        className="text-xs text-accent hover:underline"
                      >
                        Lihat
                      </button>
                    )}
                    <button
                      onClick={() => setDeleteTarget(r.id)}
                      aria-label="Hapus assessment"
                      className="rounded p-1 text-text-muted hover:text-danger"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
            Sebelumnya
          </Button>
          <span className="font-mono text-xs text-text-muted">
            Halaman {page + 1} / {totalPages}
          </span>
          <Button
            size="sm"
            variant="outline"
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
          >
            Berikutnya
          </Button>
        </div>
      )}

      <Modal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Hapus Assessment?"
        maxWidth="max-w-md"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Batal
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (deleteTarget) {
                  deleteAssessment(deleteTarget);
                  deleteResult(deleteTarget);
                  if (sessionId) void authService.deleteAssessment(sessionId, deleteTarget);
                }
                setDeleteTarget(null);
              }}
            >
              Hapus Permanen
            </Button>
          </div>
        }
      >
        <p className="text-sm text-text-muted">
          Assessment beserta hasil scoringnya akan dihapus permanen dari penyimpanan lokal dan
          server. Tindakan ini tidak dapat dibatalkan.
        </p>
      </Modal>
    </Card>
  );
}

// ─── Tab 4: Data & Privasi ───────────────────────────────────────────────────

function PrivacyTab({ onGoTab }: { onGoTab: (t: Tab) => void }) {
  const { user, sessionId } = useAuthStore();
  const { assessments } = useAssessmentStore();
  const { results } = useResultStore();
  const [noticeOpen, setNoticeOpen] = useState(false);
  const consent = getConsentRecord();

  const exportData = async () => {
    let payload: unknown = {
      profile: user,
      consentRecord: consent,
      assessments: assessments.map((a) => ({ ...a, result: results[a.id] ?? null })),
      exportedAt: new Date().toISOString(),
    };
    if (sessionId) {
      const res = await authService.exportUserData(sessionId);
      if (res.success && res.data) payload = { ...res.data, localCopy: payload };
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `my-pdp-data-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const rights = [
    {
      icon: Download,
      title: 'Export Data Saya',
      pasal: 'Pasal 13 UU PDP',
      desc: 'Unduh seluruh data Anda (profil + assessment) dalam format JSON.',
      action: (
        <Button size="sm" variant="outline" onClick={exportData}>
          Export JSON
        </Button>
      ),
    },
    {
      icon: Pencil,
      title: 'Perbarui Data Saya',
      pasal: 'Pasal 6 UU PDP',
      desc: 'Ubah nama, jabatan, atau organisasi Anda di tab Profil.',
      action: (
        <Button size="sm" variant="outline" onClick={() => onGoTab('profile')}>
          Ke Tab Profil
        </Button>
      ),
    },
    {
      icon: Trash2,
      title: 'Hapus Akun',
      pasal: 'Pasal 8 UU PDP',
      desc: 'Hapus akun Anda secara permanen melalui tab Keamanan.',
      action: (
        <Button size="sm" variant="outline" onClick={() => onGoTab('security')}>
          Ke Tab Keamanan
        </Button>
      ),
    },
    {
      icon: FileText,
      title: 'Lihat Privacy Notice',
      pasal: 'Pasal 20 UU PDP',
      desc: 'Baca kembali Pemberitahuan Pemrosesan Data Pribadi.',
      action: (
        <Button size="sm" variant="outline" onClick={() => setNoticeOpen(true)}>
          Baca Notice
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <Card className="border-l-[3px] border-l-accent">
        <CardHeader>
          <CardTitle>Status Persetujuan</CardTitle>
        </CardHeader>
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="success" dot>
            <ShieldCheck className="mr-0.5 h-3 w-3" /> Consent Aktif
          </Badge>
          <span className="font-mono text-xs text-text-muted">
            Diberikan {consent ? formatDateTime(consent.consentGivenAt) : '—'} · v
            {consent?.privacyNoticeVersion ?? '1.0'}
          </span>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Hak Subjek Data (Pasal 5-16 UU PDP)</CardTitle>
          <CardDescription>Kelola data pribadi Anda sesuai hak yang dijamin undang-undang</CardDescription>
        </CardHeader>
        <div className="space-y-3">
          {rights.map((r) => (
            <div
              key={r.title}
              className="flex flex-col gap-3 rounded-lg border border-border bg-background/40 p-4 sm:flex-row sm:items-center"
            >
              <r.icon className="h-5 w-5 shrink-0 text-accent" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-semibold text-text-primary">{r.title}</h3>
                  <Badge variant="accent">{r.pasal}</Badge>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-text-muted">{r.desc}</p>
              </div>
              <div className="shrink-0">{r.action}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Informasi Penyimpanan</CardTitle>
        </CardHeader>
        <div className="flex items-start gap-2.5 text-sm text-text-muted">
          <UserIcon className="mt-0.5 h-4 w-4 shrink-0 text-text-faint" />
          <div className="space-y-1">
            <p>Data akun dan assessment disimpan di Google Sheets milik operator aplikasi (Pengendali Data) melalui kanal terenkripsi HTTPS.</p>
            <p>Tidak ada data yang dijual atau dibagikan ke pihak ketiga untuk tujuan komersial. IP address dan User Agent tidak direkam.</p>
          </div>
        </div>
      </Card>

      <Modal
        open={noticeOpen}
        onClose={() => setNoticeOpen(false)}
        title="Pemberitahuan Pemrosesan Data Pribadi"
        maxWidth="max-w-3xl"
      >
        <PrivacyNoticeContent />
      </Modal>
    </div>
  );
}
