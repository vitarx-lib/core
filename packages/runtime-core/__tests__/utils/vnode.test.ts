/**
 * VNode 工具函数测试
 *
 * 测试 VNode 相关的工具函数
 */

import { describe, expect, it } from 'vitest'
import {
  COMMENT_NODE_TYPE,
  createVNode,
  FRAGMENT_NODE_TYPE,
  isCommentNode,
  isContainerNode,
  isElementNode,
  isFragmentNode,
  isStatefulWidgetNode,
  isTextNode,
  isWidgetNode,
  TEXT_NODE_TYPE
} from '../../src/index.js'
import { createTestWidget } from '../helpers/test-widget.js'

describe('VNode 工具函数', () => {
  describe('节点类型判断', () => {
    it('isTextNode 应该正确识别文本节点', () => {
      const textNode = createVNode(TEXT_NODE_TYPE, { text: 'text' })
      const divNode = createVNode('div', {})

      expect(isTextNode(textNode)).toBe(true)
      expect(isTextNode(divNode)).toBe(false)
    })

    it('isCommentNode 应该正确识别注释节点', () => {
      const commentNode = createVNode(COMMENT_NODE_TYPE, { text: 'comment' })
      const divNode = createVNode('div', {})

      expect(isCommentNode(commentNode)).toBe(true)
      expect(isCommentNode(divNode)).toBe(false)
    })

    it('isElementNode 应该正确识别元素节点', () => {
      const divNode = createVNode('div', {})
      const textNode = createVNode(TEXT_NODE_TYPE, { text: 'text' })

      expect(isElementNode(divNode)).toBe(true)
      // img 是 void 元素，不是常规元素
      expect(isElementNode(textNode)).toBe(false)
    })

    it('isFragmentNode 应该正确识别 Fragment 节点', () => {
      const fragmentNode = createVNode(FRAGMENT_NODE_TYPE, {})
      const divNode = createVNode('div', {})

      expect(isFragmentNode(fragmentNode)).toBe(true)
      expect(isFragmentNode(divNode)).toBe(false)
    })

    it('isWidgetNode 应该正确识别 Widget 节点', () => {
      const TestWidget = createTestWidget()
      const widgetNode = createVNode(TestWidget, {})
      const divNode = createVNode('div', {})

      expect(isWidgetNode(widgetNode)).toBe(true)
      expect(isWidgetNode(divNode)).toBe(false)
    })

    it('isStatefulWidgetNode 应该正确识别有状态 Widget 节点', () => {
      const TestWidget = createTestWidget()
      const widgetNode = createVNode(TestWidget, {})
      const divNode = createVNode('div', {})

      expect(isStatefulWidgetNode(widgetNode)).toBe(true)
      expect(isStatefulWidgetNode(divNode)).toBe(false)
    })
  })

  describe('容器节点判断', () => {
    it('isContainerNode 应该正确识别容器节点', () => {
      const divNode = createVNode('div', {})
      const fragmentNode = createVNode(FRAGMENT_NODE_TYPE, {})
      const textNode = createVNode(TEXT_NODE_TYPE, { text: 'text' })
      const imgNode = createVNode('img', {})

      expect(isContainerNode(divNode)).toBe(true)
      expect(isContainerNode(fragmentNode)).toBe(true)
      expect(isContainerNode(textNode)).toBe(false)
      expect(isContainerNode(imgNode)).toBe(false)
    })
  })
})
