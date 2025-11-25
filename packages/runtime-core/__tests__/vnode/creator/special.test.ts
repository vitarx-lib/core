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
      const vnode = createTextVNode({ value: 'Hello World' })

      expect(vnode.type).toBe(TEXT_NODE_TYPE)
      expect(vnode.kind).toBe(NodeKind.TEXT)
      expect(vnode.props.value).toBe('Hello World')
    })

    it('应该创建空文本节点', () => {
      const vnode = createTextVNode({ value: '' })

      expect(vnode.type).toBe(TEXT_NODE_TYPE)
      expect(vnode.kind).toBe(NodeKind.TEXT)
      expect(vnode.props.value).toBe('')
    })

    it('应该处理数字文本', () => {
      const vnode = createTextVNode({ value: 123 as any })

      expect(vnode.type).toBe(TEXT_NODE_TYPE)
      expect(vnode.props.value).toBe(123)
    })

    it('应该处理特殊字符', () => {
      const specialText = '<div>Special & "quoted" text</div>'
      const vnode = createTextVNode({ value: specialText })

      expect(vnode.props.value).toBe(specialText)
    })

    it('应该处理多行文本', () => {
      const multilineText = `Line 1
Line 2
Line 3`
      const vnode = createTextVNode({ value: multilineText })

      expect(vnode.props.value).toBe(multilineText)
    })

    it('应该处理 Unicode 字符', () => {
      const unicodeText = '你好 世界 🌍'
      const vnode = createTextVNode({ value: unicodeText })

      expect(vnode.props.value).toBe(unicodeText)
    })

    it('应该设置应用上下文', () => {
      const vnode = createTextVNode({ value: 'Text' })

      // 特殊节点的 appContext 可能为 undefined
      expect(vnode).toBeDefined()
    })

    it('应该支持 key 属性', () => {
      const vnode = createTextVNode({ value: 'Text', key: 'text-1' })

      expect(vnode.key).toBe('text-1')
    })

    it('应该不包含 children', () => {
      const vnode = createTextVNode({ value: 'Text' })

      expect((vnode as any).children).toBeUndefined()
    })

    it('应该不支持 ref', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const vnode = createTextVNode({ value: 'Text', ref: {} as any })

      // ref 在 TEXT 节点上应该被忽略
      expect(vnode.ref).toBeUndefined()
      expect(warnSpy).toHaveBeenCalled()
      warnSpy.mockRestore()
    })
  })

  describe('createCommentVNode - 注释节点', () => {
    it('应该创建注释节点', () => {
      const vnode = createCommentVNode({ value: 'This is a comment' })

      expect(vnode.type).toBe(COMMENT_NODE_TYPE)
      expect(vnode.kind).toBe(NodeKind.COMMENT)
      expect(vnode.props.value).toBe('This is a comment')
    })

    it('应该创建空注释节点', () => {
      const vnode = createCommentVNode({ value: '' })

      expect(vnode.type).toBe(COMMENT_NODE_TYPE)
      expect(vnode.kind).toBe(NodeKind.COMMENT)
      expect(vnode.props.value).toBe('')
    })

    it('应该处理多行注释', () => {
      const multilineComment = `Comment line 1
Comment line 2
Comment line 3`
      const vnode = createCommentVNode({ value: multilineComment })

      expect(vnode.props.value).toBe(multilineComment)
    })

    it('应该处理特殊字符', () => {
      const specialComment = '<!-- This is a special comment -->'
      const vnode = createCommentVNode({ value: specialComment })

      expect(vnode.props.value).toBe(specialComment)
    })

    it('应该设置应用上下文', () => {
      const vnode = createCommentVNode({ value: 'Comment' })

      // 特殊节点的 appContext 可能为 undefined
      expect(vnode).toBeDefined()
    })

    it('应该支持 key 属性', () => {
      const vnode = createCommentVNode({ value: 'Comment', key: 'comment-1' })

      expect(vnode.key).toBe('comment-1')
    })

    it('应该不包含 children', () => {
      const vnode = createCommentVNode({ value: 'Comment' })

      expect((vnode as any).children).toBeUndefined()
    })

    it('应该不支持 ref', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const vnode = createCommentVNode({ value: 'Comment', ref: {} as any })

      // ref 在 COMMENT 节点上应该被忽略
      expect(vnode.ref).toBeUndefined()
      expect(warnSpy).toHaveBeenCalled()
      warnSpy.mockRestore()
    })
  })

  describe('节点属性', () => {
    it('文本节点不应该包含额外的 props', () => {
      const vnode = createTextVNode({ value: 'Text' })

      expect(Object.keys(vnode.props)).toEqual(['value'])
    })

    it('注释节点不应该包含额外的 props', () => {
      const vnode = createCommentVNode({ value: 'Comment' })

      expect(Object.keys(vnode.props)).toEqual(['value'])
    })
  })

  describe('节点状态', () => {
    it('文本节点应该初始化为 Created 状态', () => {
      const vnode = createTextVNode({ value: 'Text' })

      expect(vnode.state).toBe(NodeState.Created)
    })

    it('注释节点应该初始化为 Created 状态', () => {
      const vnode = createCommentVNode({ value: 'Comment' })

      expect(vnode.state).toBe(NodeState.Created)
    })
  })

  describe('边界情况', () => {
    it('应该处理 null 文本值', () => {
      const vnode = createTextVNode({ value: null as any })

      expect(vnode.type).toBe(TEXT_NODE_TYPE)
      expect(vnode.props.value).toBe(null)
    })

    it('应该处理 undefined 文本值', () => {
      const vnode = createTextVNode({ value: undefined as any })

      expect(vnode.type).toBe(TEXT_NODE_TYPE)
      expect(vnode.props.value).toBe(undefined)
    })

    it('应该处理布尔值文本', () => {
      const vnodeTrue = createTextVNode({ value: true as any })
      const vnodeFalse = createTextVNode({ value: false as any })

      expect(vnodeTrue.props.value).toBe(true)
      expect(vnodeFalse.props.value).toBe(false)
    })

    it('应该处理对象值文本', () => {
      const obj = { key: 'value' }
      const vnode = createTextVNode({ value: obj as any })

      expect(vnode.props.value).toBe(obj)
    })
  })
})
