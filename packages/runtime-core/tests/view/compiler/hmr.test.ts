import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { resolveHMRComponent } from '../../../src/view/compiler/hmr.js'
import {
  ComponentView,
  createComponentView,
  createView,
  ViewKind
} from '../../../src/index.js'

/**
 * HMR 组件解析的单元测试
 *
 * 测试环境由 vitest.config 注入 __VITARX_DEV__ = true，environment 为 jsdom，
 * 因此 window 全局存在，可模拟 HMR 客户端的注册/卸载。
 */
describe('HMR 组件解析', () => {
  /**
   * HMR 管理器在 window 上的键名，需与 hmr.ts 内部常量保持一致
   */
  const HMR_KEY = '__$VITARX_HMR$__'

  beforeEach(() => {
    // 每个用例前确保干净的 window 状态
    delete (window as unknown as Record<string, unknown>)[HMR_KEY]
  })

  afterEach(() => {
    // 用例结束后清理，避免影响其他测试
    delete (window as unknown as Record<string, unknown>)[HMR_KEY]
    vi.restoreAllMocks()
  })

  describe('resolveHMRComponent', () => {
    it('未注册 HMR 管理器时应原样返回组件', () => {
      const Comp = (props: { msg: string }) => props.msg
      expect(resolveHMRComponent(Comp as Function)).toBe(Comp)
    })

    it('resolveComponent 非函数时应原样返回组件', () => {
      // 模拟部分注入场景：管理器存在但 resolveComponent 不是函数
      ;(window as unknown as Record<string, unknown>)[HMR_KEY] = {
        resolveComponent: null
      }
      const Comp = (props: { msg: string }) => props.msg
      expect(resolveHMRComponent(Comp as Function)).toBe(Comp)
    })

    it('注册 HMR 管理器后应调用 resolveComponent 并返回其结果', () => {
      const OldComp = (props: { msg: string }) => props.msg
      const NewComp = (props: { msg: string }) => `new:${props.msg}`
      const resolveSpy = vi.fn().mockReturnValue(NewComp)

      ;(window as unknown as Record<string, unknown>)[HMR_KEY] = {
        resolveComponent: resolveSpy
      }

      const result = resolveHMRComponent(OldComp as Function)
      expect(resolveSpy).toHaveBeenCalledOnce()
      expect(resolveSpy).toHaveBeenCalledWith(OldComp)
      expect(result).toBe(NewComp)
    })

    it('应将传入的组件作为参数传递给 resolveComponent', () => {
      const Comp = (props: { n: number }) => props.n
      const resolveSpy = vi.fn((c: Function) => c)
      ;(window as unknown as Record<string, unknown>)[HMR_KEY] = {
        resolveComponent: resolveSpy
      }

      resolveHMRComponent(Comp as Function)
      expect(resolveSpy).toHaveBeenCalledWith(Comp)
    })
  })

  describe('createView HMR 集成', () => {
    it('字符串标签不应触发 HMR 解析', () => {
      const resolveSpy = vi.fn((c: Function) => c)
      ;(window as unknown as Record<string, unknown>)[HMR_KEY] = {
        resolveComponent: resolveSpy
      }

      createView('div', { id: 'test' })

      expect(resolveSpy).not.toHaveBeenCalled()
    })

    it('组件类型应通过 HMR 解析置换为新组件', () => {
      const OldComp = (props: { msg: string }) => props.msg
      const NewComp = (props: { msg: string }) => `new:${props.msg}`
      const resolveSpy = vi.fn().mockReturnValue(NewComp)
      ;(window as unknown as Record<string, unknown>)[HMR_KEY] = {
        resolveComponent: resolveSpy
      }

      const view = createView(OldComp, { msg: 'hi' })

      expect(resolveSpy).toHaveBeenCalledOnce()
      expect(resolveSpy).toHaveBeenCalledWith(OldComp)
      // ComponentView 应持有置换后的新组件
      expect(view).toBeInstanceOf(ComponentView)
      expect((view as ComponentView).component).toBe(NewComp)
      expect(view.kind).toBe(ViewKind.COMPONENT)
    })

    it('无 HMR 管理器时 createView 应正常创建组件视图', () => {
      const Comp = (props: { msg: string }) => props.msg
      const view = createView(Comp, { msg: 'hi' })

      expect(view).toBeInstanceOf(ComponentView)
      expect((view as ComponentView).component).toBe(Comp)
    })
  })

  describe('createComponentView HMR 集成', () => {
    it('应通过 HMR 解析置换为新组件', () => {
      const OldComp = (props: { msg: string }) => props.msg
      const NewComp = (props: { msg: string }) => `new:${props.msg}`
      const resolveSpy = vi.fn().mockReturnValue(NewComp)
      ;(window as unknown as Record<string, unknown>)[HMR_KEY] = {
        resolveComponent: resolveSpy
      }

      const view = createComponentView(OldComp, { msg: 'hi' })

      expect(resolveSpy).toHaveBeenCalledOnce()
      expect(resolveSpy).toHaveBeenCalledWith(OldComp)
      expect(view).toBeInstanceOf(ComponentView)
      expect(view.component).toBe(NewComp)
    })

    it('无 HMR 管理器时应正常创建组件视图', () => {
      const Comp = (props: { msg: string }) => props.msg
      const view = createComponentView(Comp, { msg: 'hi' })

      expect(view).toBeInstanceOf(ComponentView)
      expect(view.component).toBe(Comp)
    })
  })
})
