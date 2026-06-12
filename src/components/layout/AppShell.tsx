import { useState } from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import { BarChart3, ClipboardList, History, Menu, Settings as SettingsIcon, UserCircle2, X } from 'lucide-react';
import logo from '@/assets/logo.svg';
import { useOrgStore } from '@/store/orgStore';
import { Badge } from '@/components/ui/Badge';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: BarChart3, permission: 'view_dashboard' as const },
  { to: '/assessment', label: 'Assessment', icon: ClipboardList, permission: 'start_assessment' as const },
  { to: '/history', label: 'Riwayat', icon: History, permission: 'view_history' as const },
  { to: '/settings', label: 'Settings', icon: SettingsIcon, permission: 'manage_settings' as const },
];

const roleVariant = { ADMINISTRATOR: 'danger', DPO: 'accent', AUDITOR: 'info' } as const;

export function AppShell() {
  const { role, userName, hasPermission } = useOrgStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  const visibleItems = NAV_ITEMS.filter((item) => hasPermission(item.permission));

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <img src={logo} alt="XyberXecurity" className="h-8 w-8" />
            <div className="hidden sm:block">
              <p className="bg-gradient-to-br from-text-primary to-accent bg-clip-text font-display text-sm font-extrabold leading-tight text-transparent">
                PDP Readiness
              </p>
              <p className="font-mono text-[10px] uppercase tracking-wider text-accent">
                XyberXecurity
              </p>
            </div>
          </Link>

          <nav className="ml-6 hidden items-center gap-1 md:flex" aria-label="Navigasi utama">
            {visibleItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                    isActive
                      ? 'bg-primary/40 text-accent'
                      : 'text-text-muted hover:bg-surface hover:text-text-primary'
                  }`
                }
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Indikator role aktif */}
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden items-center gap-2 sm:flex">
              <UserCircle2 className="h-5 w-5 text-text-muted" />
              <span className="max-w-[12rem] truncate text-sm text-text-primary">{userName}</span>
            </div>
            <Badge variant={roleVariant[role]} dot>
              {role}
            </Badge>
            <button
              className="rounded-md p-2 text-text-muted hover:bg-surface md:hidden"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Buka menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <nav className="border-t border-border bg-surface px-4 py-2 md:hidden" aria-label="Navigasi mobile">
            {visibleItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-md px-3 py-2.5 text-sm ${
                    isActive ? 'bg-primary/40 text-accent' : 'text-text-muted'
                  }`
                }
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            ))}
          </nav>
        )}
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <Outlet />
      </main>

      <footer className="border-t border-border py-6">
        <p className="text-center font-mono text-xs text-text-muted">
          Powered by <span className="text-accent">XyberXecurity</span> by Dea Saka Kurnia Putra ·
          UU PDP No. 27 Tahun 2022
        </p>
      </footer>
    </div>
  );
}
