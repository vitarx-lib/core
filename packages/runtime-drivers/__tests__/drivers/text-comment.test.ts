import { createCommentVNode, createTextVNode, NodeState } from '@vitarx/runtime-core'
import { beforeEach, describe, expect, it } from 'vitest'
import { CommentDriver, TextDriver } from '../../src/index.js'

describe('TextDriver', () => {
  let controller: TextDriver

  beforeEach(() => {
    controller = new TextDriver()
  })

  describe('render', () => {
    it('应该创建文本节点元素', () => {
      const vnode = createTextVNode({ text: 'Hello' })
      controller.render(vnode)
      const el = vnode.el!
      expect(el).toBeDefined()
      expect(el.nodeType).toBe(Node.TEXT_NODE)
      expect(el.textContent).toBe('Hello')
    })

    it('应该设置节点状态为 Rendered', () => {
      const vnode = createTextVNode({ text: 'Test' })
      controller.render(vnode)

      expect(vnode.state).toBe(NodeState.Rendered)
    })

    it('应该将元素存储在 vnode.el 中', () => {
      const vnode = createTextVNode({ text: 'Test' })
      controller.render(vnode)
      const el = vnode.el!
      expect(vnode.el).toBe(el)
    })

    it('应该处理空字符串', () => {
      const vnode = createTextVNode({ text: '' })
      controller.render(vnode)
      const el = vnode.el!
      expect(el.textContent).toBe('')
    })

    it('应该处理特殊字符', () => {
      const vnode = createTextVNode({ text: '<>&"\'test' })
      controller.render(vnode)
      const el = vnode.el!
      expect(el.textContent).toBe('<>&"\'test')
    })
  })

  describe('mount', () => {
    it('应该将文本节点挂载到容器', () => {
      const vnode = createTextVNode({ text: 'Hello' })
      controller.render(vnode)

      const container = document.createElement('div')
      controller.mount(vnode, container)

      expect(container.childNodes.length).toBe(1)
      expect(container.textContent).toBe('Hello')
    })

    it('应该设置节点状态为 Activated', () => {
      const vnode = createTextVNode({ text: 'Test' })
      controller.render(vnode)

      const container = document.createElement('div')
      controller.mount(vnode, container)

      expect(vnode.state).toBe(NodeState.Activated)
    })
  })

  describe('updateProps', () => {
    it('应该更新文本内容', () => {
      const vnode = createTextVNode({ text: 'Hello' })
      controller.render(vnode)

      controller.updateProps(vnode, { text: 'World' })

      expect(vnode.props.text).toBe('World')
      expect(vnode.el!.textContent).toBe('World')
    })

    it('应该更新为空字符串', () => {
      const vnode = createTextVNode({ text: 'Hello' })
      controller.render(vnode)

      controller.updateProps(vnode, { text: '' })

      expect(vnode.props.text).toBe('')
      expect(vnode.el!.textContent).toBe('')
    })

    it('应该在值未改变时不做更新', () => {
      const vnode = createTextVNode({ text: 'Hello' })
      controller.render(vnode)
      const el = vnode.el

      controller.updateProps(vnode, { text: 'Hello' })

      expect(vnode.el).toBe(el)
    })
  })

  describe('unmount', () => {
    it('应该从 DOM 中移除文本节点', () => {
      const vnode = createTextVNode({ text: 'Hello' })
      controller.render(vnode)

      const container = document.createElement('div')
      controller.mount(vnode, container)

      expect(container.childNodes.length).toBe(1)

      controller.unmount(vnode)

      expect(container.childNodes.length).toBe(0)
    })

    it('应该设置节点状态为 Unmounted', () => {
      const vnode = createTextVNode({ text: 'Test' })
      controller.render(vnode)

      const container = document.createElement('div')
      controller.mount(vnode, container)

      controller.unmount(vnode)

      expect(vnode.state).toBe(NodeState.Unmounted)
    })

    it('应该清除 el 引用', () => {
      const vnode = createTextVNode({ text: 'Test' })
      controller.render(vnode)

      const container = document.createElement('div')
      controller.mount(vnode, container)

      controller.unmount(vnode)

      expect(vnode.el).toBeUndefined()
    })
  })
})

describe('CommentController', () => {
  let controller: CommentDriver

  beforeEach(() => {
    controller = new CommentDriver()
  })

  describe('render', () => {
    it('应该创建注释节点元素', () => {
      const vnode = createCommentVNode({ text: 'comment text' })
      controller.render(vnode)
      const el = vnode.el!
      expect(el).toBeDefined()
      expect(el.nodeType).toBe(Node.COMMENT_NODE)
      expect(el.textContent).toBe('comment text')
    })

    it('应该设置节点状态为 Rendered', () => {
      const vnode = createCommentVNode({ text: 'Test' })
      controller.render(vnode)

      expect(vnode.state).toBe(NodeState.Rendered)
    })

    it('应该将元素存储在 vnode.el 中', () => {
      const vnode = createCommentVNode({ text: 'Test' })
      controller.render(vnode)
      const el = vnode.el!
      expect(vnode.el).toBe(el)
    })

    it('应该处理空注释', () => {
      const vnode = createCommentVNode({ text: '' })
      controller.render(vnode)
      const el = vnode.el!
      expect(el.textContent).toBe('')
    })
  })

  describe('mount', () => {
    it('应该将注释节点挂载到容器', () => {
      const vnode = createCommentVNode({ text: 'comment' })
      controller.render(vnode)

      const container = document.createElement('div')
      controller.mount(vnode, container)

      expect(container.childNodes.length).toBe(1)
      expect(container.childNodes[0].nodeType).toBe(Node.COMMENT_NODE)
    })

    it('应该设置节点状态为 Activated', () => {
      const vnode = createCommentVNode({ text: 'Test' })
      controller.render(vnode)

      const container = document.createElement('div')
      controller.mount(vnode, container)

      expect(vnode.state).toBe(NodeState.Activated)
    })
  })

  describe('updateProps', () => {
    it('应该更新注释内容', () => {
      const vnode = createCommentVNode({ text: 'old comment' })
      controller.render(vnode)

      controller.updateProps(vnode, { text: 'new comment' })

      expect(vnode.props.text).toBe('new comment')
      expect(vnode.el!.textContent).toBe('new comment')
    })

    it('应该在值未改变时不做更新', () => {
      const vnode = createCommentVNode({ text: 'comment' })
      controller.render(vnode)
      const el = vnode.el

      controller.updateProps(vnode, { text: 'comment' })

      expect(vnode.el).toBe(el)
    })
  })

  describe('unmount', () => {
    it('应该从 DOM 中移除注释节点', () => {
      const vnode = createCommentVNode({ text: 'comment' })
      controller.render(vnode)

      const container = document.createElement('div')
      controller.mount(vnode, container)

      expect(container.childNodes.length).toBe(1)

      controller.unmount(vnode)

      expect(container.childNodes.length).toBe(0)
    })

    it('应该设置节点状态为 Unmounted', () => {
      const vnode = createCommentVNode({ text: 'Test' })
      controller.render(vnode)

      const container = document.createElement('div')
      controller.mount(vnode, container)

      controller.unmount(vnode)

      expect(vnode.state).toBe(NodeState.Unmounted)
    })

    it('应该清除 el 引用', () => {
      const vnode = createCommentVNode({ text: 'Test' })
      controller.render(vnode)

      const container = document.createElement('div')
      controller.mount(vnode, container)

      controller.unmount(vnode)

      expect(vnode.el).toBeUndefined()
    })
  })
})
