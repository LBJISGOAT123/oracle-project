// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // 이 부분이 있어야 Replit에서 접속이 가능합니다.
    port: 3000,      // 보통 3000번이나 5173번을 사용합니다.
  }
})