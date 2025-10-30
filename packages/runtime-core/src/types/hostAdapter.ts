import type {
  AllHostElementNames,
  HostElementInstance,
  HostElementNames,
  HostParentElement,
  HostVoidElementNames,
  SpecialElementNames
} from './element.js'
import type { StyleRules } from './props.js'
import type {
  CommentNodeType,
  FragmentNodeType,
  NonElementNodeType,
  TextNodeType
} from './vnode.js'

/**
 * DOM适配器接口，定义了操作DOM元素的基本方法
 * 提供创建、修改、删除DOM元素以及处理事件和样式的能力
 */
export interface HostAdapter {
  /**
   * 创建指定类型的DOM元素
   *
   * @template T - 元素类型
   * @param type - 元素类型，如 'div', 'span' 等
   * @param initAttributes - 初始属性对象
   * @returns { HostElementInstance<T> } 返回创建的元素实例
   */
  createElement<T extends Omit<AllHostElementNames, SpecialElementNames>>(
    type: T,
    initAttributes?: Record<string, any>
  ): HostElementInstance<T>
  /**
   * 判断是否为容器元素
   *
   * 容器元素表示支持子元素
   *
   * @param el
   */
  isContainer(el: HostElementInstance): boolean
  /**
   * 创建文档片段，用于批量DOM操作提高性能
   * @returns { HostElementInstance<FragmentNodeType> } 返回文档片段实例
   */
  createFragment(): HostElementInstance<FragmentNodeType>
  /**
   * 创建文本节点
   * @param text - 文本内容
   * @returns { HostElementInstance<TextNodeType> } 返回文本节点实例
   */
  createText(text: string): HostElementInstance<TextNodeType>
  /**
   * 创建注释/锚点节点
   * @param text - 注释内容
   * @returns { HostElementInstance<CommentNodeType> } 返回注释节点实例
   */
  createComment(text: string): HostElementInstance<CommentNodeType>
  /**
   * 判断给定的标签名是否为 void 元素
   *
   * @param tag - 标签名
   * @returns {boolean} - 如果是 void 元素则返回 true，否则返回 false
   */
  isVoidElement(tag: string): boolean
  /**
   * 从DOM中移除元素
   * @param el - 要移除的元素实例
   */
  remove(el: HostElementInstance): void
  /**
   * 在指定锚点元素之前插入新元素
   * @param el - 要插入的元素实例
   * @param anchor - 锚点元素，新元素将插入到此元素之前
   */
  insertBefore(el: HostElementInstance, anchor: HostElementInstance): void
  /**
   * 在指定锚点元素之后插入新元素
   * @param el - 要插入的元素实例
   * @param anchor - 锚点元素，新元素将插入到此元素之后
   */
  insertAfter(el: HostElementInstance, anchor: HostElementInstance): void
  /**
   * 用新元素替换旧元素
   * @param newElement - 新元素实例
   * @param oldElement - 要被替换的旧元素实例
   */
  replace(newElement: HostElementInstance, oldElement: HostElementInstance): void
  /**
   * 将元素添加到父元素的子元素列表末尾
   * @param parent - 父元素实例
   * @param el - 要添加的子元素实例
   */
  appendChild(parent: HostParentElement, el: HostElementInstance): void
  /**
   * 设置元素的样式
   * @param el - 元素实例
   * @param style - 样式规则对象
   */
  setStyle(el: HostElementInstance, style: StyleRules): void
  /**
   * 设置元素的CSS类
   * @param el - 元素实例
   * @param classValue - CSS类名数组
   */
  setClass(el: HostElementInstance, classValue: string[]): void
  /**
   * 设置元素显示模式
   *
   * @param el - 元素实例
   * @param show - 是否显示元素
   */
  setDisplay(el: HostElementInstance<HostElementNames | HostVoidElementNames>, show: boolean): void
  /**
   * 设置元素的属性
   * @param el - 元素实例
   * @param key - 属性名
   * @param nextValue - 新属性值
   * @param prevValue - 旧属性值（可选）
   */
  setAttribute(el: HostElementInstance, key: string, nextValue: any, prevValue?: any): void
  /**
   * 设置元素的属性
   * @param el - 元素实例
   * @param attrs - 属性对象
   */
  setAttributes(el: HostElementInstance, attrs: Record<string, any>): void
  /**
   * 设置元素的文本内容
   * @param el - 元素实例
   * @param value - 文本内容
   */
  setText(el: HostElementInstance<NonElementNodeType>, value: string): void
  /**
   * 为元素添加事件监听器
   * @param el - 元素实例
   * @param name - 事件名称
   * @param handler - 事件处理函数
   */
  addEventListener(el: HostElementInstance, name: string, handler: (...args: any[]) => any): void
  /**
   * 移除元素的事件监听器
   * @param el - 元素实例
   * @param name - 事件名称
   * @param handler - 要移除的事件处理函数
   */
  removeEventListener(el: HostElementInstance, name: string, handler: (...args: any[]) => any): void
  /**
   * 查询元素
   *
   * @param selector - 选择器字符串
   * @param [container] - 可选的容器元素实例，不传入时，默认为body
   * @returns { HostElementInstance | null } 查询到的元素实例，或者null
   */
  querySelector(selector: string, container?: HostParentElement): HostElementInstance | null
  /**
   * 查询元素下的指定选择器的所有元素
   * @param selector - 选择器字符串
   * @param [container] - 可选的容器元素实例，不传入时，默认为body
   * @returns { HostElementInstance[] } 查询到的元素实例数组
   */
  querySelectorAll(selector: string, container?: HostParentElement): HostElementInstance[]
}
