import { ref } from '@vitarx/responsive'
import {
  createVNode,
  NodeState,
  type RegularElementNodeType,
  type VoidElementNodeType
} from '@vitarx/runtime-core'
import { beforeEach, describe, expect, it } from 'vitest'
import { RegularElementDriver, VoidElementDriver } from '../../src/index.js'

describe('RegularElementDriver', () => {
  let controller: RegularElementDriver

  beforeEach(() => {
    controller = new RegularElementDriver()
    document.body.innerHTML = ''
  })

  describe('render', () => {
    it('应该创建 HTML 元素', () => {
      const vnode = createVNode('div', {})
      const el = controller.render(vnode)

      expect(el).toBeDefined()
      expect(el.tagName).toBe('DIV')
    })

    it('应该设置节点状态为 Rendered', () => {
      const vnode = createVNode('div', {})
      controller.render(vnode)

      expect(vnode.state).toBe(NodeState.Rendered)
    })

    it('应该将元素存储在 vnode.el 中', () => {
      const vnode = createVNode('div', {})
      const el = controller.render(vnode)

      expect(vnode.el).toBe(el)
    })

    it('应该创建不同类型的元素', () => {
      const types: RegularElementNodeType[] = ['div', 'span', 'p', 'section', 'article']

      types.forEach(type => {
        const vnode = createVNode(type, {})
        const el = controller.render(vnode)
        expect(el.tagName).toBe(type.toUpperCase())
      })
    })

    it('应该设置元素属性', () => {
      const vnode = createVNode('div', {
        id: 'test-id',
        className: ['container']
      })
      const el = controller.render(vnode) as HTMLElement

      expect(el.id).toBe('test-id')
      expect(el.className).toBe('container')
    })

    it('应该处理 ref 引用', () => {
      const elRef = ref<HTMLElement | null>(null)
      const vnode = createVNode('div', { ref: elRef })
      const el = controller.render(vnode)
      expect(elRef.value).toStrictEqual(el)
    })

    it('应该渲染子节点', () => {
      const vnode = createVNode('div', { children: 'Hello' })
      const el = document.body
      controller.render(vnode)
      controller.mount(vnode, document.body)
      expect(el.children.length).toBe(1)
      expect(el.textContent).toBe('Hello')
    })

    it('应该渲染多个子节点', () => {
      const vnode = createVNode('ul', {
        children: [
          createVNode('li', { children: 'Item 1' }),
          createVNode('li', { children: 'Item 2' }),
          createVNode('li', { children: 'Item 3' })
        ]
      })
      controller.render(vnode)
      controller.mount(vnode, document.body)
      const el = document.body.children[0]
      expect(el.children.length).toBe(3)
      expect(el.textContent).toBe('Item 1Item 2Item 3')
    })
  })

  describe('mount', () => {
    it('应该将元素挂载到容器', () => {
      const vnode = createVNode('div', {})
      controller.render(vnode)

      const container = document.createElement('div')
      controller.mount(vnode, container)

      expect(container.childNodes.length).toBe(1)
      expect(container.firstChild).toBe(vnode.el)
    })

    it('应该设置节点状态为 Activated', () => {
      const vnode = createVNode('div', {})
      controller.render(vnode)

      const container = document.createElement('div')
      controller.mount(vnode, container)

      expect(vnode.state).toBe(NodeState.Activated)
    })

    it('应该挂载包含子节点的元素', () => {
      const vnode = createVNode('div', { children: 'Child' })
      controller.render(vnode)

      const container = document.createElement('div')
      controller.mount(vnode, container)

      expect(container.textContent).toBe('Child')
    })
  })

  describe('updateProps', () => {
    it('应该更新元素属性', () => {
      const vnode = createVNode('div', { id: 'old' })
      controller.render(vnode)

      controller.updateProps(vnode, { id: 'new' })

      expect(vnode.props.id).toBe('new')
      expect((vnode.el as HTMLElement).id).toBe('new')
    })

    it('应该添加新属性', () => {
      const vnode = createVNode('div', {})
      controller.render(vnode)

      controller.updateProps(vnode, { id: 'test', title: 'Test Title' })

      expect((vnode.el as HTMLElement).id).toBe('test')
      expect((vnode.el as HTMLElement).title).toBe('Test Title')
    })

    it('应该删除不存在的属性', () => {
      const vnode = createVNode('div', { id: 'test', title: 'Title' })
      controller.render(vnode)

      controller.updateProps(vnode, { id: 'test' })

      expect((vnode.el as HTMLElement).id).toBe('test')
      expect((vnode.el as HTMLElement).title).toBe('')
    })

    it('应该更新 className', () => {
      const vnode = createVNode('div', { className: ['old'] })
      controller.render(vnode)

      controller.updateProps(vnode, { className: ['new'] })

      expect((vnode.el as HTMLElement).className).toBe('new')
    })

    it('应该不更新相同的属性值', () => {
      const vnode = createVNode('div', { id: 'test' })
      controller.render(vnode)
      const el = vnode.el

      controller.updateProps(vnode, { id: 'test' })

      expect(vnode.el).toBe(el)
      expect(vnode.props.id).toBe('test')
    })
  })

  describe('unmount', () => {
    it('应该从 DOM 中移除元素', () => {
      const vnode = createVNode('div', {})
      controller.render(vnode)

      const container = document.createElement('div')
      controller.mount(vnode, container)

      expect(container.childNodes.length).toBe(1)

      controller.unmount(vnode)

      expect(container.childNodes.length).toBe(0)
    })

    it('应该设置节点状态为 Unmounted', () => {
      const vnode = createVNode('div', {})
      controller.render(vnode)

      const container = document.createElement('div')
      controller.mount(vnode, container)

      controller.unmount(vnode)

      expect(vnode.state).toBe(NodeState.Unmounted)
    })

    it('应该清除 el 引用', () => {
      const vnode = createVNode('div', {})
      controller.render(vnode)

      const container = document.createElement('div')
      controller.mount(vnode, container)

      controller.unmount(vnode)

      expect(vnode.el).toBeUndefined()
    })

    it('应该清除 ref 引用', () => {
      const elRef = ref<HTMLElement | null>(null)
      const vnode = createVNode('div', { ref: elRef })
      controller.render(vnode)

      const container = document.createElement('div')
      controller.mount(vnode, container)

      expect(elRef.value).not.toBeNull()

      controller.unmount(vnode)

      expect(elRef.value).toBeNull()
    })

    it('应该卸载包含子节点的元素', () => {
      const vnode = createVNode('div', { children: 'Child' })
      controller.render(vnode)

      const container = document.createElement('div')
      controller.mount(vnode, container)

      expect(() => {
        controller.unmount(vnode)
      }).not.toThrow()

      expect(vnode.state).toBe(NodeState.Unmounted)
    })
  })

  describe('activate', () => {
    it('应该激活已停用的元素', () => {
      const vnode = createVNode('div', {})
      controller.render(vnode)

      const container = document.createElement('div')
      controller.mount(vnode, container)
      controller.deactivate(vnode, true)

      expect(vnode.state).toBe(NodeState.Deactivated)

      controller.activate(vnode, true)

      expect(vnode.state).toBe(NodeState.Activated)
    })
  })

  describe('deactivate', () => {
    it('应该停用元素', () => {
      const vnode = createVNode('div', {})
      controller.render(vnode)

      const container = document.createElement('div')
      controller.mount(vnode, container)

      controller.deactivate(vnode, true)

      expect(vnode.state).toBe(NodeState.Deactivated)
    })

    it('应该创建锚点注释节点', () => {
      const vnode = createVNode('div', {})
      controller.render(vnode)

      const container = document.createElement('div')
      controller.mount(vnode, container)

      controller.deactivate(vnode, true)

      expect(vnode.anchor).toBeDefined()
      expect(vnode.anchor!.nodeType).toBe(Node.COMMENT_NODE)
    })
  })
})

