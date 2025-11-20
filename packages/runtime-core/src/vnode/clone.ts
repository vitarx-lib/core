import { NON_SIGNAL_SYMBOL } from '@vitarx/responsive'
import { NodeState, VIRTUAL_NODE_SYMBOL } from '../constants/index.js'
import type { VNode } from '../types/index.js'
import { isElementNode, isFragmentNode, isWidgetNode } from '../utils/index.js'

/**
 * 克隆虚拟节点
 *
 * 创建一个虚拟节点的浅拷贝，将节点恢复到初始状态（Created）。
 * 克隆后的节点具有独立的属性对象，可以安全地修改而不影响原节点。
 *
 * 克隆的内容：
 * - 基础属性：type、kind、props、key、ref、static、devInfo
 * - 元素节点：isSVGElement、children、directives
 * - 组件节点：directives
 * - 片段节点：children
 *
 * 不克隆的内容（运行时数据）：
 * - el（DOM元素引用）
 * - anchor（锚点元素）
 * - runtimeInstance（运行时实例）
 * - memoCache（组件缓存）
 * - directiveStore（指令存储）
 * - state（总是恢复为 Created 状态）
 *
 * @param node - 要克隆的虚拟节点
 * @returns 克隆后的新虚拟节点（初始状态）
 *
 * @example
 * ```typescript
 * const original = createVNode('div', { class: 'container' })
 * const cloned = cloneVNode(original)
 * // cloned 是一个新的节点，状态为 Created，可以独立修改其属性
 * cloned.props.class = 'new-container'
 * ```
 */
export function cloneVNode<T extends VNode>(node: T): T {
  // 创建新的节点对象，复制基础属性
  const cloned: VNode = {
    [NON_SIGNAL_SYMBOL]: true,
    [VIRTUAL_NODE_SYMBOL]: true,
    type: node.type,
    kind: node.kind,
    // 状态恢复为 Created（初始状态）
    state: NodeState.Created,
    // 浅拷贝 props，确保修改不会影响原节点
    props: { ...node.props },
    appContext: node.appContext
  }

  // 复制可选属性
  if ('key' in node) {
    cloned.key = node.key
  }

  if (node.ref) {
    cloned.ref = node.ref
  }

  if ('static' in node) {
    cloned.static = node.static
  }

  if (node.devInfo) {
    cloned.devInfo = node.devInfo
  }

  // 处理元素节点特有属性
  if (isElementNode(node)) {
    const elementNode = node as any
    const clonedElement = cloned as any

    if ('isSVGElement' in elementNode.isSVGElement) {
      clonedElement.isSVGElement = elementNode.isSVGElement
    }

    // 如果有子节点，递归克隆每个子节点
    if (elementNode.children) {
      clonedElement.children = elementNode.children.map((child: VNode) => cloneVNode(child))
    }

    // 复制指令（如果有）
    if (elementNode.directives) {
      clonedElement.directives = new Map(elementNode.directives)
    }
  }

  // 处理片段节点
  if (isFragmentNode(node)) {
    const fragmentNode = node as any
    const clonedFragment = cloned as any

    // 递归克隆子节点
    if (fragmentNode.children) {
      clonedFragment.children = fragmentNode.children.map((child: VNode) => cloneVNode(child))
    }
  }

  // 处理组件节点的指令
  if (isWidgetNode(node)) {
    const widgetNode = node as any
    const clonedWidget = cloned as any

    // 复制指令（如果有）
    if (widgetNode.directives) {
      clonedWidget.directives = new Map(widgetNode.directives)
    }
  }

  return cloned as T
}
