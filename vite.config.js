import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages は https://<user>.github.io/walk/ で配信されるため、
// 本番ビルドだけ base を '/walk/' にする（開発時は '/' のまま）
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/walk/' : '/',
  plugins: [react()],
}))
