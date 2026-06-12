import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, KeyRound, Mail } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { AuthShell } from '@/components/auth/AuthShell';
import { PasswordStrength } from '@/components/auth/PasswordStrength';

type Step = 'email' | 'reset' | 'done';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { forgotPassword, resetPassword, isLoading, error, clearError } = useAuthStore();

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [devToken, setDevToken] = useState<string | undefined>();
  const [token, setToken] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [localErr, setLocalErr] = useState('');

  const submitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLocalErr('');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setLocalErr('Format email tidak valid');
      return;
    }
    const res = await forgotPassword(email);
    if (res.ok) {
      setDevToken(res.devToken);
      setStep('reset');
    }
  };

  const submitReset = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLocalErr('');
    if (token.trim().length < 4) {
      setLocalErr('Masukkan kode reset dari email Anda');
      return;
    }
    if (newPw.length < 8) {
      setLocalErr('Password minimal 8 karakter');
      return;
    }
    if (newPw !== confirmPw) {
      setLocalErr('Konfirmasi password tidak cocok');
      return;
    }
    const ok = await resetPassword(email, token.trim().toUpperCase(), newPw);
    if (ok) setStep('done');
  };

  return (
    <AuthShell
      title={step === 'done' ? 'Password Direset' : 'Lupa Password'}
      subtitle={
        step === 'email'
          ? 'Masukkan email Anda untuk menerima kode reset'
          : step === 'reset'
            ? 'Masukkan kode dari email dan password baru Anda'
            : undefined
      }
    >
      {(error || localErr) && step !== 'done' && (
        <Alert variant="danger" className="mb-4">
          {localErr || error}
        </Alert>
      )}

      {step === 'email' && (
        <form onSubmit={submitEmail} className="space-y-4" noValidate>
          <Input
            id="fp-email"
            type="email"
            label="Email"
            placeholder="nama@perusahaan.co.id"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-br from-accent-400 to-accent-500 text-sm font-semibold text-background shadow-btn-accent transition-all hover:shadow-btn-accent-hover disabled:opacity-60"
          >
            <Mail className="h-4 w-4" />
            {isLoading ? 'Mengirim…' : 'Kirim Kode Reset'}
          </button>
        </form>
      )}

      {step === 'reset' && (
        <form onSubmit={submitReset} className="space-y-4" noValidate>
          <Alert variant="info" className="mb-1">
            Jika email terdaftar, kode reset telah dikirim. Cek inbox (dan folder spam) Anda.
          </Alert>
          {devToken && (
            <Alert variant="warning" title="DEV MODE">
              Kode reset: <span className="font-mono font-bold">{devToken}</span>
            </Alert>
          )}
          <Input
            id="fp-token"
            label="Kode Reset"
            placeholder="6 karakter dari email"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="font-mono uppercase tracking-widest"
          />
          <div>
            <Input
              id="fp-newpw"
              type="password"
              label="Password Baru"
              placeholder="Minimal 8 karakter"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
            />
            <PasswordStrength password={newPw} />
          </div>
          <Input
            id="fp-confirm"
            type="password"
            label="Konfirmasi Password Baru"
            placeholder="Ulangi password baru"
            value={confirmPw}
            onChange={(e) => setConfirmPw(e.target.value)}
          />
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-br from-accent-400 to-accent-500 text-sm font-semibold text-background shadow-btn-accent transition-all hover:shadow-btn-accent-hover disabled:opacity-60"
          >
            <KeyRound className="h-4 w-4" />
            {isLoading ? 'Memproses…' : 'Reset Password'}
          </button>
          <button
            type="button"
            onClick={() => setStep('email')}
            className="w-full text-center text-xs text-text-muted hover:text-text-primary"
          >
            Kirim ulang kode
          </button>
        </form>
      )}

      {step === 'done' && (
        <div className="text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-success" />
          <p className="mt-3 text-sm text-text-muted">
            Password Anda berhasil direset. Silakan masuk dengan password baru.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-br from-accent-400 to-accent-500 text-sm font-semibold text-background shadow-btn-accent"
          >
            Kembali ke Login
          </button>
        </div>
      )}

      {step !== 'done' && (
        <div className="mt-5 text-center">
          <Link to="/login" className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary">
            <ArrowLeft className="h-3.5 w-3.5" />
            Kembali ke Login
          </Link>
        </div>
      )}
    </AuthShell>
  );
}
