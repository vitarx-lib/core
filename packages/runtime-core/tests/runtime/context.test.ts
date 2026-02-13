import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { App } from '../../src/app'
import { getApp, getComponentView, getInstance } from '../../src/index.js'
import { runComponent } from '../../src/runtime/context.js'
import type { ComponentInstance } from '../../src/view'

describe('runtime/context', () => {
  let mockInstance: ComponentInstance
  let mockApp: App

  beforeEach(() => {
    mockApp = {
      config: {}
    } as App

    mockInstance = {
      app: mockApp,
      view: {
        type: 'component'
      } as any,
      scope: {
        run: vi.fn((fn: () => any) => fn())
      }
    } as any
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('runComponent', () => {
    it('应该在组件上下文中执行函数', () => {
      const testValue = 'test'
      const result = runComponent(mockInstance, () => {
        expect(getInstance()).toBe(mockInstance)
        return testValue
      })

      expect(result).toBe(testValue)
      expect(mockInstance.scope.run).toHaveBeenCalledTimes(1)
    })

    it('应该在执行后恢复之前的实例', () => {
      const previousInstance = getInstance()
      runComponent(mockInstance, () => {
        expect(getInstance()).toBe(mockInstance)
      })

      expect(getInstance()).toBe(previousInstance)
    })

    it('即使函数抛出异常也应该恢复之前的实例', () => {
      const previousInstance = getInstance()
      expect(() => {
        runComponent(mockInstance, () => {
          throw new Error('Test error')
        })
      }).toThrow('Test error')

      expect(getInstance()).toBe(previousInstance)
    })
  })

  describe('getInstance', () => {
    it('当没有活动实例时应该返回 null', () => {
      expect(getInstance()).toBeNull()
    })

    it('在 runComponent 内部应该返回活动实例', () => {
      runComponent(mockInstance, () => {
        expect(getInstance()).toBe(mockInstance)
      })
    })
  })

  describe('getComponentView', () => {
    it('当没有活动实例时应该返回 null', () => {
      expect(getComponentView()).toBeNull()
    })

    it('当实例活动时应该返回组件视图', () => {
      runComponent(mockInstance, () => {
        expect(getComponentView()).toBe(mockInstance.view)
      })
    })
  })

  describe('getApp', () => {
    it('当没有活动实例时应该返回 null', () => {
      expect(getApp()).toBeNull()
    })

    it('当组件活动时应该返回应用实例', () => {
      runComponent(mockInstance, () => {
        expect(getApp()).toBe(mockApp)
      })
    })

    it('应该返回类型化的应用实例', () => {
      interface TestApp extends App {
        test: string
      }

      const typedApp = {
        ...mockApp,
        test: 'test'
      } as TestApp

      const typedInstance = {
        ...mockInstance,
        app: typedApp
      } as unknown as ComponentInstance

      runComponent(typedInstance, () => {
        expect(getApp<TestApp>()).toBe(typedApp)
        expect(getApp<TestApp>()?.test).toBe('test')
      })
    })
  })
})
