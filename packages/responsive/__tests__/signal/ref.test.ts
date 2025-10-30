import { describe, expect, it, vi } from 'vitest'
import {
  Depend,
  isDeepSignal,
  isRef,
  isRefSignal,
  isSignal,
  reactive,
  ref,
  toRef,
  toRefs,
  watch
} from '../../src'

describe('ref', () => {
  describe('基础功能', () => {
    it('应该正确创建ref对象', () => {
      const count = ref(0)
      expect(count.value).toBe(0)
      expect(isRef(count)).toBe(true)
      expect(isSignal(count)).toBe(true)
    })

    it('应该能够修改ref的值', () => {
      const count = ref(0)
      count.value = 1
      expect(count.value).toBe(1)
    })

    it('应该支持复杂数据类型', () => {
      const obj = ref({ count: 0 })
      expect(obj.value.count).toBe(0)
      obj.value.count = 1
      expect(obj.value.count).toBe(1)
    })

    it('应该支持嵌套ref', () => {
      const nested = ref(ref(0))
      expect(nested.value).toBe(0)
      nested.value = 1
      expect(nested.value).toBe(1)
    })
  })

  describe('响应式特性', () => {
    it('应该能够追踪依赖', () => {
      const count = ref(0)
      const dep = Depend.collect(() => {
        count.value
      })
      expect(dep.deps.has(count)).toBe(true)
    })
  })

  describe('深度响应式', () => {
    it('默认应该是深度响应式的', () => {
      const obj = ref({ nested: { count: 0 } })
      const fn = vi.fn()
      watch(obj, fn, { flush: 'sync' })
      obj.value.nested.count++
      expect(fn).toHaveBeenCalledOnce()
    })

    it('应该支持关闭深度响应式', () => {
      const obj = ref({ nested: { count: 0 } }, { deep: false })
      const fn = vi.fn()
      watch(obj, fn, { flush: 'sync' })
      obj.value.nested.count = 1
      expect(fn).not.toHaveBeenCalled()
    })
  })

  describe('类型检查', () => {
    it('isRef应该正确识别ref对象', () => {
      const count = ref(0)
      const plainObj = { value: 0 }

      expect(isRef(count)).toBe(true)
      expect(isRef(plainObj)).toBe(false)
    })
    it('ts类型声明校验', () => {
      const count = ref()
      expect(count.value).toBeUndefined()
      const count2 = ref(0)
      expect(count2.value).toBe(0)
      const count3 = ref<number>()
      expect(count3.value).toBeUndefined()
      const count4 = ref(0, { deep: false })
      expect(count4.value).toBe(0)
      expect(isDeepSignal(count4)).toBe(false)
    })
  })

  describe('toRef功能', () => {
    it('应该能将普通值转换为ref', () => {
      const countRef = toRef(1)
      expect(isRef(countRef)).toBe(true)
      expect(countRef.value).toBe(1)

      countRef.value = 2
      expect(countRef.value).toBe(2)
    })

    it('应该能直接返回已有的ref', () => {
      const originalRef = ref(1)
      const newRef = toRef(originalRef)
      expect(newRef).toBe(originalRef)
    })

    it('应该能将getter函数转换为只读ref', () => {
      let count = 1
      const getCount = () => count
      const countRef = toRef(getCount)

      expect(isRefSignal(countRef)).toBe(true)
      expect(countRef.value).toBe(1)

      count = 2
      expect(countRef.value).toBe(2)
    })

    it('应该能创建与对象属性绑定的ref', () => {
      const state = reactive({ count: 1 })
      const countRef = toRef(state, 'count')

      // 初始值检查
      expect(countRef.value).toBe(1)

      // 从ref修改影响原始对象
      countRef.value = 2
      expect(state.count).toBe(2)

      // 从原始对象修改影响ref
      state.count = 3
      expect(countRef.value).toBe(3)
    })

    it('应该支持对象属性的默认值', () => {
      const state: any = reactive({ count: 1 })
      const nameRef = toRef(state, 'name', 'defaultName')

      expect(nameRef.value).toBe('defaultName')

      state.name = 'newName'
      expect(nameRef.value).toBe('newName')

      nameRef.value = 'anotherName'
      expect(state.name).toBe('anotherName')
    })
  })

  describe('toRefs功能', () => {
    it('应该能将reactive对象的所有属性转换为refs', () => {
      const state = reactive({ count: 1, name: 'test' })
      const refs = toRefs(state)

      expect(isRefSignal(refs.count)).toBe(true)
      expect(isRefSignal(refs.name)).toBe(true)
      expect(refs.count.value).toBe(1)
      expect(refs.name.value).toBe('test')

      // 测试双向绑定
      refs.count.value = 2
      expect(state.count).toBe(2)

      state.name = 'updated'
      expect(refs.name.value).toBe('updated')
    })

    it('应该对普通对象给出警告但仍能工作', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const plainState = { count: 1, name: 'test' }
      const refs = toRefs(plainState)

      expect(isRefSignal(refs.count)).toBe(true)
      expect(isRefSignal(refs.name)).toBe(true)
      expect(refs.count.value).toBe(1)
      expect(refs.name.value).toBe('test')

      // 验证警告已被发出
      expect(warnSpy).toBeCalled()

      warnSpy.mockRestore()
    })
  })
})
