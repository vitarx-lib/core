import path from 'node:path'
import type { RenderUnit, ValidChild, View } from 'vitarx'
import type { Plugin } from 'vite'
import { type CompileOptions, transform } from './transform.js'

const __dirname = path.dirname(new URL(import.meta.url).pathname)

/**
 * vite-plugin-vitarx 配置选项
 *
 * 暂无配置选项
 */
export interface VitePluginVitarxOptions {}
declare global {
  namespace Vitarx {
    interface IntrinsicElements {
      /**
       * IfBlock - 编译宏组件，无需import导入
       *
       * IfBlock 组件不具有运行时效果，它只是为了兼容tsx类型校验，
       * 例如 `<Comp><h1 v-if={cond} /><h2 v-else /><Comp>`，Comp组件的children要求传入单个元素时tsx类型会误报，使用 `IfBlock` 包裹则可以使 v-if 组合链通过 children 类型校验
       *
       * @example
       * ```tsx
       * import { View } from 'vitarx';
       * function TestComp(props:{children:View}) {
       *   return <div>{props.children}</div>
       * }
       * function App() {
       *   return (
       *    <TestComp>
       *       <IfBlock>
       *          <h1 v-if={cond}/>
       *          <h2 v-else/>
       *       </IfBlock>
       *    </TestComp>
       *   )
       * }
       * ```
       */
      IfBlock: {
        /**
         * 子元素列表
         *
         * 所有子元素必须带有 v-if / v-else-if / v-else 指令，且组合顺序必须正确！
         */
        children: View[]
      }
      /**
       * Switch - 编译宏组件，无需import导入
       *
       * Switch 组件用于条件渲染，`Match` 是其唯一合法子元素，
       * 通过 `when` 属性判断是否匹配，匹配则渲染 `Match` 子元素，否则渲染 `fallback`
       *
       * @example
       * ```tsx
       * function App() {
       *   return (
       *    <Switch fallback="Default">
       *       <Match when={a}>A</Match>
       *       <Match when={b}>B</Match>
       *    </Switch>
       *   )
       * }
       * ```
       */
      Switch: {
        /**
         * 默认渲染内容
         *
         * 当所有 `Match` 都不匹配时，渲染该内容
         */
        fallback?: RenderUnit
        /**
         * 子元素列表
         *
         * 必须是 `Match` 组件
         */
        children: View | View[]
      }
      /**
       * Match - 编译宏组件，无需import导入
       *
       * 需 `Switch` 组件搭配使用，不允许单独使用。
       */
      Match: {
        /**
         * 渲染条件
         *
         * 如果 when 为 true，则渲染 Match 子元素，否则渲染 Switch 的 fallback
         */
        when: any
        /**
         * 子元素
         */
        children: ValidChild
      }
    }
  }
}
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
export default function vitarx(_options?: VitePluginVitarxOptions): Plugin {
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
          __VITARX_DEV__: JSON.stringify(isDEV),
          __VITARX_SSR__: JSON.stringify(isSSR)
        },
        resolve: {
          alias: {
            '@vitarx/vite-plugin/hmr-client': path.join(__dirname, 'hmr-client/index.js')
          }
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
