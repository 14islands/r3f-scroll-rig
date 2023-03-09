import * as path from 'node:path'
import * as vite from 'vite'

const entries = ['./src/index.ts', './src/scrollbar/index.ts', './src/powerups/index.ts']

export default vite.defineConfig({
  build: {
    sourcemap: true,
    target: 'es2018',
    lib: {
      formats: ['es', 'cjs'],
      entry: entries[0],
      fileName: '[name]',
    },
    rollupOptions: {
      external: (id) => !id.startsWith('.') && !path.isAbsolute(id),
      input: entries,
      output: {
        preserveModules: true,
      },
    },
  },
})
