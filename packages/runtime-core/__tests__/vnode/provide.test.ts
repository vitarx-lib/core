import { describe, expect, it, vi } from 'vitest'
import { inject, provide, TextVNode, VNode, WidgetVNode } from '../../src'

// 创建模拟函数组件
const mockFnWidget = () => new TextVNode('Mock Fn Widget')
const mockVNode = new WidgetVNode(mockFnWidget)
describe('provide-inject', () => {
  describe('provide 函数测试', () => {
    it('应该能够正常提供依赖数据', () => {
      mockVNode.runInContext(() => {
        // 执行测试
        provide('testKey', 'testValue')
        expect(mockVNode.getProvide('testKey')).toBe('testValue')
      })
    })

    it('当名称为App时应该抛出错误', () => {
      mockVNode.runInContext(() => {
        // 执行测试并验证异常
        expect(() => {
          provide('App', 'anyValue')
        }).toThrow('App 是内部保留关键词，请勿使用！')
      })
    })

    it('在非小部件上下文中调用时应该抛出错误', () => {
      // 执行测试并验证异常
      expect(() => {
        provide('testKey', 'testValue')
      }).toThrow('provide must be called in widget')
    })
  })

  describe('inject 函数测试', () => {
    it('应该能够成功注入祖先组件提供的数据', () => {
      // 创建父级VNode并提供数据
      const parentVNode = new WidgetVNode(mockFnWidget)
      parentVNode.runInContext(() => {
        provide('testKey', 'injectedValue')
        expect(parentVNode.getProvide('testKey')).toBe('injectedValue')
      })
      // 创建子级VNode并尝试注入数据
      const childVNode = new WidgetVNode(mockFnWidget)
      VNode.addParentVNodeMapping(childVNode, parentVNode)
      childVNode.runInContext(() => {
        const parent = VNode.findParentVNode(childVNode) as WidgetVNode
        expect(parent).toBe(parentVNode)
        // 执行测试
        const result = inject<string>('testKey')
        // 验证结果
        expect(result).toBe('injectedValue')
      })
    })

    it('注入不存在的数据时应该返回undefined', () => {
      mockVNode.runInContext(() => {
        // 执行测试
        const result = inject<string>('nonExistentKey')
        // 验证结果
        expect(result).toBeUndefined()
      })
    })

    it('注入不存在的数据但提供了默认值时应该返回默认值', () => {
      mockVNode.runInContext(() => {
        // 执行测试
        const result = inject<string>('nonExistentKey', 'defaultValue')
        // 验证结果
        expect(result).toBe('defaultValue')
      })
    })

    it('当treatDefaultAsFactory为true时，应该将默认值作为工厂函数执行', () => {
      const mockVNode = new WidgetVNode(mockFnWidget)
      const factoryFn = vi.fn().mockReturnValue('factoryResult')

      mockVNode.runInContext(() => {
        // 执行测试
        const result = inject('nonExistentKey', factoryFn, true)
        // 验证结果
        expect(result).toBe('factoryResult')
        expect(factoryFn).toHaveBeenCalled()
      })
    })

    it('当treatDefaultAsFactory为false时，应该直接返回默认值', () => {
      const mockVNode = new WidgetVNode(mockFnWidget)
      const factoryFn = vi.fn().mockReturnValue('factoryResult')

      mockVNode.runInContext(() => {
        // 执行测试
        const result = inject('nonExistentKey', factoryFn, false)
        // 验证结果
        expect(result).toBe(factoryFn)
        expect(factoryFn).not.toHaveBeenCalled()
      })
    })

    it('注入名称为App时应该返回App实例', () => {
      // 创建父级VNode并提供App实例
      const appInstance = { name: 'AppInstance' }
      const parentVNode = new WidgetVNode(mockFnWidget)
      parentVNode.provide('App', appInstance)

      // 创建子级VNode并尝试注入App
      const childVNode = new WidgetVNode(mockFnWidget)
      VNode.addParentVNodeMapping(childVNode, parentVNode)

      childVNode.runInContext(() => {
        // 执行测试
        const result = inject<any>('App')
        // 验证结果
        expect(result).toBe(appInstance)
      })
    })
  })
})
