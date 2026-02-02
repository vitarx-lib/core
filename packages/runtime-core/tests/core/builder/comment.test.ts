import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { Comment, CommentView, IS_VIEW_BUILDER, ViewKind } from '../../../src/index.js'

describe('Comment Builder', () => {
  describe('Builder Functionality', () => {
    it('应该被标记为视图构建器', () => {
      expect(Comment[IS_VIEW_BUILDER]).toBe(true)
    })

    it('应该创建 CommentView 实例', () => {
      const commentView = Comment({ text: 'test comment' })

      expect(commentView).toBeInstanceOf(CommentView)
      expect(commentView.kind).toBe(ViewKind.COMMENT)
    })

    it('应该将 text 属性传递给 CommentView', () => {
      const testText = 'This is a test comment'
      const commentView = Comment({ text: testText })

      expect(commentView.text).toBe(testText)
    })

    it('应该将 text 转换为字符串', () => {
      const testText = 12345
      const commentView = Comment({ text: String(testText) })

      expect(commentView.text).toBe('12345')
    })

    it('应该处理空字符串', () => {
      const commentView = Comment({ text: '' })

      expect(commentView).toBeInstanceOf(CommentView)
      expect(commentView.text).toBe('')
    })

    it('应该接受 location 参数', () => {
      const location = { fileName: 'test.ts', lineNumber: 1, columnNumber: 1 }
      const commentView = Comment({ text: 'test' }, location)

      expect(commentView).toBeInstanceOf(CommentView)
    })

    it('应该在没有 location 参数时正常工作', () => {
      const commentView = Comment({ text: 'test' })

      expect(commentView).toBeInstanceOf(CommentView)
    })
  })

  describe('Type Safety', () => {
    it('应该有正确的类型签名', () => {
      // This test ensures type compatibility at runtime
      const commentBuilder: typeof Comment = Comment
      const commentView = commentBuilder({ text: 'typed comment' })

      expect(commentView).toBeInstanceOf(CommentView)
    })
  })

  describe('Integration with View System', () => {
    let container: HTMLElement

    beforeEach(() => {
      container = document.createElement('div')
      document.body.appendChild(container)
    })

    afterEach(() => {
      document.body.removeChild(container)
    })

    it('应该能够挂载和卸载', () => {
      const commentView = Comment({ text: 'test comment' })

      expect(() => {
        commentView.mount(container)
      }).not.toThrow()

      expect(() => {
        commentView.dispose()
      }).not.toThrow()
    })

    it('应该在 DOM 中创建注释节点', () => {
      const commentView = Comment({ text: 'test comment' })
      commentView.mount(container)

      // Comment nodes are not visible in the DOM but should be created
      expect(container.childNodes.length).toBe(1)
      expect(container.childNodes[0].nodeType).toBe(8) // COMMENT_NODE
      expect(container.childNodes[0].nodeValue).toBe('test comment')
    })

    it('应该在文本更改时更新', () => {
      const commentView = Comment({ text: 'original text' })
      commentView.mount(container)

      commentView.text = 'updated text'
      expect(commentView.text).toBe('updated text')
      expect(container.childNodes[0].nodeValue).toBe('updated text')
    })
  })

  describe('Edge Cases', () => {
    it('应该处理文本中的特殊字符', () => {
      const specialText = '<script>alert("test")</script>'
      const commentView = Comment({ text: specialText })

      expect(commentView.text).toBe(specialText)
    })

    it('应该处理非常长的文本', () => {
      const longText = 'a'.repeat(1000)
      const commentView = Comment({ text: longText })

      expect(commentView.text).toBe(longText)
    })

    it('应该处理 null 和 undefined 文本转换', () => {
      const commentView1 = Comment({ text: null as any })
      expect(commentView1.text).toBe('null')

      const commentView2 = Comment({ text: undefined as any })
      expect(commentView2.text).toBe('undefined')
    })
  })
})
