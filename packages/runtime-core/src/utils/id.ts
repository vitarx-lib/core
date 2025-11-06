import { getCurrentVNode } from '../vnode/index.js'

let globalId = -1
/**
 * 生成应用内唯一的id
 *
 * 算法为 `${应用id前缀-递增计数器}`
 *
 * 可以通过 `app.config.idPrefix` 或 prefix 参数设置id前缀，默认为 `v`
 *
 * @param {string} [prefix] - ID前缀
 * @returns {string} 返回生成的唯一ID字符串
 * @example
 * ```ts
 * function App() {
 *  const id = useId() // v-0
 *  console.log(useId()) // v-1
 *  return <div id={id}>test</div>
 * }
 * ```
 */
export const useId = (prefix?: string): string => {
  // 获取当前Vue组件实例
  const vnode = getCurrentVNode()
  // 如果没有实例（非组件环境），则使用全局ID计数器生成ID
  if (!vnode) return `${prefix || 'v'}-${globalId++}`

  // 从应用上下文中获取ID前缀
  prefix ||= vnode.appContext?.config.idPrefix || 'v'
  return `${prefix}-${globalId++}`
}
