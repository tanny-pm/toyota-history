// Tailwind v4 を PostCSS プラグイン経由で読み込む。
// vite-plus はフォーク版 Vite のため、公式 @tailwindcss/vite ではなく
// ツールチェーン非依存な PostCSS 経路で確実に注入する。
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
