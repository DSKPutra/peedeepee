import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  X,
  BarChart3,
  ClipboardList,
  FileText,
  GraduationCap,
  Landmark,
  Network,
  ShieldCheck,
  Siren,
  UserCheck,
} from 'lucide-react';
import logo from '@/assets/logo.svg';
import pdpIcon from '@/assets/pdp-icon.svg';
import { DOMAINS } from '@/core/constants/domains';
import { getQuestionsByDomain } from '@/core/constants/questions';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';

const ICONS = { Landmark, UserCheck, ShieldCheck, Network, Siren, GraduationCap } as const;

const FEATURES = [
  {
    icon: ClipboardList,
    title: 'Assessment Terstruktur',
    description:
      '60 pertanyaan tertimbang di 6 domain kepatuhan, masing-masing dipetakan langsung ke pasal UU PDP dengan konteks hukum.',
  },
  {
    icon: BarChart3,
    title: 'Analitik Real-time',
    description:
      'Compliance index, radar 6 domain, risk matrix, dan prioritisasi gap dihitung otomatis oleh scoring engine tertimbang.',
  },
  {
    icon: FileText,
    title: 'Laporan Profesional',
    description:
      'Executive summary, gap analysis, dan remediation roadmap 3 fase — siap diekspor sebagai PDF untuk manajemen dan auditor.',
  },
];

/** Partikel dekoratif CSS-only di hero. */
const PARTICLES = [
  { size: 6, top: '15%', left: '8%', color: '#6269ED', delay: '0s' },
  { size: 4, top: '70%', left: '12%', color: '#E8AC1A', delay: '1.2s' },
  { size: 8, top: '25%', left: '85%', color: '#6269ED', delay: '0.6s' },
  { size: 5, top: '60%', left: '90%', color: '#4A51E0', delay: '2s' },
  { size: 3, top: '40%', left: '20%', color: '#E8AC1A', delay: '2.8s' },
  { size: 7, top: '80%', left: '75%', color: '#848CF3', delay: '1.8s' },
  { size: 4, top: '10%', left: '60%', color: '#E8AC1A', delay: '0.3s' },
  { size: 5, top: '85%', left: '40%', color: '#6269ED', delay: '3.2s' },
];

import { clearWithdrawalNotice, hasWithdrawalNotice } from '@/core/utils/consent';
import { useAuthStore } from '@/store/authStore';

