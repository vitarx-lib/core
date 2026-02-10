import { ref } from '@vitarx/responsive'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  builder,
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
  h,
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
  describe('h', () => {
    it('应该创建元素视图实例', () => {
      const view = h(
        'div',
        {
          id: 'test',
          className: 'container'
        },
        'test content'
      )

      expect(view).toBeInstanceOf(ElementView)
      expect(view.kind).toBe(ViewKind.ELEMENT)
      expect(view.tag).toBe('div')
      expect((view as any).props?.id).toBe('test')
      expect((view as any).props?.className).toBe('container')
    })

    it('应该创建组件视图实例', () => {
      const TestComponent = (props: any) => {
        return h('span', null, props.text)
      }

      const view = h(TestComponent, {
        text: 'hello world'
      })

      expect(view).toBeInstanceOf(ComponentView)
      expect(view.kind).toBe(ViewKind.COMPONENT)
    })

    it('应该创建视图构建器实例', () => {
      const TestBuilder = builder((props: any) => {
        return new ElementView('section', props)
      })

      const view = h(TestBuilder, {
        'data-test': 'builder-test'
      })

      expect(view).toBeInstanceOf(ElementView)
      expect(view.kind).toBe(ViewKind.ELEMENT)
      expect(view.tag).toBe('section')
    })

    it('应该正确处理单个子节点', () => {
      const view = h('div', null, 'single child')

      expect((view.children[0] as TextView).text).toBe('single child')
    })

    it('应该正确处理多个子节点', () => {
      const child1 = h('span', null, 'first')
      const child2 = h('span', null, 'second')
      const view = h('div', null, child1, child2)

      const children = (view as ElementView).children
      expect(Array.isArray(children)).toBe(true)
      expect(children).toHaveLength(2)
      expect(children[0]).toBe(child1)
      expect(children[1]).toBe(child2)
    })

    it('应该正确处理 undefined 的 props 参数', () => {
      const view = h('div', undefined, 'content')

      expect(view).toBeInstanceOf(ElementView)
      expect(view.children[0]).toBeInstanceOf(TextView)
    })

    it('应该在开发模式下包含位置信息', () => {
      // 模拟开发环境
      const originalDev = __DEV__
      Object.defineProperty(globalThis, '__DEV__', {
        value: true,
        writable: true
      })

      try {
        const view = h('div', null, 'test')

        expect(view.location).toBeDefined()
        expect(view.location?.fileName).toContain('factory.test.ts')
      } finally {
        Object.defineProperty(globalThis, '__DEV__', {
          value: originalDev,
          writable: true
        })
      }
    })

    it('应该在生产模式下不包含位置信息', () => {
      // 模拟生产环境
      const originalDev = __DEV__
      Object.defineProperty(globalThis, '__DEV__', {
        value: false,
        writable: true
      })

      try {
        const view = h('div', null, 'test')

        expect(view.location).toBeUndefined()
      } finally {
        Object.defineProperty(globalThis, '__DEV__', {
          value: originalDev,
          writable: true
        })
      }
    })

    it('应该正确处理 Fragment 构建器', () => {
      const FragmentBuilder = builder((props: any) => {
        return new FragmentView(props.children)
      })

      const child = h('span', null, 'fragment child')
      const view = h(FragmentBuilder, null, child)

      expect(view).toBeInstanceOf(FragmentView)
      expect(view.kind).toBe(ViewKind.FRAGMENT)
    })

    it('应该正确处理文本子节点', () => {
      const view = h('div', null, 'text content')

      expect((view.children[0] as TextView).text).toBe('text content')
    })

    it('应该正确处理数字子节点', () => {
      const view = h('div', null, 42)

      expect((view.children[0] as TextView).text).toBe('42')
    })

    it('应该正确处理响应式子节点', () => {
      const reactiveChild = ref('reactive text')
      const view = h('div', null, reactiveChild)

      expect(view.children[0]).toBeInstanceOf(DynamicView)
    })

    it('应该正确处理混合类型的子节点', () => {
      const textChild = 'text'
      const elementChild = h('span', null, 'element')
      const reactiveChild = ref('reactive')

      const view = h('div', null, textChild, elementChild, reactiveChild)

      const children = (view as ElementView).children
      expect(Array.isArray(children)).toBe(true)
      expect(children).toHaveLength(3)
      expect(children[0]).toBeInstanceOf(TextView)
      expect(children[1]).toBeInstanceOf(ElementView)
      expect(children[2]).toBeInstanceOf(DynamicView)
    })

    it('应该正确处理嵌套的 h 调用', () => {
      const view = h('div', null, h('span', { className: 'inner' }, 'nested content'))

      const children = view.children[0] as ElementView
      expect(children).toBeInstanceOf(ElementView)
      expect(children.tag).toBe('span')
      expect(children.props?.className).toBe('inner')
      expect((children.children[0] as TextView).text).toBe('nested content')
    })

    it('应该正确处理空子节点', () => {
      const view = h('div')

      expect(view).toBeInstanceOf(ElementView)
      expect((view as ElementView).props).toBeNull()
    })

    it('应该正确处理 null 子节点', () => {
      const view = h('div', null, null)

      expect(view.children.length).toBe(0)
    })

    it('应该正确处理 undefined 子节点', () => {
      const view = h('div', null, undefined)

      expect(view.children.length).toBe(0)
    })
  })
})
