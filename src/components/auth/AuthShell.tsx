import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import logo from '@/assets/logo.svg';

interface AuthShellProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  /** Lebar maksimum kartu. */
  maxWidth?: string;
}

export function AuthShell({ title, subtitle, children, maxWidth = 'max-w-md' }: AuthShellProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-background to-surface px-4 py-10">
      <div className={`w-full ${maxWidth}`}>
        <Link to="/" className="mb-7 flex items-center justify-center gap-2.5">
          <img src={logo} alt="XyberXecurity" className="h-9 w-9" />
          <span className="bg-gradient-to-br from-text-primary to-accent bg-clip-text font-display text-lg font-extrabold text-transparent">
            XyberXecurity
          </span>
        </Link>

        <div className="card-surface p-6 sm:p-8 animate-fade-in">
          <h1 className="font-display text-2xl font-bold text-text-primary">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm text-text-muted">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>

        <p className="mt-6 text-center font-mono text-[11px] text-text-faint">
          Powered by <span className="text-accent">XyberXecurity</span> by Dea Saka Kurnia Putra
        </p>
      </div>
    </div>
  );
}
