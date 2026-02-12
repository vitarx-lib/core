import { ViewKind } from '@vitarx/runtime-core'
import { describe, expect, it } from 'vitest'
import { getFirstNode } from '../../src/client/utils.js'

describe('getFirstNode', () => {
  it('应该在容器为空时返回null', () => {
    const container = document.createElement('div')

    const result = getFirstNode(container, 0)

    expect(result).toBeNull()
  })

  it('应该获取常规元素节点', () => {
    const container = document.createElement('div')
    const child = document.createElement('span')
    child.id = 'test'
    container.appendChild(child)

    const result = getFirstNode(container, 0)

    expect(result).not.toBeNull()
    expect(result!.kind).toBe(ViewKind.ELEMENT)
    expect(result!.tag).toBe('span')
    expect(result!.el).toBe(child)
    expect(result!.nextIndex).toBe(1)
  })

  it('应该获取空元素节点', () => {
    const container = document.createElement('div')
    const img = document.createElement('img')
    container.appendChild(img)

    const result = getFirstNode(container, 0)

    expect(result).not.toBeNull()
    expect(result!.kind).toBe(ViewKind.ELEMENT)
    expect(result!.tag).toBe('img')
    expect(result!.el).toBe(img)
  })

  it('应该获取文本节点', () => {
    const container = document.createElement('div')
    const text = document.createTextNode('Hello')
    container.appendChild(text)

    const result = getFirstNode(container, 0)

    expect(result).not.toBeNull()
    expect(result!.kind).toBe(ViewKind.TEXT)
    expect(result!.el).toBe(text)
  })

  it('应该获取注释节点', () => {
    const container = document.createElement('div')
    const comment = document.createComment('comment')
    container.appendChild(comment)

    const result = getFirstNode(container, 0)

    expect(result).not.toBeNull()
    expect(result!.kind).toBe(ViewKind.COMMENT)
    expect(result!.el).toBe(comment)
  })

  it('应该将片段节点作为数组获取', () => {
    const container = document.createElement('div')

    // 添加 Fragment start 注释
    const startComment = document.createComment('Fragment:start')
    container.appendChild(startComment)

    // 添加 Fragment 内容
    const span1 = document.createElement('span')
    span1.textContent = 'A'
    container.appendChild(span1)

    const span2 = document.createElement('span')
    span2.textContent = 'B'
    container.appendChild(span2)

    // 添加 Fragment end 注释
    const endComment = document.createComment('Fragment:end')
    container.appendChild(endComment)

    const result = getFirstNode(container, 0)

    expect(result).not.toBeNull()
    expect(result!.kind).toBe(ViewKind.FRAGMENT)
    expect(result!.tag).toBe('fragment-node')
    expect(Array.isArray(result!.el)).toBe(true)
    expect((result!.el as any[]).length).toBe(4) // start + 2 spans + end
    expect(result!.nextIndex).toBe(4) // Fragment end 的 index + 1
  })

  it('应该获取指定索引的节点', () => {
    const container = document.createElement('div')

    const span1 = document.createElement('span')
    span1.id = 'first'
    container.appendChild(span1)

    const span2 = document.createElement('span')
    span2.id = 'second'
    container.appendChild(span2)

    const result = getFirstNode(container, 1)

    expect(result).not.toBeNull()
    expect(result!.el).toBe(span2)
    expect((result!.el as HTMLElement).id).toBe('second')
    expect(result!.nextIndex).toBe(2)
  })

  it('应该处理混合节点类型', () => {
    const container = document.createElement('div')

    const text = document.createTextNode('Text')
    container.appendChild(text)

    const element = document.createElement('div')
    container.appendChild(element)

    const comment = document.createComment('Comment')
    container.appendChild(comment)

    // 获取第一个节点（文本）
    const result1 = getFirstNode(container, 0)
    expect(result1!.kind).toBe(ViewKind.TEXT)

    // 获取第二个节点（元素）
    const result2 = getFirstNode(container, 1)
    expect(result2!.kind).toBe(ViewKind.ELEMENT)

    // 获取第三个节点（注释）
    const result3 = getFirstNode(container, 2)
    expect(result3!.kind).toBe(ViewKind.COMMENT)
  })

  it('应该处理后面跟着其他节点的片段', () => {
    const container = document.createElement('div')

    // Fragment
    container.appendChild(document.createComment('Fragment:start'))
    container.appendChild(document.createElement('span'))
    container.appendChild(document.createComment('Fragment:end'))

    // 其他节点
    const afterFragment = document.createElement('div')
    container.appendChild(afterFragment)

    // 获取 Fragment
    const fragmentResult = getFirstNode(container, 0)
    expect(fragmentResult!.kind).toBe(ViewKind.FRAGMENT)
    expect(fragmentResult!.nextIndex).toBe(3)

    // 获取 Fragment 后的节点
    const afterResult = getFirstNode(container, fragmentResult!.nextIndex)
    expect(afterResult!.el).toBe(afterFragment)
  })

  it('应该返回正确的标签名', () => {
    const container = document.createElement('div')

    const tags = ['div', 'span', 'p', 'a', 'button']
    tags.forEach(tag => {
      const el = document.createElement(tag)
      container.appendChild(el)
    })

    tags.forEach((tag, index) => {
      const result = getFirstNode(container, index)
      expect(result!.tag).toBe(tag)
    })
  })

  it('应该处理空片段', () => {
    const container = document.createElement('div')

    container.appendChild(document.createComment('Fragment:start'))
    container.appendChild(document.createComment('Fragment:end'))

    const result = getFirstNode(container, 0)

    expect(result).not.toBeNull()
    expect(result!.kind).toBe(ViewKind.FRAGMENT)
    expect((result!.el as any[]).length).toBe(2) // 只有起止注释
  })
})
