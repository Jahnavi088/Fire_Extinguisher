import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/app1': {
        target: 'https://ehs.garrev.com',
        changeOrigin: true,
        secure: true,
      },
    },
  },
})
