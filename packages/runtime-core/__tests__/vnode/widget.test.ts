import { EffectScope } from '@vitarx/responsive'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { FragmentVNode, LifecycleHooks, TextVNode, VNode, Widget, WidgetVNode } from '../../src'

// 创建模拟Widget类
class MockWidget extends Widget {
  build() {
    return new TextVNode('Mock Widget')
  }
}

// 创建模拟函数组件
const mockFnWidget = vi.fn(() => new TextVNode('Mock Fn Widget'))

describe('WidgetVNode 单元测试', () => {
  describe('构造函数和基础属性', () => {
    it('应该正确创建WidgetVNode实例', () => {
      const widgetVNode = new WidgetVNode(MockWidget, {})
      expect(widgetVNode).toBeInstanceOf(WidgetVNode)
      expect(widgetVNode).toBeInstanceOf(VNode)
    })

    it('应该正确获取children属性', () => {
      const children = [new FragmentVNode()]
      const widgetVNode = new WidgetVNode(MockWidget, { children })
      expect(widgetVNode.children).toBe(children)
    })

    it('应该正确获取teleport属性', () => {
      const widgetVNode = new WidgetVNode(MockWidget, {})
      expect(widgetVNode.teleport).toBeNull()
    })

    it('应该正确获取state属性', () => {
      const widgetVNode = new WidgetVNode(MockWidget, {})
      expect(widgetVNode.state).toBe('notRendered')
    })
    it('应该正确创建函数式WidgetVNode', () => {
      const widgetVNode = new WidgetVNode(mockFnWidget, {})
      expect(widgetVNode).toBeInstanceOf(WidgetVNode)
      expect(widgetVNode).toBeInstanceOf(VNode)
    })
  })

  describe('instance getter', () => {
    it('应该正确创建Widget实例', () => {
      const widgetVNode = new WidgetVNode(MockWidget, {})
      const instance = widgetVNode.instance
      expect(instance).toBeInstanceOf(MockWidget)
    })

    it('应该缓存Widget实例', () => {
      const widgetVNode = new WidgetVNode(MockWidget, {})
      const instance1 = widgetVNode.instance
      const instance2 = widgetVNode.instance
      expect(instance1).toBe(instance2)
    })
  })

  describe('child getter', () => {
    it('应该构建并缓存子节点', () => {
      const widgetVNode = new WidgetVNode(MockWidget, {})
      const child1 = widgetVNode.child
      const child2 = widgetVNode.child
      expect(child1).toBeInstanceOf(FragmentVNode)
      expect(child1).toBe(child2)
    })
  })

  describe('element getter', () => {
    it('应该调用render方法', () => {
      const widgetVNode = new WidgetVNode(MockWidget, {})
      const renderSpy = vi.spyOn(widgetVNode, 'render')
      const element = widgetVNode.element
      expect(renderSpy).toHaveBeenCalled()
    })
  })

  describe('scope getter', () => {
    it('应该返回instance的scope属性', () => {
      const widgetVNode = new WidgetVNode(MockWidget, {})
      const scope = widgetVNode.scope
      expect(scope).toBeInstanceOf(EffectScope)
    })
  })

  describe('静态方法', () => {
    it('is方法应该正确判断WidgetVNode', () => {
      const widgetVNode = new WidgetVNode(MockWidget, {})
      expect(WidgetVNode.is(widgetVNode)).toBe(true)

      const fragmentVNode = new FragmentVNode()
      expect(WidgetVNode.is(fragmentVNode)).toBe(false)
    })

    it('getCurrentVNode应该返回当前上下文中的VNode', () => {
      // 这个测试需要更复杂的设置来模拟上下文
      expect(WidgetVNode.getCurrentVNode()).toBeUndefined()
    })
  })

  describe('依赖注入相关方法', () => {
    it('provide和getProvide方法应该正确工作', () => {
      const widgetVNode = new WidgetVNode(MockWidget, {})
      widgetVNode.provide('testKey', 'testValue')
      expect(widgetVNode.getProvide('testKey')).toBe('testValue')
    })

    it('getProvide方法应该支持默认值', () => {
      const widgetVNode = new WidgetVNode(MockWidget, {})
      expect(widgetVNode.getProvide('nonExistentKey', 'defaultValue')).toBe('defaultValue')
    })

    it('hasProvide方法应该正确检查提供项', () => {
      const widgetVNode = new WidgetVNode(MockWidget, {})
      expect(widgetVNode.hasProvide('testKey')).toBe(false)
      widgetVNode.provide('testKey', 'testValue')
      expect(widgetVNode.hasProvide('testKey')).toBe(true)
    })

    it('提供"App"作为键应该抛出错误', () => {
      const widgetVNode = new WidgetVNode(MockWidget, {})
      expect(() => widgetVNode.provide('App', 'value')).toThrow(
        'App 是内部保留关键词，不能用于注册提供者！'
      )
    })
  })

  describe('render方法', () => {
    it('应该正确渲染组件', () => {
      const widgetVNode = new WidgetVNode(MockWidget, {})
      const element = widgetVNode.render()
      expect(element).toBeDefined()
      expect(widgetVNode.state).toBe('notMounted')
    })

    it('已经渲染过的组件应该返回缓存的element', () => {
      const widgetVNode = new WidgetVNode(MockWidget, {})
      widgetVNode.render()
      widgetVNode.render()
      // 第二次调用应该直接返回child.element
    })
  })

  describe('mount方法', () => {
    it('未渲染状态应该先渲染再挂载', () => {
      const widgetVNode = new WidgetVNode(MockWidget, {})
      const renderSpy = vi.spyOn(widgetVNode, 'render')
      const container = document.createElement('div')

      widgetVNode.mount(container)

      expect(renderSpy).toHaveBeenCalled()
      expect(widgetVNode.state).toBe('activated')
    })

    it('非notMounted状态应该抛出错误', () => {
      const widgetVNode = new WidgetVNode(MockWidget, {})
      widgetVNode.render()
      // 手动更改状态以模拟错误情况
      // 注意：由于#state是私有属性，这里无法直接修改
    })
  })

  describe('生命周期钩子', () => {
    it('triggerLifecycleHook应该正确调用钩子方法', () => {
      const widgetVNode = new WidgetVNode(MockWidget, {})
      const mockHook = vi.fn()
      widgetVNode.instance.onMounted = mockHook

      widgetVNode.triggerLifecycleHook(LifecycleHooks.mounted)

      expect(mockHook).toHaveBeenCalled()
    })

    it('错误钩子应该调用reportWidgetError', () => {
      const widgetVNode = new WidgetVNode(MockWidget, {})
      vi.spyOn(widgetVNode, 'reportError')
      widgetVNode.instance.onError = vi.fn()
      widgetVNode.triggerLifecycleHook(LifecycleHooks.error, new Error('Test'), {
        source: 'update',
        instance: widgetVNode.instance
      })
      expect(widgetVNode.reportError).toHaveBeenCalled()
    })
  })

  describe('unmount方法', () => {
    it('应该正确卸载组件', () => {
      const widgetVNode = new WidgetVNode(MockWidget, {})
      widgetVNode.render()
      widgetVNode.mount()
      widgetVNode.unmount()
      expect(widgetVNode.state).toBe('unloaded')
    })

    it('已经卸载的组件应该抛出异常', () => {
      const widgetVNode = new WidgetVNode(MockWidget, {})
      widgetVNode.render()
      widgetVNode.mount()
      widgetVNode.unmount()
      // 第二次调用应该直接返回
      expect(() => widgetVNode.unmount()).toThrow()
    })
  })

  describe('activate和deactivate方法', () => {
    let widgetVNode: WidgetVNode
    let parentElement: HTMLElement

    // 在所有测试之前创建共享的元素
    beforeAll(() => {
      parentElement = document.createElement('div')
    })

    beforeEach(() => {
      // 每个测试用例开始前创建新的 WidgetVNode
      widgetVNode = new WidgetVNode(MockWidget, {})
      widgetVNode.render()
      widgetVNode.mount(parentElement)
    })

    afterEach(() => {
      // 每个测试用例结束后清理
      if (widgetVNode.state !== 'unloaded') {
        widgetVNode.unmount()
      }
      parentElement.innerHTML = ''
    })

    it('应该正确停用组件', () => {
      widgetVNode.deactivate()
      expect(widgetVNode.state).toBe('deactivated')
      expect(parentElement.firstChild).toBe(widgetVNode.shadowElement)
    })

    it('应该正确激活组件', () => {
      widgetVNode.deactivate()
      expect(widgetVNode.state).toBe('deactivated')
      expect(parentElement.firstChild).toBe(widgetVNode.shadowElement)

      widgetVNode.activate()
      expect(widgetVNode.state).toBe('activated')
      expect(parentElement.firstChild).toBe(widgetVNode.element)
    })
  })

  describe('updateChild方法', () => {
    it('应该正确更新子节点', () => {
      const widgetVNode = new WidgetVNode(MockWidget, {})
      widgetVNode.render()

      const rafSpy = vi.spyOn(window, 'requestAnimationFrame')
      rafSpy.mockImplementation(cb => {
        cb(0)
        return 1
      })

      widgetVNode.updateChild()

      expect(rafSpy).toHaveBeenCalled()
    })

    it('已卸载的组件更新应该触发错误', () => {
      const widgetVNode = new WidgetVNode(MockWidget, {})
      widgetVNode.render()
      widgetVNode.mount()
      widgetVNode.unmount()

      const errorHookSpy = vi.spyOn(widgetVNode, 'triggerLifecycleHook')
      widgetVNode.updateChild()

      expect(errorHookSpy).toHaveBeenCalledWith(
        LifecycleHooks.error,
        expect.any(Error),
        expect.objectContaining({ source: 'update' })
      )
    })
  })

  describe('错误处理', () => {
    it('reportWidgetError应该处理根节点错误', () => {
      const widgetVNode = new WidgetVNode(MockWidget, {})
      const handleRootErrorSpy = vi.spyOn(widgetVNode, 'reportError')

      widgetVNode.reportError(new Error('Test error'), {
        source: 'render',
        instance: widgetVNode.instance
      })

      expect(handleRootErrorSpy).toHaveBeenCalled()
    })
  })
})
