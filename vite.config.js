import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    headers: {
      'allow-control-allow-origin': '*',
    },
  },
  build: {
    sourcemap: true,
  }
})