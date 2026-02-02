import { describe, expect, it, vi } from 'vitest'
import {
  applyDirective,
  defineDirective,
  resolveDirective,
  runComponent,
  ViewKind,
  withDirectives
} from '../../src/index.js'
import type { Directive, DirectiveBinding, HostElement } from '../../src/types'
import type { ElementView } from '../../src/view'

describe('runtime/directive', () => {
  let mockInstance: any
  let mockApp: any
  let mockElement: HostElement

  beforeEach(() => {
    mockApp = {
      directive: vi.fn((name: string) => {
        return mockApp.directives?.[name]
      }),
      directives: {}
    }

    mockInstance = {
      app: mockApp,
      directiveStore: new Map(),
      scope: {
        run: vi.fn((fn: () => any) => fn())
      }
    }

    mockElement = {
      tagName: 'DIV'
    } as HostElement
  })

  afterEach(() => {
    vi.clearAllMocks()
    // 清除全局指令
    const globalDirectives = (defineDirective as any).globalDirectives
    if (globalDirectives) {
      globalDirectives.clear()
    }
  })

  describe('defineDirective', () => {
    it('当指令名称为空时应该抛出错误', () => {
      expect(() => {
        defineDirective('', {} as Directive)
      }).toThrow('Directive name cannot be empty.')
    })

    it('当没有组件上下文时应该定义全局指令', () => {
      const directive: Directive = {
        mounted: vi.fn()
      }

      defineDirective('test', directive)
      expect(resolveDirective('test')).toBe(directive)
      expect(directive.name).toBe('test')
    })

    it('在组件上下文中应该定义组件局部指令', () => {
      const directive: Directive = {
        mounted: vi.fn()
      }

      runComponent(mockInstance, () => {
        defineDirective('test', directive)
        expect(mockInstance.directiveStore.has('test')).toBe(true)
        expect(mockInstance.directiveStore.get('test')).toBe(directive)
        expect(directive.name).toBe('test')
      })
    })

    it('如果组件上下文中不存在 directiveStore 应该创建它', () => {
      const directive: Directive = {
        mounted: vi.fn()
      }

      const instanceWithoutStore = {
        app: mockApp,
        scope: {
          run: vi.fn((fn: () => any) => fn())
        }
      } as any

      runComponent(instanceWithoutStore, () => {
        defineDirective('test', directive)
        expect(instanceWithoutStore.directiveStore).toBeDefined()
        expect(instanceWithoutStore.directiveStore.has('test')).toBe(true)
      })
    })
  })

  describe('resolveDirective', () => {
    it('应该解析全局指令', () => {
      const directive: Directive = {
        mounted: vi.fn()
      }

      defineDirective('test', directive)
      expect(resolveDirective('test')).toBe(directive)
    })

    it('应该解析不带 v- 前缀的指令', () => {
      const directive: Directive = {
        mounted: vi.fn()
      }

      defineDirective('test', directive)
      expect(resolveDirective('v-test')).toBe(directive)
    })

    it('应该优先解析组件局部指令', () => {
      const globalDirective: Directive = {
        mounted: vi.fn()
      }
      const localDirective: Directive = {
        mounted: vi.fn()
      }

      defineDirective('test', globalDirective)

      runComponent(mockInstance, () => {
        defineDirective('test', localDirective)
        expect(resolveDirective('test')).toBe(localDirective)
      })
    })

    it('当没有局部指令时应该解析应用指令', () => {
      const globalDirective: Directive = {
        mounted: vi.fn()
      }
      const appDirective: Directive = {
        mounted: vi.fn()
      }

      defineDirective('test', globalDirective)
      mockApp.directives['test'] = appDirective

      runComponent(mockInstance, () => {
        expect(resolveDirective('test')).toBe(appDirective)
      })
    })

    it('当没有局部或应用指令时应该解析全局指令', () => {
      const globalDirective: Directive = {
        mounted: vi.fn()
      }

      defineDirective('test', globalDirective)

      runComponent(mockInstance, () => {
        expect(resolveDirective('test')).toBe(globalDirective)
      })
    })

    it('当指令未找到时应该返回 undefined', () => {
      expect(resolveDirective('non-existent')).toBeUndefined()
    })
  })

  describe('withDirectives', () => {
    it('对于非元素/组件视图应该原样返回', () => {
      const view = {
        kind: ViewKind.FRAGMENT
      }

      const result = withDirectives(view as any, [])
      expect(result).toBe(view)
    })

    it('应该向元素视图添加指令', () => {
      const directive: Directive = {
        name: 'test',
        mounted: vi.fn()
      }

      const view = {
        kind: ViewKind.ELEMENT,
        tag: 'div'
      } as ElementView

      const result = withDirectives(view, [directive])
      expect(result.directives).toBeDefined()
      expect(result.directives?.size).toBe(1)
      expect(result.directives?.has(directive)).toBe(true)
    })

    it('应该向元素视图添加带绑定的指令', () => {
      const directive: Directive = {
        name: 'test',
        mounted: vi.fn()
      }

      const binding: DirectiveBinding = {
        value: 'test-value'
      }

      const view = {
        kind: ViewKind.ELEMENT,
        tag: 'div'
      } as ElementView

      const result = withDirectives(view, [[directive, binding]])
      expect(result.directives).toBeDefined()
      expect(result.directives?.size).toBe(1)
      expect(result.directives?.get(directive)).toBe(binding)
    })

    it('应该处理指令名称字符串', () => {
      const directive: Directive = {
        name: 'test',
        mounted: vi.fn()
      }

      defineDirective('test', directive)

      const binding: DirectiveBinding = {
        value: 'test-value'
      }

      const view = {
        kind: ViewKind.ELEMENT,
        tag: 'div'
      } as ElementView

      const result = withDirectives(view, [['test', binding]])
      expect(result.directives).toBeDefined()
      expect(result.directives?.size).toBe(1)
    })
  })

  describe('applyDirective', () => {
    it('应该调用指令钩子', () => {
      const directive1: Directive = {
        name: 'test1',
        mounted: vi.fn()
      }

      const directive2: Directive = {
        name: 'test2',
        mounted: vi.fn()
      }

      const binding1: DirectiveBinding = { value: 'value1' }
      const binding2: DirectiveBinding = { value: 'value2' }

      const view = {
        kind: ViewKind.ELEMENT,
        tag: 'div',
        directives: new Map([
          [directive1, binding1],
          [directive2, binding2]
        ])
      } as ElementView

      applyDirective(view, mockElement, 'mounted')
      expect(directive1.mounted).toHaveBeenCalledWith(mockElement, binding1, view)
      expect(directive2.mounted).toHaveBeenCalledWith(mockElement, binding2, view)
    })

    it('当指令钩子未定义时不应该抛出错误', () => {
      const directive: Directive = {
        name: 'test'
      }

      const view = {
        kind: ViewKind.ELEMENT,
        tag: 'div',
        directives: new Map([[directive, {}]])
      } as ElementView

      expect(() => {
        applyDirective(view, mockElement, 'mounted')
      }).not.toThrow()
    })

    it('应该优雅地处理指令钩子错误', () => {
      const directive: Directive = {
        name: 'test',
        mounted: () => {
          throw new Error('Directive error')
        }
      }

      const view = {
        kind: ViewKind.ELEMENT,
        tag: 'div',
        directives: new Map([[directive, {}]])
      } as ElementView

      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

      expect(() => {
        applyDirective(view, mockElement, 'mounted')
      }).not.toThrow()

      consoleError.mockRestore()
    })
  })
})
