import { ref } from '@vitarx/responsive'
import { beforeEach, describe, expect, it } from 'vitest'
import {
  createVNode,
  defineStatelessWidget,
  NodeState,
  StatefulWidgetController,
  StatelessWidgetController,
  Widget
} from '../../src/index.js'

// 测试用有状态 Widget
class TestStatefulWidget extends Widget {
  build() {
    return createVNode('div', {}, 'test')
  }
}

// 测试用无状态 Widget
const TestStatelessWidget = defineStatelessWidget((props: { text?: string }) => {
  return createVNode('div', {}, props.text || 'test')
})

describe('StatefulWidgetController', () => {
  let controller: StatefulWidgetController

  beforeEach(() => {
    controller = new StatefulWidgetController()
  })

  describe('render', () => {
    it('应该渲染有状态 Widget', () => {
      const vnode = createVNode(TestStatefulWidget, {})
      const el = controller.render(vnode)

      expect(el).toBeDefined()
      expect((el as HTMLElement).tagName).toBe('DIV')
      expect(el.textContent).toBe('test')
    })

    it('应该设置节点状态为 Rendered', () => {
      const vnode = createVNode(TestStatefulWidget, {})
      controller.render(vnode)

      expect(vnode.state).toBe(NodeState.Rendered)
    })

    it('应该创建 runtime instance', () => {
      const vnode = createVNode(TestStatefulWidget, {})
      controller.render(vnode)

      expect(vnode.runtimeInstance).toBeDefined()
      expect(vnode.runtimeInstance?.instance).toBeInstanceOf(TestStatefulWidget)
    })
  })

  describe('mount', () => {
    it('应该挂载有状态 Widget', () => {
      const vnode = createVNode(TestStatefulWidget, {})
      controller.render(vnode)

      const container = document.createElement('div')
      controller.mount(vnode, container)

      expect(container.textContent).toBe('test')
      expect(vnode.state).toBe(NodeState.Activated)
    })
  })

  describe('updateProps', () => {
    it('应该更新 Widget 属性', () => {
      class PropWidget extends Widget<{ text: string }> {
        build() {
          return createVNode('div', {}, this.props.text)
        }
      }
      const vnode = createVNode<typeof PropWidget>(PropWidget, { text: 'Old' })
      controller.render(vnode)

      const container = document.createElement('div')
      controller.mount(vnode, container)

      expect(container.textContent).toBe('Old')

      controller.updateProps(vnode, { text: 'New' })

      expect(vnode.props.text).toBe('New')
      expect(container.textContent).toBe('New')
    })
  })

  describe('unmount', () => {
    it('应该卸载 Widget', () => {
      const vnode = createVNode(TestStatefulWidget, {})
      controller.render(vnode)

      const container = document.createElement('div')
      controller.mount(vnode, container)

      controller.unmount(vnode)

      expect(vnode.state).toBe(NodeState.Unmounted)
      expect(container.childNodes.length).toBe(0)
    })
  })

  describe('activate/deactivate', () => {
    it('应该激活和停用 Widget', () => {
      const vnode = createVNode(TestStatefulWidget, {})
      controller.render(vnode)

      const container = document.createElement('div')
      controller.mount(vnode, container)
      expect(vnode.state).toBe(NodeState.Activated)
      expect(vnode.anchor).toBeUndefined()
      expect(container.textContent).toBe('test')

      controller.deactivate(vnode, true)
      expect(vnode.state).toBe(NodeState.Deactivated)
      expect(vnode.anchor).toBeDefined()
      expect(container.textContent).toBe('')

      controller.activate(vnode, true)
      expect(vnode.state).toBe(NodeState.Activated)
      expect(vnode.anchor).toBeUndefined()
      expect(container.textContent).toBe('test')
    })
  })
})

describe('StatelessWidgetController', () => {
  let controller: StatelessWidgetController

  beforeEach(() => {
    controller = new StatelessWidgetController()
  })

  describe('render', () => {
    it('应该渲染无状态 Widget', () => {
      const vnode = createVNode(TestStatelessWidget, { text: 'Hello' })
      const el = controller.render(vnode)

      expect(el).toBeDefined()
      expect((el as HTMLElement).tagName).toBe('DIV')
      expect(el.textContent).toBe('Hello')
    })

    it('应该设置节点状态为 Rendered', () => {
      const vnode = createVNode(TestStatelessWidget, {})
      controller.render(vnode)

      expect(vnode.state).toBe(NodeState.Rendered)
    })

    it('应该绑定 ref 引用到 vnode', () => {
      const widgetRef = ref<any>(null)
      const vnode = createVNode(TestStatelessWidget, { ref: widgetRef })
      controller.render(vnode)

      expect(widgetRef.value).toBe(vnode)
    })
  })

  describe('mount', () => {
    it('应该挂载无状态 Widget', () => {
      const vnode = createVNode(TestStatelessWidget, { text: 'Content' })
      controller.render(vnode)

      const container = document.createElement('div')
      controller.mount(vnode, container)

      expect(container.textContent).toBe('Content')
      expect(vnode.state).toBe(NodeState.Activated)
    })
  })

  describe('updateProps', () => {
    it('应该在属性改变时触发更新', () => {
      const vnode = createVNode(TestStatelessWidget, { text: 'Old' })
      controller.render(vnode)

      const container = document.createElement('div')
      controller.mount(vnode, container)

      controller.updateProps(vnode, { text: 'New' })

      expect(container.textContent).toBe('New')
    })
  })

  describe('unmount', () => {
    it('应该卸载无状态 Widget', () => {
      const vnode = createVNode(TestStatelessWidget, {})
      controller.render(vnode)

      const container = document.createElement('div')
      controller.mount(vnode, container)

      controller.unmount(vnode)

      expect(vnode.state).toBe(NodeState.Unmounted)
      expect(container.childNodes.length).toBe(0)
    })

    it('应该清除 ref 引用', () => {
      const widgetRef = ref<any>(null)
      const vnode = createVNode(TestStatelessWidget, { ref: widgetRef })
      controller.render(vnode)

      const container = document.createElement('div')
      controller.mount(vnode, container)

      expect(widgetRef.value).not.toBeNull()

      controller.unmount(vnode)

      expect(widgetRef.value).toBeNull()
    })
  })

  describe('activate/deactivate', () => {
    it('应该激活和停用无状态 Widget', () => {
      const vnode = createVNode(TestStatelessWidget, { text: 'test' })
      controller.render(vnode)

      const container = document.createElement('div')
      controller.mount(vnode, container)
      expect(vnode.state).toBe(NodeState.Activated)
      expect(vnode.anchor).toBeUndefined()
      expect(container.textContent).toBe('test')

      controller.deactivate(vnode, true)
      expect(vnode.state).toBe(NodeState.Deactivated)
      expect(vnode.anchor).toBeDefined()
      expect(container.textContent).toBe('')

      controller.activate(vnode, true)
      expect(vnode.state).toBe(NodeState.Activated)
      expect(vnode.anchor).toBeUndefined()
      expect(container.textContent).toBe('test')
    })
  })
})
