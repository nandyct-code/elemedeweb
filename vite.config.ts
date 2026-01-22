
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
        manifest: {
          name: 'ELEMEDE',
          short_name: 'ELEMEDE',
          description: 'Tu Guía Maestra de Repostería y Dulces.',
          theme_color: '#f97316',
          background_color: '#fffafb',
          display: 'standalone',
          orientation: 'portrait',
          scope: '/',
          start_url: '/',
          icons: [
            {
              src: 'https://cdn-icons-png.flaticon.com/512/3199/3199895.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'https://cdn-icons-png.flaticon.com/512/3199/3199895.png',
              sizes: '512x512',
              type: 'image/png'
            },
            {
              src: 'https://cdn-icons-png.flaticon.com/512/3199/3199895.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ]
        }
      })
    ],
    // SECURITY UPDATE: API_KEY removed from define. 
    // It is now handled securely via Supabase Edge Functions.
    build: {
      outDir: 'dist',
      sourcemap: true
    }
  };
});
