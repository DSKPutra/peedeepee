import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Check,
  Cloud,
  Copy,
  Download,
  FileText,
  Pencil,
  RefreshCw,
  ShieldCheck,
  ShieldOff,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import type { Permission, UserIdentity, UserRole } from '@/types';
import { ROLE_PERMISSIONS } from '@/types';
import { useOrgStore } from '@/store/orgStore';
import { useAssessmentStore } from '@/store/assessmentStore';
import { useResultStore } from '@/store/resultStore';
import { useDriveStore } from '@/store/driveStore';
import {
  PRIVACY_NOTICE_VERSION,
  getConsentRecord,
  updateConsentIdentity,
  withdrawConsent,
} from '@/core/utils/consent';
import { formatDateTime } from '@/core/utils/reportFormatter';
import { driveService } from '@/services/driveService';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { PrivacyNoticeContent } from '@/components/consent/PrivacyNoticeContent';
import { IdentityForm } from '@/components/consent/IdentityForm';

const orgSchema = z.object({
  name: z.string().min(2, 'Nama organisasi minimal 2 karakter'),
  industry: z.string().min(2, 'Industri wajib diisi'),
  size: z.enum(['STARTUP', 'SMALL', 'MEDIUM', 'LARGE', 'ENTERPRISE']),
  dpoName: z.string().min(2, 'Nama DPO wajib diisi'),
  userName: z.string().min(2, 'Nama pengguna wajib diisi'),
});

type OrgForm = z.infer<typeof orgSchema>;

const PERMISSION_LABELS: Record<Permission, string> = {
  view_dashboard: 'Lihat dashboard',
  start_assessment: 'Mulai assessment',
  view_report: 'Lihat laporan',
  export_pdf: 'Export PDF',
  manage_settings: 'Kelola settings',
  view_history: 'Lihat riwayat',
  delete_assessment: 'Hapus assessment',
};

const ALL_PERMISSIONS = Object.keys(PERMISSION_LABELS) as Permission[];
const ROLES: UserRole[] = ['ADMINISTRATOR', 'DPO', 'AUDITOR'];
const roleVariant = { ADMINISTRATOR: 'danger', DPO: 'accent', AUDITOR: 'info' } as const;

