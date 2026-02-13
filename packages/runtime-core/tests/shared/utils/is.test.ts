import { ref } from '@vitarx/responsive'
import { describe, it } from 'vitest'
import {
  createCommentView,
  createComponentView,
  createDynamicView,
  createElementView,
  createFragmentView,
  createTextView,
  IS_VIEW,
  IS_VIEW_BUILDER,
  isCommentView,
  isComponentView,
  isDynamicView,
  isElementView,
  isFragmentView,
  isListView,
  isTextView,
  isView,
  isViewBuilder,
  ListView,
  ViewKind
} from '../../../src/index.js'

describe('Runtime Core Shared Utils - is', () => {
  describe('isView', () => {
    it('应该识别 View 对象', () => {
      const view = createTextView('text')
      expect(isView(view)).toBe(true)
    })

    it('应该识别带有 IS_VIEW 标记的对象', () => {
      const mockView = {
        [IS_VIEW]: true,
        kind: ViewKind.TEXT
      }
      expect(isView(mockView)).toBe(true)
    })

    it('应该返回 false 对于非 View 对象', () => {
      expect(isView(null)).toBe(false)
      expect(isView(undefined)).toBe(false)
      expect(isView({})).toBe(false)
      expect(isView('test')).toBe(false)
      expect(isView(123)).toBe(false)
    })
  })

  describe('isComponentView', () => {
    it('应该识别 ComponentView 对象', () => {
      const componentView = createComponentView(() => 'test', {})
      expect(isComponentView(componentView)).toBe(true)
    })

    it('应该返回 false 对于非 ComponentView 对象', () => {
      const textView = createTextView('text')
      expect(isComponentView(textView)).toBe(false)
      expect(isComponentView({})).toBe(false)
    })
  })

  describe('isDynamicView', () => {
    it('应该识别 DynamicView 对象', () => {
      const dynamicView = createDynamicView(ref())
      expect(isDynamicView(dynamicView)).toBe(true)
    })

    it('应该返回 false 对于非 DynamicView 对象', () => {
      const textView = createTextView('text')
      expect(isDynamicView(textView)).toBe(false)
      expect(isDynamicView({})).toBe(false)
    })
  })

  describe('isTextView', () => {
    it('应该识别 TextView 对象', () => {
      const textView = createTextView('text')
      expect(isTextView(textView)).toBe(true)
    })

    it('应该返回 false 对于非 TextView 对象', () => {
      const elementView = createElementView('div', null)
      expect(isTextView(elementView)).toBe(false)
      expect(isTextView({})).toBe(false)
    })
  })

  describe('isCommentView', () => {
    it('应该识别 CommentView 对象', () => {
      const commentView = createCommentView('test')
      expect(isCommentView(commentView)).toBe(true)
    })

    it('应该返回 false 对于非 CommentView 对象', () => {
      const textView = createTextView('text')
      expect(isCommentView(textView)).toBe(false)
      expect(isCommentView({})).toBe(false)
    })
  })

  describe('isElementView', () => {
    it('应该识别 ElementView 对象', () => {
      const elementView = createElementView('div', null)
      expect(isElementView(elementView)).toBe(true)
    })

    it('应该返回 false 对于非 ElementView 对象', () => {
      const textView = createTextView('text')
      expect(isElementView(textView)).toBe(false)
      expect(isElementView({})).toBe(false)
    })
  })

  describe('isFragmentView', () => {
    it('应该识别 FragmentView 对象', () => {
      const fragmentView = createFragmentView([])
      expect(isFragmentView(fragmentView)).toBe(true)
    })

    it('应该返回 false 对于非 FragmentView 对象', () => {
      const textView = createTextView('text')
      expect(isFragmentView(textView)).toBe(false)
      expect(isFragmentView({})).toBe(false)
    })
  })

  describe('isListView', () => {
    it('应该识别 ListView 对象', () => {
      const listView = new ListView()
      expect(isListView(listView)).toBe(true)
    })

    it('应该返回 false 对于非 ListView 对象', () => {
      const textView = createTextView('text')
      expect(isListView(textView)).toBe(false)
      expect(isListView({})).toBe(false)
    })
  })

  describe('isViewBuilder', () => {
    it('应该识别带有 IS_VIEW_BUILDER 标记的函数', () => {
      const mockBuilder = {
        [IS_VIEW_BUILDER]: true
      }
      expect(isViewBuilder(mockBuilder)).toBe(true)
    })

    it('应该返回 false 对于非 ViewBuilder 函数', () => {
      const normalFunction = () => 'test'
      expect(isViewBuilder(normalFunction)).toBe(false)
      expect(isViewBuilder({})).toBe(false)
    })
  })
})
