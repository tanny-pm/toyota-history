import { defineConfig } from 'vite-plus'
import react from '@vitejs/plugin-react'

// GitHub Pages のプロジェクトサイトで公開するため base を固定
export default defineConfig({
  base: '/toyota-history/',
  plugins: [react()],
})
