import { createVNode, h, NodeKind, resolveDirective, withDirectives } from '@vitarx/runtime-core'
import { describe, expect, it } from 'vitest'
import {
  applyShowDirective,
  inheritShowDirective,
  serializeVNodeToSink
} from '../../src/shared/index.js'
import { StringSink } from '../../src/shared/sink.js'

const showDirective = resolveDirective('show')!
describe('applyShowDirective', () => {
  it('should apply display:none when v-show is false', () => {
    const node = createVNode('div', {})
    withDirectives(node, [[showDirective, false]])
    const props: Record<string, any> = {}

    applyShowDirective(node, props)

    expect(props.style).toBeDefined()
    expect(props.style.display).toBe('none')
  })

  it('should not modify props when v-show is true', () => {
    const node = createVNode('div', {})
    withDirectives(node, [[showDirective, true]])
    const props: Record<string, any> = {}

    applyShowDirective(node, props)

    expect(props.style).toBeUndefined()
  })

  it('should merge with existing style', () => {
    const node = createVNode('div', {})
    withDirectives(node, [[showDirective, false]])
    const props: Record<string, any> = { style: { color: 'red' } }

    applyShowDirective(node, props)

    expect(props.style.color).toBe('red')
    expect(props.style.display).toBe('none')
  })

  it('should do nothing when no v-show directive', () => {
    const node = createVNode('div', {})
    const props: Record<string, any> = {}

    applyShowDirective(node, props)

    expect(props.style).toBeUndefined()
  })
})

describe('inheritShowDirective', () => {
  it('should inherit v-show directive from parent to child', () => {
    const parent = createVNode('div', {})
    const child = createVNode('span', {})
    withDirectives(parent, [[showDirective, false]])

    inheritShowDirective(parent, child)

    expect(child.directives?.get('show')).toBeDefined()
    expect(child.directives?.get('show')![1]).toBe(false)
  })

  it('should do nothing when parent has no v-show', () => {
    const parent = createVNode('div', {})
    const child = createVNode('span', {})

    inheritShowDirective(parent, child)

    expect(child.directives?.get('show')).toBeUndefined()
  })
})

describe('serializeVNodeToSink', () => {
  it('should serialize regular element', () => {
    const node = h('div', { id: 'test' }, 'Hello')
    const sink = new StringSink()

    serializeVNodeToSink(node, sink)

    const html = sink.toString()
    expect(html).toContain('<div')
    expect(html).toContain('id="test"')
    expect(html).toContain('Hello')
    expect(html).toContain('</div>')
  })

  it('should serialize void element', () => {
    const node = createVNode('img', { src: 'test.jpg', alt: 'Test' })
    const sink = new StringSink()

    serializeVNodeToSink(node, sink)

    const html = sink.toString()
    expect(html).toContain('<img')
    expect(html).toContain('src="test.jpg"')
    expect(html).toContain('alt="Test"')
    expect(html).toContain('/>')
  })

  it('should serialize text node', () => {
    const node = { kind: NodeKind.TEXT, props: { text: 'Hello World' } } as any
    const sink = new StringSink()

    serializeVNodeToSink(node, sink)

    expect(sink.toString()).toBe('Hello World')
  })

  it('should escape text content', () => {
    const node = { kind: NodeKind.TEXT, props: { text: '<script>alert("xss")</script>' } } as any
    const sink = new StringSink()

    serializeVNodeToSink(node, sink)

    const html = sink.toString()
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
  })

  it('should serialize comment node', () => {
    const node = { kind: NodeKind.COMMENT, props: { text: 'This is a comment' } } as any
    const sink = new StringSink()

    serializeVNodeToSink(node, sink)

    expect(sink.toString()).toBe('<!--This is a comment-->')
  })

  it('should serialize fragment with markers', () => {
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

  it('should handle v-html directive', () => {
    const node = createVNode('div', { 'v-html': '<span>Raw HTML</span>' })
    const sink = new StringSink()

    serializeVNodeToSink(node, sink)

    const html = sink.toString()
    expect(html).toContain('<div')
    expect(html).toContain('<span>Raw HTML</span>')
    expect(html).toContain('</div>')
  })

  it('should apply v-show directive', () => {
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
