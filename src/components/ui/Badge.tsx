import type { HTMLAttributes, ReactNode } from 'react';

type Variant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'accent' | 'muted';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
  variant?: Variant;
  /** Titik status di kiri label. */
  dot?: boolean;
}

const variantClasses: Record<Variant, string> = {
  default: 'bg-primary/40 text-text-primary border-border',
  success: 'bg-success/15 text-success border-success/40',
  warning: 'bg-warning/15 text-warning border-warning/40',
  danger: 'bg-danger/15 text-danger border-danger/40',
  info: 'bg-info/15 text-info border-info/40',
  accent: 'bg-accent/10 text-accent border-accent/40',
  muted: 'bg-surface text-text-muted border-border',
};

const dotColor: Record<Variant, string> = {
  default: 'bg-text-primary',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  info: 'bg-info',
  accent: 'bg-accent',
  muted: 'bg-text-muted',
};

export function Badge({ children, variant = 'default', dot = false, className = '', ...props }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[11px] font-medium uppercase tracking-wider ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${dotColor[variant]}`} />}
      {children}
    </span>
  );
}
