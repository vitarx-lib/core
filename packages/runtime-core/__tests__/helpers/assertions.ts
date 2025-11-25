/**
 * 自定义断言辅助函数
 *
 * 提供特定于 runtime-core 测试的断言工具
 */

import { expect } from 'vitest'
import type { VNode } from '../../src/index.js'
import { NodeState } from '../../src/index.js'

/**
 * 断言节点状态
 *
 * @param node VNode 节点
 * @param expectedState 期望的状态
 */
export function expectNodeState(node: VNode, expectedState: NodeState) {
  expect(node.state).toBe(expectedState)
}

/**
 * 断言 DOM 结构
 *
 * @param element DOM 元素
 * @param expectedTag 期望的标签名
 */
export function expectDOMStructure(element: Element, expectedTag: string) {
  expect(element.tagName.toLowerCase()).toBe(expectedTag.toLowerCase())
}

/**
 * 断言生命周期调用顺序
 *
 * @param calls 实际调用序列
 * @param expectedOrder 期望的顺序
 */
export function expectLifecycleCallOrder(calls: string[], expectedOrder: string[]) {
  expect(calls).toEqual(expectedOrder)
}

/**
 * 断言节点已挂载
 *
 * @param node VNode 节点
 */
export function expectNodeMounted(node: VNode) {
  expectNodeState(node, NodeState.Activated)
  expect(node.el).toBeTruthy()
}

/**
 * 断言节点已卸载
 *
 * @param node VNode 节点
 */
export function expectNodeUnmounted(node: VNode) {
  expectNodeState(node, NodeState.Unmounted)
}

/**
 * 断言节点已渲染
 *
 * @param node VNode 节点
 */
export function expectNodeRendered(node: VNode) {
  expectNodeState(node, NodeState.Rendered)
  expect(node.el).toBeTruthy()
}
