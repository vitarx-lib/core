import { isRecordObject, popProperty } from '@vitarx/utils'
import { DomHelper } from '../../dom/index'
import type { RuntimeElement, UniqueKey, VNodeProps, VNodeType } from '../types'

const VNODE_SYMBOL = Symbol('VNODE_SYMBOL')
type Source = { fileName: string; lineNumber: number; columnNumber: number }
/**
 * 虚拟节点抽象类
 *
 * @template T - 节点类型
 */
export abstract class VNode<T extends VNodeType = VNodeType> {
  readonly [VNODE_SYMBOL] = true
  /**
   * 父节点映射
   *
   * @private
   */
  static #parentNodeMapping = new WeakMap<VNode, VNode>()
  /**
   * 源信息，仅在开发调试阶段存在
   */
  source?: Source
  /**
   * 虚拟节点类型
   * 可以是标签名（如 'div'）、组件（函数或类）或特殊符号
   */
  #type: T
  /**
   * 节点属性
   */
  #props: VNodeProps<T>
  /**
   * 唯一标识符
   */
  readonly #key: UniqueKey | null = null
  /**
   * 引用
   */
  readonly #ref: NonNullable<VNodeProps<T>>['ref'] | null = null
  #shadowElement?: Comment

  /**
   * 创建一个虚拟节点实例
   * @param type 虚拟节点的类型，可以是标签名、组件函数或其他类型
   * @param props 虚拟节点的属性对象
   */
  constructor(type: T, props: VNodeProps<T> | null = null) {
    // 节点类型
    this.#type = type
    // 节点属性
    this.#props = props ?? ({} as VNodeProps<T>)
    if (props) {
      // 提取key属性
      this.#key = popProperty(props, 'key')
      // 引用
      this.#ref = popProperty(props, 'ref')
    }
    this.propsHandler()
  }
  /**
   * 处理属性的方法
   * 该方法负责处理和合并传递给组件的属性，包括样式、类名等特殊属性
   */
  protected propsHandler(): void {
    // 从props中提取v-bind属性，并返回剩余的props
    const vBind = popProperty(this.props, 'v-bind')
    let attrs: Record<string, any> = vBind // 初始化属性对象
    let exclude: string[] = [] // 初始化排除列表
    // 如果vBind是数组，则分别获取属性对象和排除列表
    if (Array.isArray(vBind)) {
      attrs = vBind[0] // 获取属性对象
      exclude = vBind[1] || [] // 获取排除列表，如果不存在则为空数组
    }
    // 如果属性对象存在，则遍历合并属性
    if (isRecordObject(attrs)) {
      for (const key in attrs) {
        // 如果排除列表中包含当前属性或属性是`children`，则跳过
        if (exclude.includes(key) || key === 'children') continue
        if (key in this.props) {
          // 合并样式
          if (key === 'style') {
            this.props[key] = DomHelper.mergeCssStyle(this.props[key], attrs[key])
            continue
          }
          if (key === 'class' || key === 'className' || key === 'classname') {
            this.props[key] = DomHelper.mergeCssClass(this.props[key], attrs[key])
            continue
          }
        }
        this.props[key] = attrs[key]
      }
    }
  }
  /**
   * 获取运行时元素实例
   *
   * @returns {RuntimeElement<T>} 返回节点类型对应的运行时元素实例
   */
  abstract get element(): RuntimeElement<T>

  /**
   * 获取节点的唯一标识符
   *
   * @returns {UniqueKey | null} 返回节点的key值，如果未设置则返回null
   */
  get key(): UniqueKey | null {
    return this.#key
  }

  /**
   * 获取节点的引用属性
   *
   * @returns {NonNullable<VNodeProps<T>>['ref'] | null} 返回节点的ref值，如果未设置则返回null
   */
  get ref(): NonNullable<VNodeProps<T>>['ref'] | null {
    return this.#ref
  }

  /**
   * 获取节点的类型
   *
   * @returns {T} 返回节点的类型
   */
  get type(): T {
    return this.#type
  }

  /**
   * 设置类型属性的值
   * @param value 要设置的类型值
   */
  protected set type(value: T) {
    this.#type = value
  }

  /**
   * 获取名称的getter方法
   * 根据type的类型返回对应的名称
   *
   * @returns {string} 返回名称字符串
   */
  get name(): string {
    // 如果this.#type是字符串类型，则直接返回该字符串
    // 否则返回this.#type的name属性
    return typeof this.#type === 'string' ? this.#type : this.#type.name
  }

