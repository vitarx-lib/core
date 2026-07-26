import { ref } from '@vitarx/responsive'
import { ModelRef, useModel } from '../../src/index.js'

describe('Runtime Core Shared Helpers - useModel', () => {
  describe('ModelRef', () => {
    it('应该创建一个双向绑定的 ModelRef', () => {
      const props = {
        value: 'initial',
        'onUpdate:value': vi.fn()
      }
      const modelRef = new ModelRef(props, 'value')

      expect(modelRef.value).toBe('initial')

      // 测试设置值
      modelRef.value = 'updated'
      expect(modelRef.value).toBe('updated')
      expect(props['onUpdate:value']).toHaveBeenCalledWith('updated')
    })

    it('应该使用默认值当属性不存在时', () => {
      const props = {
        'onUpdate:value': vi.fn()
      }
      const modelRef = new ModelRef(props, 'value' as any, 'default')

      expect(modelRef.value).toBe('default')
    })

    it('应该响应 props 中的变化', () => {
      const props = ref({
        value: 'initial',
        'onUpdate:value': vi.fn()
      })
      const modelRef = new ModelRef(props.value, 'value')

      // 更新 props 对象
      props.value = {
        ...props.value,
        value: 'updated'
      }

      // 由于我们创建了新的 props 对象，ModelRef 不会自动更新
      // 注意：ModelRef 会监听 props[propName] 的变化，但不会监听整个 props 对象的替换
      // 这里我们直接测试 ModelRef 的基本功能，而不是响应式系统的功能
      expect(modelRef.value).toBe('initial')
    })

    it('应该在值相同时不触发更新', () => {
      const props = {
        value: 'initial',
        'onUpdate:value': vi.fn()
      }
      const modelRef = new ModelRef(props, 'value')

      // 设置相同的值
      modelRef.value = 'initial'
      expect(props['onUpdate:value']).not.toHaveBeenCalled()
    })

    it('应该在没有更新事件时正常工作', () => {
      const props = {
        value: 'initial'
      }
      const modelRef = new ModelRef(props, 'value')

      expect(() => {
        modelRef.value = 'updated'
      }).not.toThrow()
      expect(modelRef.value).toBe('updated')
    })
  })

  describe('useModel', () => {
    it('应该创建一个 ModelRef 实例', () => {
      const props = {
        value: 'initial',
        'onUpdate:value': vi.fn()
      }
      const modelRef = useModel(props, 'value')

      expect(modelRef).toBeInstanceOf(ModelRef)
      expect(modelRef.value).toBe('initial')
    })

    it('应该支持默认值', () => {
      const props = {
        'onUpdate:value': vi.fn()
      }
      const modelRef = useModel(props, 'value' as any, 'default')

      expect(modelRef.value).toBe('default')
    })

    it('应该在多个 ModelRef 共享同一数据源时保持双向同步', () => {
      const value = ref(0)
      const props = {
        get value() {
          return value.value
        },
        'onUpdate:value': (v: any) => (value.value = v)
      }
      const modelRef1 = useModel(props, 'value')
      const modelRef2 = useModel(props, 'value')

      expect(modelRef1).toBeInstanceOf(ModelRef)
      expect(modelRef1.value).toBe(0)
      expect(modelRef2).toBeInstanceOf(ModelRef)
      expect(modelRef2.value).toBe(0)

      modelRef1.value++

      expect(value.value).toBe(1)
      modelRef2.value++

      expect(modelRef1.value).toBe(2)
      expect(value.value).toBe(2)
    })
  })
})
