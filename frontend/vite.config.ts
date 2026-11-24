import path from 'path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),
        tailwindcss()
  ],
  server: {
  allowedHosts: ['nonliterary-silas-joltless.ngrok-free.dev'],
  proxy: { '/api': { target: 'http://localhost:5000', changeOrigin: true } },
},
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),   //treat as in src always
    },
  },
})
