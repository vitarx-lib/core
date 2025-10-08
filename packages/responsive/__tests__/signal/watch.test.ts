import { describe, expect, it, vi } from 'vitest'
import { computed, reactive, ref, watch, watchChanges, watchEffect, watchProperty } from '../../src'

describe('watch', () => {
  describe('基础功能', () => {
    it('应该监听ref的变化', () => {
      const count = ref(0)
      const fn = vi.fn()

      const subscriber = watch(count, fn, { batch: false })

      count.value = 1
      expect(fn).toHaveBeenCalledWith(1, 0, expect.any(Function))

      // 停止监听后不应该再触发回调
      subscriber.dispose()
      count.value = 2
      expect(fn).toHaveBeenCalledTimes(1)
    })
    it('应该监听reactive对象的变化', () => {
      const state = reactive({ count: 0 })
      const fn = vi.fn()

      watch(() => state.count, fn, { batch: false })

      state.count = 1
      expect(fn).toHaveBeenCalledWith(1, 0, expect.any(Function))
    })
    it('应该监听computed的变化', () => {
      const count = ref(0)
      const double = computed(() => count.value * 2, { batch: false })
      const fn = vi.fn()

      watch(double, fn, { batch: false })

      count.value = 1
      expect(fn).toHaveBeenCalledWith(2, 0, expect.any(Function))
    })
    it('应该能监听到深度变化监听', () => {
      const state = reactive({ nested: { count: 0 } })
      const fn = vi.fn()
      watch(state, fn, { batch: false })
      state.nested.count = 1
      expect(fn).toHaveBeenCalledOnce()
    })
    it('应该支持immediate选项立即执行', () => {
      const state = reactive({ count: 0 })
      const fn = vi.fn()
      watch(state, fn, { immediate: true, batch: false })
      expect(fn).toHaveBeenCalledOnce()
      const fn2 = vi.fn()
      watchProperty(state, 'count', fn2, { immediate: true, batch: false })
      expect(fn2).toHaveBeenCalledWith(['count'], state)
    })
    it('应该支持监听集合', () => {
      const map = reactive(new Map())
      const fn = vi.fn()
      watch(map, fn, { batch: false })
      map.set('key', 'value')
      expect(fn).toHaveBeenCalledOnce()
      const set = ref(new Set())
      const fn2 = vi.fn()
      watch(set, fn2, { batch: false })
      set.value.add('key')
      expect(fn2).toHaveBeenCalledOnce()
    })
    it('应该支持监听数组的变化', async () => {
      const data = ref([1, 2, 3])
      const fn = vi.fn()
      watchEffect(() => {
        data.value.map(item => item + 1)
      }, fn)
      data.value.push(0)
      await vi.waitFor(() => {
        expect(fn).toHaveBeenCalledOnce()
      })
      data.value.pop()
      await vi.waitFor(() => {
        expect(fn).toHaveBeenCalledTimes(2)
      })
      data.value.unshift(4)
      await vi.waitFor(() => {
        expect(fn).toHaveBeenCalledTimes(3)
      })
      data.value.reverse()
      await vi.waitFor(() => {
        expect(fn).toHaveBeenCalledTimes(4)
      })
      data.value.shift()
      await vi.waitFor(() => {
        expect(fn).toHaveBeenCalledTimes(5)
      })
      expect(data.value.length).greaterThanOrEqual(0)
      data.value.splice(0)
      expect(data.value.length).toBe(0)
      await vi.waitFor(() => {
        expect(fn).toHaveBeenCalledTimes(6)
      })
    })
    it('应该支持监听指定属性的变化', () => {
      const data = ref({ count: 0 })
      const fn = vi.fn()
      watchProperty(data, 'value', fn)
      const fn2 = vi.fn()
      watchProperty(data.value, 'count', fn2)
      data.value.count++
      Promise.resolve().then(() => {
        expect(fn).toHaveBeenCalledWith(['value'], data)
        expect(fn2).toHaveBeenCalledWith(['count'], data.value)
      })
    })
    it('应该支持监听getter函数返回值变化', async () => {
      const fn = vi.fn()
      const count = ref(1)

      watch(() => count.value * 2, fn)

      count.value++
      await vi.waitFor(() => {
        expect(fn).toHaveBeenCalledWith(4, 2, expect.any(Function))
      })
    })
  })

  describe('选项', () => {
    it('应该支持clone选项克隆对象值', () => {
      const state = reactive({ nested: { count: 0 } })
      const fn = vi.fn()
      let oldValue: any

      watch(
        () => state.nested,
        (newVal, oldVal) => {
          fn(newVal, oldVal)
          oldValue = oldVal
        },
        { clone: true, batch: false }
      )

      state.nested.count = 1
      expect(fn).toHaveBeenCalled()
      // 使用clone选项时，oldValue应该是一个独立的对象副本，而不是引用
      expect(oldValue).not.toBe(state.nested)
      expect(oldValue.count).toBe(0)
    })

    it('应该支持batch选项批量处理更新', () => {
      const state = reactive({ count: 0 })
      const fn = vi.fn()

      watch(() => state.count, fn)
      state.count++
      state.count++
      Promise.resolve().then(() => expect(fn).toHaveBeenCalledOnce())
    })
  })

  describe('清理函数', () => {
    it('应该支持清理函数', async () => {
      const cleanup = vi.fn()
      const count = ref(0)

      watch(
        count,
        (_newVal, _oldVal, onCleanup) => {
          onCleanup(cleanup)
        },
        { batch: false }
      )

      count.value = 1
      count.value = 2

      // 第一次变化后的清理函数应该被调用
      expect(cleanup).toHaveBeenCalledTimes(1)
    })
  })

  describe('多个数据源', () => {
    it('应该支持监听多个数据源', () => {
      const count1 = ref(0)
      const count2 = ref(10)
      const fn = vi.fn()
      const fn2 = vi.fn()
      watchChanges([count1, count2], fn)
      watch([count1, count2], fn2)
      count1.value = 1
      Promise.resolve().then(() => {
        expect(fn).toHaveBeenCalledWith(['value'], count1)
        expect(fn2).toHaveBeenCalledOnce()
      })
    })
  })
})
