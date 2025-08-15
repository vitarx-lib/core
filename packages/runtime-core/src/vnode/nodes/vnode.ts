import { popProperty } from '@vitarx/utils/src/index'
import type { FragmentElement, RuntimeElement, UniqueKey, VNodeProps, VNodeType } from '../types'

/**
 * 虚拟节点抽象类
 *
 * @template T - 节点类型
 */
export abstract class VNode<T extends VNodeType = VNodeType> {
  /**
   * 父节点映射
   *
   * @private
   */
  static #parentNodeMapping = new WeakMap<VNode, VNode>()
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
  readonly #key: UniqueKey | null
  /**
   * 引用
   */
  readonly #ref: NonNullable<VNodeProps<T>>['ref'] | null

  /**
   * 创建一个虚拟节点实例
   * @param type 虚拟节点的类型，可以是标签名、组件函数或其他类型
   * @param props 虚拟节点的属性对象
   */
  protected constructor(type: T, props: VNodeProps<T> | null = null) {
    // 节点类型
    this.#type = type
    // 节点属性
    this.#props = props ?? ({} as VNodeProps<T>)
    // 提取key属性
    this.#key = props ? popProperty(props, 'key') : null
    // 引用
    this.#ref = props ? popProperty(props, 'ref') : null
    // TODO 需格式化props
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
    return val instanceof VNode
  }

  /**
   * 挂载虚拟节点到指定的容器中
   *
   * @param [container] - 可选的容器元素，可以是HTML元素、SVG元素或片段元素
   */
  abstract mount(container?: HTMLElement | SVGElement | FragmentElement): void

  /**
   * 卸载组件的方法
   * 该方法会递归卸载所有子组件，并从DOM中移除当前组件的元素
   */
  abstract unmount(): void
}