export default function Settings() {
  const navigate = useNavigate();
  const { organization, role, userName, setOrganization, setRole, setUserName, hasPermission } =
    useOrgStore();
  const assessmentStore = useAssessmentStore();
  const resultStore = useResultStore();
  const { queueCount } = useDriveStore();

  const [saved, setSaved] = useState(false);
  const [importError, setImportError] = useState('');
  const [copied, setCopied] = useState(false);
  const [consentVersion, setConsentVersion] = useState(0); // re-render setelah update identitas
  const importRef = useRef<HTMLInputElement>(null);

  // Modal states
  const [identityOpen, setIdentityOpen] = useState(false);
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [withdrawStep, setWithdrawStep] = useState<0 | 1 | 2>(0);
  const [withdrawConfirmText, setWithdrawConfirmText] = useState('');
  const [deleteAssessmentsOpen, setDeleteAssessmentsOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);

  void consentVersion;
  const consent = getConsentRecord();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OrgForm>({
    resolver: zodResolver(orgSchema),
    defaultValues: {
      name: organization?.name ?? '',
      industry: organization?.industry ?? '',
      size: organization?.size ?? 'MEDIUM',
      dpoName: organization?.dpoName ?? '',
      userName,
    },
  });

  const canManage = hasPermission('manage_settings');

  const onSubmit = (data: OrgForm) => {
    setOrganization({
      id: organization?.id ?? `org-${Date.now()}`,
      name: data.name,
      industry: data.industry,
      size: data.size,
      dpoName: data.dpoName,
      createdAt: organization?.createdAt ?? new Date().toISOString(),
    });
    setUserName(data.userName);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const buildFullExport = () => ({
    exportedAt: new Date().toISOString(),
    consentRecord: consent,
    organization,
    assessments: assessmentStore.assessments,
    results: resultStore.results,
  });

  // ── ① Export Data Saya (Pasal 13 — portabilitas) ──
  const handleExportMyData = () => {
    const payload = buildFullExport();
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `my-pdp-data-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    void driveService.saveFullExport(payload);
  };

  // ── ② Perbarui Identitas (Pasal 6 — koreksi) ──
  const handleIdentityUpdate = (identity: UserIdentity) => {
    const updated = updateConsentIdentity(identity);
    if (updated) {
      setOrganization({
        id: organization?.id ?? `org-${Date.now()}`,
        name: identity.organization,
        industry: identity.industry,
        size: identity.orgSize,
        dpoName: organization?.dpoName ?? identity.fullName,
        createdAt: organization?.createdAt ?? new Date().toISOString(),
      });
      setUserName(identity.fullName);
      void driveService.saveConsent(updated);
      setConsentVersion((v) => v + 1);
    }
    setIdentityOpen(false);
  };

  // ── ④ Tarik Persetujuan (Pasal 9) ──
  const handleWithdraw = () => {
    withdrawConsent();
    navigate('/');
  };

  // ── ⑤ Hapus Data Assessment (Pasal 8) ──
  const handleDeleteAssessments = () => {
    assessmentStore.resetAll();
    resultStore.resetAll();
    setDeleteAssessmentsOpen(false);
  };

  const handleImport = (file: File) => {
    setImportError('');
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result));
        if (!Array.isArray(data.assessments)) throw new Error('Format tidak valid: assessments harus array');
        assessmentStore.importAssessments(data.assessments);
        if (data.results && typeof data.results === 'object') resultStore.importResults(data.results);
        if (data.organization) setOrganization(data.organization);
      } catch (e) {
        setImportError(e instanceof Error ? e.message : 'File JSON tidak valid');
      }
    };
    reader.readAsText(file);
  };

  const handleResync = async () => {
    setSyncing(true);
    try {
      await driveService.flushQueue();
      await driveService.saveFullExport(buildFullExport());
    } finally {
      setSyncing(false);
    }
  };

  const copyConsentId = async () => {
    if (!consent) return;
    await navigator.clipboard.writeText(consent.consentId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Action cards Hak Subjek Data
  const rightsCards = [
    {
      icon: Download,
      title: '① Export Data Saya',
      pasal: 'Pasal 13 UU PDP',
      description: 'Unduh semua data Anda (consent + seluruh hasil assessment) dalam format JSON.',
      action: <Button size="sm" variant="outline" onClick={handleExportMyData}>Export JSON</Button>,
    },
    {
      icon: Pencil,
      title: '② Perbarui Identitas Saya',
      pasal: 'Pasal 6 UU PDP',
      description: 'Ubah nama, jabatan, atau perusahaan Anda. Perubahan tidak mempengaruhi assessment yang sudah selesai.',
      action: (
        <Button size="sm" variant="outline" onClick={() => setIdentityOpen(true)} disabled={!consent}>
          Edit Identitas
        </Button>
      ),
    },
    {
      icon: FileText,
      title: '③ Lihat Privacy Notice',
      pasal: 'Pasal 20 UU PDP',
      description: 'Baca kembali Pemberitahuan Pemrosesan Data Pribadi kami.',
      action: <Button size="sm" variant="outline" onClick={() => setNoticeOpen(true)}>Baca Privacy Notice</Button>,
    },
    {
      icon: ShieldOff,
      title: '④ Tarik Persetujuan',
      pasal: 'Pasal 9 UU PDP',
      description:
        'Tarik persetujuan pemrosesan data Anda. Tindakan ini menghapus semua data Anda dan mengunci akses ke aplikasi. Tindakan ini tidak dapat dibatalkan.',
      action: (
        <Button size="sm" variant="danger" onClick={() => setWithdrawStep(1)} disabled={!consent}>
          Tarik Persetujuan
        </Button>
      ),
      danger: true,
    },
    {
      icon: Trash2,
      title: '⑤ Hapus Semua Data Assessment',
      pasal: 'Pasal 8 UU PDP',
      description: 'Hapus semua assessment dan hasil laporan. Data identitas dan consent dipertahankan.',
      action: (
        <Button size="sm" variant="outline" onClick={() => setDeleteAssessmentsOpen(true)}>
          Hapus Data Assessment
        </Button>
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-bold text-text-primary sm:text-3xl">Settings</h1>
        <p className="mt-1 text-sm text-text-muted">
          Profil organisasi, manajemen data & privasi, dan kontrol akses
        </p>
      </div>

      {/* ═══ Manajemen Data & Privasi ═══ */}
      <Card className="border-l-[3px] border-l-accent">
        <CardHeader>
          <CardTitle>Manajemen Data & Privasi</CardTitle>
          <CardDescription>
            Status persetujuan dan hak-hak Anda sebagai Subjek Data (Pasal 5-16 UU PDP)
          </CardDescription>
        </CardHeader>

        {/* Status Persetujuan */}
        {consent ? (
          <div className="rounded-lg border border-border bg-subtle p-4">
            <div className="grid gap-x-6 gap-y-2 font-mono text-xs sm:grid-cols-2">
              <p className="text-text-muted">
                Status Consent :{' '}
                <span className="inline-flex items-center gap-1 font-semibold text-success">
                  <Check className="h-3.5 w-3.5" /> Aktif
                </span>
              </p>
              <p className="text-text-muted">
                Diberikan pada :{' '}
                <span className="text-text-primary">{formatDateTime(consent.consentGivenAt)}</span>
              </p>
              <p className="text-text-muted">
                Versi Privacy Notice :{' '}
                <span className="text-text-primary">{consent.privacyNoticeVersion}</span>
              </p>
              <p className="flex items-center gap-1.5 text-text-muted">
                Consent ID :{' '}
                <span className="truncate text-text-primary">{consent.consentId.slice(0, 18)}…</span>
                <button
                  onClick={copyConsentId}
                  aria-label="Salin Consent ID"
                  className="rounded p-0.5 text-text-muted hover:text-accent"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </p>
            </div>
          </div>
        ) : (
          <Alert variant="warning" title="Belum ada persetujuan aktif">
            Selesaikan Pre-Assessment Gate untuk memberikan persetujuan pemrosesan data.
          </Alert>
        )}

        {/* Hak Subjek Data — 5 action cards */}
        <div className="mt-4 space-y-3">
          {rightsCards.map((card) => (
            <div
              key={card.title}
              className={`flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center ${
                card.danger ? 'border-danger/40 bg-danger/5' : 'border-border bg-background/40'
              }`}
            >
              <card.icon
                className={`h-5 w-5 shrink-0 ${card.danger ? 'text-danger' : 'text-accent'}`}
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-semibold text-text-primary">{card.title}</h3>
                  <Badge variant={card.danger ? 'danger' : 'accent'}>{card.pasal}</Badge>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-text-muted">{card.description}</p>
              </div>
              <div className="shrink-0">{card.action}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* ═══ Google Drive Sync ═══ */}
      <Card>
        <CardHeader>
          <CardTitle>Google Drive Sync</CardTitle>
          <CardDescription>
            Backup otomatis consent, progress, dan laporan ke Drive Pengendali Data via Apps Script
          </CardDescription>
        </CardHeader>
        <div className="flex flex-wrap items-center gap-3">
          {driveService.isConfigured() ? (
            <>
              <Badge variant="success" dot>
                Terkonfigurasi
              </Badge>
              {queueCount > 0 && <Badge variant="warning" dot>{queueCount} antrean offline</Badge>}
              <Button size="sm" variant="outline" onClick={handleResync} disabled={syncing}>
                <RefreshCw className={`h-3.5 w-3.5 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Menyinkron…' : 'Sync Ulang Semua Data'}
              </Button>
            </>
          ) : (
            <Badge variant="muted" dot>
              Belum dikonfigurasi
            </Badge>
          )}
        </div>
        {!driveService.isConfigured() && (
          <div className="mt-3 rounded-lg border border-border bg-subtle p-4 text-xs leading-relaxed text-text-muted">
            <p className="mb-1 flex items-center gap-1.5 font-semibold text-text-primary">
              <Cloud className="h-4 w-4 text-accent" /> Cara setup (gratis, tanpa OAuth):
            </p>
            <ol className="list-decimal space-y-0.5 pl-5">
              <li>Buka script.google.com → New Project</li>
              <li>
                Paste kode dari <code className="text-accent">scripts/apps-script-receiver.js</code>
              </li>
              <li>Deploy → Web App → Execute as: Me → Access: Anyone</li>
              <li>
                Simpan URL deploy sebagai <code className="text-accent">VITE_APPS_SCRIPT_URL</code>{' '}
                di .env.local (dev) dan GitHub Secrets (production)
              </li>
            </ol>
          </div>
        )}
      </Card>

      {/* ═══ Profil Organisasi ═══ */}
      <Card>
        <CardHeader>
          <CardTitle>Profil Organisasi</CardTitle>
          <CardDescription>Identitas yang dicantumkan pada laporan assessment</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              id="org-name"
              label="Nama Organisasi"
              placeholder="PT Contoh Indonesia"
              error={errors.name?.message}
              disabled={!canManage}
              {...register('name')}
            />
            <Input
              id="org-industry"
              label="Industri"
              placeholder="Perbankan, Kesehatan, E-commerce…"
              error={errors.industry?.message}
              disabled={!canManage}
              {...register('industry')}
            />
            <Select
              id="org-size"
              label="Ukuran Organisasi"
              disabled={!canManage}
              options={[
                { value: 'STARTUP', label: 'Startup / UMKM (< 50 karyawan)' },
                { value: 'SMALL', label: 'Perusahaan Kecil (50-250 karyawan)' },
                { value: 'MEDIUM', label: 'Perusahaan Menengah (251-1000 karyawan)' },
                { value: 'LARGE', label: 'Perusahaan Besar (1001-5000 karyawan)' },
                { value: 'ENTERPRISE', label: 'Korporasi (> 5000 karyawan)' },
              ]}
              {...register('size')}
            />
            <Input
              id="org-dpo"
              label="Nama DPO"
              placeholder="Nama Data Protection Officer"
              error={errors.dpoName?.message}
              disabled={!canManage}
              {...register('dpoName')}
            />
            <Input
              id="user-name"
              label="Nama Pengguna Aktif"
              placeholder="Nama Anda"
              error={errors.userName?.message}
              disabled={!canManage}
              {...register('userName')}
            />
          </div>
          {!canManage && (
            <Alert variant="info">
              Role <span className="font-mono">{role}</span> tidak memiliki izin mengelola settings.
              Hanya Administrator yang dapat mengubah profil.
            </Alert>
          )}
          <div className="flex items-center gap-3">
            <Button type="submit" disabled={!canManage}>
              Simpan Profil
            </Button>
            {saved && (
              <span className="flex items-center gap-1.5 text-sm text-success animate-fade-in">
                <Check className="h-4 w-4" /> Tersimpan
              </span>
            )}
          </div>
        </form>
      </Card>

      {/* ═══ RBAC ═══ */}
      <Card>
        <CardHeader>
          <CardTitle>Role-Based Access Control (Simulasi)</CardTitle>
          <CardDescription>
            Ganti role aktif untuk melihat bagaimana akses UI berubah di seluruh aplikasi
          </CardDescription>
        </CardHeader>
        <div className="flex flex-wrap gap-2">
          {ROLES.map((r) => (
            <button
              key={r}
              onClick={() => setRole(r)}
              className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm transition-all ${
                role === r
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-border text-text-muted hover:border-border-strong'
              }`}
            >
              <ShieldCheck className="h-4 w-4" />
              {r}
              {role === r && <Badge variant={roleVariant[r]}>aktif</Badge>}
            </button>
          ))}
        </div>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border font-mono text-[11px] uppercase tracking-wider text-text-faint">
                <th className="pb-2 pr-3 font-medium">Permission</th>
                {ROLES.map((r) => (
                  <th key={r} className={`pb-2 pr-3 text-center font-medium ${role === r ? 'text-accent' : ''}`}>
                    {r.slice(0, 5)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ALL_PERMISSIONS.map((perm) => (
                <tr key={perm} className="border-b border-border-muted">
                  <td className="py-2 pr-3 text-xs text-text-primary">{PERMISSION_LABELS[perm]}</td>
                  {ROLES.map((r) => (
                    <td key={r} className="py-2 pr-3 text-center">
                      {ROLE_PERMISSIONS[r].includes(perm) ? (
                        <Check className="mx-auto h-4 w-4 text-success" />
                      ) : (
                        <X className="mx-auto h-4 w-4 text-danger/60" />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ═══ Import Data ═══ */}
      <Card>
        <CardHeader>
          <CardTitle>Import Data</CardTitle>
          <CardDescription>Pulihkan data assessment dari file export JSON sebelumnya</CardDescription>
        </CardHeader>
        <Button variant="outline" onClick={() => importRef.current?.click()} disabled={!canManage}>
          <Upload className="h-4 w-4" />
          Import JSON
        </Button>
        <input
          ref={importRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleImport(f);
            e.target.value = '';
          }}
        />
        {importError && (
          <Alert variant="danger" className="mt-3" title="Import gagal">
            {importError}
          </Alert>
        )}
      </Card>

      {/* ═══ Tentang ═══ */}
      <Card>
        <CardHeader>
          <CardTitle>Tentang Aplikasi</CardTitle>
        </CardHeader>
        <div className="space-y-1 font-mono text-xs text-text-muted">
          <p>PDP Readiness Assessment Tool v1.1</p>
          <p>Comprehensive UU PDP No. 27 Tahun 2022 Compliance Engine</p>
          <p>
            Powered by <span className="text-accent">XyberXecurity</span> by Dea Saka Kurnia Putra
          </p>
        </div>
      </Card>

      {/* ─── Modal: Edit Identitas (Pasal 6) ─── */}
      <Modal
        open={identityOpen}
        onClose={() => setIdentityOpen(false)}
        title="Perbarui Identitas Saya — Pasal 6 UU PDP"
      >
        <IdentityForm
          initial={consent?.userIdentity ?? null}
          onSubmit={handleIdentityUpdate}
          submitLabel="Simpan Perubahan"
        />
      </Modal>

      {/* ─── Modal: Privacy Notice (Pasal 20) ─── */}
      <Modal
        open={noticeOpen}
        onClose={() => setNoticeOpen(false)}
        title="Pemberitahuan Pemrosesan Data Pribadi"
        maxWidth="max-w-3xl"
      >
        <PrivacyNoticeContent />
      </Modal>

      {/* ─── Modal Tarik Persetujuan — tingkat 1 ─── */}
      <Modal
        open={withdrawStep === 1}
        onClose={() => setWithdrawStep(0)}
        title="Apakah Anda yakin ingin menarik persetujuan?"
        maxWidth="max-w-md"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setWithdrawStep(0)}>
              Batal
            </Button>
            <Button variant="danger" onClick={() => setWithdrawStep(2)}>
              Ya, Lanjutkan
            </Button>
          </div>
        }
      >
        <Alert variant="danger" title="Konsekuensi penarikan persetujuan (Pasal 9 UU PDP)">
          Seluruh data Anda — identitas, catatan persetujuan, assessment, dan laporan — akan
          dihapus permanen dari browser ini, dan akses ke aplikasi akan dikunci hingga Anda
          memberikan persetujuan baru. Penarikan tidak mempengaruhi pemrosesan yang telah
          dilakukan sebelumnya.
        </Alert>
      </Modal>

      {/* ─── Modal Tarik Persetujuan — tingkat 2 ─── */}
      <Modal
        open={withdrawStep === 2}
        onClose={() => {
          setWithdrawStep(0);
          setWithdrawConfirmText('');
        }}
        title="Konfirmasi Akhir"
        maxWidth="max-w-md"
        footer={
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setWithdrawStep(0);
                setWithdrawConfirmText('');
              }}
            >
              Batal
            </Button>
            <Button
              variant="danger"
              disabled={withdrawConfirmText !== 'KONFIRMASI'}
              onClick={handleWithdraw}
            >
              Tarik Persetujuan & Hapus Data
            </Button>
          </div>
        }
      >
        <p className="text-sm text-text-muted">
          Ketik <span className="font-mono font-bold text-danger">KONFIRMASI</span> untuk
          melanjutkan penarikan persetujuan dan penghapusan seluruh data Anda.
        </p>
        <input
          type="text"
          value={withdrawConfirmText}
          onChange={(e) => setWithdrawConfirmText(e.target.value)}
          placeholder="KONFIRMASI"
          aria-label="Ketik KONFIRMASI untuk melanjutkan"
          className="mt-3 h-10 w-full rounded-lg border border-danger/50 bg-subtle px-3 font-mono text-sm text-text-primary placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-danger/30"
        />
      </Modal>

      {/* ─── Modal Hapus Data Assessment ─── */}
      <Modal
        open={deleteAssessmentsOpen}
        onClose={() => setDeleteAssessmentsOpen(false)}
        title="Hapus Semua Data Assessment?"
        maxWidth="max-w-md"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteAssessmentsOpen(false)}>
              Batal
            </Button>
            <Button variant="danger" onClick={handleDeleteAssessments}>
              Hapus Permanen
            </Button>
          </div>
        }
      >
        <p className="text-sm text-text-muted">
          Seluruh assessment dan hasil laporan akan dihapus permanen dari penyimpanan lokal (Pasal
          8 UU PDP). Data identitas dan catatan persetujuan Anda tetap dipertahankan.
        </p>
      </Modal>
    </div>
  );
}
