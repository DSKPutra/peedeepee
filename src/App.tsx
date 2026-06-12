import { Suspense, lazy, useEffect } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ErrorBoundary } from '@/components/layout/ErrorBoundary';
import { AppShell } from '@/components/layout/AppShell';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { DriveSyncIndicator } from '@/components/drive/DriveSyncIndicator';
import { driveService } from '@/services/driveService';
import { seedDemoDataIfNeeded } from '@/core/utils/seedDemoData';

const LandingPage = lazy(() => import('@/pages/LandingPage'));
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Assessment = lazy(() => import('@/pages/Assessment'));
const Report = lazy(() => import('@/pages/Report'));
const History = lazy(() => import('@/pages/History'));
const Settings = lazy(() => import('@/pages/Settings'));
const ProfilePage = lazy(() => import('@/pages/ProfilePage'));

function PageLoader() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center" role="status" aria-label="Memuat">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-border border-t-accent" />
        <p className="font-mono text-xs text-text-muted">Memuat…</p>
      </div>
    </div>
  );
}

export default function App() {
  useEffect(() => {
    seedDemoDataIfNeeded();
    // Flush antrean Drive saat app dimuat dan saat koneksi kembali online
    void driveService.flushQueue();
    const handleOnline = () => void driveService.flushQueue();
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  return (
    <ErrorBoundary>
      <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Publik */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />

            {/* Terproteksi — wajib autentikasi (consent direkam saat registrasi) */}
            <Route element={<AuthGuard />}>
              <Route element={<AppShell />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/assessment" element={<Assessment />} />
                <Route path="/report/:assessmentId" element={<Report />} />
                <Route path="/history" element={<History />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/settings" element={<Settings />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
        <DriveSyncIndicator />
      </HashRouter>
    </ErrorBoundary>
  );
}
