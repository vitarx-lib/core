import { isRef, ref } from '@vitarx/responsive'
import { describe, expect, it } from 'vitest'
import { access, branch, dynamic, isDynamicView, ViewKind } from '../../../src/index.js'

describe('Compiler Helpers', () => {
  describe('branch', () => {
    it('应该创建 DynamicView 实例', () => {
      const select = () => 0
      const branches = [() => 'branch 0', () => 'branch 1']
      const view = branch(select, branches)

      expect(view.kind).toBe(ViewKind.DYNAMIC)
    })

    it('应该接受 location 参数', () => {
      const select = () => 0
      const branches = [() => 'branch 0']
      const location = { fileName: 'test.ts', lineNumber: 1, columnNumber: 1 }
      const view = branch(select, branches, location)

      expect(isDynamicView(view)).toBeTruthy()
      expect(view.location).toBe(location)
    })
  })

  describe('access', () => {
    it('当属性不是响应式时应该直接返回值', () => {
      const obj = { name: 'test' }
      const result = access(obj, 'name')

      expect(result).toBe('test')
      expect(isRef(result)).toBeFalsy()
    })

    it('当属性是响应式时应该返回 Ref', () => {
      const r = ref(true)
      const obj = {
        get name() {
          return r.value ? 'test' : 'updated'
        }
      }
      const result = access(obj, 'name')

      expect(isRef(result)).toBe(true)
    })
  })

  describe('dynamic', () => {
    it('应该创建 DynamicView 实例', () => {
      const view = dynamic(() => 'test')

      expect(isDynamicView(view)).toBeTruthy()
      expect(view.kind).toBe(ViewKind.DYNAMIC)
    })

    it('应该追踪响应式依赖', () => {
      const isRef = ref(true)
      const view = dynamic(() => (isRef.value ? 'true' : 'false'))

      expect(view.kind).toBe(ViewKind.DYNAMIC)
    })
  })
})
