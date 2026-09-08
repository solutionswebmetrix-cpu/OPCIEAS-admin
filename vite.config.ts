import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const backendUrl =
    env.VITE_BACKEND_URL ||
    (env.VITE_API_URL?.startsWith('/') ? 'http://localhost:8000' : env.VITE_API_URL?.replace(/\/api\/?$/, ''));

  return {
    base: '/',
    plugins: [react()],
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
    server: {
      port: 5174,
      historyApiFallback: true,
      proxy: backendUrl
        ? {
            '/api': {
              target: backendUrl,
              changeOrigin: true,
              secure: false,
            },
          }
        : {},
    },
    build: {
      outDir: 'dist',
      sourcemap: mode !== 'production',
      chunkSizeWarningLimit: 1500,
      rollupOptions: {
        output: {
          manualChunks: {
            react: ['react', 'react-dom', 'react-router-dom'],
            motion: ['framer-motion'],
            lucide: ['lucide-react'],
          },
        },
      },
    },
  };
});
