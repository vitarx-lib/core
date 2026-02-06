import { logger, LogLevel } from '@vitarx/utils'
import { describe, expect, it, vi } from 'vitest'
import { inject, provide, runComponent } from '../../src/index.js'

describe('runtime/provide', () => {
  let mockInstance: any
  let mockParentInstance: any
  let mockApp: any

  beforeEach(() => {
    vi.clearAllMocks()

    mockApp = {
      hasProvide: vi.fn((name: string) => mockApp.provides?.has(name)),
      inject: vi.fn((name: string, defaultValue: any) => {
        return mockApp.provides?.get(name) ?? defaultValue
      }),
      provides: new Map()
    }

    mockParentInstance = {
      provide: new Map(),
      app: mockApp,
      scope: {
        run: vi.fn((fn: () => any) => fn())
      }
    }

    mockInstance = {
      parent: mockParentInstance,
      app: mockApp,
      scope: {
        run: vi.fn((fn: () => any) => fn())
      }
    }
  })

  describe('provide', () => {
    it('应该在组件上下文中提供值', () => {
      const name = 'test'
      const value = 'test value'

      runComponent(mockInstance, () => {
        provide(name, value)
        expect(mockInstance.provide).toBeDefined()
        expect(mockInstance.provide.get(name)).toBe(value)
      })
    })

    it('应该添加到现有的 provide map', () => {
      const name1 = 'test1'
      const value1 = 'test value 1'
      const name2 = 'test2'
      const value2 = 'test value 2'

      runComponent(mockInstance, () => {
        provide(name1, value1)
        provide(name2, value2)
        expect(mockInstance.provide.size).toBe(2)
        expect(mockInstance.provide.get(name1)).toBe(value1)
        expect(mockInstance.provide.get(name2)).toBe(value2)
      })
    })

    it('在组件上下文外调用时应该记录错误', () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
      const name = 'test'
      const value = 'test value'

      provide(name, value)
      expect(consoleError).toHaveBeenCalledWith(
        logger.formatMessage(LogLevel.ERROR, `provide(): must be called in a component context`)
      )
      consoleError.mockRestore()
    })
  })

  describe('inject', () => {
    it('应该从父组件注入值', () => {
      const name = 'test'
      const value = 'test value'
      mockParentInstance.provide.set(name, value)

      const result = runComponent(mockInstance, () => {
        return inject(name)
      })

      expect(result).toBe(value)
    })

    it('当未找到值且没有默认值时应该返回 undefined', () => {
      const name = 'non-existent'

      const result = runComponent(mockInstance, () => {
        return inject(name)
      })

      expect(result).toBeUndefined()
    })

    it('当未找到值时应该返回默认值', () => {
      const name = 'non-existent'
      const defaultValue = 'default value'

      const result = runComponent(mockInstance, () => {
        return inject(name, defaultValue)
      })

      expect(result).toBe(defaultValue)
    })

    it('当 treatDefaultAsFactory 为 true 时应该调用工厂函数', () => {
      const name = 'non-existent'
      const factory = vi.fn(() => 'factory value')

      const result = runComponent(mockInstance, () => {
        return inject(name, factory, true)
      })

      expect(factory).toHaveBeenCalled()
      expect(result).toBe('factory value')
    })

    it('当 treatDefaultAsFactory 为 false 时不应该调用工厂函数', () => {
      const name = 'non-existent'
      const factory = vi.fn(() => 'factory value')

      const result = runComponent(mockInstance, () => {
        return inject(name, factory, false)
      })

      expect(factory).not.toHaveBeenCalled()
      expect(result).toBe(factory)
    })

    it('当在父链中未找到时应该从应用上下文注入', () => {
      const name = 'test'
      const value = 'app value'
      mockApp.provides.set(name, value)

      const result = runComponent(mockInstance, () => {
        return inject(name)
      })

      expect(result).toBe(value)
      expect(mockApp.inject).toHaveBeenCalledWith(name, undefined)
    })

    it('在组件上下文外调用时应该抛出错误', () => {
      const name = 'test'

      expect(() => {
        inject(name)
      }).toThrow('inject must be called in component')
    })

    it('应该在所有祖先中查找提供的值', () => {
      const name = 'test'
      const value = 'grandparent value'

      // 创建多层级结构
      const grandparentInstance = {
        provide: new Map([[name, value]]),
        app: mockApp,
        scope: {
          run: vi.fn((fn: () => any) => fn())
        }
      }

      const parentInstance = {
        parent: grandparentInstance,
        app: mockApp,
        scope: {
          run: vi.fn((fn: () => any) => fn())
        }
      }

      const childInstance = {
        parent: parentInstance,
        app: mockApp,
        scope: {
          run: vi.fn((fn: () => any) => fn())
        }
      } as any

      const result = runComponent(childInstance, () => {
        return inject(name)
      })

      expect(result).toBe(value)
    })

    it('应该使用最近祖先提供的值', () => {
      const name = 'test'
      const parentValue = 'parent value'
      const grandparentValue = 'grandparent value'

      // 创建多层级结构
      const grandparentInstance = {
        provide: new Map([[name, grandparentValue]]),
        app: mockApp,
        scope: {
          run: vi.fn((fn: () => any) => fn())
        }
      }

      const parentInstance = {
        parent: grandparentInstance,
        provide: new Map([[name, parentValue]]),
        app: mockApp,
        scope: {
          run: vi.fn((fn: () => any) => fn())
        }
      }

      const childInstance = {
        parent: parentInstance,
        app: mockApp,
        scope: {
          run: vi.fn((fn: () => any) => fn())
        }
      } as any

      const result = runComponent(childInstance, () => {
        return inject(name)
      })

      expect(result).toBe(parentValue)
    })
  })
})
