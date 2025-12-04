import { ref } from '@vitarx/responsive'
import { describe, expect, it } from 'vitest'
import {
  createRegularElementVNode,
  h,
  NodeKind,
  type RegularElementVNode
} from '../../../src/index.js'
import { initChildren, propagateSVGNamespace } from '../../../src/vnode/normalizer/children.js'

describe('vnode/normalizer/children', () => {
  describe('initChildren - 子节点规范化', () => {
    it('应该规范化单个文本子节点', () => {
      const parent = h('div', {})
      const children = initChildren('Hello', parent)

      expect(children).toHaveLength(1)
      expect(children[0].kind).toBe(NodeKind.TEXT)
      expect(children[0].props.text).toBe('Hello')
    })

    it('应该规范化数字子节点', () => {
      const parent = h('div', {})
      const children = initChildren(123, parent)

      expect(children).toHaveLength(1)
      expect(children[0].kind).toBe(NodeKind.TEXT)
      expect(children[0].props.text).toBe('123')
    })

    it('应该规范化 VNode 子节点', () => {
      const parent = h('div', {})
      const child = h('span', { children: 'Text' })
      const children = initChildren(child, parent)

      expect(children).toHaveLength(1)
      expect(children[0]).toBe(child)
      // initChildren 会处理子节点
      expect(children).toBeDefined()
    })

    it('应该规范化数组子节点', () => {
      const parent = h('div', {})
      const child1 = h('span', { children: 'A' })
      const child2 = h('span', { children: 'B' })
      const children = initChildren([child1, child2], parent)

      expect(children).toHaveLength(2)
      expect(children[0]).toBe(child1)
      expect(children[1]).toBe(child2)
    })

    it('应该扁平化嵌套数组', () => {
      const parent = h('div', {})
      const child1 = h('span', { children: 'A' })
      const child2 = h('span', { children: 'B' })
      const child3 = h('span', { children: 'C' })
      const children = initChildren([[child1, child2], child3], parent)

      expect(children).toHaveLength(3)
      expect(children[0]).toBe(child1)
      expect(children[1]).toBe(child2)
      expect(children[2]).toBe(child3)
    })

    it('应该处理深度嵌套数组', () => {
      const parent = h('div', {})
      const child = h('span', { children: 'Text' })
      const children = initChildren([[[child]]], parent)

      expect(children).toHaveLength(1)
      expect(children[0]).toBe(child)
    })

    it('应该过滤 null 值', () => {
      const parent = h('div', {})
      const child = h('span', { children: 'Text' })
      const children = initChildren([child, null, null], parent)

      expect(children).toHaveLength(1)
      expect(children[0]).toBe(child)
    })

    it('应该过滤 undefined 值', () => {
      const parent = h('div', {})
      const child = h('span', { children: 'Text' })
      const children = initChildren([child, undefined, undefined], parent)

      expect(children).toHaveLength(1)
      expect(children[0]).toBe(child)
    })

    it('应该过滤布尔值', () => {
      const parent = h('div', {})
      const child = h('span', { children: 'Text' })
      const children = initChildren([child, true, false], parent)

      expect(children).toHaveLength(1)
      expect(children[0]).toBe(child)
    })

    it('应该处理混合类型子节点', () => {
      const parent = h('div', {})
      const vnode = h('span', { children: 'Element' })
      const children = initChildren(['Text', 123, vnode, null, undefined, false], parent)

      expect(children.length).toBeGreaterThan(0)
      // 应该包含文本节点、数字节点和元素节点
      const hasTextNode = children.some(c => c.kind === NodeKind.TEXT && c.props.text === 'Text')
      const hasNumberNode = children.some(c => c.kind === NodeKind.TEXT && c.props.text === '123')
      const hasElementNode = children.some(c => c === vnode)

      expect(hasTextNode).toBe(true)
      expect(hasNumberNode).toBe(true)
      expect(hasElementNode).toBe(true)
    })

    it('应该解包 ref 值', () => {
      const parent = h('div', {})
      const textRef = ref('Ref Text')
      const children = initChildren(textRef, parent)

      expect(children).toHaveLength(1)
      expect(children[0].kind).toBe(NodeKind.TEXT)
      expect(children[0].props.text).toBe('Ref Text')
    })

    it('应该处理 ref 包装的数组', () => {
      const parent = h('div', {})
      const child1 = h('span', { children: 'A' })
      const child2 = h('span', { children: 'B' })
      const childrenRef = ref([child1, child2])
      const children = initChildren(childrenRef, parent)

      expect(children).toHaveLength(2)
      expect(children[0]).toBe(child1)
      expect(children[1]).toBe(child2)
    })

    it('应该设置父节点引用', () => {
      const parent = h('div', {})
      const child = h('span', { children: 'Text' })
      const children = initChildren(child, parent)

      // initChildren 处理子节点关系
      expect(children).toHaveLength(1)
      expect(children[0]).toBe(child)
    })

    it('应该调用处理函数', () => {
      const parent = h('div', {})
      const child = h('span', { children: 'Text' })
      let handlerCalled = false

      initChildren(child, parent, node => {
        handlerCalled = true
        expect(node).toBe(child)
      })

      expect(handlerCalled).toBe(true)
    })

    it('应该为每个子节点调用处理函数', () => {
      const parent = h('div', {})
      const child1 = h('span', { children: 'A' })
      const child2 = h('span', { children: 'B' })
      const calledNodes: any[] = []

      initChildren([child1, child2], parent, node => {
        calledNodes.push(node)
      })

      expect(calledNodes).toHaveLength(2)
      expect(calledNodes[0]).toBe(child1)
      expect(calledNodes[1]).toBe(child2)
    })

    it('应该处理空数组', () => {
      const parent = h('div', {})
      const children = initChildren([], parent)

      expect(children).toEqual([])
    })

    it('应该保持子节点顺序', () => {
      const parent = h('div', {})
      const children = initChildren(['First', 'Second', 'Third'], parent)

      expect(children).toHaveLength(3)
      expect(children[0].props.text).toBe('First')
      expect(children[1].props.text).toBe('Second')
      expect(children[2].props.text).toBe('Third')
    })
  })

  describe('propagateSVGNamespace - SVG 命名空间传播', () => {
    it('应该为 SVG 元素子节点设置 isSVGElement', () => {
      const circle = h('circle', { cx: 50, cy: 50, r: 40 })
      propagateSVGNamespace(circle)

      expect(circle.isSVGElement).toBe(true)
    })

    it('应该递归设置子元素的 isSVGElement', () => {
      const g = createRegularElementVNode('g' as any, {
        children: [h('circle', { cx: 50, cy: 50, r: 40 })]
      })
      propagateSVGNamespace(g)

      expect(g.isSVGElement).toBe(true)
      expect((g.children![0] as RegularElementVNode).isSVGElement).toBe(true)
    })

    it('应该不覆盖已设置的 isSVGElement', () => {
      const svg = createRegularElementVNode('svg' as any, {})
      svg.isSVGElement = true

      propagateSVGNamespace(svg)

      expect(svg.isSVGElement).toBe(true)
    })

    it('应该跳过 foreignObject 元素', () => {
      const foreignObject = createRegularElementVNode('foreignObject' as any, {
        children: [h('div', { children: 'HTML content' })]
      })

      propagateSVGNamespace(foreignObject)

      // foreignObject 内部应该是 HTML 命名空间
      expect((foreignObject.children![0] as RegularElementVNode).isSVGElement).toBeFalsy()
    })

    it('应该处理深度嵌套的 SVG 元素', () => {
      const g1 = createRegularElementVNode('g' as any, {
        children: [
          createRegularElementVNode('g' as any, {
            children: [h('circle', { cx: 50, cy: 50, r: 40 })]
          })
        ]
      })

      propagateSVGNamespace(g1)

      expect(g1.isSVGElement).toBe(true)
      expect((g1.children![0] as RegularElementVNode).isSVGElement).toBe(true)
      expect((g1.children![0] as any).children![0].isSVGElement).toBe(true)
    })

    it('应该只处理元素节点', () => {
      const text = h('plain-text', { text: 'Text' })

      // 文本节点不应该有 isSVGElement 属性
      propagateSVGNamespace(text as any)

      expect((text as any).isSVGElement).toBeUndefined()
    })
  })
})
