import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  ChevronDown,
  ClipboardList,
  History,
  LogOut,
  Menu,
  Settings as SettingsIcon,
  User as UserIcon,
  X,
} from 'lucide-react';
import logo from '@/assets/logo.svg';
import { useOrgStore } from '@/store/orgStore';
import { useAuthStore } from '@/store/authStore';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: BarChart3, permission: 'view_dashboard' as const },
  { to: '/assessment', label: 'Assessment', icon: ClipboardList, permission: 'start_assessment' as const },
  { to: '/history', label: 'Riwayat', icon: History, permission: 'view_history' as const },
];

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || 'U';
}

export function AppShell() {
  const navigate = useNavigate();
  const { hasPermission } = useOrgStore();
  const { user, logout } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const visibleItems = NAV_ITEMS.filter((item) => hasPermission(item.permission));
  const displayName = user?.fullName ?? 'Pengguna';

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const doLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
          <Link to="/dashboard" className="flex items-center gap-2.5">
            <img src={logo} alt="XyberXecurity" className="h-8 w-8" />
            <div className="hidden sm:block">
              <p className="bg-gradient-to-br from-text-primary to-accent bg-clip-text font-display text-sm font-extrabold leading-tight text-transparent">
                PDP Readiness
              </p>
              <p className="font-mono text-[10px] uppercase tracking-wider text-accent">XyberXecurity</p>
            </div>
          </Link>

          <nav className="ml-6 hidden items-center gap-1 md:flex" aria-label="Navigasi utama">
            {visibleItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                    isActive ? 'bg-primary/40 text-accent' : 'text-text-muted hover:bg-surface hover:text-text-primary'
                  }`
                }
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* User dropdown */}
          <div className="ml-auto flex items-center gap-2" ref={menuRef}>
            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2 rounded-full border border-border py-1 pl-1 pr-2.5 transition-colors hover:border-border-strong"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-700 font-mono text-[11px] font-bold text-white">
                  {initials(displayName)}
                </span>
                <span className="hidden max-w-[10rem] truncate text-sm text-text-primary sm:block">
                  {displayName}
                </span>
                <ChevronDown className="h-4 w-4 text-text-muted" />
              </button>

              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-56 overflow-hidden rounded-lg border border-border bg-elevated shadow-card animate-fade-in"
                >
                  <div className="border-b border-border px-4 py-3">
                    <p className="truncate text-sm font-semibold text-text-primary">{displayName}</p>
                    <p className="truncate font-mono text-[11px] text-text-muted">{user?.email}</p>
                  </div>
                  <Link
                    to="/profile"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-text-muted transition-colors hover:bg-overlay hover:text-text-primary"
                  >
                    <UserIcon className="h-4 w-4" /> Profil Saya
                  </Link>
                  <Link
                    to="/settings"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-text-muted transition-colors hover:bg-overlay hover:text-text-primary"
                  >
                    <SettingsIcon className="h-4 w-4" /> Settings
                  </Link>
                  <button
                    onClick={doLogout}
                    className="flex w-full items-center gap-2.5 border-t border-border px-4 py-2.5 text-sm text-danger transition-colors hover:bg-danger/10"
                  >
                    <LogOut className="h-4 w-4" /> Keluar
                  </button>
                </div>
              )}
            </div>

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
            <Link
              to="/profile"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-text-muted"
            >
              <UserIcon className="h-4 w-4" /> Profil Saya
            </Link>
            <Link
              to="/settings"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-text-muted"
            >
              <SettingsIcon className="h-4 w-4" /> Settings
            </Link>
          </nav>
        )}
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <Outlet />
      </main>

      <footer className="border-t border-border py-6">
        <p className="text-center font-mono text-xs text-text-muted">
          Powered by <span className="text-accent">XyberXecurity</span> by Dea Saka Kurnia Putra · UU
          PDP No. 27 Tahun 2022
        </p>
      </footer>
    </div>
  );
}
