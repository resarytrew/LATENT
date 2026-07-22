import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { cx } from '@/shared/lib/cx';

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cx('min-h-32 w-full resize-y border border-hairline bg-surface p-4 text-base leading-relaxed text-primary placeholder:text-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-signal', props.className)} />;
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cx('w-full border border-hairline bg-surface px-3 py-2 text-sm text-primary placeholder:text-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-signal', props.className)} />;
}

export function Label({ children }: { children: React.ReactNode }) {
  return <label className="text-xs uppercase tracking-[0.18em] text-secondary">{children}</label>;
}
