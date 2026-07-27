import {
  defineConfig,
  loadEnv,
  type HtmlTagDescriptor,
  type Plugin
} from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { VitePWA } from 'vite-plugin-pwa';

/// Helper function to get a required environment variable.
const requiredEnv = (env: Record<string, string>, name: string): string => {
  const value = env[name];

  if (typeof value === 'undefined' || value === '')
    throw new Error(`Missing required environment variable: ${name}`);

  return value;
};

/// Vite plugin to inject theme variables into the HTML head.
const injectTheme = (vars: Record<string, string>): Plugin => ({
  name: 'inject-theme',
  enforce: 'post',
  transformIndexHtml: () => {
    const tagDescriptor: HtmlTagDescriptor = {
      injectTo: 'head',
      tag: 'style',
      attrs: { type: 'text/css' },
      children: `@layer theme { :root {${Object.entries(vars)
        .map(([key, value]) => `--${key}: ${value}`)
        .join(';')}}}`
    };

    return [tagDescriptor];
  }
});

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());

  const pwa = VitePWA({
    registerType: 'autoUpdate',
    devOptions: {
      enabled: true
    },
    manifest: {
      name: requiredEnv(env, 'VITE_APP_NAME'),
      short_name: requiredEnv(env, 'VITE_APP_SHORT_NAME'),
      start_url: '/',
      background_color: requiredEnv(env, 'VITE_APP_BACKGROUND_COLOR'),
      theme_color: requiredEnv(env, 'VITE_APP_THEME_COLOR'),
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
    plugins: [
      react(),
      tailwindcss(),
      pwa,
      injectTheme({
        'pwa-background-color': requiredEnv(env, 'VITE_APP_BACKGROUND_COLOR'),
        'pwa-theme-color': requiredEnv(env, 'VITE_APP_THEME_COLOR'),
        'pwa-theme-color-foreground': requiredEnv(
          env,
          'VITE_APP_THEME_COLOR_FOREGROUND'
        ),
        'pwa-theme-color-soft': requiredEnv(env, 'VITE_APP_THEME_COLOR_SOFT')
      })
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src')
      }
    }
  };
});
