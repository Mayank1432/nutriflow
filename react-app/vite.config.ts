import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Node typings are not installed for this config file, so the environment
// is read through globalThis instead of the `process` global.
const env = (globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env ?? {}

export default defineConfig({
  base: './',
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(env.npm_package_version ?? 'dev'),
    __BUILD_DATE__: JSON.stringify(new Date().toISOString().slice(0, 10)),
    __BUILD_COMMIT__: JSON.stringify(env.GITHUB_SHA ? env.GITHUB_SHA.slice(0, 7) : 'local'),
  },
})