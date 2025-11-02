import { defineConfig } from 'vite'
import reactSwc from '@vitejs/plugin-react-swc'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    reactSwc(),
  ],
  esbuild: {
    jsx: 'automatic',
    loader: 'jsx',
    include: [
      /src\/.*\.js$/,
      /src\/.*\.jsx$/,
      /src\/.*\.tsx$/,
    ],
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
      },
      jsx: 'automatic',
    },
  },
  resolve: {
    alias: {
      'assets': path.resolve(__dirname, './src/assets'),
      'components': path.resolve(__dirname, './src/components'),
      'examples': path.resolve(__dirname, './src/examples'),
      'layouts': path.resolve(__dirname, './src/layouts'),
      'context': path.resolve(__dirname, './src/context'),
      'routes': path.resolve(__dirname, './src/routes'),
    },
    extensions: ['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json'],
  },
  server: {
    fs: {
      strict: false,
    },
  },
})
