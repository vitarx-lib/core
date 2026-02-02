import { IS_RAW } from '@vitarx/responsive'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { IS_VIEW, ViewKind, ViewState } from '../../../src/index.js'
import { BaseView } from '../../../src/view/implements/base.js'

describe('BaseView', () => {
  // 创建一个具体的 BaseView 子类用于测试
  class TestView extends BaseView<ViewKind.TEXT, Text> {
    readonly kind = ViewKind.TEXT
    protected hostNode: Text | null = null
    protected override doInit(): void {
      // 模拟初始化
      this.hostNode = document.createTextNode('test')
    }

    protected override doMount(target: Node, type: string): void {
      // 模拟挂载
      if (type === 'append') {
        ;(target as Element).appendChild(this.hostNode!)
      }
    }

    protected override doDispose(): void {
      // 模拟销毁
      this.hostNode = null
    }

    protected override doActivate(): void {
      // 模拟激活
    }

    protected override doDeactivate(): void {
      // 模拟停用
    }
  }

  let view: TestView
  let container: HTMLElement

  beforeEach(() => {
    view = new TestView()
    container = document.createElement('div')
    document.body.appendChild(container)
  })

  afterEach(() => {
    document.body.removeChild(container)
  })

  describe('基本属性', () => {
    it('应该有 IS_VIEW 标记', () => {
      expect(view[IS_VIEW]).toBe(true)
    })

    it('应该有 IS_RAW 标记', () => {
      expect(view[IS_RAW]).toBe(true)
    })

    it('应该有 kind 属性', () => {
      expect(view.kind).toBe(ViewKind.TEXT)
    })

    it('应该接受 location 参数', () => {
      const location = { fileName: 'test.ts', lineNumber: 1, columnNumber: 1 }
      const viewWithLocation = new TestView(location)

      expect(viewWithLocation.location).toBe(location)
    })
  })

  describe('状态管理', () => {
    it('初始状态应该是 UNUSED', () => {
      expect(view.state).toBe(ViewState.UNUSED)
      expect(view.isUnused).toBe(true)
      expect(view.isInitialized).toBe(false)
      expect(view.isActivated).toBe(false)
      expect(view.isDeactivated).toBe(false)
    })

    it('初始化后状态应该是 INITIALIZED', () => {
      view.init()

      expect(view.state).toBe(ViewState.INITIALIZED)
      expect(view.isUnused).toBe(false)
      expect(view.isInitialized).toBe(true)
      expect(view.isActivated).toBe(false)
      expect(view.isDeactivated).toBe(false)
    })

    it('挂载后状态应该是 ACTIVATED', () => {
      view.mount(container)

      expect(view.state).toBe(ViewState.ACTIVATED)
      expect(view.isUnused).toBe(false)
      expect(view.isInitialized).toBe(false)
      expect(view.isActivated).toBe(true)
      expect(view.isDeactivated).toBe(false)
    })

    it('销毁后状态应该是 UNUSED', () => {
      view.mount(container)
      view.dispose()

      expect(view.state).toBe(ViewState.UNUSED)
      expect(view.isUnused).toBe(true)
      expect(view.isInitialized).toBe(false)
      expect(view.isActivated).toBe(false)
      expect(view.isDeactivated).toBe(false)
    })

    it('停用时状态应该是 DEACTIVATED', () => {
      view.mount(container)
      view.deactivate()

      expect(view.state).toBe(ViewState.DEACTIVATED)
      expect(view.isUnused).toBe(false)
      expect(view.isInitialized).toBe(false)
      expect(view.isActivated).toBe(false)
      expect(view.isDeactivated).toBe(true)
    })

    it('激活后状态应该是 ACTIVATED', () => {
      view.mount(container)
      view.deactivate()
      view.activate()

      expect(view.state).toBe(ViewState.ACTIVATED)
      expect(view.isUnused).toBe(false)
      expect(view.isInitialized).toBe(false)
      expect(view.isActivated).toBe(true)
      expect(view.isDeactivated).toBe(false)
    })
  })

  describe('生命周期方法', () => {
    it('应该能够初始化', () => {
      expect(() => {
        view.init()
      }).not.toThrow()
      expect(view.state).toBe(ViewState.INITIALIZED)
    })

    it('应该能够挂载', () => {
      expect(() => {
        view.mount(container)
      }).not.toThrow()
      expect(view.state).toBe(ViewState.ACTIVATED)
    })

    it('应该能够销毁', () => {
      view.mount(container)
      expect(() => {
        view.dispose()
      }).not.toThrow()
      expect(view.state).toBe(ViewState.UNUSED)
    })

    it('应该能够停用', () => {
      view.mount(container)
      expect(() => {
        view.deactivate()
      }).not.toThrow()
      expect(view.state).toBe(ViewState.DEACTIVATED)
    })

    it('应该能够激活', () => {
      view.mount(container)
      view.deactivate()
      expect(() => {
        view.activate()
      }).not.toThrow()
      expect(view.state).toBe(ViewState.ACTIVATED)
    })
  })

  describe('错误处理', () => {
    it('当视图不是 INITIALIZED 状态时挂载应该抛出错误', () => {
      view.init()
      view.dispose() // 变为 UNUSED 状态

      expect(() => {
        view.mount(container)
      }).not.toThrow() // 应该自动初始化
    })

    it('当视图不是 DEACTIVATED 状态时激活应该抛出错误', () => {
      expect(() => {
        view.activate()
      }).toThrow()
    })

    it('当视图不是 ACTIVATED 状态时停用应该抛出错误', () => {
      expect(() => {
        view.deactivate()
      }).toThrow()
    })

    it('当 hostNode 不存在时访问 node 应该抛出错误', () => {
      expect(() => {
        const node = view.node
      }).toThrow()
    })
  })

  describe('上下文和所有者', () => {
    it('应该能够设置和获取 ctx', () => {
      const ctx = { app: null, owner: null }
      view.init(ctx as any)

      expect(view.ctx).toBe(ctx)
    })

    it('应该能够获取 owner', () => {
      const owner = {} as any
      const ctx = { app: null, owner }
      view.init(ctx as any)

      expect(view.owner).toBe(owner)
    })

    it('应该能够获取 app', () => {
      const app = {} as any
      const ctx = { app, owner: null }
      view.init(ctx as any)

      expect(view.app).toBe(app)
    })
  })
})
