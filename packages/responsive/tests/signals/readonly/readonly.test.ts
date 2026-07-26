import { logger } from '@vitarx/utils'
import { describe, expect, it, vi } from 'vitest'
import { IS_READONLY, ref } from '../../../src/index.js'
import { createReadonlyProxy } from '../../../src/signals/readonly/readonly.js'

describe('signal/readonly/readonly', () => {
  describe('createReadonlyProxy', () => {
    it('should create a readonly proxy', () => {
      const target = { prop: 42 }
      const readonlyProxy = createReadonlyProxy(target, true)

      expect(readonlyProxy).toBeDefined()
      expect(readonlyProxy.prop).toBe(42)
    })

    it('should unwrap ref values', () => {
      const refValue = ref(42)
      const target = { prop: refValue }
      const readonlyProxy = createReadonlyProxy(target, true)

      expect(readonlyProxy.prop).toBe(42)
    })

    it('should create deep readonly proxies', () => {
      const target = { nested: { prop: 42 } }
      const readonlyProxy = createReadonlyProxy(target, true)

      expect(readonlyProxy.nested).toBeDefined()
      expect(readonlyProxy.nested.prop).toBe(42)
    })

    it('should create shallow readonly proxies', () => {
      const target = { nested: { prop: 42 } }
      const readonlyProxy = createReadonlyProxy(target, false)

      expect(readonlyProxy.nested).toBeDefined()
      expect(readonlyProxy.nested.prop).toBe(42)
    })

    it('should warn when setting properties', () => {
      const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => {})
      const target = { prop: 42 }
      const readonlyProxy = createReadonlyProxy(target, true)

      // @ts-ignore - intentionally setting readonly property
      ;(readonlyProxy as any).prop = 100

      expect(warnSpy).toHaveBeenCalledWith(
        '[Readonly] The object is read-only, and the prop attribute cannot be set!'
      )
      warnSpy.mockRestore()
    })

    it('should warn when deleting properties', () => {
      const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => {})
      const target = { prop: 42 }
      const readonlyProxy = createReadonlyProxy(target, true)

      // @ts-ignore - intentionally deleting readonly property
      delete (readonlyProxy as any).prop

      expect(warnSpy).toHaveBeenCalledWith(
        '[Readonly] The object is read-only, and the prop attribute cannot be removed!'
      )
      warnSpy.mockRestore()
    })

    it('should bind functions to target', () => {
      const target = {
        prop: 42,
        method() {
          return this.prop
        }
      }
      const readonlyProxy = createReadonlyProxy(target, true)

      expect(readonlyProxy.method()).toBe(42)
    })

    it('should return cached proxy when called with same target', () => {
      const target = { prop: 42 }
      const readonlyProxy1 = createReadonlyProxy(target, true)
      const readonlyProxy2 = createReadonlyProxy(target, true)

      expect(readonlyProxy1).toBe(readonlyProxy2)
    })
  })

  // ===================== 回归测试 =====================

  // 回归测试：getter/method 内的 this 指向原始 target，允许修改自身属性
  // 设计语义：只读 = "外部只读"，通过 readonly 代理从外部访问时不能修改属性，
  // 但对象内部的 getter / method 是自身行为，应允许正常读写属性。
  // 对应实现：readonly.ts get() 中 Reflect.get(target, prop, target) 用 target 作 receiver
  describe('getter this binding', () => {
    it('should allow getter to modify own properties (this bound to target, not readonly proxy)', () => {
      const target = {
        _count: 0,
        // getter 内部通过 this 写属性：this 应为原始 target，允许修改
        get value() {
          this._count = 99
          return this._count
        }
      }

      const readonlyProxy = createReadonlyProxy(target, true)

      // 访问 getter：内部的 this._count = 99 应正常修改 target（不被 set trap 拦截）
      const result = readonlyProxy.value

      // getter 正常执行，target._count 被修改
      expect(target._count).toBe(99)
      // getter 返回修改后的值
      expect(result).toBe(99)
    })

    it('should still intercept external writes via readonly proxy (external readonly)', () => {
      const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => {})

      const target = { _count: 0 }
      const readonlyProxy = createReadonlyProxy(target, true)

      // 外部直接写 readonlyProxy._count 应被 set trap 拦截（外部只读契约）
      ;(readonlyProxy as any)._count = 100

      expect(warnSpy).toHaveBeenCalledWith(
        '[Readonly] The object is read-only, and the _count attribute cannot be set!'
      )
      // target 不应被修改
      expect(target._count).toBe(0)

      warnSpy.mockRestore()
    })

    it('should support nested getters accessed via this', () => {
      const target = {
        _value: 42,
        get value() {
          return this._value
        },
        get doubled() {
          // 嵌套 getter 通过 this 访问另一个 getter，this 为 target，读取正确
          return this.value * 2
        }
      }

      const readonlyProxy = createReadonlyProxy(target, true)

      // 嵌套 getter 链应正常工作
      expect(readonlyProxy.doubled).toBe(84)
    })
  })

  // 回归测试：deep 模式下 ref 解包后对内部对象递归包装 readonly
  // 对应修复：readonly.ts get() 中 isRef(value) 分支，deep && isObject(inner) 时 createReadonlyProxy
  describe('ref unwrap recursive readonly wrapping', () => {
    it('should wrap ref inner object as readonly in deep mode', () => {
      const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => {})

      const inner = { a: 1 }
      const refValue = ref(inner)
      const target = { count: refValue }
      const readonlyProxy = createReadonlyProxy(target, true)

      // count 应解包 ref 并返回 inner 的 readonly 代理（非原始 inner）
      const innerProxy = readonlyProxy.count
      expect(innerProxy.a).toBe(1)
      // 应标记为 readonly
      expect((innerProxy as any)[IS_READONLY]).toBe(true)

      // 修改 inner 代理的属性应被拦截
      ;(innerProxy as any).a = 2
      expect(warnSpy).toHaveBeenCalledWith(
        '[Readonly] The object is read-only, and the a attribute cannot be set!'
      )
      // 原始 inner 不应被修改
      expect(inner.a).toBe(1)

      warnSpy.mockRestore()
    })

    it('should not wrap ref inner object as readonly in shallow mode', () => {
      const inner = { a: 1 }
      const refValue = ref(inner)
      const target = { count: refValue }
      // shallow 模式：ref 解包后直接返回内部值（ref 内部已转为 reactive 代理），
      // 不递归包装 readonly
      const readonlyProxy = createReadonlyProxy(target, false)

      const innerValue = readonlyProxy.count
      // 不应标记为 readonly（shallow 模式不递归包装）
      expect((innerValue as any)[IS_READONLY]).toBeUndefined()
      // 仍可正常访问属性
      expect(innerValue.a).toBe(1)
    })

    it('should return primitive ref value directly (no wrapping needed)', () => {
      const refValue = ref(42)
      const target = { count: refValue }
      const readonlyProxy = createReadonlyProxy(target, true)

      // 原始类型值无需递归包装
      expect(readonlyProxy.count).toBe(42)
    })

    it('should not double-wrap already readonly inner objects', () => {
      const inner = { a: 1 }
      const refValue = ref(inner)
      const target = { count: refValue }

      // 第一次：deep 模式创建 readonly 代理
      const readonlyProxy = createReadonlyProxy(target, true)
      const innerProxy1 = readonlyProxy.count
      expect((innerProxy1 as any)[IS_READONLY]).toBe(true)

      // 第二次：通过另一个 readonly 代理访问同一 ref，不应重复包装
      const readonlyProxy2 = createReadonlyProxy({ count: refValue }, true)
      const innerProxy2 = readonlyProxy2.count
      expect((innerProxy2 as any)[IS_READONLY]).toBe(true)
    })
  })
})
