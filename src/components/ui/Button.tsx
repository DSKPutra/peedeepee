import { type ButtonHTMLAttributes, forwardRef } from 'react';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-accent text-background font-semibold hover:shadow-[0_0_24px_rgba(0,212,255,0.35)] active:scale-[0.985]',
  secondary: 'bg-primary text-text-primary hover:bg-primary/80 active:scale-[0.985]',
  outline:
    'border border-border text-text-primary bg-transparent hover:border-accent/60 hover:text-accent active:scale-[0.985]',
  ghost: 'text-text-muted hover:text-text-primary hover:bg-surface active:scale-[0.985]',
  danger: 'bg-danger/15 text-danger border border-danger/40 hover:bg-danger/25 active:scale-[0.985]',
  success: 'bg-success text-background font-semibold hover:shadow-[0_0_24px_rgba(0,200,150,0.35)] active:scale-[0.985]',
};

const sizeClasses: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs rounded',
  md: 'h-10 px-4 text-sm rounded-md',
  lg: 'h-12 px-6 text-base rounded-md',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className = '', ...props }, ref) => (
    <button
      ref={ref}
      className={`inline-flex items-center justify-center gap-2 font-body transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 disabled:opacity-40 disabled:pointer-events-none ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    />
  )
);
Button.displayName = 'Button';
