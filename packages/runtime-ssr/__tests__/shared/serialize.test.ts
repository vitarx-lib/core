import { createVNode, h, NodeKind, resolveDirective, withDirectives } from '@vitarx/runtime-core'
import { describe, expect, it } from 'vitest'
import {
  inheritShowDirective,
  resolveDirectiveProps,
  serializeVNodeToSink
} from '../../src/shared/serialize.js'
import { StringSink } from '../../src/shared/sink.js'

const showDirective = resolveDirective('show')!
describe('applyShowDirective', () => {
  it('当v-show为false时应该应用display:none', () => {
    const node = createVNode('div', {})
    withDirectives(node, [[showDirective, false]])
    const props: Record<string, any> = {}

    resolveDirectiveProps(node, props)

    expect(props.style).toBeDefined()
    expect(props.style.display).toBe('none')
  })

  it('当v-show为true时不应该修改props', () => {
    const node = createVNode('div', {})
    withDirectives(node, [[showDirective, true]])
    const props: Record<string, any> = {}

    resolveDirectiveProps(node, props)

    expect(props.style).toBeUndefined()
  })

  it('应该与现有样式合并', () => {
    const node = createVNode('div', {})
    withDirectives(node, [[showDirective, false]])
    const props: Record<string, any> = { style: { color: 'red' } }

    resolveDirectiveProps(node, props)

    expect(props.style.color).toBe('red')
    expect(props.style.display).toBe('none')
  })

  it('当没有v-show指令时不应该做任何事情', () => {
    const node = createVNode('div', {})
    const props: Record<string, any> = {}

    resolveDirectiveProps(node, props)

    expect(props.style).toBeUndefined()
  })
})

describe('inheritShowDirective', () => {
  it('应该从父节点继承v-show指令到子节点', () => {
    const parent = createVNode('div', {})
    const child = createVNode('span', {})
    withDirectives(parent, [[showDirective, false]])

    inheritShowDirective(parent, child)

    expect(child.directives?.get('show')).toBeDefined()
    expect(child.directives?.get('show')![1]).toBe(false)
  })

  it('当父节点没有v-show时不应该做任何事情', () => {
    const parent = createVNode('div', {})
    const child = createVNode('span', {})

    inheritShowDirective(parent, child)

    expect(child.directives?.get('show')).toBeUndefined()
  })
})

describe('serializeVNodeToSink', () => {
  it('应该序列化常规元素', () => {
    const node = h('div', { id: 'test' }, 'Hello')
    const sink = new StringSink()

    serializeVNodeToSink(node, sink)

    const html = sink.toString()
    expect(html).toContain('<div')
    expect(html).toContain('id="test"')
    expect(html).toContain('Hello')
    expect(html).toContain('</div>')
  })

  it('应该序列化空元素', () => {
    const node = createVNode('img', { src: 'test.jpg', alt: 'Test' })
    const sink = new StringSink()

    serializeVNodeToSink(node, sink)

    const html = sink.toString()
    expect(html).toContain('<img')
    expect(html).toContain('src="test.jpg"')
    expect(html).toContain('alt="Test"')
    expect(html).toContain('/>')
  })

  it('应该序列化文本节点', () => {
    const node = { kind: NodeKind.TEXT, props: { text: 'Hello World' } } as any
    const sink = new StringSink()

    serializeVNodeToSink(node, sink)

    expect(sink.toString()).toBe('Hello World')
  })

  it('应该转义文本内容', () => {
    const node = { kind: NodeKind.TEXT, props: { text: '<script>alert("xss")</script>' } } as any
    const sink = new StringSink()

    serializeVNodeToSink(node, sink)

    const html = sink.toString()
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
  })

  it('应该序列化注释节点', () => {
    const node = { kind: NodeKind.COMMENT, props: { text: 'This is a comment' } } as any
    const sink = new StringSink()

    serializeVNodeToSink(node, sink)

    expect(sink.toString()).toBe('<!--This is a comment-->')
  })

  it('应该序列化带标记的片段', () => {
    const node = createVNode('fragment', {
      children: [h('div', {}, 'Child 1'), h('div', {}, 'Child 2')]
    })
    const sink = new StringSink()

    serializeVNodeToSink(node, sink)

    const html = sink.toString()
    expect(html).toContain('<!--Fragment start-->')
    expect(html).toContain('Child 1')
    expect(html).toContain('Child 2')
    expect(html).toContain('<!--Fragment end-->')
  })

  it('应该处理v-html指令', () => {
    const node = createVNode('div', { 'v-html': '<span>Raw HTML</span>' })
    const sink = new StringSink()

    serializeVNodeToSink(node, sink)

    const html = sink.toString()
    expect(html).toContain('<div')
    expect(html).toContain('<span>Raw HTML</span>')
    expect(html).toContain('</div>')
  })

  it('应该应用v-show指令', () => {
    const node = h('div', {}, 'Content')
    withDirectives(node, [[showDirective, false]])
    const sink = new StringSink()

    serializeVNodeToSink(node, sink)

    const html = sink.toString()
    expect(html).toContain('style=')
    expect(html).toContain('display')
    expect(html).toContain('none')
  })
})
