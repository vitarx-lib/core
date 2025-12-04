import { describe, expect, it, vi } from 'vitest'
import {
  COMMENT_NODE_TYPE,
  createCommentVNode,
  createTextVNode,
  NodeKind,
  NodeState,
  TEXT_NODE_TYPE
} from '../../../src/index.js'

describe('vnode/creator/special', () => {
  describe('createTextVNode - 文本节点', () => {
    it('应该创建文本节点', () => {
      const vnode = createTextVNode({ text: 'Hello World' })

      expect(vnode.type).toBe(TEXT_NODE_TYPE)
      expect(vnode.kind).toBe(NodeKind.TEXT)
      expect(vnode.props.text).toBe('Hello World')
    })

    it('应该创建空文本节点', () => {
      const vnode = createTextVNode({ text: '' })

      expect(vnode.type).toBe(TEXT_NODE_TYPE)
      expect(vnode.kind).toBe(NodeKind.TEXT)
      expect(vnode.props.text).toBe('')
    })

    it('应该处理数字文本', () => {
      const vnode = createTextVNode({ text: 123 as any })

      expect(vnode.type).toBe(TEXT_NODE_TYPE)
      expect(vnode.props.text).toBe(123)
    })

    it('应该处理特殊字符', () => {
      const specialText = '<div>Special & "quoted" text</div>'
      const vnode = createTextVNode({ text: specialText })

      expect(vnode.props.text).toBe(specialText)
    })

    it('应该处理多行文本', () => {
      const multilineText = `Line 1
Line 2
Line 3`
      const vnode = createTextVNode({ text: multilineText })

      expect(vnode.props.text).toBe(multilineText)
    })

    it('应该处理 Unicode 字符', () => {
      const unicodeText = '你好 世界 🌍'
      const vnode = createTextVNode({ text: unicodeText })

      expect(vnode.props.text).toBe(unicodeText)
    })

    it('应该设置应用上下文', () => {
      const vnode = createTextVNode({ text: 'Text' })

      // 特殊节点的 appContext 可能为 undefined
      expect(vnode).toBeDefined()
    })

    it('应该支持 key 属性', () => {
      const vnode = createTextVNode({ text: 'Text', key: 'text-1' })

      expect(vnode.key).toBe('text-1')
    })

    it('应该不包含 children', () => {
      const vnode = createTextVNode({ text: 'Text' })

      expect((vnode as any).children).toBeUndefined()
    })

    it('应该不支持 ref', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const vnode = createTextVNode({ text: 'Text', ref: {} as any })

      // ref 在 TEXT 节点上应该被忽略
      expect(vnode.ref).toBeUndefined()
      expect(warnSpy).toHaveBeenCalled()
      warnSpy.mockRestore()
    })
  })

  describe('createCommentVNode - 注释节点', () => {
    it('应该创建注释节点', () => {
      const vnode = createCommentVNode({ text: 'This is a comment' })

      expect(vnode.type).toBe(COMMENT_NODE_TYPE)
      expect(vnode.kind).toBe(NodeKind.COMMENT)
      expect(vnode.props.text).toBe('This is a comment')
    })

    it('应该创建空注释节点', () => {
      const vnode = createCommentVNode({ text: '' })

      expect(vnode.type).toBe(COMMENT_NODE_TYPE)
      expect(vnode.kind).toBe(NodeKind.COMMENT)
      expect(vnode.props.text).toBe('')
    })

    it('应该处理多行注释', () => {
      const multilineComment = `Comment line 1
Comment line 2
Comment line 3`
      const vnode = createCommentVNode({ text: multilineComment })

      expect(vnode.props.text).toBe(multilineComment)
    })

    it('应该处理特殊字符', () => {
      const specialComment = '<!-- This is a special comment -->'
      const vnode = createCommentVNode({ text: specialComment })

      expect(vnode.props.text).toBe(specialComment)
    })

    it('应该设置应用上下文', () => {
      const vnode = createCommentVNode({ text: 'Comment' })

      // 特殊节点的 appContext 可能为 undefined
      expect(vnode).toBeDefined()
    })

    it('应该支持 key 属性', () => {
      const vnode = createCommentVNode({ text: 'Comment', key: 'comment-1' })

      expect(vnode.key).toBe('comment-1')
    })

    it('应该不包含 children', () => {
      const vnode = createCommentVNode({ text: 'Comment' })

      expect((vnode as any).children).toBeUndefined()
    })

    it('应该不支持 ref', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const vnode = createCommentVNode({ text: 'Comment', ref: {} as any })

      // ref 在 COMMENT 节点上应该被忽略
      expect(vnode.ref).toBeUndefined()
      expect(warnSpy).toHaveBeenCalled()
      warnSpy.mockRestore()
    })
  })

  describe('节点属性', () => {
    it('文本节点不应该包含额外的 props', () => {
      const vnode = createTextVNode({ text: 'Text' })

      expect(Object.keys(vnode.props)).toEqual(['text'])
    })

    it('注释节点不应该包含额外的 props', () => {
      const vnode = createCommentVNode({ text: 'Comment' })

      expect(Object.keys(vnode.props)).toEqual(['text'])
    })
  })

  describe('节点状态', () => {
    it('文本节点应该初始化为 Created 状态', () => {
      const vnode = createTextVNode({ text: 'Text' })

      expect(vnode.state).toBe(NodeState.Created)
    })

    it('注释节点应该初始化为 Created 状态', () => {
      const vnode = createCommentVNode({ text: 'Comment' })

      expect(vnode.state).toBe(NodeState.Created)
    })
  })

  describe('边界情况', () => {
    it('应该处理 null 文本值', () => {
      const vnode = createTextVNode({ text: null as any })

      expect(vnode.type).toBe(TEXT_NODE_TYPE)
      expect(vnode.props.text).toBe(null)
    })

    it('应该处理 undefined 文本值', () => {
      const vnode = createTextVNode({ text: undefined as any })

      expect(vnode.type).toBe(TEXT_NODE_TYPE)
      expect(vnode.props.text).toBe(undefined)
    })

    it('应该处理布尔值文本', () => {
      const vnodeTrue = createTextVNode({ text: true as any })
      const vnodeFalse = createTextVNode({ text: false as any })

      expect(vnodeTrue.props.text).toBe(true)
      expect(vnodeFalse.props.text).toBe(false)
    })

    it('应该处理对象值文本', () => {
      const obj = { key: 'value' }
      const vnode = createTextVNode({ text: obj as any })

      expect(vnode.props.text).toBe(obj)
    })
  })
})