export default function LandingPage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const primaryCta = isAuthenticated ? '/assessment' : '/register';
  const secondaryCta = isAuthenticated ? '/dashboard' : '/login';
  const secondaryLabel = isAuthenticated ? 'Buka Dashboard' : 'Masuk ke Akun';

  // Baca flag di initializer (idempotent), hapus setelah render pertama —
  // aman terhadap double-invoke React StrictMode.
  const [showWithdrawal, setShowWithdrawal] = useState(() => hasWithdrawalNotice());
  useEffect(() => {
    if (showWithdrawal) clearWithdrawalNotice();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-background grid-bg">
      {/* Notifikasi penarikan persetujuan (Pasal 9) */}
      {showWithdrawal && (
        <div className="fixed left-1/2 top-4 z-50 flex w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 items-start gap-3 rounded-lg border border-success/40 bg-surface p-4 shadow-card animate-fade-in">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" />
          <p className="text-sm leading-relaxed text-text-muted">
            <span className="font-semibold text-text-primary">Persetujuan Anda telah ditarik.</span>{' '}
            Data Anda telah dihapus dari browser ini.
          </p>
          <button
            onClick={() => setShowWithdrawal(false)}
            aria-label="Tutup notifikasi"
            className="ml-auto rounded p-0.5 text-text-muted hover:text-text-primary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      {/* ── Hero ── */}
      <section className="relative overflow-hidden px-4 pb-20 pt-16 sm:pt-24">
        {/* radial glow */}
        <div
          className="pointer-events-none absolute left-1/2 top-0 h-[480px] w-[720px] -translate-x-1/2 rounded-full opacity-30"
          style={{ background: 'radial-gradient(ellipse, rgba(74,81,224,0.35) 0%, transparent 65%)' }}
        />
        {PARTICLES.map((p, i) => (
          <span
            key={i}
            className="particle animate-float"
            style={{
              width: p.size,
              height: p.size,
              top: p.top,
              left: p.left,
              backgroundColor: p.color,
              animationDelay: p.delay,
              boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
            }}
          />
        ))}

        <div className="relative mx-auto max-w-4xl text-center">
          <div className="flex items-center justify-center gap-3">
            <img src={logo} alt="XyberXecurity" className="h-14 w-14" />
            <img src={pdpIcon} alt="UU PDP" className="h-14 w-14" />
          </div>
          <p className="mt-6 font-mono text-xs uppercase tracking-[0.2em] text-accent">
            XyberXecurity · Compliance Engine
          </p>
          <h1 className="mt-4 font-display text-4xl font-bold leading-tight text-text-primary sm:text-6xl">
            Ukur Kesiapan PDP
            <br />
            <span className="bg-gradient-to-r from-[#F0F1FA] via-[#A8AABE] to-[#E8AC1A] bg-clip-text text-transparent">
              Organisasi Anda
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-text-muted sm:text-lg">
            PDP Readiness Assessment Tool — compliance engine komprehensif untuk{' '}
            <span className="text-text-primary">UU PDP No. 27 Tahun 2022</span>. Identifikasi gap,
            klasifikasikan risiko, dan bangun roadmap remediasi berbasis pasal.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to={primaryCta}
              className="inline-flex h-12 items-center gap-2 rounded-lg bg-gradient-to-br from-accent-400 to-accent-500 px-7 text-base font-semibold text-background shadow-btn-accent transition-all hover:shadow-btn-accent-hover hover:-translate-y-px"
            >
              Mulai Assessment
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to={secondaryCta}
              className="inline-flex h-12 items-center gap-2 rounded-lg border border-border px-7 text-base text-text-muted transition-colors hover:border-border-strong hover:bg-overlay hover:text-text-primary"
            >
              {secondaryLabel}
            </Link>
          </div>
        </div>
      </section>

      {/* ── 3 Fitur Utama ── */}
      <section className="mx-auto max-w-6xl px-4 pb-20">
        <div className="grid gap-5 md:grid-cols-3">
          {FEATURES.map((feature) => (
            <Card key={feature.title} accentTop hoverable>
              <feature.icon className="h-8 w-8 text-accent" />
              <h3 className="mt-4 font-display text-lg font-semibold text-text-primary">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-text-muted">{feature.description}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* ── 6 Domain Kepatuhan ── */}
      <section className="mx-auto max-w-6xl px-4 pb-24">
        <div className="text-center">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">
            Cakupan Assessment
          </p>
          <h2 className="mt-3 font-display text-3xl font-bold text-text-primary">
            6 Domain Kepatuhan UU PDP
          </h2>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {DOMAINS.map((domain) => {
            const Icon = ICONS[domain.icon as keyof typeof ICONS] ?? ShieldCheck;
            return (
              <Card key={domain.id} hoverable>
                <div className="flex items-start justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-accent/30 bg-accent/10">
                    <Icon className="h-5 w-5 text-accent" />
                  </div>
                  <Badge variant="accent">{domain.pasalRange}</Badge>
                </div>
                <h3 className="mt-4 font-display text-base font-semibold text-text-primary">
                  {domain.name}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-text-muted line-clamp-3">
                  {domain.description}
                </p>
                <p className="mt-3 font-mono text-[11px] text-text-muted">
                  {getQuestionsByDomain(domain.id).length} pertanyaan · bobot ×
                  {domain.weight.toFixed(1)}
                </p>
              </Card>
            );
          })}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-4 text-center">
          <img src={logo} alt="XyberXecurity" className="h-8 w-8" />
          <p className="font-mono text-xs text-text-muted">
            Powered by <span className="text-accent">XyberXecurity</span> by Dea Saka Kurnia Putra
          </p>
          <p className="text-xs text-text-muted/70">
            Comprehensive UU PDP No. 27 Tahun 2022 Compliance Engine
          </p>
        </div>
      </footer>
    </div>
  );
}
