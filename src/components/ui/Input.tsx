import { type InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, id, className = '', ...props }, ref) => (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-text-muted">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={id}
        className={`h-10 w-full rounded-md border bg-background px-3 text-sm text-text-primary placeholder:text-text-muted/60 transition-colors focus:outline-none focus:ring-2 focus:ring-accent/50 ${
          error ? 'border-danger' : 'border-border focus:border-accent/60'
        } ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  )
);
Input.displayName = 'Input';
