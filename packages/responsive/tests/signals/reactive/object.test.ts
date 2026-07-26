import { logger } from '@vitarx/utils'
import { describe, expect, it, vi } from 'vitest'
import { reactive, ref, watch } from '../../../src/index.js'
import {
  ArrayReactive,
  createReactive,
  ObjectReactive,
  ReactiveProperty
} from '../../../src/signals/reactive/object.js'

describe('signal/reactive/object', () => {
  describe('PropertySignal', () => {
    it('should create a PropertySignal instance', () => {
      const target = { prop: 42 }
      const propertySignal = new ReactiveProperty(target, 'prop', true)

      expect(propertySignal).toBeInstanceOf(ReactiveProperty)
      expect(propertySignal.target).toBe(target)
      expect(propertySignal.key).toBe('prop')
      expect(propertySignal.deep).toBe(true)
    })

    it('should get value and track dependencies', async () => {
      const target = { prop: 42 }
      const propertySignal = new ReactiveProperty(target, 'prop', true)
      const trackSignalSpy = vi.spyOn(
        await import('../../../src/core/signal/index.js'),
        'trackSignal'
      )

      const value = propertySignal.getValue()

      expect(value).toBe(42)
      expect(trackSignalSpy).toHaveBeenCalledWith(propertySignal)
    })

    it('should set value and trigger updates', async () => {
      const target = { prop: 0 }
      const propertySignal = new ReactiveProperty(target, 'prop', true)
      const triggerSignalSpy = vi.spyOn(
        await import('../../../src/core/signal/index.js'),
        'triggerSignal'
      )

      propertySignal.setValue(42)

      expect(target.prop).toBe(42)
      expect(triggerSignalSpy).toHaveBeenCalledWith(propertySignal, 'set', { newValue: 42 })
    })

    it('should invalidate and clear effects', async () => {
      const target = { prop: 42 }
      const propertySignal = new ReactiveProperty(target, 'prop', true)
      const triggerSignalSpy = vi.spyOn(
        await import('../../../src/core/signal/index.js'),
        'triggerSignal'
      )
      const clearSignalEffectsSpy = vi.spyOn(
        await import('../../../src/core/signal/index.js'),
        'clearSignalLinks'
      )

      propertySignal.invalidate(42)

      expect(triggerSignalSpy).toHaveBeenCalledWith(propertySignal, 'set', {
        oldValue: 42,
        newValue: undefined
      })
      expect(clearSignalEffectsSpy).toHaveBeenCalledWith(propertySignal)
      expect(propertySignal['proxy']).toBeUndefined()
    })

    it('should unwrap ref values', () => {
      const refValue = ref(42)
      const target = { prop: refValue }
      const propertySignal = new ReactiveProperty(target, 'prop', true)

      const value = propertySignal.getValue()

      expect(value).toBe(42)
    })

    it('should unwrap callable signal values', () => {
      const callableSignal = ref(42)
      const target = { prop: callableSignal }
      const propertySignal = new ReactiveProperty(target, 'prop', true)

      const value = propertySignal.getValue()

      expect(value).toBe(42)
    })
  })

  describe('ReactiveObject', () => {
    it('should create a ReactiveObject instance', () => {
      const target = { prop: 42 }
      const reactiveObject = new ObjectReactive(target, true)

      expect(reactiveObject).toBeInstanceOf(ObjectReactive)
      expect(reactiveObject['target']).toBe(target)
      expect(reactiveObject['deep']).toBe(true)
    })

    it('should check if property exists', () => {
      const target = { prop: 42 }
      const reactiveObject = new ObjectReactive(target, true)
      const trackSignalSpy = vi.spyOn(reactiveObject as any, 'trackSignal')

      const result = reactiveObject.has(target, 'prop')

      expect(result).toBe(true)
      expect(trackSignalSpy).toHaveBeenCalledWith('has', { key: 'prop' })
    })

    it('should delete property', () => {
      const target = { prop: 42 }
      const reactiveObject = new ObjectReactive(target, true)
      const triggerSignalSpy = vi.spyOn(reactiveObject as any, 'triggerSignal')

      const result = reactiveObject.deleteProperty(target, 'prop')

      expect(result).toBe(true)
      expect(triggerSignalSpy).toHaveBeenCalledWith('deleteProperty', {
        key: 'prop',
        oldValue: 42,
        newValue: undefined
      })
    })

    it('should get property value', () => {
      const target = { prop: 42 }
      const reactiveObject = new ObjectReactive(target, true)

      // Mock the receiver to avoid issues with Proxy
      const receiver = {}
      const value = (reactiveObject as any).doGet(target, 'prop', receiver)

      expect(value).toBe(42)
    })

    it('should set property value', () => {
      const target = { prop: 0 } as any
      const reactiveObject = new ObjectReactive(target, true)

      const result = (reactiveObject as any).set(target, 'prop', 42, {})

      expect(result).toBe(true)
      expect(target.prop).toBe(42)
    })
  })

  describe('ReactiveArray', () => {
    it('should create a ReactiveArray instance', () => {
      const target = [1, 2, 3]
      const reactiveArray = new ArrayReactive(target, true)

      expect(reactiveArray).toBeInstanceOf(ArrayReactive)
      expect(reactiveArray['target']).toBe(target)
      expect(reactiveArray['deep']).toBe(true)
    })

    it('should handle array length changes', async () => {
      const target = [1, 2, 3]
      const reactiveArray = new ArrayReactive(target, true)
      const triggerSignalSpy = vi.spyOn(
        await import('../../../src/core/signal/index.js'),
        'triggerSignal'
      )

      // Mock the receiver to avoid issues with Proxy
      const result = (reactiveArray as any).set(target, 'length', 2, {})

      expect(result).toBe(true)
      expect(target.length).toBe(2)
      expect(triggerSignalSpy).toHaveBeenCalled()
    })

    it('should throw error for invalid array length', () => {
      const target = [1, 2, 3]
      const reactiveArray = new ArrayReactive(target, true)

      expect(() => {
        ;(reactiveArray as any).set(target, 'length', -1, {})
      }).toThrow('Invalid array length: -1')
    })
  })

  describe('createReactive', () => {
    it('should create reactive object', () => {
      const target = { prop: 42 }
      const reactive = createReactive(target, true)

      expect(reactive).toBeDefined()
      expect(reactive.prop).toBe(42)
    })

    it('should create reactive array', () => {
      const target = [1, 2, 3]
      const reactive = createReactive(target, true)

      expect(reactive).toBeDefined()
      expect(Array.isArray(reactive)).toBe(true)
      expect(reactive.length).toBe(3)
    })

    it('should create reactive Map', () => {
      const target = new Map([['key', 'value']])
      const reactive = createReactive(target, true)

      expect(reactive).toBeDefined()
      expect(reactive.get('key')).toBe('value')
    })

    it('should create reactive Set', () => {
      const target = new Set([1, 2, 3])
      const reactive = createReactive(target, true)

      expect(reactive).toBeDefined()
      expect(reactive.has(1)).toBe(true)
    })

    it('should create reactive WeakMap', () => {
      const key = {}
      const target = new WeakMap([[key, 'value']])
      const reactive = createReactive(target, true)

      expect(reactive).toBeDefined()
      expect(reactive.get(key)).toBe('value')
    })

    it('should create reactive WeakSet', () => {
      const key = {}
      const target = new WeakSet([key])
      const reactive = createReactive(target, true)

      expect(reactive).toBeDefined()
      expect(reactive.has(key)).toBe(true)
    })
  })

  // ===================== 回归测试 =====================

  // 回归测试：ownKeys trap 追踪 ReactiveSource 结构信号，新增/删除属性时触发迭代型 effect
  // 对应实现：object.ts ownKeys trap 调用 trackSignal 建立依赖，set/deleteProperty 触发结构信号
  describe('ownKeys reactivity', () => {
    it('should trigger effect when adding a new property (for...in / Object.keys)', () => {
      const obj: any = reactive({ count: 0 })
      const cb = vi.fn()
      // 读取 keys 数量建立 ReactiveSource 结构依赖（ownKeys trap）
      const watcher = watch(() => Object.keys(obj).length, cb, { flush: 'sync' })

      expect(cb).not.toHaveBeenCalled()

      obj.newProp = 'x' // 新增属性 → 触发结构信号
      expect(cb).toHaveBeenCalledWith(2, 1, expect.any(Function))

      watcher.dispose()
    })

    it('should trigger effect when deleting a property', () => {
      const obj: any = reactive({ count: 0, toDelete: 'x' })
      const cb = vi.fn()
      const watcher = watch(() => Object.keys(obj).length, cb, { flush: 'sync' })

      expect(cb).not.toHaveBeenCalled()

      delete obj.toDelete // 删除属性 → 触发结构信号
      expect(cb).toHaveBeenCalledWith(1, 2, expect.any(Function))

      watcher.dispose()
    })

    it('should trigger effect when adding property via for...in', () => {
      const obj: any = reactive({ a: 1 })
      const cb = vi.fn()
      // for...in 同样走 ownKeys trap，建立 ReactiveSource 结构依赖
      const watcher = watch(
        () => {
          let count = 0
          for (const _ in obj) count++
          return count
        },
        cb,
        { flush: 'sync' }
      )

      obj.b = 2 // 新增属性 → 触发结构信号 → getter 重跑
      expect(cb).toHaveBeenCalledWith(2, 1, expect.any(Function))

      watcher.dispose()
    })
  })

  // 回归测试：数组索引扩展（proxy[5]=1，length=3）应同步 oldLength 并触发 lengthSignal
  // 对应修复：object.ts ArrayReactive.set 检测 index >= target.length 时同步 length
  describe('array index expansion triggers length', () => {
    it('should trigger length effect when setting index beyond current length', () => {
      const arr = reactive([1, 2, 3])
      const cb = vi.fn()
      const watcher = watch(() => arr.length, cb, { flush: 'sync' })

      expect(cb).not.toHaveBeenCalled()

      arr[5] = 42 // 扩展数组，length 从 3 → 6
      expect(arr.length).toBe(6)
      expect(arr[5]).toBe(42)
      expect(cb).toHaveBeenCalledWith(6, 3, expect.any(Function))

      watcher.dispose()
    })

    it('should trigger length effect when using push', () => {
      const arr = reactive([1, 2, 3])
      const cb = vi.fn()
      const watcher = watch(() => arr.length, cb, { flush: 'sync' })

      expect(cb).not.toHaveBeenCalled()

      arr.push(4) // push 内部按索引 set，触发 length 同步
      expect(arr.length).toBe(4)
      expect(cb).toHaveBeenCalledWith(4, 3, expect.any(Function))

      watcher.dispose()
    })
  })

  // 回归测试：__proto__ 走原始 Reflect 路径，不纳入响应式追踪
  // 对应修复：object.ts doGet/set/has/deleteProperty 对 p === '__proto__' 跳过响应式逻辑
  describe('__proto__ protection', () => {
    it('should not trigger reactive effect when setting __proto__', () => {
      const obj = reactive({ count: 0 })
      const cb = vi.fn()
      const watcher = watch(() => obj.count, cb, { flush: 'sync' })

      // 设置 __proto__ 不应触发 count 的 watcher
      ;(obj as any).__proto__ = { extra: 'data' }
      expect(cb).not.toHaveBeenCalled()

      watcher.dispose()
    })

    it('should not create ReactiveProperty for __proto__', () => {
      const target = { count: 0 }
      const reactiveObj = new ObjectReactive(target, true) as any

      // 读取 __proto__ 不应在 propertyMap 中创建信号
      const _ = reactiveObj.doGet(target, '__proto__', {})

      // propertyMap 中不应存在 __proto__ 的 ReactiveProperty
      expect(reactiveObj.propertyMap.has('__proto__')).toBe(false)
    })
  })

  // 回归测试：冻结对象不可变，reactive 应直接返回原对象（不创建代理）
  // 对应修复：object.ts createReactive 入口检测 Object.isFrozen 并 dev 警告
  describe('frozen object handling', () => {
    it('should return frozen object as-is without creating proxy', () => {
      const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => {})
      const frozen = Object.freeze({ count: 0 })

      const result = reactive(frozen)

      // 应返回原始冻结对象，而非代理
      expect(result).toBe(frozen)
      expect(warnSpy).toHaveBeenCalledWith(
        '[reactive] target is frozen, return as-is without proxy'
      )

      warnSpy.mockRestore()
    })

    it('should return frozen array as-is', () => {
      const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => {})
      const frozenArr = Object.freeze([1, 2, 3])

      const result = reactive(frozenArr)

      expect(result).toBe(frozenArr)
      warnSpy.mockRestore()
    })
  })
})
