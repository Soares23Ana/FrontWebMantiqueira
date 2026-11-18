import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// Testes automatizados (npm test): rodam num navegador simulado (jsdom), sem precisar do back nem do Tailwind.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    css: false,
  },
});
