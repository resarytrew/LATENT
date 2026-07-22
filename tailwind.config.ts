import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        surface: 'var(--surface)',
        primary: 'var(--text-primary)',
        secondary: 'var(--text-secondary)',
        hairline: 'var(--hairline)',
        muted: 'var(--muted)',
        signal: 'var(--signal)',
        danger: 'var(--danger)',
        success: 'var(--success)'
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'Inter', 'ui-sans-serif', 'system-ui'],
        mono: ['var(--font-geist-mono)', 'SFMono-Regular', 'ui-monospace', 'monospace']
      }
    }
  },
  plugins: []
};
export default config;