  /**
   * 获取节点的属性对象
   *
   * @returns {VNodeProps<T>} 返回节点的属性对象
   */
  get props(): VNodeProps<T> {
    return this.#props
  }

  protected set props(value: VNodeProps<T>) {
    this.#props = value
  }

  /**
   * 父节点对象
   *
   * @returns {VNode | null} 父节点对象，如果没有则返回null
   */
  get parent(): VNode | null {
    return VNode.findParentVNode(this) ?? null
  }

  /**
   * 添加父映射
   *
   * @param child - 子节点
   * @param parent - 父节点
   */
  static addParentVNodeMapping(child: VNode, parent: VNode) {
    this.#parentNodeMapping.set(child, parent)
  }

  /**
   * 查找父节点
   *
   * @param {VNode} vnode - 虚拟节点对象
   * @return {VNode|undefined} - 如果存在父节点则返回父节点的VNode对象
   */
  static findParentVNode(vnode: VNode): VNode | undefined {
    return this.#parentNodeMapping.get(vnode)
  }

  /**
   * 判断给定对象是否为VNode实例
   *
   * @param val - 需要判断的值
   * @returns {boolean} 如果对象是VNode实例则返回true，否则返回false
   */
  static is(val: any): val is VNode {
    return val?.[VNODE_SYMBOL] === true
  }

  /**
   * 挂载虚拟节点到指定的容器中
   *
   * @param [container] - 可选的容器元素，可以是HTML元素、SVG元素或片段元素
   */
  abstract mount(container?: ParentNode): void
  /**
   * 卸载组件的方法
   * 该方法会递归卸载所有子组件，并从DOM中移除当前组件的元素
   */
  abstract unmount(): void

  /**
   * 获取 shadow 元素的访问器属性
   * 如果 shadow 元素不存在，则创建一个空的注释节点作为占位符
   * @returns {Comment} 返回 shadow 元素，可能是已存在的或新创建的注释节点
   */
  get shadowElement(): Comment {
    if (!this.#shadowElement) {
      // 检查 shadowElement 是否已初始化
      this.#shadowElement = document.createComment(
        `${typeof this.type === 'function' ? this.type.name : this.type} shadow element`
      ) // 如果未初始化，创建一个注释节点作为占位符
    }
    return this.#shadowElement // 返回 shadow 元素
  }

  /**
   * 移除Shadow DOM元素并将其引用设置为undefined
   * 这个方法会检查shadowElement是否存在，如果存在则从DOM中移除它，然后将引用置为undefined
   */
  removeShadowElement(): void {
    this.#shadowElement?.remove() // 使用可选链操作符，如果shadowElement存在则调用remove()方法
    this.#shadowElement = undefined // 将shadowElement的引用置为undefined，便于垃圾回收
  }

  /**
   * 切换DOM元素与阴影DOM元素
   * 此方法会根据当前元素的挂载状态，在真实DOM元素和阴影元素之间进行切换
   */
  toggleElement(): void {
    // 检查当前元素是否已挂载到DOM树中
    if (this.element.parentNode) {
      // 如果已挂载，用shadowElement替换当前元素
      this.element.parentNode.replaceChild(this.shadowElement, this.element)
    } else {
      // 如果未挂载（处于shadow状态），将元素恢复到DOM树中
      this.shadowElement.parentNode?.replaceChild(this.element, this.shadowElement)
      this.#shadowElement = undefined // 清除shadowElement引用，便于垃圾回收
    }
  }
  /**
   * 检查是否存在阴影元素
   * @returns {boolean} 如果存在阴影元素则返回true，否则返回false
   */
  hasShadowElement(): boolean {
    return !!this.#shadowElement // 使用双重非运算符将shadowElement转换为布尔值
  }

  /**
   * 让小部件恢复激活状态，重新挂载到父元素上。
   *
   * @param {boolean} root - 是否是根节点，默认为true，内部递归激活时使用，勿肆意传入！
   * @returns {void}
   */
  abstract activate(root: boolean): void

  /**
   * 停用小部件
   * 此方法用于停用当前小部件及其子节点，处理相关的生命周期钩子，
   * 并根据是否为根节点执行不同的移除逻辑。
   *
   * @param root - 该参数用于递归时内部判断是否需要移除当前元素。
   */
  abstract deactivate(root: boolean): void
}
