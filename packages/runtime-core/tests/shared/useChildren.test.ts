import { isRef, ref } from '@vitarx/responsive'
import { describe, expect, it } from 'vitest'
import { branch, dynamic, expr, useChildren, useFastChild, ViewKind } from '../../src/index.js'

describe('runtime/useChildren', () => {
  describe('useChildren', () => {
    it('应该将单个 View 归一化为 View 数组', () => {
      const view = dynamic(() => 'test')
      const children = useChildren(view)

      expect(Array.isArray(children)).toBeTruthy()
      expect(children.length).toBe(1)
      expect(children[0].kind).toBe(ViewKind.DYNAMIC)
    })

    it('应该将 Ref 归一化为包含 DynamicView 的数组', () => {
      const count = ref(1)
      const result = expr(() => count.value + 10)
      if (!isRef(result)) throw new Error('expected Ref')
      const children = useChildren(result)

      expect(Array.isArray(children)).toBeTruthy()
      expect(children.length).toBe(1)
      expect(children[0].kind).toBe(ViewKind.DYNAMIC)
    })

    it('应该将字符串归一化为 TextView 数组', () => {
      const children = useChildren('hello')

      expect(Array.isArray(children)).toBeTruthy()
      expect(children.length).toBe(1)
      expect(children[0].kind).toBe(ViewKind.TEXT)
    })

    it('应该扁平化嵌套数组', () => {
      const view1 = dynamic(() => 'a')
      const view2 = dynamic(() => 'b')
      const children = useChildren([view1, ['nested', view2]])

      expect(children.length).toBe(3)
    })

    it('应该处理 null 值', () => {
      expect(useChildren(null).length).toBe(0)
    })

    it('应该处理 branch 返回的 SwitchViewSource', () => {
      const cond = ref(true)
      const source = branch(
        () => (cond.value ? 0 : 1),
        [() => dynamic(() => 'A'), () => dynamic(() => 'B')]
      )
      const children = useChildren(source)

      expect(Array.isArray(children)).toBeTruthy()
      expect(children.length).toBe(1)
    })
  })

  describe('useFastChild', () => {
    it('应该将单个 View 直接返回', () => {
      const view = dynamic(() => 'test')
      const child = useFastChild(view)

      expect(child).not.toBeNull()
      expect(child!.kind).toBe(ViewKind.DYNAMIC)
    })

    it('应该将 Ref 归一化为 DynamicView', () => {
      const count = ref(1)
      const result = expr(() => count.value + 10)
      if (!isRef(result)) throw new Error('expected Ref')
      const child = useFastChild(result)

      expect(child).not.toBeNull()
      expect(child!.kind).toBe(ViewKind.DYNAMIC)
    })

    it('应该将字符串归一化为 TextView', () => {
      const child = useFastChild('hello')

      expect(child).not.toBeNull()
      expect(child!.kind).toBe(ViewKind.TEXT)
    })

    it('应该将数字归一化为 TextView', () => {
      const child = useFastChild(42)

      expect(child).not.toBeNull()
      expect(child!.kind).toBe(ViewKind.TEXT)
    })

    it('应该从数组中取第一个元素归一化', () => {
      const view1 = dynamic(() => 'first')
      const view2 = dynamic(() => 'second')
      const child = useFastChild([view1, view2])

      expect(child).not.toBeNull()
      expect(child!.kind).toBe(ViewKind.DYNAMIC)
    })

    it('应该将空数组返回 null', () => {
      const child = useFastChild([])

      expect(child).toBeNull()
    })

    it('应该将 null 和无法识别的值返回 null', () => {
      expect(useFastChild(null)).toBeNull()
      expect(useFastChild(undefined as any)).toBeNull()
      expect(useFastChild({} as any)).toBeNull()
    })

    it('应该处理 branch 返回的 SwitchViewSource', () => {
      const cond = ref(true)
      const source = branch(
        () => (cond.value ? 0 : 1),
        [() => dynamic(() => 'A'), () => dynamic(() => 'B')]
      )
      const child = useFastChild(source)

      expect(child).not.toBeNull()
      expect(child!.kind).toBe(ViewKind.DYNAMIC)
    })
  })
})
