import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cx } from '@/shared/lib/cx';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

export function Button({ className, variant = 'secondary', children, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; children: ReactNode }) {
  return (
    <button
      className={cx(
        'inline-flex items-center justify-center gap-2 border px-4 py-2 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal disabled:cursor-not-allowed disabled:opacity-40',
        variant === 'primary' && 'border-signal bg-signal text-white hover:opacity-90',
        variant === 'secondary' && 'border-hairline bg-surface text-primary hover:bg-muted',
        variant === 'ghost' && 'border-transparent bg-transparent text-secondary hover:text-primary',
        variant === 'danger' && 'border-danger bg-transparent text-danger hover:bg-muted',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
