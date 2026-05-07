import { ref } from '@vitarx/responsive'
import { describe, expect, it, vi } from 'vitest'
import { BranchRef, ExprRef } from '../../../src/view/compiler/ref.js'

describe('Compiler Source', () => {
  describe('ExprRef', () => {
    it('应该创建一个带有依赖追踪功能的计算 Ref', () => {
      const getter = () => 'test'
      const source = new ExprRef(getter)

      expect(source).toHaveProperty('value')
      expect(source.value).toBe('test')
      expect(source).toHaveProperty('isStatic')
    })

    it('应该追踪响应式依赖', () => {
      const countRef = ref(0)
      const source = new ExprRef(() => countRef.value)

      expect(source.value).toBe(0)
      expect(source.isStatic).toBe(false)
    })

    it('当没有响应式依赖时应该是静态的', () => {
      const source = new ExprRef(() => 'test')

      expect(source.value).toBe('test')
      expect(source.isStatic).toBe(true)
    })

    it('当依赖变化时应该重新计算值', () => {
      const countRef = ref(0)
      const source = new ExprRef(() => countRef.value)

      expect(source.value).toBe(0)

      countRef.value = 1
      expect(source.value).toBe(1)
    })

    it('应该缓存计算结果', () => {
      const getter = vi.fn(() => 'test')
      const source = new ExprRef(getter)

      expect(source.value).toBe('test')
      expect(getter).toHaveBeenCalledTimes(1)

      expect(source.value).toBe('test')
      expect(getter).toHaveBeenCalledTimes(1)
    })
  })

  describe('BranchRef', () => {
    it('应该创建一个基于条件选择的多分支计算 Ref', () => {
      const select = () => 0
      const branches = [() => 'branch 0', () => 'branch 1']
      const source = new BranchRef(select, branches)

      expect(source).toHaveProperty('value')
      expect(source.value).toBe('branch 0')
      expect(source).toHaveProperty('isStatic')
    })

    it('应该根据选择函数的结果执行对应的分支函数', () => {
      let index = ref(0)
      const select = () => index.value
      const branches = [() => 'branch 0', () => 'branch 1']
      const source = new BranchRef(select, branches)
      expect(source.value).toBe('branch 0')
      index.value = 1
      expect(source.value).toBe('branch 1')
    })

    it('应该追踪选择函数的响应式依赖', () => {
      const indexRef = ref(0)
      const branches = [() => 'branch 0', () => 'branch 1']
      const source = new BranchRef(() => indexRef.value, branches)

      expect(source.value).toBe('branch 0')
      expect(source.isStatic).toBe(false)

      indexRef.value = 1
      expect(source.value).toBe('branch 1')
    })

    it('当选择相同索引时应该使用缓存的结果', () => {
      let index = 0
      const branchFn = vi.fn(() => 'branch 0')
      const select = () => index
      const branches = [branchFn, () => 'branch 1']
      const source = new BranchRef(select, branches)

      expect(source.value).toBe('branch 0')
      expect(branchFn).toHaveBeenCalledTimes(1)

      expect(source.value).toBe('branch 0')
      expect(branchFn).toHaveBeenCalledTimes(1)
    })

    it('当选择不同索引时应该执行新的分支函数', () => {
      let index = ref(0)
      const branchFn0 = vi.fn(() => 'branch 0')
      const branchFn1 = vi.fn(() => 'branch 1')
      const select = () => index.value
      const branches = [branchFn0, branchFn1]
      const source = new BranchRef(select, branches)

      expect(source.value).toBe('branch 0')
      expect(branchFn0).toHaveBeenCalledTimes(1)
      expect(branchFn1).toHaveBeenCalledTimes(0)

      index.value = 1
      expect(source.value).toBe('branch 1')
      expect(branchFn0).toHaveBeenCalledTimes(1)
      expect(branchFn1).toHaveBeenCalledTimes(1)
    })

    it('当没有响应式依赖时应该是静态的', () => {
      const select = () => 0
      const branches = [() => 'branch 0']
      const source = new BranchRef(select, branches)

      expect(source.value).toBe('branch 0')
      expect(source.isStatic).toBe(true)
    })
  })
})
