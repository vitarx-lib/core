import { ref } from '@vitarx/responsive'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  CommentView,
  ComponentView,
  createCommentView,
  createComponentView,
  createDynamicView,
  createElementView,
  createFragmentView,
  createTextView,
  createView,
  DynamicView,
  ElementView,
  FragmentView,
  HostElementTag,
  TextView,
  ViewKind
} from '../../../src/index.js'

describe('View Factory Functions', () => {
  let container: HTMLElement

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
  })

  afterEach(() => {
    document.body.removeChild(container)
  })

  describe('createView', () => {
    it('应该创建元素视图', () => {
      const view = createView('div', {
        id: 'test',
        children: 'test text'
      })

      expect(view).toBeInstanceOf(ElementView)
      expect(view.kind).toBe(ViewKind.ELEMENT)
    })

    it('应该创建组件视图', () => {
      const TestComponent = (props: any) => {
        return props.text
      }

      const view = createView(TestComponent, {
        text: 'test text'
      })

      expect(view).toBeInstanceOf(ComponentView)
      expect(view.kind).toBe(ViewKind.COMPONENT)
    })

    it('应该接受 location 参数', () => {
      const location = { fileName: 'test.ts', lineNumber: 1, columnNumber: 1 }
      const view = createView('div', null, location)

      expect(view.location).toBe(location)
    })

    it('当类型无效时应该抛出错误', () => {
      expect(() => {
        createView(123 as any, null)
      }).toThrow()
    })
  })

  describe('createTextView', () => {
    it('应该创建文本视图', () => {
      const view = createTextView('test text')

      expect(view).toBeInstanceOf(TextView)
      expect(view.kind).toBe(ViewKind.TEXT)
    })

    it('应该接受 location 参数', () => {
      const location = { fileName: 'test.ts', lineNumber: 1, columnNumber: 1 }
      const view = createTextView('test text', location)

      expect(view.location).toBe(location)
    })
  })

  describe('createCommentView', () => {
    it('应该创建注释视图', () => {
      const view = createCommentView('test comment')

      expect(view).toBeInstanceOf(CommentView)
      expect(view.kind).toBe(ViewKind.COMMENT)
    })

    it('应该接受 location 参数', () => {
      const location = { fileName: 'test.ts', lineNumber: 1, columnNumber: 1 }
      const view = createCommentView('test comment', location)

      expect(view.location).toBe(location)
    })
  })

  describe('createComponentView', () => {
    it('应该创建组件视图', () => {
      const view = createComponentView(
        (props: any) => {
          return props.text
        },
        {
          text: 'test text'
        }
      )

      expect(view).toBeInstanceOf(ComponentView)
      expect(view.kind).toBe(ViewKind.COMPONENT)
    })

    it('应该接受 location 参数', () => {
      const location = { fileName: 'test.ts', lineNumber: 1, columnNumber: 1 }

      const view = createComponentView(
        (props: any) => {
          return props.text
        },
        null,
        location
      )

      expect(view.location).toBe(location)
    })
  })

  describe('createFragmentView', () => {
    it('应该创建片段视图', () => {
      const view = createFragmentView('test text')

      expect(view).toBeInstanceOf(FragmentView)
      expect(view.kind).toBe(ViewKind.FRAGMENT)
    })

    it('应该接受 location 参数', () => {
      const location = { fileName: 'test.ts', lineNumber: 1, columnNumber: 1 }
      const view = createFragmentView('test text', location)

      expect(view.location).toBe(location)
    })
  })

  describe('createDynamicView', () => {
    it('应该创建动态视图', () => {
      const source = ref('test')
      const view = createDynamicView(source)

      expect(view).toBeInstanceOf(DynamicView)
      expect(view.kind).toBe(ViewKind.DYNAMIC)
    })

    it('应该接受 location 参数', () => {
      const location = { fileName: 'test.ts', lineNumber: 1, columnNumber: 1 }
      const source = ref('test')
      const view = createDynamicView(source, location)

      expect(view.location).toBe(location)
    })
  })

  describe('createElementView', () => {
    it('应该创建元素视图', () => {
      const view = createElementView('div' as HostElementTag, {
        id: 'test',
        children: 'test text'
      })

      expect(view).toBeInstanceOf(ElementView)
      expect(view.kind).toBe(ViewKind.ELEMENT)
    })

    it('应该接受 location 参数', () => {
      const location = { fileName: 'test.ts', lineNumber: 1, columnNumber: 1 }
      const view = createElementView('div' as HostElementTag, null, location)

      expect(view.location).toBe(location)
    })
  })
})
