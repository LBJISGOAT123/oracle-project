import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// import checker from 'vite-plugin-checker' // 주석 처리 또는 삭제

export default defineConfig({
  plugins: [
    react(),
    // checker({ typescript: true }) // 주석 처리 또는 삭제
  ],
})
