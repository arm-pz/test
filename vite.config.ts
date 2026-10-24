import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import {defineConfig} from 'vite';
import {viteSingleFile} from 'vite-plugin-singlefile';

// `--mode single` inlines everything into one HTML file for previews that
// cannot serve separate assets. The normal build stays code-split.
export default defineConfig(({mode}) => ({
  // relative asset URLs, so the build runs from any folder or preview host
  base: './',
  plugins: [react(), tailwindcss(), ...(mode === 'single' ? [viteSingleFile()] : [])],
  build: {
    target: 'es2020',
    outDir: mode === 'single' ? 'dist-single' : 'dist',
  },
}));
