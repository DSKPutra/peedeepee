import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Check, Download, ShieldCheck, Trash2, Upload, X } from 'lucide-react';
import type { Permission, UserRole } from '@/types';
import { ROLE_PERMISSIONS } from '@/types';
import { useOrgStore } from '@/store/orgStore';
import { useAssessmentStore } from '@/store/assessmentStore';
import { useResultStore } from '@/store/resultStore';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';

const orgSchema = z.object({
  name: z.string().min(2, 'Nama organisasi minimal 2 karakter'),
  industry: z.string().min(2, 'Industri wajib diisi'),
  size: z.enum(['SMALL', 'MEDIUM', 'LARGE', 'ENTERPRISE']),
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
  const { organization, role, userName, setOrganization, setRole, setUserName, hasPermission, resetOrg } =
    useOrgStore();
  const assessmentStore = useAssessmentStore();
  const resultStore = useResultStore();

  const [saved, setSaved] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [importError, setImportError] = useState('');
  const importRef = useRef<HTMLInputElement>(null);

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

  const handleExport = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      organization,
      assessments: assessmentStore.assessments,
      results: resultStore.results,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pdp-assessment-export_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
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

  const handleResetAll = () => {
    assessmentStore.resetAll();
    resultStore.resetAll();
    resetOrg();
    localStorage.removeItem('pdp-demo-seeded-v1');
    setResetOpen(false);
    window.location.reload();
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-bold text-text-primary sm:text-3xl">Settings</h1>
        <p className="mt-1 text-sm text-text-muted">
          Profil organisasi, kontrol akses, dan manajemen data
        </p>
      </div>

      {/* ── Profil Organisasi ── */}
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
                { value: 'SMALL', label: 'Kecil (< 50 karyawan)' },
                { value: 'MEDIUM', label: 'Menengah (50-250 karyawan)' },
                { value: 'LARGE', label: 'Besar (250-1000 karyawan)' },
                { value: 'ENTERPRISE', label: 'Enterprise (> 1000 karyawan)' },
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

      {/* ── Simulasi RBAC ── */}
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
              className={`flex items-center gap-2 rounded-md border px-4 py-2.5 text-sm transition-all ${
                role === r
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-border text-text-muted hover:border-accent/40'
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
              <tr className="border-b border-border font-mono text-[11px] uppercase tracking-wider text-text-muted">
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
                <tr key={perm} className="border-b border-border/50">
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

      {/* ── Export / Import ── */}
      <Card>
        <CardHeader>
          <CardTitle>Export / Import Data</CardTitle>
          <CardDescription>
            Cadangkan atau pulihkan seluruh data assessment dalam format JSON
          </CardDescription>
        </CardHeader>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4" />
            Export JSON
          </Button>
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
        </div>
        {importError && (
          <Alert variant="danger" className="mt-3" title="Import gagal">
            {importError}
          </Alert>
        )}
      </Card>

      {/* ── Danger Zone ── */}
      <Card className="border-danger/40">
        <CardHeader>
          <CardTitle className="text-danger">Danger Zone</CardTitle>
          <CardDescription>
            Menghapus seluruh assessment, hasil scoring, dan profil organisasi dari localStorage
          </CardDescription>
        </CardHeader>
        <Button variant="danger" onClick={() => setResetOpen(true)} disabled={!canManage}>
          <Trash2 className="h-4 w-4" />
          Reset Semua Data
        </Button>
      </Card>

      <Modal
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        title="Reset Semua Data?"
        maxWidth="max-w-md"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setResetOpen(false)}>
              Batal
            </Button>
            <Button variant="danger" onClick={handleResetAll}>
              Ya, Hapus Semuanya
            </Button>
          </div>
        }
      >
        <p className="text-sm text-text-muted">
          Seluruh data — assessment, hasil scoring, riwayat, dan profil organisasi — akan dihapus
          permanen dari penyimpanan lokal browser. Data demo akan dimuat ulang setelah reset.
          Tindakan ini tidak dapat dibatalkan.
        </p>
      </Modal>
    </div>
  );
}
