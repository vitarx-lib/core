import { ref } from '@vitarx/responsive'
import { describe, expect, it } from 'vitest'
import {
  build,
  DynamicView,
  memberExpressions,
  readonlyProp,
  switchExpressions,
  ViewKind
} from '../../../src/index.js'

describe('Compiler Helpers', () => {
  describe('readonlyProp', () => {
    it('应该创建一个只读的响应式引用对象', () => {
      const obj = { name: 'test' }
      const propRef = readonlyProp(obj, 'name')

      expect(propRef).toHaveProperty('value')
      expect(propRef.value).toBe('test')
    })

    it('应该缓存相同对象的相同属性引用', () => {
      const obj = { name: 'test' }
      const ref1 = readonlyProp(obj, 'name')
      const ref2 = readonlyProp(obj, 'name')

      expect(ref1).toBe(ref2)
    })

    it('应该为不同属性创建不同的引用', () => {
      const obj = { name: 'test', age: 18 }
      const ref1 = readonlyProp(obj, 'name')
      const ref2 = readonlyProp(obj, 'age')

      expect(ref1).not.toBe(ref2)
      expect(ref1.value).toBe('test')
      expect(ref2.value).toBe(18)
    })

    it('应该为不同对象创建不同的引用', () => {
      const obj1 = { name: 'test1' }
      const obj2 = { name: 'test2' }
      const ref1 = readonlyProp(obj1, 'name')
      const ref2 = readonlyProp(obj2, 'name')

      expect(ref1).not.toBe(ref2)
      expect(ref1.value).toBe('test1')
      expect(ref2.value).toBe('test2')
    })

    it('应该返回最新的属性值', () => {
      const obj = { name: 'test' }
      const propRef = readonlyProp(obj, 'name')

      expect(propRef.value).toBe('test')

      obj.name = 'updated'
      expect(propRef.value).toBe('updated')
    })
  })

  describe('switchExpressions', () => {
    it('应该创建 DynamicView 实例', () => {
      const select = () => 0
      const branches = [() => 'branch 0', () => 'branch 1']
      const view = switchExpressions(select, branches)

      expect(view).toBeInstanceOf(DynamicView)
      expect(view.kind).toBe(ViewKind.DYNAMIC)
    })

    it('应该接受 location 参数', () => {
      const select = () => 0
      const branches = [() => 'branch 0']
      const location = { fileName: 'test.ts', lineNumber: 1, columnNumber: 1 }
      const view = switchExpressions(select, branches, location)

      expect(view).toBeInstanceOf(DynamicView)
      expect(view.location).toBe(location)
    })
  })

  describe('memberExpressions', () => {
    it('当属性是函数时应该直接返回函数', () => {
      const obj = { name: 'test', fn: () => 'function' }
      const result = memberExpressions(obj, 'fn')

      expect(typeof result).toBe('function')
      // @ts-ignore
      expect(result()).toBe('function')
    })

    it('当属性不是响应式时应该直接返回值', () => {
      const obj = { name: 'test' }
      const result = memberExpressions(obj, 'name')

      expect(result).toBe('test')
      expect(result).not.toBeInstanceOf(DynamicView)
    })

    it('当属性是响应式时应该返回 DynamicView', () => {
      const isRef = ref(true)
      const obj = {
        get name() {
          return isRef.value ? 'test' : 'updated'
        }
      }
      const result = memberExpressions(obj, 'name')

      expect(result).toBeInstanceOf(DynamicView)
      expect((result as DynamicView).kind).toBe(ViewKind.DYNAMIC)
    })
  })

  describe('build', () => {
    it('应该创建 DynamicView 实例', () => {
      const view = build(() => 'test')

      expect(view).toBeInstanceOf(DynamicView)
      expect(view.kind).toBe(ViewKind.DYNAMIC)
    })

    it('应该追踪响应式依赖', () => {
      const isRef = ref(true)
      const view = build(() => (isRef.value ? 'true' : 'false'))

      expect(view).toBeInstanceOf(DynamicView)
    })
  })
})
