import { ref } from '@vitarx/responsive'
import { describe, expect, it, vi } from 'vitest'
import { CommentVNode, ElementVNode, FragmentVNode, refEl, TextVNode } from '../../src'

describe('ElementVNode 测试套件', () => {
  describe('element getter 测试', () => {
    it('应该正确创建HTML元素', () => {
      // 准备
      const mockElement = document.createElement('div')
      const createElementNSMock = vi.spyOn(document, 'createElementNS').mockReturnValue(mockElement)

      // 执行
      const vnode = new ElementVNode('div')
      const element = vnode.element

      // 断言
      expect(createElementNSMock).toHaveBeenCalledWith('http://www.w3.org/1999/xhtml', 'div')
      expect(element).toBe(mockElement)
    })

    it('应该正确创建SVG元素', () => {
      // 准备
      const mockElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
      const createElementNSMock = vi.spyOn(document, 'createElementNS').mockReturnValue(mockElement)

      // 执行
      const vnode = new ElementVNode('svg')
      const element = vnode.element

      // 断言
      expect(createElementNSMock).toHaveBeenCalledWith('http://www.w3.org/2000/svg', 'svg')
      expect(element).toBe(mockElement)
    })

    it('应该在创建元素时设置属性', () => {
      // 准备
      const mockElement = document.createElement('div')
      vi.spyOn(document, 'createElementNS').mockReturnValue(mockElement)
      const props = { id: 'test', class: 'my-class' }

      // Mock propsHandler 来验证它被调用
      const propsHandlerSpy = vi.spyOn(ElementVNode.prototype as any, 'propsHandler')

      // 执行
      const vnode = new ElementVNode('div', props)
      vnode.element

      // 断言
      expect(propsHandlerSpy).toHaveBeenCalled()
    })

    it('应该在创建元素时绑定ref', () => {
      // 准备
      const mockElement = document.createElement('div')
      vi.spyOn(document, 'createElementNS').mockReturnValue(mockElement)
      const ref = refEl()
      // 执行
      const vnode = new ElementVNode('div', { ref })
      vnode.element
      // 断言
      expect(ref.value).toBe(mockElement)
    })

    it('应该在创建元素时渲染子节点', () => {
      // 准备
      const mockElement = document.createElement('div')
      vi.spyOn(document, 'createElementNS').mockReturnValue(mockElement)
      const renderChildrenSpy = vi.spyOn(ElementVNode.prototype as any, 'renderChildren')

      // 执行
      const vnode = new ElementVNode('div')
      vnode.element

      // 断言
      expect(renderChildrenSpy).toHaveBeenCalled()
    })

    it('应该缓存已创建的元素', () => {
      // 准备
      const mockElement = document.createElement('div')
      const createElementNSMock = vi.spyOn(document, 'createElementNS').mockReturnValue(mockElement)

      // 执行
      const vnode = new ElementVNode('div')
      const element1 = vnode.element
      const element2 = vnode.element

      // 断言
      expect(createElementNSMock).toHaveBeenCalledTimes(1)
      expect(element1).toBe(element2)
    })

    it('应该在创建元素时设置事件处理程序', () => {
      const mockElement = document.createElement('div')
      vi.spyOn(document, 'createElementNS').mockReturnValue(mockElement)
      const eventHandler = vi.fn()
      const vnode = new ElementVNode('div', { onClick: eventHandler })
      vnode.element
      vnode.element.dispatchEvent(new MouseEvent('click'))
      expect(eventHandler).toHaveBeenCalled()
    })

    it('应该兼容props.children设置为0', () => {
      const vnode = new ElementVNode('div', { children: 0 })
      vnode.mount()
      expect(vnode.element.textContent).toBe('0')
    })
  })

  describe('isSvgVNode 静态方法测试', () => {
    it('应该识别svg标签为SVG节点', () => {
      // 准备
      const vnode = new ElementVNode('svg')

      // 执行
      const result = ElementVNode.isSvgVNode(vnode)

      // 断言
      expect(result).toBe(true)
    })

    it('应该识别带有SVG命名空间的元素为SVG节点', () => {
      // 准备
      const vnode = new ElementVNode('circle', {
        xmlns: 'http://www.w3.org/2000/svg'
      })

      // 执行
      const result = ElementVNode.isSvgVNode(vnode)

      // 断言
      expect(result).toBe(true)
    })

    it('应该识别父节点为svg的元素为SVG节点', () => {
      // 准备
      const parentVNode = new ElementVNode('svg')
      const vnode = new ElementVNode('circle')
      vi.spyOn(ElementVNode, 'findParentVNode').mockReturnValue(parentVNode)

      // 执行
      const result = ElementVNode.isSvgVNode(vnode)

      // 断言
      expect(result).toBe(true)
    })

    it('应该识别普通HTML元素为非SVG节点', () => {
      // 准备
      const vnode = new ElementVNode('div')
      vi.spyOn(ElementVNode, 'findParentVNode').mockReturnValue(undefined)

      // 执行
      const result = ElementVNode.isSvgVNode(vnode)

      // 断言
      expect(result).toBe(false)
    })
  })

  describe('is 静态方法测试', () => {
    it('应该识别ElementVNode实例', () => {
      const vnode = new ElementVNode('div')

      // 执行
      const result = ElementVNode.is(vnode)

      // 断言
      expect(result).toBe(true)
    })

    it('应该拒绝非ElementVNode实例', () => {
      const obj = {}

      // 执行
      const result = ElementVNode.is(obj)

      // 断言
      expect(result).toBe(false)
    })

    it('应该拒绝type不是字符串的节点', () => {
      const vnode: any = new ElementVNode('div')
      vnode.type = 123

      // 执行
      const result = ElementVNode.is(vnode)

      // 断言
      expect(result).toBe(false)
    })

    it('应该拒绝特殊节点类型', () => {
      // 执行和断言
      expect(ElementVNode.is(new FragmentVNode({ children: ['fragment-node'] }))).toBe(false)
      expect(ElementVNode.is(new TextVNode('text-node'))).toBe(false)
      expect(ElementVNode.is(new CommentVNode('comment-node'))).toBe(false)
    })
  })

  describe('propsHandler 方法测试', () => {
    it('应该正确解包ref值', () => {
      // 准备
      const refValue = 'test'
      const refObj = ref(refValue)

      // 执行
      const vnode = new ElementVNode('div', { id: refObj })

      // 断言
      expect(vnode.props.id).toBe(refValue)
    })

    it('应该处理className属性并删除原属性', () => {
      // 准备
      const classArray = ['class1', 'class2']

      // 执行
      const vnode = new ElementVNode('div', { className: 'class1 class2' })

      // 断言
      expect(vnode.props.className).toBeUndefined()
      expect(vnode.props.class).toStrictEqual(classArray)
    })

    it('应该处理classname属性并删除原属性', () => {
      // 准备
      const classArray = ['class1', 'class2']

      // 执行
      const vnode = new ElementVNode('div', { classname: 'class1 class2' })

      // 断言
      expect(vnode.props.classname).toBeUndefined()
      expect(vnode.props.class).toStrictEqual(classArray)
    })

    it('应该合并class属性', () => {
      // 准备
      const mergedArray = ['class1', 'class2', 'class3', 'class4']

      // 执行
      const vnode = new ElementVNode('div', {
        class: 'class1 class2',
        className: 'class3 class4'
      })

      // 断言
      expect(vnode.props.class).toStrictEqual(mergedArray)
    })

    it('应该在处理属性后正确设置DOM属性', () => {
      // 准备
      const mockElement = document.createElement('div')
      vi.spyOn(document, 'createElementNS').mockReturnValue(mockElement)
      const props = { id: 'test', class: 'my-class' }

      // 执行
      const vnode = new ElementVNode('div', props)
      vnode.element // 触发element getter，进而调用propsHandler和DomHelper.setAttributes
      expect(mockElement.getAttribute('id')).toBe('test')
      expect(mockElement.getAttribute('class')).toBe('my-class')
    })
  })
})
