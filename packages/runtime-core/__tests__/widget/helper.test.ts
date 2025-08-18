import { describe, expect, it } from 'vitest'
import {
  createVNode,
  defineExpose,
  defineSimpleWidget,
  getCurrentInstance,
  isSimpleWidget,
  markSimpleWidget,
  refEl,
  Widget,
  WidgetVNode
} from '../../src'

function MockWidget() {
  const instance = getCurrentInstance()
  defineExpose({ instance })
  return null
}

describe('实例获取相关函数测试', () => {
  describe('getCurrentInstance / useCurrentInstance', () => {
    it('应该在 WidgetVNode.getCurrentVNode 返回有效节点时返回该节点的实例', () => {
      const refInstance = refEl<Widget>()
      const instance = new WidgetVNode(MockWidget, { ref: refInstance }).instance
      expect(refInstance.value).toBe(instance)
    })

    it('应该在 WidgetVNode.getCurrentVNode 返回 null 时返回 undefined', () => {
      expect(getCurrentInstance()).toBeUndefined()
    })
  })
})

describe('简单小部件标记相关函数测试', () => {
  describe('markSimpleWidget / defineSimpleWidget', () => {
    it('应该正确地标记函数并添加特殊符号属性', () => {
      // 创建一个测试用的构建函数
      const buildFn = (props: { title: string }) => {
        return createVNode('div', { children: props.title })
      }

      // 执行标记函数
      const result = markSimpleWidget(buildFn)

      // 验证返回的是同一个函数
      expect(result).toBe(buildFn)

      // 验证函数上添加了特殊符号属性
      expect(isSimpleWidget(result)).toBe(true)

      // 验证别名
      expect(defineSimpleWidget).toBe(markSimpleWidget)
    })
  })

  describe('isSimpleWidget', () => {
    it('应该对非函数值返回 false', () => {
      expect(isSimpleWidget(null)).toBe(false)
      expect(isSimpleWidget(undefined)).toBe(false)
      expect(isSimpleWidget({})).toBe(false)
      expect(isSimpleWidget([])).toBe(false)
      expect(isSimpleWidget('string')).toBe(false)
      expect(isSimpleWidget(123)).toBe(false)
    })

    it('应该对未标记的函数返回 false', () => {
      const normalFn = () => {}
      expect(isSimpleWidget(normalFn)).toBe(false)
    })

    it('应该对已标记的函数返回 true', () => {
      const buildFn = () => null

      // 先标记函数
      const markedFn = markSimpleWidget(buildFn)
      expect(isSimpleWidget(markedFn)).toBe(true)
    })
  })
})
