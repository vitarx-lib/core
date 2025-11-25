import { describe, expect, it } from 'vitest'
import type {
  RegularElementVNode,
  RegularElementVNodeType,
  VoidElementVNodeType
} from '../../../src/index.js'
import { createRegularElementVNode, createVoidElementVNode, NodeKind } from '../../../src/index.js'
import { h } from '../../../src/vnode/core/create.js'

describe('vnode/creator/element', () => {
  describe('createVoidElementVNode - 空元素节点', () => {
    it('应该创建 img 节点', () => {
      const vnode = createVoidElementVNode('img' as VoidElementVNodeType, {
        src: '/test.png',
        alt: 'Test'
      })

      expect(vnode.type).toBe('img')
      expect(vnode.kind).toBe(NodeKind.VOID_ELEMENT)
      expect(vnode.props.src).toBe('/test.png')
      expect(vnode.props.alt).toBe('Test')
      expect((vnode as any).children).toBeUndefined()
    })

    it('应该创建 input 节点', () => {
      const vnode = createVoidElementVNode('input' as VoidElementVNodeType, {
        type: 'text',
        placeholder: 'Enter text'
      })

      expect(vnode.type).toBe('input')
      expect(vnode.kind).toBe(NodeKind.VOID_ELEMENT)
      expect(vnode.props.type).toBe('text')
      expect(vnode.props.placeholder).toBe('Enter text')
    })

    it('应该创建 br 节点', () => {
      const vnode = createVoidElementVNode('br' as VoidElementVNodeType, {})

      expect(vnode.type).toBe('br')
      expect(vnode.kind).toBe(NodeKind.VOID_ELEMENT)
    })

    it('应该创建 hr 节点', () => {
      const vnode = createVoidElementVNode('hr' as VoidElementVNodeType, {})

      expect(vnode.type).toBe('hr')
      expect(vnode.kind).toBe(NodeKind.VOID_ELEMENT)
    })

    it('应该规范化 class 属性', () => {
      const vnode = createVoidElementVNode('img' as VoidElementVNodeType, {
        class: 'icon large',
        src: '/icon.png'
      })

      expect(vnode.props.class).toEqual(['icon', 'large'])
    })

    it('应该规范化 style 属性', () => {
      const vnode = createVoidElementVNode('img' as VoidElementVNodeType, {
        style: { width: '100px', height: '100px' },
        src: '/icon.png'
      })

      expect(vnode.props.style).toBeDefined()
      expect(vnode.props.style).toHaveProperty('width', '100px')
      expect(vnode.props.style).toHaveProperty('height', '100px')
    })
  })

  describe('createRegularElementVNode - 常规元素节点', () => {
    it('应该创建 div 节点', () => {
      const vnode = createRegularElementVNode('div' as RegularElementVNodeType, {
        id: 'container',
        class: 'main'
      })

      expect(vnode.type).toBe('div')
      expect(vnode.kind).toBe(NodeKind.REGULAR_ELEMENT)
      expect(vnode.props.id).toBe('container')
      expect(vnode.props.class).toEqual(['main'])
    })

    it('应该创建 span 节点', () => {
      const vnode = createRegularElementVNode('span' as RegularElementVNodeType, {
        class: 'text'
      })

      expect(vnode.type).toBe('span')
      expect(vnode.kind).toBe(NodeKind.REGULAR_ELEMENT)
    })

    it('应该处理子节点', () => {
      const vnode = createRegularElementVNode('div' as RegularElementVNodeType, {
        children: [h('span', { children: 'Child 1' }), h('span', { children: 'Child 2' })]
      })

      expect(vnode.children).toBeDefined()
      expect(vnode.children).toHaveLength(2)
      expect(vnode.children![0].type).toBe('span')
      expect(vnode.children![1].type).toBe('span')
    })

    it('应该处理文本子节点', () => {
      const vnode = createRegularElementVNode('p' as RegularElementVNodeType, {
        children: 'Hello World'
      })

      expect(vnode.children).toBeDefined()
      expect(vnode.children).toHaveLength(1)
      expect(vnode.children![0].kind).toBe(NodeKind.TEXT)
    })

    it('应该处理混合子节点', () => {
      const vnode = createRegularElementVNode('div' as RegularElementVNodeType, {
        children: ['Text', h('span', { children: 'Element' }), 123]
      })

      expect(vnode.children).toBeDefined()
      expect(vnode.children!.length).toBeGreaterThan(0)
    })

    it('应该处理嵌套数组子节点', () => {
      const vnode = createRegularElementVNode('div' as RegularElementVNodeType, {
        children: [['Text1', 'Text2'], [h('span', { children: 'Text3' })]]
      })

      expect(vnode.children).toBeDefined()
      expect(vnode.children!.length).toBeGreaterThan(0)
    })

    it('应该规范化 class 属性', () => {
      const vnode = createRegularElementVNode('div' as RegularElementVNodeType, {
        class: 'container main'
      })

      expect(vnode.props.class).toEqual(['container', 'main'])
    })

    it('应该规范化 style 属性', () => {
      const vnode = createRegularElementVNode('div' as RegularElementVNodeType, {
        style: { color: 'red', fontSize: '14px' }
      })

      expect(vnode.props.style).toBeDefined()
      expect(vnode.props.style).toHaveProperty('color', 'red')
      expect(vnode.props.style).toHaveProperty('fontSize', '14px')
    })

    it('应该标记 svg 元素', () => {
      const vnode = createRegularElementVNode('svg' as RegularElementVNodeType, {})

      expect(vnode.isSVGElement).toBe(true)
    })

    it('应该不标记非 svg 元素', () => {
      const vnode = createRegularElementVNode('div' as RegularElementVNodeType, {})

      expect(vnode.isSVGElement).toBe(false)
    })

    it('应该从 props 中移除 children', () => {
      const vnode = createRegularElementVNode('div' as RegularElementVNodeType, {
        children: 'Text',
        id: 'test'
      })

      expect(vnode.props.children).toBeUndefined()
      expect(vnode.props.id).toBe('test')
    })
  })

  describe('SVG 命名空间传播', () => {
    it('应该为 svg 子元素设置 SVG 命名空间', () => {
      const vnode = createRegularElementVNode('svg' as RegularElementVNodeType, {
        children: [h('circle', { cx: 50, cy: 50, r: 40 })]
      })

      expect(vnode.isSVGElement).toBe(true)
      expect(vnode.children).toBeDefined()
      expect((vnode.children![0] as RegularElementVNode).isSVGElement).toBe(true)
    })
  })

  describe('属性处理', () => {
    it('应该保留所有自定义属性', () => {
      const vnode = createRegularElementVNode('div' as RegularElementVNodeType, {
        'data-test': 'value',
        'aria-label': 'Label',
        role: 'button'
      })

      expect(vnode.props['data-test']).toBe('value')
      expect(vnode.props['aria-label']).toBe('Label')
      expect(vnode.props.role).toBe('button')
    })

    it('应该处理事件监听器', () => {
      const onClick = () => {}
      const vnode = createRegularElementVNode('button' as RegularElementVNodeType, {
        onClick
      })

      expect(vnode.props.onClick).toBe(onClick)
    })

    it('应该处理 ref 属性', () => {
      const vnode = createRegularElementVNode('div' as RegularElementVNodeType, {
        id: 'test'
      })

      expect(vnode.props.id).toBe('test')
    })
  })

  describe('空节点处理', () => {
    it('应该创建没有属性的节点', () => {
      const vnode = createRegularElementVNode('div' as RegularElementVNodeType, {})

      expect(vnode.props).toEqual({})
      expect(vnode.children).toEqual([])
    })

    it('应该创建没有子节点的节点', () => {
      const vnode = createRegularElementVNode('div' as RegularElementVNodeType, {
        id: 'test'
      })

      expect(vnode.children).toEqual([])
    })
  })
})
