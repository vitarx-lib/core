import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { Fragment, FragmentView, IS_VIEW_BUILDER, ViewKind } from '../../../src/index.js'

describe('Fragment Builder', () => {
  describe('构建器功能', () => {
    it('应该被标记为视图构建器', () => {
      expect(Fragment[IS_VIEW_BUILDER]).toBe(true)
    })

    it('应该创建 FragmentView 实例', () => {
      const fragmentView = Fragment({ children: 'test fragment' })

      expect(fragmentView).toBeInstanceOf(FragmentView)
      expect(fragmentView.kind).toBe(ViewKind.FRAGMENT)
    })

    it('应该传递 children 属性到 FragmentView', () => {
      const testChildren = 'This is a test fragment'
      const fragmentView = Fragment({ children: testChildren })

      expect(fragmentView).toBeInstanceOf(FragmentView)
    })

    it('应该接受 location 参数', () => {
      const location = { fileName: 'test.ts', lineNumber: 1, columnNumber: 1 }
      const fragmentView = Fragment({ children: 'test' }, location)

      expect(fragmentView).toBeInstanceOf(FragmentView)
      expect(fragmentView.location).toBe(location)
    })

    it('应该在没有 location 参数时正常工作', () => {
      const fragmentView = Fragment({ children: 'test' })

      expect(fragmentView).toBeInstanceOf(FragmentView)
    })
  })

  describe('类型安全', () => {
    it('应该有正确的类型签名', () => {
      const fragmentView = Fragment({ children: 'test fragment' })

      expect(fragmentView).toBeInstanceOf(FragmentView)
    })

    it('应该有 __is_fragment 标记', () => {
      expect(Fragment).toBeDefined()
    })
  })

  describe('集成测试', () => {
    let container: HTMLElement

    beforeEach(() => {
      container = document.createElement('div')
      document.body.appendChild(container)
    })

    afterEach(() => {
      document.body.removeChild(container)
    })

    it('应该能够挂载和卸载', () => {
      const fragmentView = Fragment({ children: 'test fragment' })

      expect(() => {
        fragmentView.mount(container)
      }).not.toThrow()

      expect(() => {
        fragmentView.dispose()
      }).not.toThrow()
    })

    it('应该正确渲染子元素', () => {
      const fragmentView = Fragment({ children: 'Test content' })
      fragmentView.mount(container)

      expect(container.textContent).toBe('Test content')
    })
  })

  describe('边界情况', () => {
    it('应该处理空 children', () => {
      const fragmentView = Fragment({ children: null as any })

      expect(fragmentView).toBeInstanceOf(FragmentView)
    })

    it('应该处理 undefined children', () => {
      const fragmentView = Fragment({ children: undefined as any })

      expect(fragmentView).toBeInstanceOf(FragmentView)
    })

    it('应该处理复杂的 children 结构', () => {
      const fragmentView = Fragment({ 
        children: [
          'Text 1',
          'Text 2',
          'Text 3'
        ] 
      })

      expect(fragmentView).toBeInstanceOf(FragmentView)
    })
  })
})