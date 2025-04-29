import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { randomFillSync } from 'node:crypto';

if (typeof globalThis.crypto !== 'object') {
  globalThis.crypto = {};
}
globalThis.crypto.getRandomValues = (buffer) => {

  return randomFillSync(buffer);
};

export default defineConfig({
  base: './', 
  plugins: [svelte()],
  server: { port: 5173 }
});