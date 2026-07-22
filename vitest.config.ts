import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/shared/lib/test-setup.ts'],
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx']
  },
  resolve: { alias: { '@': '/home/user/LATENT/src' } }
});
