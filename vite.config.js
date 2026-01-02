import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Replit 외부 접속을 허용하기 위해 모든 IP(0.0.0.0)에서 수신 대기합니다.
    host: '0.0.0.0', 
    // Replit이 가장 잘 인식하는 기본 포트인 5000번을 사용합니다.
    port: 5000,
    // 다른 포트로 넘어가지 않도록 설정합니다.
    strictPort: true,
    // 브라우저 연결 시 보안 검사를 통과하도록 설정합니다.
    allowedHosts: true
  }
})