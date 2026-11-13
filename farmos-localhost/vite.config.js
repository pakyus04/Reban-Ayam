import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const api = `http://127.0.0.1:${env.PORT || 5000}`;
  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: Number(env.WEB_PORT || 3000),
      proxy: { '/api': { target: api }, '/uploads': { target: api } },
    },
  };
});
