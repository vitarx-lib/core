import { getCurrentInstance } from '../vnode/index.js'

let globalId = -1
/**
 * 生成应用内唯一的id
 *
 * 算法为 `${应用id前缀-递增计数器}`
 *
 * 可以通过 `app.config.idPrefix` 设置id前缀，默认为 `v`
 *
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
export function useId(): string {
  // 获取当前Vue组件实例
  const instance = getCurrentInstance()
  // 如果没有实例（非组件环境），则使用全局ID计数器生成ID
  if (!instance) return `v-${globalId++}`

  // 从应用上下文中获取ID前缀
  const prefix = instance.$vnode.appContext?.config.idPrefix || 'v'
  return `${prefix}-${globalId++}`
}
