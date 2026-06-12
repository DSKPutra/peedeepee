import { useEffect, useRef, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

function Loader({ label }: { label: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background" role="status">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-border border-t-accent" />
        <p className="font-mono text-xs text-text-muted">{label}</p>
      </div>
    </div>
  );
}

/**
 * Guard untuk seluruh halaman terproteksi.
 *
 * Penting: zustand `persist` merehidrasi state SETELAH render pertama. Bila
 * guard memutuskan sebelum hidrasi selesai, refresh pada halaman terproteksi
 * akan salah-redirect ke /login. Karena itu kita menunggu hidrasi dulu, baru
 * memvalidasi sesi ke backend, baru memutuskan akses.
 */
export function AuthGuard() {
  const { isAuthenticated, sessionId, validateSession } = useAuthStore();
  const location = useLocation();

  const [hydrated, setHydrated] = useState(() => useAuthStore.persist.hasHydrated());
  const [checking, setChecking] = useState(true);
  const validated = useRef(false);

  // Tunggu hidrasi persist selesai.
  useEffect(() => {
    if (hydrated) return;
    const unsub = useAuthStore.persist.onFinishHydration(() => setHydrated(true));
    if (useAuthStore.persist.hasHydrated()) setHydrated(true);
    return unsub;
  }, [hydrated]);

  // Setelah hidrasi: validasi sesi ke server (sekali).
  useEffect(() => {
    if (!hydrated || validated.current) return;
    validated.current = true;
    const sid = useAuthStore.getState().sessionId;
    if (sid) {
      void validateSession().finally(() => setChecking(false));
    } else {
      setChecking(false);
    }
  }, [hydrated, validateSession]);

  if (!hydrated) return <Loader label="Memuat…" />;
  if (checking && sessionId) return <Loader label="Memverifikasi sesi…" />;
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;

  return <Outlet />;
}
