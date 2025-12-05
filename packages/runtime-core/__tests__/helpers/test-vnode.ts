/**
 * 测试 VNode 创建辅助函数
 *
 * 提供快速创建测试用 VNode 的工具函数
 */

import {
  type CommentNode,
  createCommentVNode,
  createTextVNode,
  createVNode,
  type FragmentNode,
  type RegularElementNode,
  type RegularElementNodeType,
  type TextNode,
  type VNode,
  type WidgetNode
} from '../../src/index.js'

/**
 * 创建测试用的文本节点
 *
 * @returns 文本 VNode
 * @param text
 */
export function createTestTextVNode(text: string = 'test text'): TextNode {
  return createTextVNode({ text })
}

/**
 * 创建测试用的注释节点
 *
 * @returns 注释 VNode
 * @param text
 */
export function createTestCommentVNode(text: string = 'test comment'): CommentNode {
  return createCommentVNode({ text })
}

/**
 * 创建测试用的元素节点
 *
 * @param type 元素类型
 * @param props 属性
 * @returns 元素 VNode
 */
export function createTestElementVNode(
  type: RegularElementNodeType = 'div',
  props: Record<string, any> = {}
): RegularElementNode {
  return createVNode(type, props)
}

/**
 * 创建测试用的 Fragment 节点
 *
 * @param children 子节点
 * @returns Fragment VNode
 */
export function createTestFragmentVNode(children: VNode[] = []): FragmentNode {
  return createVNode('fragment', { children }) as FragmentNode
}

/**
 * 创建测试用的 Widget 节点
 *
 * @param widget Widget 类型
 * @param props 属性
 * @returns Widget VNode
 */
export function createTestWidgetVNode(widget: any, props: Record<string, any> = {}): WidgetNode {
  return createVNode(widget, props) as WidgetNode
}

/**
 * 创建嵌套的测试 VNode 树
 *
 * @param depth 嵌套深度
 * @param childrenCount 每层子节点数量
 * @returns VNode 树
 */
export function createTestVNodeTree(depth: number = 2, childrenCount: number = 2): VNode {
  if (depth === 0) {
    return createTestTextVNode(`depth-${depth}`)
  }

  const children: VNode[] = []
  for (let i = 0; i < childrenCount; i++) {
    children.push(createTestVNodeTree(depth - 1, childrenCount))
  }

  return createTestElementVNode('div', { children })
}
