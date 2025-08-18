import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  CommentVNode,
  createVNode,
  ElementVNode,
  FragmentVNode,
  getCurrentVNode,
  isVNode,
  markSimpleWidget,
  TextVNode,
  useCurrentVNode,
  WidgetVNode
} from '../src'

describe('createVNode', () => {
  it('当props中v-if为true时应该创建CommentVNode', () => {
    const vnode = createVNode('div', { 'v-if': true })
    expect(vnode).toBeInstanceOf(CommentVNode)
  })

  it('应该创建具有正确值的TextVNode', () => {
    const vnode = createVNode('text-node', { children: 'hello' })
    expect(vnode).toBeInstanceOf(TextVNode)
    expect((vnode as TextVNode).value).toBe('hello')
  })

  it('应该创建带有children数组的TextVNode', () => {
    const vnode = createVNode('text-node', { children: 'hello' })
    expect(vnode).toBeInstanceOf(TextVNode)
    expect((vnode as TextVNode).value).toBe('hello')
  })

  it('应该创建具有默认值的CommentVNode', () => {
    const vnode = createVNode('comment-node')
    expect(vnode).toBeInstanceOf(CommentVNode)
    expect((vnode as CommentVNode).value).toBe('')
  })

  it('应该创建FragmentVNode', () => {
    const vnode = createVNode('fragment-node', { children: ['hello'] })
    expect(vnode).toBeInstanceOf(FragmentVNode)
  })

  it('应该创建一个默认类型的ElementVNode', () => {
    const vnode = createVNode('div')
    expect(vnode).toBeInstanceOf(ElementVNode)
  })

  it('当props有子项时应该正确处理子项', () => {
    const vnode = createVNode('div', { children: 'existing' }, 'new') as ElementVNode
    expect(vnode).toBeInstanceOf(ElementVNode)
    expect(vnode.children).toHaveLength(2)
    expect(vnode.children[0]).toBeInstanceOf(TextVNode)
    expect(vnode.children[1]).toBeInstanceOf(TextVNode)
    expect((vnode.children[0] as TextVNode).value).toBe('existing')
    expect((vnode.children[1] as TextVNode).value).toBe('new')
  })

  it('对于非简单widget应该创建WidgetVNode', () => {
    const widgetType = vi.fn()
    const vnode = createVNode(widgetType, {})
    expect(vnode).toBeInstanceOf(WidgetVNode)
  })

  it('应该从简单widget创建VNode', () => {
    const simpleWidget = vi.fn(() => new ElementVNode('div'))
    const vnode = createVNode(markSimpleWidget(simpleWidget), {})
    expect(vnode).toBeInstanceOf(ElementVNode)
  })

  it('如果简单widget不返回VNode应该抛出错误', () => {
    const simpleWidget = vi.fn(() => 'ddd')
    expect(() => createVNode(markSimpleWidget(simpleWidget as any), {})).toThrow(
      'simple widget must return a VNode'
    )
  })

  it('应该处理null props', () => {
    const vnode = createVNode('div', null, 'child') as ElementVNode
    expect(vnode).toBeInstanceOf(ElementVNode)
    expect(vnode.children).toHaveLength(1)
    expect(vnode.children[0]).toBeInstanceOf(TextVNode)
    expect((vnode.children[0] as TextVNode).value).toBe('child')
  })
})

describe('getCurrentVNode / useCurrentVNode', () => {
  beforeEach(() => {
    vi.spyOn(WidgetVNode, 'getCurrentVNode').mockReturnValue(undefined)
  })

  it('当没有当前VNode时应该返回undefined', () => {
    expect(getCurrentVNode()).toBeUndefined()
  })

  it('应该是getCurrentVNode的别名', () => {
    expect(useCurrentVNode).toBe(getCurrentVNode)
  })

  it('当存在当前VNode时应该返回它', () => {
    const mockVNode = new WidgetVNode(vi.fn(), {})
    vi.spyOn(WidgetVNode, 'getCurrentVNode').mockReturnValue(mockVNode)
    expect(getCurrentVNode()).toBe(mockVNode)
  })
})

describe('isVNode', () => {
  it('对于VNode实例应该返回true', () => {
    expect(isVNode(new ElementVNode('div'))).toBe(true)
    expect(isVNode(new TextVNode('text'))).toBe(true)
    expect(isVNode(new CommentVNode('comment'))).toBe(true)
    expect(isVNode(new FragmentVNode({ children: ['1'] }))).toBe(true)
    expect(isVNode(new WidgetVNode(vi.fn(), {}))).toBe(true)
  })

  it('对于非VNode值应该返回false', () => {
    expect(isVNode(null)).toBe(false)
    expect(isVNode(undefined)).toBe(false)
    expect(isVNode('string')).toBe(false)
    expect(isVNode(123)).toBe(false)
    expect(isVNode({})).toBe(false)
    expect(isVNode([])).toBe(false)
  })
})
