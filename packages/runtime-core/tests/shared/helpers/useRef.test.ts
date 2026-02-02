import { useRef } from '../../../src/index.js'

describe('Runtime Core Shared Helpers - useRef', () => {
  it('应该创建一个初始值为 null 的 ShallowRef', () => {
    const ref = useRef<HTMLDivElement>()
    expect(ref.value).toBe(null)
  })

  it('应该能够更新引用值', () => {
    const ref = useRef<HTMLDivElement>()
    const mockElement = document.createElement('div')
    ref.value = mockElement
    expect(ref.value).toBe(mockElement)
  })

  it('应该能够引用组件实例', () => {
    const ref = useRef<{ name: string }>()
    const mockComponentInstance = { name: 'TestComponent' }
    ref.value = mockComponentInstance
    expect(ref.value).toBe(mockComponentInstance)
    expect(ref.value?.name).toBe('TestComponent')
  })

  it('应该支持泛型类型推断', () => {
    const ref = useRef<number>()
    expect(ref.value).toBe(null)
    // 应该能够设置数字类型的值
    ref.value = 42 as any
    expect(ref.value).toBe(42)
  })
})
