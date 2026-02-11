import {
  createCommentView,
  createFragmentView,
  createTextView,
  h,
  resolveDirective,
  withDirectives
} from '@vitarx/runtime-core'
import { describe, expect, it } from 'vitest'
import { resolveDirectiveProps, serializeViewToSink } from '../../src/shared/serialize.js'
import { StringSink } from '../../src/shared/sink.js'

const showDirective = resolveDirective('show')!
describe('resolveDirectiveProps', () => {
  it('当v-show为false时应该应用display:none', () => {
    const node = h('div')
    withDirectives(node, [[showDirective, { value: false }]])

    const props = resolveDirectiveProps(node, {})

    expect(props.style).toBeDefined()
    expect(props.style.display).toBe('none')
  })

  it('当v-show为true时不应该修改props', () => {
    const node = h('div')
    withDirectives(node, [[showDirective, { value: true }]])

    const props = resolveDirectiveProps(node, {})

    expect(props.style).toBeUndefined()
  })

  it('应该与现有样式合并', () => {
    const node = h('div')
    withDirectives(node, [[showDirective, { value: false }]])

    const props = resolveDirectiveProps(node, { style: { color: 'red' } })

    expect(props.style.color).toBe('red')
    expect(props.style.display).toBe('none')
  })

  it('当没有v-show指令时不应该做任何事情', () => {
    const node = h('div')

    const props = resolveDirectiveProps(node, {})

    expect(props.style).toBeUndefined()
  })
})

describe('serializeViewToSink', () => {
  it('应该序列化常规元素', async () => {
    const node = h('div', { id: 'test' }, 'Hello')
    const sink = new StringSink()

    await serializeViewToSink(node, sink)

    const html = sink.toString()
    expect(html).toContain('<div')
    expect(html).toContain('id="test"')
    expect(html).toContain('Hello')
    expect(html).toContain('</div>')
  })

  it('应该序列化空元素', async () => {
    const node = h('img', { src: 'test.jpg', alt: 'Test' })
    const sink = new StringSink()

    await serializeViewToSink(node, sink)

    const html = sink.toString()
    expect(html).toContain('<img')
    expect(html).toContain('src="test.jpg"')
    expect(html).toContain('alt="Test"')
    expect(html).toContain('/>')
  })

  it('应该序列化文本节点', async () => {
    const node = createTextView('Hello World')
    const sink = new StringSink()

    await serializeViewToSink(node, sink)

    expect(sink.toString()).toBe('Hello World')
  })

  it('应该转义文本内容', async () => {
    const node = createTextView('<script>alert("xss")</script>')
    const sink = new StringSink()

    await serializeViewToSink(node, sink)

    const html = sink.toString()
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
  })

  it('应该序列化注释节点', async () => {
    const node = createCommentView('This is a comment')
    const sink = new StringSink()

    await serializeViewToSink(node, sink)

    expect(sink.toString()).toBe('<!--This is a comment-->')
  })

  it('应该序列化带标记的片段', async () => {
    const node = createFragmentView([h('div', 'Child 1'), h('div', 'Child 2')])
    const sink = new StringSink()

    await serializeViewToSink(node, sink)

    const html = sink.toString()
    expect(html).toContain('<!--Fragment:start-->')
    expect(html).toContain('Child 1')
    expect(html).toContain('Child 2')
    expect(html).toContain('<!--Fragment:end-->')
  })

  it('应该处理v-html指令', async () => {
    const node = h('div', { 'v-html': '<span>Raw HTML</span>' })
    const sink = new StringSink()

    await serializeViewToSink(node, sink)

    const html = sink.toString()
    expect(html).toContain('<div')
    expect(html).toContain('<span>Raw HTML</span>')
    expect(html).toContain('</div>')
  })

  it('应该应用v-show指令', () => {
    const node = h('div', 'Content')
    withDirectives(node, [[showDirective, { value: false }]])
    const sink = new StringSink()

    serializeViewToSink(node, sink)

    const html = sink.toString()
    expect(html).toContain('style=')
    expect(html).toContain('display')
    expect(html).toContain('none')
  })
})
