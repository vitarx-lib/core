import { describe, expect, it, vi } from 'vitest'
import {
  computed,
  flushSync,
  IS_REACTIVE,
  reactive,
  ref,
  watch,
  watchEffect,
  watchPostEffect,
  watchSyncEffect
} from '../../src/index.js'
import { EffectWatcher } from '../../src/watcher/effect.js'

describe('watcher/factory', () => {
  describe('watch', () => {
    it('should watch a ref and call callback on change', async () => {
      const refInstance = ref(0)
      const callback = vi.fn()

      const watcher = watch(refInstance, callback)

      // Callback should not be called immediately
      expect(callback).not.toHaveBeenCalled()

      // Change ref value
      refInstance.value = 1
      flushSync()
      // Callback should be called with new and old values
      expect(callback).toHaveBeenCalledWith(1, 0, expect.any(Function))

      watcher.dispose()
    })

    it('should watch a computed and call callback on change', async () => {
      const signalInstance = ref(0)
      const computedInstance = computed(() => signalInstance.value * 2)
      const callback = vi.fn()

      const watcher = watch(computedInstance, callback)

      // Callback should not be called immediately
      expect(callback).not.toHaveBeenCalled()

      // Change signal value, which should trigger computed update
      signalInstance.value = 1
      flushSync()
      // Callback should be called with new and old values
      expect(callback).toHaveBeenCalledWith(2, 0, expect.any(Function))

      watcher.dispose()
    })

    it('should watch a reactive object and call callback on change', async () => {
      const reactiveInstance = reactive({ count: 0 })
      const callback = vi.fn()

      const watcher = watch(reactiveInstance, callback)

      // Callback should not be called immediately
      expect(callback).not.toHaveBeenCalled()

      // Change reactive property
      reactiveInstance.count = 1
      flushSync()
      // Callback should be called
      expect(callback).toHaveBeenCalled()

      watcher.dispose()
    })

    it('should support immediate option', async () => {
      const signalInstance = ref(0)
      const callback = vi.fn()

      const watcher = watch(signalInstance, callback, { immediate: true, flush: 'sync' })

      // Callback should be called immediately with current value
      expect(callback).toHaveBeenCalledWith(0, 0, expect.any(Function))

      // Change signal value
      signalInstance.value = 1

      // Callback should be called again
      expect(callback).toHaveBeenCalledWith(1, 0, expect.any(Function))

      watcher.dispose()
    })

    it('should support once option', async () => {
      const signalInstance = ref(0)
      const callback = vi.fn()

      const watcher = watch(signalInstance, callback, { once: true })

      // Change signal value first time
      signalInstance.value = 1
      flushSync()
      // Callback should be called
      expect(callback).toHaveBeenCalledWith(1, 0, expect.any(Function))

      // Change signal value second time
      signalInstance.value = 2

      // Callback should not be called again
      expect(callback).toHaveBeenCalledTimes(1)

      // Watcher should be isDeprecated
      expect(watcher.isDisposed).toBe(true)
    })

    it('should watch a getter function', async () => {
      const signalInstance = ref(0)
      const callback = vi.fn()

      const watcher = watch(() => signalInstance.value * 2, callback)

      // Callback should not be called immediately
      expect(callback).not.toHaveBeenCalled()

      // Change signal value
      signalInstance.value = 1
      flushSync()
      // Callback should be called with new and old values
      expect(callback).toHaveBeenCalledWith(2, 0, expect.any(Function))

      watcher.dispose()
    })

    it('should watch an array of sources', async () => {
      const signal1 = ref(0)
      const signal2 = ref(1)
      const callback = vi.fn()

      const watcher = watch([signal1, signal2], callback)

      // Callback should not be called immediately
      expect(callback).not.toHaveBeenCalled()

      // Change first signal
      signal1.value = 2
      flushSync()
      // Callback should be called
      expect(callback).toHaveBeenCalledWith([2, 1], [0, 1], expect.any(Function))

      watcher.dispose()
    })
  })

  describe('watchEffect', () => {
    it('should create an EffectWatcher instance', () => {
      const effect = vi.fn()
      const watcher = watchEffect(effect)

      expect(watcher).toBeInstanceOf(EffectWatcher)
      expect(effect).toHaveBeenCalled()
    })

    it('should accept options', () => {
      const effect = vi.fn()
      const watcher = watchEffect(effect, { flush: 'post' })

      expect(watcher).toBeInstanceOf(EffectWatcher)
      expect(effect).toHaveBeenCalled()
    })
  })

  describe('watchPostEffect', () => {
    it('should create an EffectWatcher instance', () => {
      const effect = vi.fn()
      const watcher = watchPostEffect(effect)

      expect(watcher).toBeInstanceOf(EffectWatcher)
      expect(effect).toHaveBeenCalled()
    })

    it('should accept options except flush', () => {
      const onTrigger = vi.fn()
      const effect = vi.fn()
      const watcher = watchPostEffect(effect, { onTrigger })

      expect(watcher).toBeInstanceOf(EffectWatcher)
      expect(effect).toHaveBeenCalled()
    })

    it('should execute effect after DOM update (post flush)', async () => {
      const signal = ref(0)
      const effect = vi.fn(() => {
        return signal.value
      })
      const watcher = watchPostEffect(effect)

      expect(effect).toHaveBeenCalledTimes(1)

      signal.value = 1
      flushSync()

      expect(effect).toHaveBeenCalledTimes(2)

      watcher.dispose()
    })

    it('should support cleanup function', async () => {
      const signal = ref(0)
      const cleanup = vi.fn()
      const effect = vi.fn(onCleanup => {
        onCleanup(cleanup)
        return signal.value
      })
      const watcher = watchPostEffect(effect)

      expect(effect).toHaveBeenCalledTimes(1)

      signal.value = 1
      flushSync()

      expect(cleanup).toHaveBeenCalledTimes(1)
      expect(effect).toHaveBeenCalledTimes(2)

      watcher.dispose()
    })
  })

  describe('watchSyncEffect', () => {
    it('should create an EffectWatcher instance', () => {
      const effect = vi.fn()
      const watcher = watchSyncEffect(effect)

      expect(watcher).toBeInstanceOf(EffectWatcher)
      expect(effect).toHaveBeenCalled()
    })

    it('should accept options except flush', () => {
      const onTrigger = vi.fn()
      const effect = vi.fn()
      const watcher = watchSyncEffect(effect, { onTrigger })

      expect(watcher).toBeInstanceOf(EffectWatcher)
      expect(effect).toHaveBeenCalled()
    })

    it('should execute effect synchronously when dependency changes', () => {
      const signal = ref(0)
      const effect = vi.fn(() => {
        return signal.value
      })
      const watcher = watchSyncEffect(effect)

      expect(effect).toHaveBeenCalledTimes(1)

      signal.value = 1

      expect(effect).toHaveBeenCalledTimes(2)

      watcher.dispose()
    })

    it('should support cleanup function', () => {
      const signal = ref(0)
      const cleanup = vi.fn()
      const effect = vi.fn(onCleanup => {
        onCleanup(cleanup)
        return signal.value
      })
      const watcher = watchSyncEffect(effect)

      expect(effect).toHaveBeenCalledTimes(1)

      signal.value = 1

      expect(cleanup).toHaveBeenCalledTimes(1)
      expect(effect).toHaveBeenCalledTimes(2)

      watcher.dispose()
    })

    it('should execute immediately on creation', () => {
      const effect = vi.fn()
      const watcher = watchSyncEffect(effect)

      expect(effect).toHaveBeenCalledTimes(1)

      watcher.dispose()
    })

    it('should track reactive dependencies', () => {
      const state = reactive({ count: 0 })
      const effect = vi.fn(() => {
        return state.count
      })
      const watcher = watchSyncEffect(effect)

      expect(effect).toHaveBeenCalledTimes(1)

      state.count = 1

      expect(effect).toHaveBeenCalledTimes(2)

      watcher.dispose()
    })
  })

  // ===================== 回归测试 =====================

  // 回归测试：ValueWatcher 值未变化时不执行 cleanup
  // 对应修复：watcher.ts execute 移除 runCleanup，value.ts runEffect 在 compare 通过后才 runCleanup
  describe('cleanup timing', () => {
    it('should not run cleanup when value has not changed', () => {
      const count = ref(0)
      const cleanup = vi.fn()
      const cb = vi.fn((_newVal: number, _oldVal: number, onCleanup: (fn: () => void) => void) => {
        onCleanup(cleanup)
      })

      // getter 返回 Math.floor(count/10)：count 0-9 → 0，count 10-19 → 1，count 20-29 → 2
      // 当 count 在同一区间内变化时，getter 返回值不变，cleanup 不应执行
      const watcher = watch(() => Math.floor(count.value / 10), cb, { flush: 'sync' })

      // 初始：cb 未调用（无 immediate），cleanup 未执行
      expect(cb).not.toHaveBeenCalled()
      expect(cleanup).not.toHaveBeenCalled()

      // count 0 → 5：getter 仍返回 0，值未变化 → cb 不调用，cleanup 不执行
      count.value = 5
      expect(cb).not.toHaveBeenCalled()
      expect(cleanup).not.toHaveBeenCalled()

      // count 5 → 15：getter 返回 1，值变化 → cb 调用，cleanup 注册但未执行（首次回调无前一次 cleanup）
      count.value = 15
      expect(cb).toHaveBeenCalledTimes(1)
      expect(cleanup).not.toHaveBeenCalled()

      // count 15 → 19：getter 仍返回 1，值未变化 → cb 不调用，cleanup 不执行（关键回归点）
      count.value = 19
      expect(cb).toHaveBeenCalledTimes(1)
      expect(cleanup).not.toHaveBeenCalled()

      // count 19 → 25：getter 返回 2，值变化 → cleanup 执行（释放上次资源），cb 调用
      count.value = 25
      expect(cb).toHaveBeenCalledTimes(2)
      expect(cleanup).toHaveBeenCalledTimes(1)

      watcher.dispose()
    })

    it('should run cleanup before callback when value changes', () => {
      const count = ref(0)
      const executionOrder: string[] = []
      const cb = vi.fn((_newVal: number, _oldVal: number, onCleanup: (fn: () => void) => void) => {
        executionOrder.push('callback')
        onCleanup(() => executionOrder.push('cleanup'))
      })

      const watcher = watch(() => count.value, cb, { flush: 'sync' })

      // 初始：无 immediate，cb 未调用
      expect(executionOrder).toEqual([])

      count.value = 1
      // 首次变化：无前一次 cleanup，仅 callback
      expect(executionOrder).toEqual(['callback'])

      count.value = 2
      // 第二次变化：cleanup（释放首次回调注册的资源）→ callback
      expect(executionOrder).toEqual(['callback', 'cleanup', 'callback'])

      watcher.dispose()
    })
  })

  // 回归测试：deep 选项对 getter 源生效（traverse 追踪嵌套属性）
  // 对应修复：helpers.ts getter 分支 deep 时包装 traverse
  describe('deep for getter source', () => {
    it('should track nested deps with deep (effect re-runs on nested change)', () => {
      const state = reactive({ nested: { count: 0 } })
      const onTrigger = vi.fn()

      // getter 返回 state.nested（reactive proxy），不直接访问 .count
      // deep: true → traverse(state.nested) 追踪 state.nested.count
      const watcher = watch(
        () => state.nested,
        () => {},
        { deep: true, flush: 'sync', onTrigger }
      )

      // 修改嵌套属性 → deep traverse 已追踪 → effect 被触发
      state.nested.count = 1
      expect(onTrigger).toHaveBeenCalled()

      watcher.dispose()
    })

    it('should NOT track nested deps without deep', () => {
      const state = reactive({ nested: { count: 0 } })
      const onTrigger = vi.fn()

      // 无 deep：getter 仅追踪 state.nested 属性本身，不追踪 state.nested.count
      const watcher = watch(
        () => state.nested,
        () => {},
        { flush: 'sync', onTrigger }
      )

      state.nested.count = 1
      // nested.count 未被追踪 → onTrigger 不被调用
      expect(onTrigger).not.toHaveBeenCalled()

      watcher.dispose()
    })
  })

  // 回归测试：deep 选项对 RefSignal 源生效（降级到 GetterWatcher + traverse）
  // 对应修复：helpers.ts RefSignal 分支 deep 时不走快捷路径，改走 getter + traverse
  describe('deep for ref source', () => {
    it('should track nested deps with deep (effect re-runs on nested change)', () => {
      const obj = ref({ count: 0 })
      const onTrigger = vi.fn()

      // deep: true → ref 降级到 GetterWatcher，traverse(obj.value) 追踪 obj.value.count
      const watcher = watch(obj, () => {}, { deep: true, flush: 'sync', onTrigger })

      // 修改 ref 内部嵌套属性 → deep traverse 已追踪 → effect 被触发
      obj.value.count = 1
      expect(onTrigger).toHaveBeenCalled()

      watcher.dispose()
    })

    it('should NOT track nested deps without deep (RefSignalWatcher fast path)', () => {
      const obj = ref({ count: 0 })
      const onTrigger = vi.fn()

      // 无 deep：走 RefSignalWatcher 快捷路径，仅追踪 ref.value 本身
      const watcher = watch(obj, () => {}, { flush: 'sync', onTrigger })

      obj.value.count = 1
      // nested.count 未被追踪 → onTrigger 不被调用
      expect(onTrigger).not.toHaveBeenCalled()

      watcher.dispose()
    })
  })

  // 回归测试：数组源返回 reactive 代理对象（非裸 target）
  // 对应修复：helpers.ts 数组分支 return s[IS_REACTIVE].target → return s
  describe('array source returns reactive proxy', () => {
    it('should pass reactive proxy to callback (not raw target)', () => {
      const state = reactive({ count: 0 })
      const signal = ref(0)
      const cb = vi.fn()

      // 数组源包含 reactive 对象：回调应收到 reactive 代理，而非裸 target
      const watcher = watch([state, signal], cb, { flush: 'sync' })

      signal.value = 1
      flushSync()

      expect(cb).toHaveBeenCalledTimes(1)
      const [newValue] = cb.mock.calls[0]
      // newValue[0] 应是 reactive 代理（有 IS_REACTIVE 标记），而非裸 target
      expect(newValue[0][IS_REACTIVE]).toBeDefined()
      expect(newValue[0]).toBe(state)

      watcher.dispose()
    })
  })
})
