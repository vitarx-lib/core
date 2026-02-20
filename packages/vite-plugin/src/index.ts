import type { Plugin } from 'vite'
import { transform } from './transform'

export interface CompileOptions {
  hmr: boolean
  dev: boolean
  ssr: boolean
  runtimeModule: string
  sourceMap: boolean | 'inline' | 'both'
}

export { transform }

export default function vitarx(): Plugin {
  let compileOptions: CompileOptions
  let isDEV = false
  let isSSR = false
  return {
    name: 'vite-plugin-vitarx',
    enforce: 'pre',
    config(config, env) {
      isDEV = env.command === 'serve' && !env.isPreview
      const configSSR = !!config.build?.ssr
      isSSR = env.isSsrBuild === true || configSSR
      return {
        esbuild: {
          jsx: 'preserve'
        },
        define: {
          __DEV__: JSON.stringify(isDEV),
          __SSR__: JSON.stringify(isSSR)
        }
      }
    },
    configResolved(config) {
      const sourcemap = config.build.sourcemap
      compileOptions = {
        dev: isDEV,
        ssr: isSSR,
        hmr: isDEV && !isSSR,
        runtimeModule: 'vitarx',
        sourceMap: sourcemap === 'inline' ? 'inline' : sourcemap === true ? 'both' : false
      }
    },
    async transform(code, id) {
      return await transform(code, id, compileOptions!)
    }
  }
}
