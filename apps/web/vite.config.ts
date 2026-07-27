import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { VitePWA } from 'vite-plugin-pwa';
import runtimeEnv from 'vite-plugin-runtime-env';

// https://vite.dev/config/
export default defineConfig(() => {
  const pwa = VitePWA({
    registerType: 'autoUpdate',
    devOptions: {
      enabled: true
    },
    manifest: {
      name: 'DSA Doku',
      short_name: 'DSA Doku',
      start_url: '/',
      background_color: '#ffffff',
      theme_color: '#00858c',
      icons: [
        {
          src: `./src/assets/icon-192.png`,
          sizes: '192x192',
          type: 'image/png'
        },
        {
          src: `./src/assets/icon-512.png`,
          sizes: '512x512',
          type: 'image/png'
        }
      ]
    }
  });

  return {
    plugins: [react(), tailwindcss(), pwa, runtimeEnv()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src')
      }
    }
  };
});
