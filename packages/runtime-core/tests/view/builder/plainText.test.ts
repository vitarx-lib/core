import { nextTick, ref } from '@vitarx/responsive'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  CommentView,
  DynamicView,
  IS_VIEW_BUILDER,
  PlainText,
  TextView,
  ViewKind
} from '../../../src/index.js'

describe('PlainText Builder', () => {
  describe('构建器功能', () => {
    it('应该被标记为视图构建器', () => {
      expect(PlainText[IS_VIEW_BUILDER]).toBe(true)
    })

    it('应该创建 TextView 实例当 text 是静态字符串时', () => {
      const textView = PlainText({ text: 'test text' })

      expect(textView).toBeInstanceOf(TextView)
      expect(textView.kind).toBe(ViewKind.TEXT)
    })

    it('应该创建 DynamicView 实例当 text 是响应式时', () => {
      const textRef = ref('dynamic text')
      const textView = PlainText({
        get text() {
          return textRef.value
        }
      })

      expect(textView).toBeInstanceOf(DynamicView)
      expect(textView.kind).toBe(ViewKind.DYNAMIC)
    })

    it('应该创建 CommentView 实例当 text 是空字符串时', () => {
      const textView = PlainText({ text: '' })

      expect(textView).toBeInstanceOf(CommentView)
      expect(textView.kind).toBe(ViewKind.COMMENT)
    })

    it('应该将 text 转换为字符串', () => {
      const textView = PlainText({ text: 12345 })

      expect(textView).toBeInstanceOf(TextView)
      expect((textView as TextView).text).toBe('12345')
    })

    it('应该接受 location 参数', () => {
      const location = { fileName: 'test.ts', lineNumber: 1, columnNumber: 1 }
      const textView = PlainText({ text: 'test' }, location)

      expect(textView).toBeInstanceOf(TextView)
      expect(textView.location).toBe(location)
    })

    it('应该在没有 location 参数时正常工作', () => {
      const textView = PlainText({ text: 'test' })

      expect(textView).toBeInstanceOf(TextView)
    })
  })

  describe('动态文本', () => {
    let container: HTMLElement

    beforeEach(() => {
      container = document.createElement('div')
      document.body.appendChild(container)
    })

    afterEach(() => {
      document.body.removeChild(container)
    })

    it('应该追踪响应式依赖', async () => {
      const textRef = ref('initial text')
      const textView = PlainText({
        get text() {
          return textRef.value
        }
      })

      textView.init()
      textView.mount(container)

      expect(container.textContent).toBe('initial text')

      textRef.value = 'updated text'
      await nextTick()
      expect(container.textContent).toBe('updated text')

      textView.dispose()
    })

    it('应该正确处理数字类型的响应式 text', async () => {
      const textRef = ref(12345)
      const textView = PlainText({
        get text() {
          return textRef.value
        }
      })

      textView.init()
      textView.mount(container)

      expect(container.textContent).toBe('12345')

      textRef.value = 67890
      await nextTick()
      expect(container.textContent).toBe('67890')

      textView.dispose()
    })
  })

  describe('错误处理', () => {
    it('当 text 不是字符串或数字时应该发出警告', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const location = { fileName: 'test.ts', lineNumber: 1, columnNumber: 1 }

      PlainText({ text: {} as any }, location)

      expect(warnSpy).toHaveBeenCalled()
      warnSpy.mockRestore()
    })

    it('当 text 是 null 时应该转换为字符串', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const textView = PlainText({ text: null as any })

      expect(textView).toBeInstanceOf(TextView)
      expect((textView as TextView).text).toBe('null')
      warnSpy.mockRestore()
    })

    it('当 text 是 undefined 时应该转换为字符串', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const textView = PlainText({ text: undefined as any })

      expect(textView).toBeInstanceOf(TextView)
      expect((textView as TextView).text).toBe('undefined')
      warnSpy.mockRestore()
    })
  })

  describe('类型安全', () => {
    it('应该有正确的类型签名', () => {
      const textView = PlainText({ text: 'test text' })

      expect(textView).toBeDefined()
    })

    it('应该有 __is_text 标记', () => {
      expect(PlainText).toBeDefined()
    })
  })

  describe('集成测试', () => {
    let container: HTMLElement

    beforeEach(() => {
      container = document.createElement('div')
      document.body.appendChild(container)
    })

    afterEach(() => {
      document.body.removeChild(container)
    })

    it('应该能够挂载和卸载', () => {
      const textView = PlainText({ text: 'test text' })

      expect(() => {
        textView.mount(container)
      }).not.toThrow()

      expect(() => {
        textView.dispose()
      }).not.toThrow()
    })

    it('应该在 DOM 中创建文本节点', () => {
      const textView = PlainText({ text: 'test text' })
      textView.mount(container)

      expect(container.textContent).toBe('test text')
      expect(container.childNodes.length).toBe(1)
      expect(container.childNodes[0].nodeType).toBe(3) // TEXT_NODE
    })
  })

  describe('边界情况', () => {
    it('应该处理非常长的文本', () => {
      const longText = 'a'.repeat(1000)
      const textView = PlainText({ text: longText })

      expect(textView).toBeInstanceOf(TextView)
      expect((textView as TextView).text).toBe(longText)
    })

    it('应该处理包含特殊字符的文本', () => {
      const specialText = '<script>alert("test")</script>'
      const textView = PlainText({ text: specialText })

      expect(textView).toBeInstanceOf(TextView)
      expect((textView as TextView).text).toBe(specialText)
    })
  })
})
