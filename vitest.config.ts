import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

export default defineConfig((env) =>
  mergeConfig(viteConfig(env), {
    define: {
      'import.meta.env.VITE_API_URL': JSON.stringify('http://api.test/api'),
    },
    css: {
      preprocessorOptions: { scss: { api: 'modern-compiler' } },
    },
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      include: ['src/**/*.test.{ts,tsx}'],
      env: { TZ: 'UTC' },
    },
  }),
);
