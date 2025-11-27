/**
 * 常量定义测试
 *
 * 测试所有常量的定义和导出
 */

import { describe, expect, it } from 'vitest'
import {
  __VITARX_VERSION__,
  __WIDGET_INTRINSIC_KEYWORDS__,
  COMMENT_NODE_TYPE,
  DYNAMIC_RENDER_TYPE,
  FRAGMENT_NODE_TYPE,
  LifecycleHooks,
  NodeKind,
  NodeState,
  TEXT_NODE_TYPE
} from '../../src/index.js'

describe('常量定义', () => {
  describe('节点类型常量', () => {
    it('应该定义所有节点类型常量', () => {
      expect(TEXT_NODE_TYPE).toBe('plain-text')
      expect(COMMENT_NODE_TYPE).toBe('comment')
      expect(FRAGMENT_NODE_TYPE).toBe('fragment')
      expect(DYNAMIC_RENDER_TYPE).toBe('dynamic')
    })
  })

  describe('NodeKind 枚举', () => {
    it('应该定义所有 NodeKind 枚举值', () => {
      expect(NodeKind.TEXT).toBeDefined()
      expect(NodeKind.COMMENT).toBeDefined()
      expect(NodeKind.FRAGMENT).toBeDefined()
      expect(NodeKind.REGULAR_ELEMENT).toBeDefined()
      expect(NodeKind.VOID_ELEMENT).toBeDefined()
      expect(NodeKind.STATEFUL_WIDGET).toBeDefined()
      expect(NodeKind.STATELESS_WIDGET).toBeDefined()
    })

    it('NodeKind 值应该是数字', () => {
      expect(typeof NodeKind.TEXT).toBe('number')
      expect(typeof NodeKind.COMMENT).toBe('number')
      expect(typeof NodeKind.FRAGMENT).toBe('number')
      expect(typeof NodeKind.REGULAR_ELEMENT).toBe('number')
      expect(typeof NodeKind.VOID_ELEMENT).toBe('number')
    })
  })

  describe('NodeState 枚举', () => {
    it('应该定义所有节点状态常量', () => {
      expect(NodeState.Created).toBeDefined()
      expect(NodeState.Rendered).toBeDefined()
      expect(NodeState.Activated).toBeDefined()
      expect(NodeState.Deactivated).toBeDefined()
      expect(NodeState.Unmounted).toBeDefined()
    })

    it('NodeState 值应该是字符串', () => {
      expect(typeof NodeState.Created).toBe('string')
      expect(typeof NodeState.Rendered).toBe('string')
      expect(typeof NodeState.Activated).toBe('string')
    })
  })

  describe('LifecycleHooks 枚举', () => {
    it('应该定义所有生命周期钩子名称', () => {
      expect(LifecycleHooks.beforeMount).toBe('onBeforeMount')
      expect(LifecycleHooks.mounted).toBe('onMounted')
      expect(LifecycleHooks.beforeUpdate).toBe('onBeforeUpdate')
      expect(LifecycleHooks.updated).toBe('onUpdated')
      expect(LifecycleHooks.beforeUnmount).toBe('onBeforeUnmount')
      expect(LifecycleHooks.unmounted).toBe('onUnmounted')
      expect(LifecycleHooks.activated).toBe('onActivated')
      expect(LifecycleHooks.deactivated).toBe('onDeactivated')
      expect(LifecycleHooks.error).toBe('onError')
      expect(LifecycleHooks.render).toBe('onRender')
    })
  })

  describe('版本号', () => {
    it('应该定义版本号', () => {
      expect(__VITARX_VERSION__).toBeDefined()
      expect(typeof __VITARX_VERSION__).toBe('string')
    })
  })

  describe('Widget 保留关键词', () => {
    it('应该定义 Widget 保留关键词集合', () => {
      expect(__WIDGET_INTRINSIC_KEYWORDS__).toBeDefined()
      expect(__WIDGET_INTRINSIC_KEYWORDS__ instanceof Set).toBe(true)
    })

    it('应该包含常见的保留关键词', () => {
      // 检查集合不为空
      expect(__WIDGET_INTRINSIC_KEYWORDS__.size).toBeGreaterThan(0)
    })
  })
})