describe('VoidElementDriver', () => {
  let controller: VoidElementDriver

  beforeEach(() => {
    controller = new VoidElementDriver()
  })

  describe('render', () => {
    it('应该创建 void 元素', () => {
      const vnode = createVNode('input', {})
      const el = controller.render(vnode)

      expect(el).toBeDefined()
      expect(el.tagName).toBe('INPUT')
    })

    it('应该设置节点状态为 Rendered', () => {
      const vnode = createVNode('br', {})
      controller.render(vnode)

      expect(vnode.state).toBe(NodeState.Rendered)
    })

    it('应该创建不同类型的 void 元素', () => {
      const types: VoidElementNodeType[] = ['input', 'br', 'hr', 'img']

      types.forEach(type => {
        const vnode = createVNode(type)
        const el = controller.render(vnode)
        expect(el.tagName).toBe(type.toUpperCase())
      })
    })

    it('应该设置 void 元素属性', () => {
      const vnode = createVNode('input', {
        type: 'text',
        placeholder: 'Enter text'
      })
      const el = controller.render(vnode) as HTMLInputElement

      expect(el.type).toBe('text')
      expect(el.placeholder).toBe('Enter text')
    })

    it('应该处理 ref 引用', () => {
      const elRef = ref<HTMLElement | null>(null)
      const vnode = createVNode('input', { ref: elRef })
      const el = controller.render(vnode)

      expect(elRef.value).toStrictEqual(el)
    })

    it('应该创建 img 元素', () => {
      const vnode = createVNode('img', {
        src: 'test.jpg',
        alt: 'Test Image'
      })
      const el = controller.render(vnode) as HTMLImageElement

      expect(el.src).toContain('test.jpg')
      expect(el.alt).toBe('Test Image')
    })
  })

  describe('mount', () => {
    it('应该将 void 元素挂载到容器', () => {
      const vnode = createVNode('br', {})
      controller.render(vnode)

      const container = document.createElement('div')
      controller.mount(vnode, container)

      expect(container.childNodes.length).toBe(1)
      expect(container.firstChild).toBe(vnode.el)
    })

    it('应该设置节点状态为 Activated', () => {
      const vnode = createVNode('hr', {})
      controller.render(vnode)

      const container = document.createElement('div')
      controller.mount(vnode, container)

      expect(vnode.state).toBe(NodeState.Activated)
    })
  })

  describe('updateProps', () => {
    it('应该更新 void 元素属性', () => {
      const vnode = createVNode('input', { type: 'text' })
      controller.render(vnode)

      controller.updateProps(vnode, { type: 'password' })

      expect((vnode.el as HTMLInputElement).type).toBe('password')
    })

    it('应该添加新属性到 void 元素', () => {
      const vnode = createVNode('input', {})
      controller.render(vnode)

      controller.updateProps(vnode, { placeholder: 'New placeholder' })

      expect((vnode.el as HTMLInputElement).placeholder).toBe('New placeholder')
    })
  })

  describe('unmount', () => {
    it('应该从 DOM 中移除 void 元素', () => {
      const vnode = createVNode('br', {})
      controller.render(vnode)

      const container = document.createElement('div')
      controller.mount(vnode, container)

      expect(container.childNodes.length).toBe(1)

      controller.unmount(vnode)

      expect(container.childNodes.length).toBe(0)
    })

    it('应该设置节点状态为 Unmounted', () => {
      const vnode = createVNode('hr', {})
      controller.render(vnode)

      const container = document.createElement('div')
      controller.mount(vnode, container)

      controller.unmount(vnode)

      expect(vnode.state).toBe(NodeState.Unmounted)
    })

    it('应该清除 el 引用', () => {
      const vnode = createVNode('br', {})
      controller.render(vnode)

      const container = document.createElement('div')
      controller.mount(vnode, container)

      controller.unmount(vnode)

      expect(vnode.el).toBeUndefined()
    })
  })
})
