import type { ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, Info, ShieldAlert } from 'lucide-react';

type Variant = 'info' | 'success' | 'warning' | 'danger';

interface AlertProps {
  variant?: Variant;
  title?: string;
  children: ReactNode;
  className?: string;
}

const config: Record<Variant, { icon: typeof Info; classes: string; iconClass: string }> = {
  info: { icon: Info, classes: 'border-info/40 bg-info/10', iconClass: 'text-info' },
  success: { icon: CheckCircle2, classes: 'border-success/40 bg-success/10', iconClass: 'text-success' },
  warning: { icon: AlertTriangle, classes: 'border-warning/40 bg-warning/10', iconClass: 'text-warning' },
  danger: { icon: ShieldAlert, classes: 'border-danger/40 bg-danger/10', iconClass: 'text-danger' },
};

export function Alert({ variant = 'info', title, children, className = '' }: AlertProps) {
  const { icon: Icon, classes, iconClass } = config[variant];
  return (
    <div className={`flex gap-3 rounded-md border p-4 ${classes} ${className}`} role="alert">
      <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${iconClass}`} />
      <div className="text-sm">
        {title && <p className="mb-1 font-semibold text-text-primary">{title}</p>}
        <div className="text-text-muted leading-relaxed">{children}</div>
      </div>
    </div>
  );
}
