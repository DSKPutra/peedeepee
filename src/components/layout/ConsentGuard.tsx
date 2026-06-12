import { Navigate, Outlet, useNavigate } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import {
  clearConsentRecord,
  getConsentRecord,
  isConsentValid,
} from '@/core/utils/consent';

/**
 * Guard seluruh halaman yang memproses data pribadi.
 * - Tidak ada consent record  → redirect paksa ke Pre-Assessment Gate
 * - Record ada tapi tidak valid (versi notice berubah / consent tidak
 *   lengkap / record korup) → layar "Persetujuan Ulang Diperlukan"
 */
export function ConsentGuard() {
  const record = getConsentRecord();

  if (!record) return <Navigate to="/pre-assessment" replace />;
  if (!isConsentValid(record)) return <ReconsentRequired />;
  return <Outlet />;
}

function ReconsentRequired() {
  const navigate = useNavigate();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6 text-center">
      <div className="card-surface max-w-md p-8">
        <ShieldAlert className="mx-auto h-12 w-12 text-warning" />
        <h1 className="mt-4 font-display text-xl font-bold text-text-primary">
          Persetujuan Ulang Diperlukan
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-text-muted">
          Pemberitahuan Pemrosesan Data Pribadi telah diperbarui atau catatan persetujuan Anda
          tidak lagi valid. Sesuai Pasal 20-21 UU PDP, kami memerlukan persetujuan baru sebelum
          melanjutkan pemrosesan data Anda.
        </p>
        <button
          onClick={() => {
            clearConsentRecord();
            navigate('/pre-assessment');
          }}
          className="mt-6 inline-flex h-11 items-center justify-center rounded-lg bg-gradient-to-br from-accent-400 to-accent-500 px-6 text-sm font-semibold text-background shadow-btn-accent"
        >
          Baca Notice & Berikan Persetujuan Baru
        </button>
      </div>
    </div>
  );
}
