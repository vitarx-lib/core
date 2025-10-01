import { describe, expect, it } from 'vitest'
import { computed, isReadonly, reactive, readonly, ref, shallowReadonly, toRaw } from '../../src'

describe('readonly', () => {
  it('应创建一个深度只读对象', () => {
    const original = {
      nested: {
        count: 0,
        arr: [1, 2, { value: 3 }]
      },
      foo: 1
    }
    const wrapped = readonly(original)

    // 验证顶层属性是否只读
    // @ts-ignore
    expect(() => ((wrapped as any).foo = 2)).toThrow()
    expect(wrapped.foo).toBe(1)
    // 验证嵌套对象是否只读
    // @ts-ignore
    expect(() => ((wrapped.nested as any).count = 1)).toThrow()
    expect(wrapped.nested.count).toBe(0)

    // 验证嵌套数组是否只读
    // @ts-ignore
    expect(() => (wrapped.nested.arr[0] = 4)).toThrow()
    // @ts-ignore
    expect(() => (wrapped.nested.arr[2].value = 4)).toThrow()
    // @ts-ignore
    expect(wrapped.nested.arr[2].value).toBe(3)

    // 验证是否为只读对象
    expect(isReadonly(wrapped)).toBe(true)
    expect(isReadonly(wrapped.nested)).toBe(true)
    expect(isReadonly(wrapped.nested.arr)).toBe(true)
    expect(isReadonly(wrapped.nested.arr[2])).toBe(true)
  })
})

describe('shallowReadonly', () => {
  it('应创建一个浅层 readonly 对象', () => {
    const original = {
      nested: {
        count: 0,
        arr: [1, 2, { value: 3 }]
      },
      foo: 1
    }
    const wrapped = shallowReadonly(original)

    // 验证顶层属性是否只读
    // @ts-ignore
    expect(() => ((wrapped as any).foo = 2)).toThrow()
    expect(wrapped.foo).toBe(1)

    // 验证嵌套对象是否可修改
    wrapped.nested.count = 1
    expect(wrapped.nested.count).toBe(1)

    // 验证嵌套数组是否可修改
    wrapped.nested.arr[0] = 4
    // @ts-ignore
    wrapped.nested.arr[2].value = 4
    expect(wrapped.nested.arr[0]).toBe(4)
    // @ts-ignore
    expect(wrapped.nested.arr[2].value).toBe(4)

    // 验证只有顶层对象是只读的
    expect(isReadonly(wrapped)).toBe(true)
    expect(isReadonly(wrapped.nested)).toBe(false)
    expect(isReadonly(wrapped.nested.arr)).toBe(false)
    expect(isReadonly(wrapped.nested.arr[2])).toBe(false)
  })
})

describe('isReadonly', () => {
  it('应正确识别 readonly 对象', () => {
    const original = { foo: 1 }
    const readonlyObj = readonly(original)
    const shallowReadonlyObj = shallowReadonly(original)

    expect(isReadonly(readonlyObj)).toBe(true)
    expect(isReadonly(shallowReadonlyObj)).toBe(true)
    expect(isReadonly(original)).toBe(false)
    expect(isReadonly(null)).toBe(false)
    expect(isReadonly(undefined)).toBe(false)
    expect(isReadonly({ foo: 1 })).toBe(false)
  })
})

describe('toRaw', () => {
  it('应返回reactive原始对象', () => {
    const original = { foo: 1 }
    const shallowReadonlyObj = reactive(original)

    expect(toRaw(shallowReadonlyObj)).toBe(original)
    expect(toRaw(original)).toBe(original)
    expect(toRaw(null)).toBe(null)
    expect(toRaw(undefined)).toBe(undefined)
  })
  it('应返回computed原始对象', () => {
    const counter = ref(1)
    const data = computed(() => {
      counter.value++
      return null
    })

    expect(toRaw(data)).toBe(null)
  })
  it('应返回ref原始对象', () => {
    const original = 1
    const data = ref(1)

    expect(toRaw(data)).toBe(original)
    expect(toRaw(original)).toStrictEqual(original)
  })
})
