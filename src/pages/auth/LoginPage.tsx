import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/authService';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { AuthShell } from '@/components/auth/AuthShell';

const schema = z.object({
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(1, 'Password wajib diisi'),
});
type LoginForm = z.infer<typeof schema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, isLoading, error, clearError } = useAuthStore();
  const [showPw, setShowPw] = useState(false);

  const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? '/dashboard';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({ resolver: zodResolver(schema) });

  useEffect(() => {
    clearError();
  }, [clearError]);

  if (isAuthenticated) return <Navigate to={from} replace />;

  const onSubmit = async (data: LoginForm) => {
    const ok = await login(data.email, data.password);
    if (ok) navigate(from, { replace: true });
  };

  return (
    <AuthShell title="Masuk ke Akun Anda" subtitle="Lanjutkan ke dashboard kepatuhan UU PDP Anda">
      {!authService.isConfigured() && (
        <Alert variant="warning" className="mb-4" title="Backend belum dikonfigurasi">
          Set <span className="font-mono">VITE_APPS_SCRIPT_URL</span> dan deploy Apps Script backend
          agar autentikasi berfungsi.
        </Alert>
      )}
      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Input
          id="login-email"
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
              id="login-password"
              type={showPw ? 'text' : 'password'}
              label="Password"
              placeholder="••••••••"
              autoComplete="current-password"
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
          <div className="mt-1.5 text-right">
            <Link to="/forgot-password" className="text-xs text-accent hover:underline">
              Lupa password?
            </Link>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-br from-accent-400 to-accent-500 text-sm font-semibold text-background shadow-btn-accent transition-all hover:shadow-btn-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-background/40 border-t-background" />
          ) : (
            <LogIn className="h-4 w-4" />
          )}
          {isLoading ? 'Memproses…' : 'Masuk'}
        </button>
      </form>

      <div className="my-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="font-mono text-[11px] uppercase tracking-wider text-text-faint">atau</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <p className="text-center text-sm text-text-muted">
        Belum punya akun?{' '}
        <Link to="/register" className="font-semibold text-accent hover:underline">
          Daftar sekarang
        </Link>
      </p>
    </AuthShell>
  );
}
