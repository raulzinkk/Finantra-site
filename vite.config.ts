import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => ({
  base: './',

  plugins: [react(), tailwindcss()],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },

  servidor: {
    // O HMR está desativado no AI Studio através da variável de ambiente
    // Não modifique — o monitoramento de arquivos está desativado para evitar edições.
    hmr: process.env.DISABLE_HMR !== 'true',

    // Desativa o monitoramento de arquivos quando DISABLE_HMR for verdadeiro
    observar: process.env.DISABLE_HMR === 'true' ? null : {},
  },
}));
