import { defineConfig } from 'vite'
import dtsPlugin from 'vite-plugin-dts'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    dtsPlugin({
      include: ['src'],
      rollupTypes: true,
      insertTypesEntry: true
    })
  ],
  define: {
    __VERSION__: JSON.stringify(process.env.npm_package_version)
  },
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'Vitarx',
      fileName: format => `vitarx.${format}.js`,
      formats: ['umd']
    }
  }
})
