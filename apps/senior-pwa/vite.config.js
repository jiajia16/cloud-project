import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    fs: {
      // Allow serving files from the monorepo root and shared packages
      allow: [
        '..',
        path.resolve(__dirname, '../../packages'),
      ],
    },
  },
  resolve: {
    alias: {
      '@ui': path.resolve(__dirname, '../../packages/ui'),
      '@utils': path.resolve(__dirname, '../../packages/utils'),
      '@types': path.resolve(__dirname, '../../packages/types'),
    },
  },
})
