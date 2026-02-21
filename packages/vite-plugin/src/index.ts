import type { Plugin } from 'vite'
import { type CompileOptions, transform } from './transform.js'

/**
 * vite-plugin-vitarx
 *
 * 功能：
 * - jsx -> createView 编译转换
 * - 支持 v-if、v-else-if、v-else 、v-model 等编译宏指令
 * - 支持 Switch , IfBlock 等编译宏组件
 * - 开发时 HMR 热更新相关代码注入与功能支持
 *
 * @param _options - 暂无可选配置。
 * @returns - vite插件对象。
 */
export default function vitarx(_options?: {}): Plugin {
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
