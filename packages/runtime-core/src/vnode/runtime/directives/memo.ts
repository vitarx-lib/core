import { unref } from '@vitarx/responsive'
import { isArrayEqual } from '@vitarx/utils'
import { VNode } from '../../base/index.js'

const MEMO_STORE = new WeakMap<Array<any>, VNode>()
/**
 * 根据提供的memo数组获取对应的VNode节点
 * @param memo - 用于查找VNode节点的数组，包含任意类型的数据
 * @returns {VNode|undefined} 如果找到匹配的VNode节点且memo数组内容相同，则返回该VNode节点；否则返回undefined
 */
export function getMemoNode(memo: Array<any>): VNode | undefined {
  // 从MEMO_STORE中获取与memo数组关联的VNode节点
  const node = MEMO_STORE.get(memo)
  // 检查是否存在节点且memo数组内容是否与节点中存储的memo数组相同
  // 如果条件满足则返回节点，否则返回undefined
  return node && node.memo && isArrayEqual(memo, node.memo) ? node : undefined
}
/**
 * 设置记忆节点的函数
 * 将给定的记忆数组(memo)和虚拟节点(node)存储到MEMO_STORE映射中
 * @param memo - 用于作为键的数组，可以是任意类型的数组
 * @param node - 要存储的虚拟节点(VNode)对象
 */
export function setMemoNode(memo: Array<any>, node: VNode): void {
  MEMO_STORE.set(memo, node) // 将memo作为键，node作为值存储到MEMO_STORE中
}

/**
 * 从记忆存储中移除指定的记忆节点
 * @param memo - 记忆数组，用于标识一组记忆节点
 */
export function removeMemoNode(memo: Array<any>): void {
  // 使用记忆数组作为键，从记忆存储中删除对应的记忆节点
  MEMO_STORE.delete(memo)
}

/**
 * 检查两个记忆数组是否相同
 * 该函数通过比较两个数组中每个元素的引用值来判断是否相等
 * @param prevMemo - 前一个记忆数组，包含任意类型的元素
 * @param nextMemo - 后一个记忆数组，包含任意类型的元素
 * @returns {boolean} 如果两个数组的所有元素经过unref处理后都相等，则返回true，否则返回false
 */
export function isSameMemo(prevMemo: Array<any>, nextMemo: Array<any>): boolean {
  // 遍历nextMemo数组，比较每个元素与prevMemo中对应元素的值
  for (let i = 0; i < nextMemo.length; i++) {
    // 使用unref函数获取每个元素的引用值，并进行比较
    // 如果发现任何一对元素不相等，立即返回false
    if (unref(nextMemo[i]) !== unref(prevMemo[i])) return false
  }
  // 如果所有元素都相等，则返回true
  return true
}
