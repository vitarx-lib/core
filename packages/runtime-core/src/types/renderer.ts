import type {
  HostCommentElement,
  HostElementNames,
  HostElements,
  HostFragmentElement,
  HostNodeElements,
  HostParentElement,
  HostRegularElements,
  HostTextElement,
  HostVoidElementNames
} from './element.js'
import type { ElementVNode, FragmentVNode } from './nodes/index.js'

/**
 * DOMRect 接口，表示一个矩形区域，
 * 用于测量和操作元素位置和尺寸。
 */
export interface DOMRect {
  /**
   * The **`height`** property of the DOMRect nodes represents the height of the rectangle.
   *
   * [MDN Reference](https://developer.mozilla.org/docs/Web/API/DOMRect/height)
   */
  height: number
  /**
   * The **`width`** property of the DOMRect nodes represents the width of the rectangle.
   *
   * [MDN Reference](https://developer.mozilla.org/docs/Web/API/DOMRect/width)
   */
  width: number
  /**
   * The **`x`** property of the DOMRect nodes represents the x-coordinate of the rectangle, which is the horizontal distance between the viewport's left edge and the rectangle's origin.
   *
   * [MDN Reference](https://developer.mozilla.org/docs/Web/API/DOMRect/x)
   */
  x: number
  /**
   * The **`y`** property of the DOMRect nodes represents the y-coordinate of the rectangle, which is the vertical distance between the viewport's top edge and the rectangle's origin.
   *
   * [MDN Reference](https://developer.mozilla.org/docs/Web/API/DOMRect/y)
   */
  y: number
  /**
   * The **`bottom`** read-only property of the **`DOMRectReadOnly`** nodes returns the bottom coordinate value of the `DOMRect`.
   *
   * [MDN Reference](https://developer.mozilla.org/docs/Web/API/DOMRectReadOnly/bottom)
   */
  readonly bottom: number
  /**
   * The **`left`** read-only property of the **`DOMRectReadOnly`** nodes returns the left coordinate value of the `DOMRect`.
   *
   * [MDN Reference](https://developer.mozilla.org/docs/Web/API/DOMRectReadOnly/left)
   */
  readonly left: number
  /**
   * The **`right`** read-only property of the **`DOMRectReadOnly`** nodes returns the right coordinate value of the `DOMRect`.
   *
   * [MDN Reference](https://developer.mozilla.org/docs/Web/API/DOMRectReadOnly/right)
   */
  readonly right: number
  /**
   * The **`top`** read-only property of the **`DOMRectReadOnly`** nodes returns the top coordinate value of the `DOMRect`.
   *
   * [MDN Reference](https://developer.mozilla.org/docs/Web/API/DOMRectReadOnly/top)
   */
  readonly top: number
  /**
   * The **`toJSON()`** method of the **`DOMRectReadOnly`** nodes returns a JSON serialization of the rectangle.
   *
   * [MDN Reference](https://developer.mozilla.org/docs/Web/API/DOMRectReadOnly/toJSON)
   */
  toJSON(): any
}

/**
 * DOM适配器接口，定义了操作DOM元素的基本方法
 * 提供创建、修改、删除DOM元素以及处理事件和样式的能力
 */
