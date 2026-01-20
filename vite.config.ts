import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    // Configurações para evitar erro 431 (Request Header Fields Too Large)
    // Aumentar limite de headers HTTP
    hmr: {
      protocol: 'ws',
      host: 'localhost',
    },
    // Configurar middleware para aumentar limite de headers
    middlewareMode: false,
    // Headers CORS se necessário
    cors: true,
  },
  // Aumentar limite de payload para requisições
  build: {
    chunkSizeWarningLimit: 1000,
  },
  // Configurações adicionais para desenvolvimento
  optimizeDeps: {
    include: ['@supabase/supabase-js'],
  },
})
