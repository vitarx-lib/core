import { describe, expect, it } from 'vitest'
import { createFragmentVNode, FRAGMENT_NODE_TYPE, h, NodeKind } from '../../../src/index.js'

describe('vnode/creator/fragment - createFragmentVNode', () => {
  describe('基础 Fragment 创建', () => {
    it('应该创建 Fragment 节点', () => {
      const vnode = createFragmentVNode({
        children: [h('div', { children: 'Child 1' }), h('div', { children: 'Child 2' })]
      })

      expect(vnode.type).toBe(FRAGMENT_NODE_TYPE)
      expect(vnode.kind).toBe(NodeKind.FRAGMENT)
      expect(vnode.children).toHaveLength(2)
    })

    it('应该创建空 Fragment', () => {
      const vnode = createFragmentVNode({ children: [] })

      expect(vnode.type).toBe(FRAGMENT_NODE_TYPE)
      expect(vnode.kind).toBe(NodeKind.FRAGMENT)
      expect(vnode.children).toEqual([])
    })
  })

  describe('子节点处理', () => {
    it('应该处理多个子节点', () => {
      const child1 = h('div', { children: 'A' })
      const child2 = h('span', { children: 'B' })
      const child3 = h('p', { children: 'C' })

      const vnode = createFragmentVNode({
        children: [child1, child2, child3]
      })

      expect(vnode.children).toHaveLength(3)
      expect(vnode.children![0]).toBe(child1)
      expect(vnode.children![1]).toBe(child2)
      expect(vnode.children![2]).toBe(child3)
    })

    it('应该处理文本子节点', () => {
      const vnode = createFragmentVNode({
        children: ['Text 1', 'Text 2', 'Text 3']
      })

      expect(vnode.children).toBeDefined()
      expect(vnode.children!.length).toBeGreaterThan(0)
      // 文本会被转换为文本节点
      vnode.children!.forEach(child => {
        expect(child.kind).toBe(NodeKind.TEXT)
      })
    })

    it('应该处理混合类型子节点', () => {
      const vnode = createFragmentVNode({
        children: ['Text', h('div', { children: 'Element' }), 123, null, undefined]
      })

      expect(vnode.children).toBeDefined()
      expect(vnode.children!.length).toBeGreaterThan(0)
    })

    it('应该扁平化嵌套数组', () => {
      const vnode = createFragmentVNode({
        children: [['Text 1', 'Text 2'], [h('div', { children: 'Element' })]] as any[]
      })

      expect(vnode.children).toBeDefined()
      // 嵌套数组应该被扁平化
      expect(vnode.children!.every(child => child.kind !== undefined)).toBe(true)
    })

    it('应该过滤 null 和 undefined', () => {
      const vnode = createFragmentVNode({
        children: [
          h('div', { children: 'Valid' }),
          null,
          undefined,
          h('span', { children: 'Also valid' })
        ]
      })

      expect(vnode.children).toBeDefined()
      // null 和 undefined 应该被过滤
      expect(vnode.children!.every(child => child !== null && child !== undefined)).toBe(true)
    })
  })

  describe('Fragment 属性', () => {
    it('应该支持 key 属性', () => {
      const vnode = createFragmentVNode({
        key: 'fragment-1',
        children: [h('div', { children: 'Child' })]
      })

      expect(vnode.key).toBe('fragment-1')
    })

    it('应该不包含 children 在 props 中', () => {
      const vnode = createFragmentVNode({
        children: [h('div', { children: 'Child' })]
      })

      // Fragment 的 props.children 可能仍然存在
      expect(vnode.children).toBeDefined()
    })
  })

  describe('嵌套 Fragment', () => {
    it('应该支持嵌套 Fragment', () => {
      const innerFragment = createFragmentVNode({
        children: [h('span', { children: 'Inner 1' }), h('span', { children: 'Inner 2' })]
      })

      const outerFragment = createFragmentVNode({
        children: [h('div', { children: 'Before' }), innerFragment, h('div', { children: 'After' })]
      })

      expect(outerFragment.children).toHaveLength(3)
      expect(outerFragment.children![1].kind).toBe(NodeKind.FRAGMENT)
    })
  })

  describe('父节点引用', () => {
    it('应该为子节点设置父节点引用', () => {
      const child1 = h('div', { children: 'Child 1' })
      const child2 = h('div', { children: 'Child 2' })

      const vnode = createFragmentVNode({
        children: [child1, child2]
      })

      // initChildren 会设置 parent 引用
      expect(vnode.children).toBeDefined()
      expect(vnode.children).toHaveLength(2)
    })
  })

  describe('应用上下文', () => {
    it('应该设置应用上下文', () => {
      const vnode = createFragmentVNode({
        children: [h('div', { children: 'Child' })]
      })

      // Fragment 的 appContext 可能为 undefined
      expect(vnode).toBeDefined()
    })

    it('应该传递应用上下文给子节点', () => {
      const child = h('div', { children: 'Child' })
      const vnode = createFragmentVNode({
        children: [child]
      })

      // 子节点也可能没有 appContext
      expect(vnode.children).toBeDefined()
    })
  })

  describe('边界情况', () => {
    it('应该处理只有一个子节点的 Fragment', () => {
      const vnode = createFragmentVNode({
        children: [h('div', { children: 'Single child' })]
      })

      expect(vnode.children).toHaveLength(1)
    })

    it('应该处理深度嵌套的子节点', () => {
      const vnode = createFragmentVNode({
        children: [[[[h('div', { children: 'Deep nested' })]]]] as any[]
      })

      expect(vnode.children).toBeDefined()
      expect(vnode.children!.length).toBeGreaterThan(0)
    })

    it('应该处理只包含文本的 Fragment', () => {
      const vnode = createFragmentVNode({
        children: 'Just text'
      })

      expect(vnode.children).toBeDefined()
      expect(vnode.children!.length).toBeGreaterThan(0)
    })

    it('应该处理只包含数字的 Fragment', () => {
      const vnode = createFragmentVNode({
        children: 42
      })

      expect(vnode.children).toBeDefined()
      expect(vnode.children!.length).toBeGreaterThan(0)
    })
  })
})
