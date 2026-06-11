import { Suspense, lazy, useEffect } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ErrorBoundary } from '@/components/layout/ErrorBoundary';
import { AppShell } from '@/components/layout/AppShell';
import { seedDemoDataIfNeeded } from '@/core/utils/seedDemoData';

const LandingPage = lazy(() => import('@/pages/LandingPage'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Assessment = lazy(() => import('@/pages/Assessment'));
const Report = lazy(() => import('@/pages/Report'));
const History = lazy(() => import('@/pages/History'));
const Settings = lazy(() => import('@/pages/Settings'));

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
  }, []);

  return (
    <ErrorBoundary>
      <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route element={<AppShell />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/assessment" element={<Assessment />} />
              <Route path="/report/:assessmentId" element={<Report />} />
              <Route path="/history" element={<History />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </HashRouter>
    </ErrorBoundary>
  );
}
