import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Em desenvolvimento, /api, /arquivos e /saude vão para a API (npm run dev no BackMantiqueiraWeb, porta 3000).
// Assim o front usa caminhos relativos e não depende de CORS. Em produção, defina VITE_API_URL.
// Se a API estiver em outra porta, defina VITE_API_PROXY (ex.: VITE_API_PROXY=http://localhost:3001).
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const API = env.VITE_API_PROXY || 'http://localhost:3000';
  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        '/api': API,
        '/arquivos': API,
        '/saude': API,
      },
    },
  };
});
