import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  base: '/mise-en-place/',
  build: {
    outDir: 'docs',
  },
  server: {
    port: 5174,
    strictPort: true,
  },
})
