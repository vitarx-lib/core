import { beforeEach, describe, expect, it } from 'vitest'
import { createVNode, FragmentController, NodeState, TEXT_NODE_TYPE } from '../../src/index.js'
import type { FragmentVNode } from '../../src/index.js'

describe('FragmentController', () => {
  let controller: FragmentController

  beforeEach(() => {
    controller = new FragmentController()
  })

  // 辅助函数：创建容器
  const createContainer = (): HTMLDivElement => document.createElement('div')

  // 辅助函数：创建文本节点
  const createTextVNode = (value: string) => createVNode(TEXT_NODE_TYPE, { value })

  // 辅助函数：创建并渲染 Fragment
  const createAndRenderFragment = (props?: any): FragmentVNode => {
    const vnode = createVNode('fragment', props || {})
    controller.render(vnode)
    return vnode as FragmentVNode
  }

  // 辅助函数：创建、渲染并挂载 Fragment
  const setupFragment = (props?: any): { vnode: FragmentVNode; container: HTMLDivElement } => {
    const vnode = createAndRenderFragment(props)
    const container = createContainer()
    controller.mount(vnode, container)
    return { vnode, container }
  }

  describe('render', () => {
    it('应该创建 Fragment 元素', () => {
      const vnode = createVNode('fragment', {})
      const el = controller.render(vnode)

      expect(el).toBeDefined()
      expect(el.nodeType).toBe(Node.DOCUMENT_FRAGMENT_NODE)
    })

    it('应该设置节点状态为 Rendered', () => {
      const vnode = createVNode('fragment', {})
      controller.render(vnode)

      expect(vnode.state).toBe(NodeState.Rendered)
    })

    it('应该将元素存储在 vnode.el 中', () => {
      const vnode = createVNode('fragment', {})
      const el = controller.render(vnode)

      expect(vnode.el).toBe(el)
    })

    it('应该渲染空 Fragment', () => {
      const vnode = createVNode('fragment', {})
      const el = controller.render(vnode)

      expect(el.childNodes.length).toBe(0)
    })

    it('应该渲染包含单个子节点的 Fragment', () => {
      const child = createVNode(TEXT_NODE_TYPE, { value: 'Hello' })
      const vnode = createVNode('fragment', { children: [child] })
      const el = controller.render(vnode)

      expect(el.childNodes.length).toBe(1)
      expect(el.textContent).toBe('Hello')
    })

    it('应该渲染包含多个子节点的 Fragment', () => {
      const children = [
        createVNode(TEXT_NODE_TYPE, { value: 'Hello' }),
        createVNode(TEXT_NODE_TYPE, { value: ' ' }),
        createVNode(TEXT_NODE_TYPE, { value: 'World' })
      ]
      const vnode = createVNode('fragment', { children })
      const el = controller.render(vnode)

      expect(el.childNodes.length).toBe(3)
      expect(el.textContent).toBe('Hello World')
    })

    it('应该渲染包含元素子节点的 Fragment', () => {
      const children = [createVNode('div', { id: 'a' }), createVNode('span', { id: 'b' })]
      const vnode = createVNode('fragment', { children })
      const el = controller.render(vnode)

      expect(el.childNodes.length).toBe(2)
      expect((el.childNodes[0] as HTMLElement).tagName).toBe('DIV')
      expect((el.childNodes[1] as HTMLElement).tagName).toBe('SPAN')
    })

    it('应该渲染嵌套的 Fragment', () => {
      const nested = createVNode('fragment', {
        children: [createVNode(TEXT_NODE_TYPE, { value: 'nested' })]
      })
      const vnode = createVNode('fragment', {
        children: [createVNode(TEXT_NODE_TYPE, { value: 'outer' }), nested]
      })
      const el = controller.render(vnode)

      expect(el.textContent).toContain('outer')
      expect(el.textContent).toContain('nested')
    })
  })

  describe('mount', () => {
    it('应该将 Fragment 子节点挂载到容器', () => {
      const children = [
        createVNode('span', { children: 'Hello' }),
        createVNode('span', { children: 'World' })
      ]
      const { container } = setupFragment({ children })

      expect(container.children.length).toBe(2)
      expect(container.textContent).toBe('HelloWorld')
    })

    it('应该设置节点状态为 Activated', () => {
      const { vnode } = setupFragment()
      expect(vnode.state).toBe(NodeState.Activated)
    })

    it('应该挂载空 Fragment', () => {
      const { container } = setupFragment()
      expect(container.textContent.length).toBe(0)
    })
  })

  describe('updateProps', () => {
    it('应该对 Fragment 不执行任何属性更新', () => {
      const vnode = createAndRenderFragment()

      // Fragment 的 updateProps 不应抛出错误
      expect(() => {
        controller.updateProps(vnode, { key: 'value' })
      }).not.toThrow()
    })

    it('应该保持原有属性不变', () => {
      const vnode = createAndRenderFragment()

      const originalProps = vnode.props
      controller.updateProps(vnode, { key: 'value' })

      expect(vnode.props).toBe(originalProps)
    })
  })

  describe('unmount', () => {
    it('应该卸载 Fragment 的所有子节点', () => {
      const children = [
        createVNode('span', { children: 'Hello' }),
        createVNode('span', { children: 'World' })
      ]
      const { vnode, container } = setupFragment({ children })

      // 片段元素，有一个开始占位节点，一个结束占位节点，两个span元素，children长度仅包含元素，不包含节点
      expect(container.children.length).toBe(2)

      controller.unmount(vnode)

      expect(container.childNodes.length).toBe(0)
    })

    it('应该设置节点状态为 Unmounted', () => {
      const { vnode } = setupFragment()

      controller.unmount(vnode)

      expect(vnode.state).toBe(NodeState.Unmounted)
    })

    it('应该清除 el 引用', () => {
      const { vnode } = setupFragment()

      controller.unmount(vnode)

      expect(vnode.el).toBeUndefined()
    })

    it('应该卸载空 Fragment', () => {
      const { vnode } = setupFragment()

      expect(() => {
        controller.unmount(vnode)
      }).not.toThrow()

      expect(vnode.state).toBe(NodeState.Unmounted)
    })
  })

  describe('activate', () => {
    it('应该激活已停用的 Fragment', () => {
      const { vnode: fragmentNode, container } = setupFragment({ children: 'Test' })
      
      controller.deactivate(fragmentNode, true)
      expect(container.textContent).toBe('')
      expect(fragmentNode.state).toBe(NodeState.Deactivated)

      controller.activate(fragmentNode, true)
      expect(container.textContent).toBe('Test')
      expect(fragmentNode.state).toBe(NodeState.Activated)
    })
  })

  describe('deactivate', () => {
    it('应该停用 Fragment', () => {
      const { vnode } = setupFragment({
        children: [createTextVNode('Test')]
      })

      controller.deactivate(vnode, true)

      expect(vnode.state).toBe(NodeState.Deactivated)
    })

    it('应该创建锆点注释节点', () => {
      const { vnode } = setupFragment({
        children: [createTextVNode('Test')]
      })

      controller.deactivate(vnode, true)

      expect(vnode.anchor).toBeDefined()
      expect(vnode.anchor!.nodeType).toBe(Node.COMMENT_NODE)
    })
  })
})
