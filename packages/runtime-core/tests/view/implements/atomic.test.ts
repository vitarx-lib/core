import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { ViewKind } from '../../../src/index.js'
import { CommentView, TextView } from '../../../src/view/implements/index.js'

describe('Atomic Views', () => {
  describe('TextView', () => {
    let container: HTMLElement

    beforeEach(() => {
      container = document.createElement('div')
      document.body.appendChild(container)
    })

    afterEach(() => {
      document.body.removeChild(container)
    })

    it('应该创建一个 TextView 实例', () => {
      const textView = new TextView('test text')

      expect(textView).toBeInstanceOf(TextView)
      expect(textView.kind).toBe(ViewKind.TEXT)
      expect(textView.text).toBe('test text')
    })

    it('应该接受 location 参数', () => {
      const location = { fileName: 'test.ts', lineNumber: 1, columnNumber: 1 }
      const textView = new TextView('test text', location)

      expect(textView).toBeInstanceOf(TextView)
      expect(textView.location).toBe(location)
    })

    it('应该能够挂载和卸载', () => {
      const textView = new TextView('test text')

      expect(() => {
        textView.mount(container)
      }).not.toThrow()

      expect(() => {
        textView.dispose()
      }).not.toThrow()
    })

    it('应该在 DOM 中创建文本节点', () => {
      const textView = new TextView('test text')
      textView.mount(container)

      expect(container.childNodes.length).toBe(1)
      expect(container.childNodes[0].nodeType).toBe(3) // TEXT_NODE
      expect(container.childNodes[0].nodeValue).toBe('test text')
    })

    it('应该能够更新文本内容', () => {
      const textView = new TextView('test text')
      textView.mount(container)

      expect(container.childNodes[0].nodeValue).toBe('test text')

      textView.text = 'updated text'
      expect(textView.text).toBe('updated text')
      expect(container.childNodes[0].nodeValue).toBe('updated text')
    })

    it('应该处理空字符串', () => {
      const textView = new TextView('')
      textView.mount(container)

      expect(container.childNodes.length).toBe(1)
      expect(container.childNodes[0].nodeType).toBe(3) // TEXT_NODE
      expect(container.childNodes[0].nodeValue).toBe('')
    })
  })

  describe('CommentView', () => {
    let container: HTMLElement

    beforeEach(() => {
      container = document.createElement('div')
      document.body.appendChild(container)
    })

    afterEach(() => {
      document.body.removeChild(container)
    })

    it('应该创建一个 CommentView 实例', () => {
      const commentView = new CommentView('test comment')

      expect(commentView).toBeInstanceOf(CommentView)
      expect(commentView.kind).toBe(ViewKind.COMMENT)
    })

    it('应该接受 location 参数', () => {
      const location = { fileName: 'test.ts', lineNumber: 1, columnNumber: 1 }
      const commentView = new CommentView('test comment', location)

      expect(commentView).toBeInstanceOf(CommentView)
      expect(commentView.location).toBe(location)
    })

    it('应该能够挂载和卸载', () => {
      const commentView = new CommentView('test comment')

      expect(() => {
        commentView.mount(container)
      }).not.toThrow()

      expect(() => {
        commentView.dispose()
      }).not.toThrow()
    })

    it('应该在 DOM 中创建注释节点', () => {
      const commentView = new CommentView('test comment')
      commentView.mount(container)

      expect(container.childNodes.length).toBe(1)
      expect(container.childNodes[0].nodeType).toBe(8) // COMMENT_NODE
      expect(container.childNodes[0].nodeValue).toBe('test comment')
    })

    it('应该处理空注释', () => {
      const commentView = new CommentView('')
      commentView.mount(container)

      expect(container.childNodes.length).toBe(1)
      expect(container.childNodes[0].nodeType).toBe(8) // COMMENT_NODE
      expect(container.childNodes[0].nodeValue).toBe('')
    })
  })
})
