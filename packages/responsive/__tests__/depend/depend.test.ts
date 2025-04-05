import { describe, expect, it } from 'vitest'
import { depCollect, depTrack } from '../../src/index'

describe('依赖收集器', () => {
  describe('基础依赖跟踪', () => {
    it('应该正确跟踪单个属性访问', () => {
      const target = { name: 'test' }
      const { deps } = depCollect(() => {
        depTrack(target, 'name')
      })

      expect(deps.has(target)).toBe(true)
      expect(deps.get(target)?.has('name')).toBe(true)
    })

    it('应该去重重复的属性访问', () => {
      const target = { count: 0 }
      const { deps } = depCollect(() => {
        depTrack(target, 'count')
        depTrack(target, 'count')
      })

      expect(deps.get(target)?.size).toBe(1)
    })

    it('应该跟踪多个对象的属性访问', () => {
      const target1 = { name: 'test1' }
      const target2 = { name: 'test2' }
      const { deps } = depCollect(() => {
        depTrack(target1, 'name')
        depTrack(target2, 'name')
      })

      expect(deps.has(target1)).toBe(true)
      expect(deps.has(target2)).toBe(true)
    })
  })

  describe('共享模式收集', () => {
    it('应该允许多个收集器共享依赖', () => {
      const target = { value: 0 }
      const collector1 = depCollect(() => {
        depTrack(target, 'value')
      }, 'shared')

      const collector2 = depCollect(() => {
        depTrack(target, 'value')
      }, 'shared')

      expect(collector1.deps.has(target)).toBe(true)
      expect(collector2.deps.has(target)).toBe(true)
    })
  })

  describe('独占模式收集', () => {
    it('应该只收集当前函数的依赖', () => {
      const target = { value: 0, inner: 0, outer: 0 }
      const outerCollector = depCollect(() => {
        depTrack(target, 'outer')
        const innerCollector = depCollect(() => {
          depTrack(target, 'inner')
        }, 'exclusive')

        expect(innerCollector.deps.get(target)?.has('inner')).toBe(true)
        expect(innerCollector.deps.get(target)?.has('outer')).toBe(false)
      })

      expect(outerCollector.deps.get(target)?.has('outer')).toBe(true)
    })
  })

  describe('嵌套收集', () => {
    it('应该正确处理嵌套的依赖收集', () => {
      const target = { nested: { value: 0 } }
      const { deps } = depCollect(() => {
        depTrack(target, 'nested')
        depCollect(() => {
          depTrack(target.nested, 'value')
        })
      })

      expect(deps.has(target)).toBe(true)
      expect(deps.get(target)?.has('nested')).toBe(true)
    })
  })
})
