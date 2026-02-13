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
  createListView,
  createTextView,
  createView,
  DynamicView,
  ElementView,
  FragmentView,
  h,
  ListView,
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
      const view = createElementView('div', {
        id: 'test',
        children: 'test text'
      })

      expect(view).toBeInstanceOf(ElementView)
      expect(view.kind).toBe(ViewKind.ELEMENT)
    })

    it('应该接受 location 参数', () => {
      const location = { fileName: 'test.ts', lineNumber: 1, columnNumber: 1 }
      const view = createElementView('div', null, location)

      expect(view.location).toBe(location)
    })
  })

  describe('createListView', () => {
    it('应该创建ListView', () => {
      const listView = createListView([])
      expect(listView).toBeInstanceOf(ListView)
    })
  })

  describe('h', () => {
    it('应该创建元素视图，仅传入type参数', () => {
      const view = h('div')

      expect(view).toBeInstanceOf(ElementView)
      expect(view.kind).toBe(ViewKind.ELEMENT)
    })

    it('应该创建元素视图，传入type和props参数', () => {
      const view = h('div', {
        id: 'test',
        className: 'container'
      })

      expect(view).toBeInstanceOf(ElementView)
      expect(view.kind).toBe(ViewKind.ELEMENT)
    })

    it('应该创建元素视图，传入type和children参数（props作为children）', () => {
      const view = h('div', 'test text')

      expect(view).toBeInstanceOf(ElementView)
      expect(view.kind).toBe(ViewKind.ELEMENT)
    })

    it('应该创建元素视图，传入type、props和children参数', () => {
      const view = h(
        'div',
        {
          id: 'test'
        },
        'test text'
      )

      expect(view).toBeInstanceOf(ElementView)
      expect(view.kind).toBe(ViewKind.ELEMENT)
    })

    it('应该创建组件视图，传入组件类型和props', () => {
      const TestComponent = (props: any) => {
        return props.text
      }

      const view = h(TestComponent, {
        text: 'test text'
      })

      expect(view).toBeInstanceOf(ComponentView)
      expect(view.kind).toBe(ViewKind.COMPONENT)
    })

    it('应该创建组件视图，传入组件类型和children', () => {
      const TestComponent = (props: any) => {
        return props.children
      }

      const view = h(TestComponent, 'test children')

      expect(view).toBeInstanceOf(ComponentView)
      expect(view.kind).toBe(ViewKind.COMPONENT)
    })

    it('当传入null作为props时，应该创建视图', () => {
      const view = h('div', null, 'test text')

      expect(view).toBeInstanceOf(ElementView)
      expect(view.kind).toBe(ViewKind.ELEMENT)
    })

    it('当传入undefined作为props时，应该创建视图', () => {
      const view = h('div', undefined, 'test text')

      expect(view).toBeInstanceOf(ElementView)
      expect(view.kind).toBe(ViewKind.ELEMENT)
    })

    it('当同时传入props和children时，children应该覆盖props中的children', () => {
      const view = h(
        'div',
        {
          children: 'original children'
        },
        'overridden children'
      )

      expect(view).toBeInstanceOf(ElementView)
      expect(view.kind).toBe(ViewKind.ELEMENT)
    })
  })
})
