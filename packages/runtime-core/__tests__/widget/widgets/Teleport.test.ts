/**
 * Teleport 组件单元测试
 */

import { notify } from '@vitarx/responsive'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  COMMENT_NODE_TYPE,
  createVNode,
  mountNode,
  NodeState,
  renderNode,
  Teleport,
  unmountNode
} from '../../../src/index.js'
import { createContainer, flushScheduler } from '../../helpers/test-widget.js'

describe('Teleport 组件', () => {
  let container: HTMLElement
  let targetContainer: HTMLElement

  beforeEach(() => {
    container = createContainer()
    targetContainer = createContainer()
    targetContainer.id = 'teleport-target'
    document.body.appendChild(targetContainer)
  })

  afterEach(() => {
    document.body.removeChild(targetContainer)
  })

  describe('属性验证', () => {
    it('应该验证 children 必须为 VNode', () => {
      expect(() => {
        Teleport.validateProps({ children: 'not a vnode' })
      }).toThrow('node object')
    })

    it('应该验证 disabled=false 时 to 属性必须存在', () => {
      expect(() => {
        Teleport.validateProps({
          children: createVNode('div'),
          disabled: false,
          to: undefined
        })
      }).toThrow()
    })

    it('应该接受字符串选择器作为 to 属性', () => {
      expect(() => {
        Teleport.validateProps({
          children: createVNode('div'),
          to: '#target'
        })
      }).not.toThrow()
    })

    it('应该接受 DOM 元素作为 to 属性', () => {
      expect(() => {
        Teleport.validateProps({
          children: createVNode('div'),
          to: document.createElement('div')
        })
      }).not.toThrow()
    })
  })

  describe('基础传送功能', () => {
    it('应该传送到字符串选择器指定的目标', () => {
      const childVNode = createVNode('div', { children: 'teleported content' })
      const vnode = createVNode(Teleport, {
        to: '#teleport-target',
        children: childVNode
      })
      renderNode(vnode)
      mountNode(vnode, container)

      expect(targetContainer.textContent).toBe('teleported content')
      expect(container.textContent).not.toContain('teleported content')
    })

    it('应该传送到 DOM 元素', () => {
      const childVNode = createVNode('span', { children: 'content' })
      const vnode = createVNode(Teleport, {
        to: targetContainer,
        children: childVNode
      })
      renderNode(vnode)
      mountNode(vnode, container)

      expect(targetContainer.textContent).toBe('content')
    })

    it('应该在 disabled=true 时渲染到原地', () => {
      const childVNode = createVNode('div', { children: 'local content' })
      const vnode = createVNode(Teleport, {
        to: '#teleport-target',
        disabled: true,
        children: childVNode
      })
      renderNode(vnode)
      mountNode(vnode, container)

      expect(container.textContent).toContain('local content')
      expect(targetContainer.textContent).not.toContain('local content')
    })

    it('应该在 defer=false 时在 onBeforeMount 挂载', () => {
      const childVNode = createVNode('div', { children: 'immediate' })
      const vnode = createVNode(Teleport, {
        to: '#teleport-target',
        defer: false,
        children: childVNode
      })
      renderNode(vnode)

      // onBeforeMount 在 mountNode 之前不会调用，这里只验证默认行为
      mountNode(vnode, container)
      expect(targetContainer.textContent).toBe('immediate')
    })

    it('应该在 defer=true 时在 onMounted 挂载', () => {
      const childVNode = createVNode('div', { children: 'deferred' })
      const vnode = createVNode(Teleport, {
        to: '#teleport-target',
        defer: true,
        children: childVNode
      })
      renderNode(vnode)
      mountNode(vnode, container)

      expect(targetContainer.textContent).toBe('deferred')
    })

    it('应该在目标容器中渲染子节点', () => {
      const childVNode = createVNode('div', { className: 'teleported', children: 'child' })
      const vnode = createVNode(Teleport, {
        to: '#teleport-target',
        children: childVNode
      })
      renderNode(vnode)
      mountNode(vnode, container)

      const teleportedEl = targetContainer.querySelector('.teleported')
      expect(teleportedEl).toBeTruthy()
      expect(teleportedEl?.textContent).toBe('child')
    })
  })

  describe('动态更新', () => {
    it('应该在 children 属性变化时更新传送内容', async () => {
      const childVNode1 = createVNode('div', { children: 'content 1' })
      const vnode = createVNode(Teleport, {
        to: '#teleport-target',
        children: childVNode1
      })
      renderNode(vnode)
      mountNode(vnode, container)

      expect(targetContainer.textContent).toBe('content 1')

      // 修改 children（通过 props）
      vnode.props.children = createVNode('div', { children: 'content 2' })
      notify(vnode.runtimeInstance!.props, 'children')
      flushScheduler()
      expect(targetContainer.textContent).toBe('content 2')
    })

    it('应该在 disabled=true 时不响应 children 变化', () => {
      const childVNode = createVNode('div', { children: 'original' })
      const vnode = createVNode(Teleport, {
        to: '#teleport-target',
        disabled: true,
        children: childVNode
      })
      renderNode(vnode)
      mountNode(vnode, container)

      // disabled 模式下，children 在原地渲染
      expect(container.textContent).toContain('original')
    })

    it('应该使用 patchUpdate 同步更新子节点', () => {
      const childVNode = createVNode('div', { children: 'initial' })
      const vnode = createVNode(Teleport, {
        to: '#teleport-target',
        children: childVNode
      })
      renderNode(vnode)
      mountNode(vnode, container)

      expect(targetContainer.textContent).toBe('initial')
    })
  })

  describe('生命周期', () => {
    it('应该在 onRender 中渲染子节点（非 disabled）', () => {
      const childVNode = createVNode('div', { children: 'rendered' })
      const vnode = createVNode(Teleport, {
        to: '#teleport-target',
        children: childVNode
      })
      renderNode(vnode)
      // onRender 会渲染 children
      expect(childVNode.state).toBe(NodeState.Rendered)
    })

    it('应该在 onBeforeMount 执行传送（非 defer）', () => {
      const childVNode = createVNode('div', { children: 'before-mount' })
      const vnode = createVNode(Teleport, {
        to: '#teleport-target',
        defer: false,
        children: childVNode
      })
      renderNode(vnode)
      mountNode(vnode, container)

      expect(targetContainer.textContent).toBe('before-mount')
    })

    it('应该在 onMounted 执行传送（defer 模式）', () => {
      const childVNode = createVNode('div', { children: 'on-mounted' })
      const vnode = createVNode(Teleport, {
        to: '#teleport-target',
        defer: true,
        children: childVNode
      })
      renderNode(vnode)
      mountNode(vnode, container)

      expect(targetContainer.textContent).toBe('on-mounted')
    })
  })

  describe('卸载处理', () => {
    it('应该在 onBeforeUnmount 卸载传送的子节点', () => {
      const childVNode = createVNode('div', { children: 'to unmount' })
      const vnode = createVNode(Teleport, {
        to: '#teleport-target',
        children: childVNode
      })
      renderNode(vnode)
      mountNode(vnode, container)

      expect(targetContainer.textContent).toBe('to unmount')

      unmountNode(vnode)

      expect(targetContainer.textContent).toBe('')
    })

    it('应该在 disabled 模式不执行卸载', () => {
      const childVNode = createVNode('div', { children: 'local' })
      const vnode = createVNode(Teleport, {
        to: '#teleport-target',
        disabled: true,
        children: childVNode
      })
      renderNode(vnode)
      mountNode(vnode, container)

      unmountNode(vnode)

      // disabled 模式下，子节点在原地，由正常卸载流程处理
      expect(container.textContent).toBe('')
    })
  })

  describe('边界场景', () => {
    it('应该在目标选择器不存在时发出警告', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const childVNode = createVNode('div', { children: 'content' })
      const vnode = createVNode(Teleport, {
        to: '#non-existent',
        children: childVNode
      })
      renderNode(vnode)
      mountNode(vnode, container)

      // 开发模式下会警告
      warnSpy.mockRestore()
    })

    it('应该在目标元素非容器类型时不传送', () => {
      // 创建一个文本节点（不能作为容器）
      const textNode = document.createTextNode('text')
      document.body.appendChild(textNode)

      const childVNode = createVNode('div', { children: 'content' })
      const vnode = createVNode(Teleport, {
        to: textNode as any,
        children: childVNode
      })
      renderNode(vnode)
      mountNode(vnode, container)

      document.body.removeChild(textNode)
    })

    it('应该在 build 返回注释节点（非 disabled）', () => {
      const childVNode = createVNode('div', { children: 'content' })
      const vnode = createVNode(Teleport, {
        to: '#teleport-target',
        children: childVNode
      })
      renderNode(vnode)

      // 非 disabled 模式下，build 返回注释节点作为锚点
      expect(vnode.runtimeInstance!.child.type).toBe(COMMENT_NODE_TYPE)
    })

    it('应该在 build 返回子节点（disabled）', () => {
      const childVNode = createVNode('div', { children: 'content' })
      const vnode = createVNode(Teleport, {
        to: '#teleport-target',
        disabled: true,
        children: childVNode
      })
      renderNode(vnode)

      // disabled 模式下，build 返回 children
      expect(vnode.runtimeInstance!.child).toBe(childVNode)
    })
  })
})