export interface HostRenderer {
  /**
   * 创建指定类型的DOM元素
   *
   * @template T - 元素类型
   * @param vnode - 虚拟节点对象
   * @returns { HostElements<T> } 返回创建的元素实例
   */
  createElement<T extends HostElementNames>(vnode: ElementVNode<T>): HostElements<T>
  /**
   * 判断是否为容器元素
   *
   * 容器元素表示支持子元素
   *
   * @param el
   */
  isContainer(el: HostNodeElements): boolean
  /**
   * 创建文档片段，用于批量DOM操作提高性能
   * @returns { HostFragmentElement } 返回文档片段实例
   */
  createFragment(vnode: FragmentVNode): HostFragmentElement
  /**
   * 创建文本节点
   * @param text - 文本内容
   * @returns { HostTextElement } 返回文本节点实例
   */
  createText(text: string): HostTextElement
  /**
   * 创建注释/锚点节点
   * @param text - 注释内容
   * @returns { HostCommentElement } 返回注释节点实例
   */
  createComment(text: string): HostCommentElement
  /**
   * 判断给定的标签名是否为 void 元素
   *
   * @param tag - 标签名
   * @returns {boolean} - 如果是 void 元素则返回 true，否则返回 false
   */
  isVoidElement(tag: string): tag is HostVoidElementNames
  /**
   * 判断给定的元素实例是否为元素
   * @param el - 元素实例
   * @returns {boolean} - 如果是元素则返回 true，否则返回 false
   */
  isElement(el: HostNodeElements): el is HostElements
  /**
   * 从DOM中移除元素
   * @param el - 要移除的元素实例
   */
  remove(el: HostNodeElements): void
  /**
   * 在指定锚点元素之前插入新元素
   * @param el - 要插入的元素实例
   * @param anchor - 锚点元素，新元素将插入到此元素之前
   */
  insertBefore(el: HostNodeElements, anchor: HostNodeElements): void
  /**
   * 用新元素替换旧元素
   * @param newChild - 新节点实例
   * @param oldChild - 要被替换的旧节点实例
   */
  replace(newChild: HostNodeElements, oldChild: HostNodeElements): void
  /**
   * 将元素添加到父元素的子元素列表末尾
   * @param el - 要添加的子元素实例
   * @param parent - 父元素实例
   */
  appendChild(
    el: HostNodeElements,
    parent: HostParentElement | HostRegularElements | HostFragmentElement
  ): void
  /**
   * 添加样式
   * @param el - 元素实例
   * @param key - 样式属性名
   * @param value - 样式属性值
   * @returns {()=>void} - 移除/恢复到之前的样式
   */
  addStyle(el: HostElements, key: string, value: string): () => void
  /**
   * 移除样式
   * @param el - 元素实例
   * @param key - 样式属性名
   */
  removeStyle(el: HostElements, key: string): void
  /**
   * 获取元素的计算样式
   * @param el - 元素实例
   * @returns {DOMRect} - 元素的计算样式对象
   */
  getBoundingClientRect(el: HostElements): DOMRect
  /**
   * 设置元素的CSS类
   * @param el - 元素实例
   * @param classValue - CSS类名数组
   */
  setClass(el: HostElements, classValue: string[]): void
  /**
   * 添加样式类
   * @param el - 元素实例
   * @param className - 样式类名，支持多个类名，用空格隔开
   */
  addClass(el: HostElements, className: string): void
  /**
   * 移除样式类
   * @param el
   * @param className
   */
  removeClass(el: HostElements, className: string): void
  /**
   * 获取动画时间
   *
   * @returns {number} 动画时间，单位毫秒，0则代表无
   */
  getAnimationDuration(el: HostElements): number
  /**
   * 获取过渡时间
   *
   * @returns {number} 过渡时间，单位毫秒，0则代表无
   */
  getTransitionDuration(el: HostElements): number
  /**
   * 请求动画帧
   *
   * 该方法用于在下一次宿主平台重绘之前调用指定的函数，实现平滑的动画效果。
   * 通常与 cancelAnimationFrame 配合使用，可以在动画不再需要时取消回调。
   *
   * @param fn - 在下一次浏览器重绘前执行的回调函数
   * @returns {number} 请求ID，可用于后续取消该动画帧请求
   */
  requestAnimationFrame(fn: () => void): number
  /**
   * 取消动画帧
   *
   * 该方法用于取消之前通过 requestAnimationFrame 方法请求的动画帧回调。
   * 需要传入 requestAnimationFrame 返回的请求ID作为参数。
   *
   * @param id - 要取消的动画帧请求ID，由 requestAnimationFrame 返回
   */
  cancelAnimationFrame(id: number): void
  /**
   * 设置元素的属性
   * @param el - 元素实例
   * @param key - 属性名
   * @param nextValue - 新属性值
   * @param prevValue - 旧属性值（可选）
   */
  setAttribute(el: HostElements, key: string, nextValue: any, prevValue?: any): void
  /**
   * 移除元素的属性
   * @param el - 元素实例
   * @param key - 属性名
   * @param prevValue - 旧属性值（可选）
   */
  removeAttribute(el: HostElements, key: string, prevValue?: any): void
  /**
   * 设置元素的文本内容
   * @param el - 元素实例
   * @param value - 文本内容
   */
  setText(el: HostTextElement | HostCommentElement, value: string): void
  /**
   * 查询元素
   *
   * @param selector - 选择器字符串
   * @param [container] - 可选的容器元素实例，不传入时，默认为body
   * @returns { HostElements | null } 查询到的元素实例，或者null
   */
  querySelector(selector: string, container?: HostParentElement): HostElements | null
  /**
   * 获取元素的父元素
   * @param el - 元素实例
   * @returns { HostParentElement | null } 父元素实例，或者null
   */
  getParentElement(el: HostNodeElements): HostParentElement | null
}
