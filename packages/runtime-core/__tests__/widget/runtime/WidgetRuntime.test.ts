/**
 * WidgetRuntime 基类单元测试
 *
 * 测试 Widget 运行时基类的通用功能
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createVNode,
  StatefulWidgetRuntime,
  stateless,
  StatelessWidgetRuntime,
  Widget,
  type WidgetRuntime
} from '../../../src/index.js'

// 测试用有状态组件
class TestStatefulWidget extends Widget {
  build() {
    return createVNode('div', { children: 'stateful' })
  }
}

// 测试用无状态组件
const TestStatelessWidget = stateless(() => {
  return createVNode('div', { children: 'stateless' })
}, 'TestStatelessWidget')
describe('WidgetRuntime 基类', () => {
  describe('基础属性', () => {
    it('应该正确初始化组件名称', () => {
      const vnode = createVNode(TestStatefulWidget, {})
      const runtime = new StatefulWidgetRuntime(vnode)

      expect(runtime.name).toBe('TestStatefulWidget')
    })

    it('应该正确绑定 vnode 引用', () => {
      const vnode = createVNode(TestStatefulWidget, {})
      const runtime = new StatefulWidgetRuntime(vnode)

      expect(runtime.vnode).toBe(vnode)
      expect(vnode.runtimeInstance).toBe(runtime)
    })

    it('应该正确设置 props', () => {
      const props = { name: 'test', age: 30 }
      const vnode = createVNode(TestStatefulWidget, props)
      const runtime = new StatefulWidgetRuntime(vnode)

      expect(runtime.props).toBeDefined()
    })

    it('应该建立 el 和 anchor 的动态属性代理', () => {
      const vnode = createVNode(TestStatefulWidget, {})
      const runtime = new StatefulWidgetRuntime(vnode)

      // 触发 child 构建
      const child = runtime.child

      // el 应该代理到 child.el
      expect(vnode.el).toBe(child.el)
      // anchor 应该代理到 child.anchor
      expect(vnode.anchor).toBe(child.anchor)
    })

    it('无状态组件应该正确初始化组件名称', () => {
      const vnode = createVNode(TestStatelessWidget, {})
      const runtime = new StatelessWidgetRuntime(vnode)

      expect(runtime.name).toBe('TestStatelessWidget')
    })
  })

  describe('child 懒加载', () => {
    it('首次访问 child 应该触发 build 方法', () => {
      const vnode = createVNode(TestStatefulWidget, {})
      const runtime = new StatefulWidgetRuntime(vnode)
      const buildSpy = vi.spyOn(runtime, 'build')

      // 首次访问 child
      const child = runtime.child

      expect(buildSpy).toHaveBeenCalled()
      expect(child).toBeDefined()
    })

    it('再次访问 child 应该返回缓存值', () => {
      const vnode = createVNode(TestStatefulWidget, {})
      const runtime = new StatefulWidgetRuntime(vnode)
      const buildSpy = vi.spyOn(runtime, 'build')

      // 首次访问
      const child1 = runtime.child
      buildSpy.mockClear()

      // 再次访问
      const child2 = runtime.child

      expect(buildSpy).not.toHaveBeenCalled()
      expect(child2).toBe(child1)
    })

    it('cachedChildVNode 为 null 时才重新构建', () => {
      const vnode = createVNode(TestStatefulWidget, {})
      const runtime = new StatefulWidgetRuntime(vnode)

      // 首次访问，cachedChildVNode 为 null
      expect(runtime.cachedChildVNode).toBeNull()
      const child1 = runtime.child
      expect(runtime.cachedChildVNode).not.toBeNull()

      // 手动清空缓存
      runtime.cachedChildVNode = null
      const child2 = runtime.child

      expect(child2).toBeDefined()
      expect(child2).not.toBe(child1)
    })
  })

  describe('type getter', () => {
    it('应该返回 vnode 的 type 属性', () => {
      const vnode = createVNode(TestStatefulWidget, {})
      const runtime = new StatefulWidgetRuntime(vnode)

      expect(runtime.type).toBe(TestStatefulWidget)
    })
  })

  describe('runInContext 上下文执行', () => {
    it('应该在节点上下文中执行函数', () => {
      const vnode = createVNode(TestStatefulWidget, {})
      const runtime = new StatefulWidgetRuntime(vnode)

      let executed = false
      const result = runtime.runInContext(() => {
        executed = true
        return 'test-result'
      })

      expect(executed).toBe(true)
      expect(result).toBe('test-result')
    })

    it('存在 appContext 时应该在应用上下文中执行', () => {
      const vnode = createVNode(TestStatefulWidget, {})
      const runtime = new StatefulWidgetRuntime(vnode)

      // 模拟 appContext
      const mockAppContext = {
        runInContext: vi.fn((fn: any) => fn())
      }
      vnode.appContext = mockAppContext as any

      runtime.runInContext(() => {
        return 'test'
      })

      expect(mockAppContext.runInContext).toHaveBeenCalled()
    })

    it('应该正确返回函数执行结果', () => {
      const vnode = createVNode(TestStatelessWidget, {})
      const runtime = new StatelessWidgetRuntime(vnode)

      const obj = { value: 42 }
      const result = runtime.runInContext(() => obj)

      expect(result).toBe(obj)
    })
  })

  describe('destroy 资源清理', () => {
    let vnode: any
    let runtime: WidgetRuntime

    beforeEach(() => {
      vnode = createVNode(TestStatefulWidget, {})
      runtime = new StatefulWidgetRuntime(vnode)
      // 触发 child 构建，确保 el 和 anchor 属性被设置
      runtime.child
    })

    it('应该清空 cachedChildVNode', () => {
      expect(runtime.cachedChildVNode).not.toBeNull()

      runtime.destroy()

      expect(runtime.cachedChildVNode).toBeNull()
    })

    it('应该删除 vnode 的 el 属性', () => {
      expect('el' in vnode).toBe(true)

      runtime.destroy()

      expect('el' in vnode).toBe(false)
    })

    it('应该删除 vnode 的 anchor 属性', () => {
      expect('anchor' in vnode).toBe(true)

      runtime.destroy()

      expect('anchor' in vnode).toBe(false)
    })

    it('应该删除 vnode 的 runtimeInstance 引用', () => {
      expect(vnode.runtimeInstance).toBe(runtime)

      runtime.destroy()

      expect(vnode.runtimeInstance).toBeUndefined()
    })

    it('无状态组件销毁后应该正确清理', () => {
      const statelessVNode = createVNode(TestStatelessWidget, {})
      const statelessRuntime = new StatelessWidgetRuntime(statelessVNode)
      statelessRuntime.child

      statelessRuntime.destroy()

      expect(statelessRuntime.cachedChildVNode).toBeNull()
      expect(statelessVNode.runtimeInstance).toBeUndefined()
    })
  })
})
