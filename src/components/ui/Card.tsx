import type { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  /** Garis aksen tipis di tepi atas kartu (signature style). */
  accentTop?: boolean;
  hoverable?: boolean;
}

export function Card({ children, accentTop = false, hoverable = false, className = '', ...props }: CardProps) {
  return (
    <div
      className={`card-surface p-5 ${
        accentTop ? 'shadow-[inset_0_1px_0_#00D4FF]' : ''
      } ${hoverable ? 'transition-colors duration-200 hover:border-accent/40' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`mb-4 ${className}`}>{children}</div>;
}

export function CardTitle({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <h3 className={`font-display text-base font-semibold text-text-primary ${className}`}>{children}</h3>;
}

export function CardDescription({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <p className={`mt-1 text-sm text-text-muted ${className}`}>{children}</p>;
}
