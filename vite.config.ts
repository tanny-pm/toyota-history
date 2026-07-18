import { defineConfig } from 'vite-plus'
import react from '@vitejs/plugin-react'

// GitHub Pages のプロジェクトサイトで公開するため base を固定。
// react() は vite-plus と @vitejs/plugin-react の型バージョン差で
// 型の深さ比較エラーになるため any でキャストする（実行時は問題なし）。
export default defineConfig({
  base: '/toyota-history/',
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  plugins: [react() as any],
})
