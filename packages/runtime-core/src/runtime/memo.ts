import type { VNode } from '../vnode/index.js'
import { getCurrentVNode } from './context.js'

/**
 * 检查两个记忆数组是否相同
 * 该函数通过比较两个数组中每个元素的引用值来判断是否相等
 * @param prevMemo - 前一个记忆数组，包含任意类型的元素
 * @param nextMemo - 后一个记忆数组，包含任意类型的元素
 * @returns {boolean} 如果两个数组的所有元素经过unref处理后都相等，则返回true，否则返回false
 */
export function isMemoSame(prevMemo: Array<any>, nextMemo: Array<any>): boolean {
  // 遍历nextMemo数组，比较每个元素与prevMemo中对应元素的值
  for (let i = 0; i < nextMemo.length; i++) {
    // 使用unref函数获取每个元素的引用值，并进行比较
    // 如果发现任何一对元素不相等，立即返回false
    if (nextMemo[i] !== prevMemo[i]) return false
  }
  // 如果所有元素都相等，则返回true
  return true
}

/**
 * 带有记忆功能的VNode构建函数
 *
 * 该api通常无需显式使用，编译器会自动为jsx模板中使用v-memo的节点进行自动替换。
 *
 * @template R - 构建的VNode的类型
 * @param memo 记忆值数组，用于比较是否需要重新构建VNode
 * @param builder VNode构建函数
 * @param index 缓存索引值
 * @returns {VNode} 构建好的VNode
 * @example
 * ```jsx
 * function Foo() {
 *   return <div>
 *     <div v-memo={[1, 2, 3]}>
 *       此节点只会被创建一次，直到 memo 值发生变化时才会重新构建
 *     </div>
 *   </div>
 * }
 * // 上面使用v-memo的div会被编译为以下代码：
 * // 第三个参数0是由编译器递增生成的，表示缓存的索引，在组件中不会重复
 * withMemo([1, 2, 3], () => jsx('div',{children:"此节点..."}),0)
 * ```
 */
export function withMemo<R extends VNode>(memo: any[], builder: () => R, index: number): R {
  // 获取当前虚拟节点
  const vnode = getCurrentVNode()
  // 无上下文 vnode，直接构建
  if (!vnode) return builder()

  let cache = vnode.memoCache // 获取缓存对象

  // 初始化 cache
  if (!cache) {
    const ret = builder() // 构建VNode
    ret.memo = memo.slice() // 保存记忆值的副本
    vnode.memoCache = new Map([[index, ret]]) // 创建新的缓存Map并存储
    return ret
  }

  // 有缓存则尝试命中
  const cached = cache.get(index) // 从缓存中获取对应索引的VNode
  // 如果缓存存在且记忆值相同，则返回缓存的VNode
  if (cached && isMemoSame(cached.memo!, memo)) {
    return cached as R
  }
  // 未命中：重新构建并写入 cache
  const ret = builder() // 重新构建VNode
  ret.memo = memo.slice() // 保存记忆值的副本
  cache.set(index, ret) // 将新构建的VNode存入缓存
  return ret
}
