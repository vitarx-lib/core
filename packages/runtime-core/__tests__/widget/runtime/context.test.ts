/**
 * Widget Runtime Context 单元测试
 *
 * 测试组件运行时上下文管理功能，主要测试 getCurrentInstance 函数
 */

import { describe, expect, it } from 'vitest'
import { createVNode, createWidgetRuntime, getCurrentInstance, Widget } from '../../../src/index.js'

// 测试用组件
class TestWidget extends Widget {
  build() {
    return createVNode('div', { children: 'test' })
  }
}

describe('getCurrentInstance', () => {
  describe('正常场景', () => {
    it('应该返回当前活动的运行时实例', () => {
      const vnode = createVNode(TestWidget, {})
      const runtime = createWidgetRuntime(vnode as any)

      // 在组件上下文中执行
      const instance = runtime.runInContext(() => {
        return getCurrentInstance()
      })

      expect(instance).toBe(runtime)
    })

    it('应该与当前 VNode 的 instance 一致', () => {
      const vnode = createVNode(TestWidget, {})
      const runtime = createWidgetRuntime(vnode as any)

      const instance = runtime.runInContext(() => {
        return getCurrentInstance()
      })

      expect(instance).toBe(vnode.instance)
    })

    it('有状态组件应该正确获取实例', () => {
      class StatefulWidget extends Widget {
        build() {
          return createVNode('div')
        }
      }

      const vnode = createVNode(StatefulWidget, {})
      const runtime = createWidgetRuntime(vnode as any)

      const instance = runtime.runInContext(() => {
        return getCurrentInstance()
      })

      expect(instance).toBeDefined()
      expect(instance.vnode).toBe(vnode)
    })

    it('无状态组件应该正确获取实例', () => {
      function StatelessWidget() {
        return createVNode('div')
      }

      const vnode = createVNode(StatelessWidget, {})
      const runtime = createWidgetRuntime(vnode as any)

      const instance = runtime.runInContext(() => {
        return getCurrentInstance()
      })

      expect(instance).toBeDefined()
      expect(instance.vnode).toBe(vnode)
    })
  })

  describe('异常场景', () => {
    it('没有活动 VNode 时应该抛出错误', () => {
      expect(() => {
        getCurrentInstance()
      }).toThrow('No active widget instance found.')
    })

    it('VNode 没有 instance 时应该抛出错误', () => {
      const vnode = createVNode(TestWidget, {})
      // 不创建 runtime instance

      expect(() => {
        getCurrentInstance()
      }).toThrow('No active widget instance found.')
    })

    it('错误信息应该清晰明确', () => {
      let errorMessage = ''
      try {
        getCurrentInstance()
      } catch (error: any) {
        errorMessage = error.message
      }

      expect(errorMessage).toContain('No active widget instance found')
    })
  })
})
