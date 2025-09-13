import { isArrayEqual, isRecordObject, popProperty } from '@vitarx/utils'
import { DomHelper } from '../../dom/index.js'
import { isVNode } from '../guards.js'
import { VNODE_SYMBOL } from '../node-symbol.js'
import { addParentVNodeMapping, findParentVNode } from '../relations.js'
import type { RuntimeElement, UniqueKey, VNodeProps, VNodeType } from '../types/index.js'

export type Source = { fileName: string; lineNumber: number; columnNumber: number }
const MEMO_STORE = new WeakMap<Array<any>, VNode>()
/**
 * 虚拟节点（VNode）基类，用于构建虚拟DOM树结构。
 *
 * 该类提供了虚拟节点的核心功能，包括节点类型管理、属性处理、缓存机制、
 * 父子节点关系维护等。作为抽象类，它定义了虚拟节点的基本行为和接口，
 * 具体的渲染和挂载逻辑由子类实现。
 *
 * 主要功能：
 * - 节点类型和属性管理
 * - 节点缓存和记忆功能（memo）
 * - 父子节点关系维护
 * - Shadow DOM元素处理
 * - 节点生命周期管理（挂载、卸载、激活、停用）
 *
 * @template T - 节点类型
 * @param type - 虚拟节点的类型，可以是标签名（如'div'）、组件（函数或类）或其他类型
 * @param props - 虚拟节点的属性对象，包含节点的各种配置和属性
 *
 * @warning
 * - 不应直接实例化此类，而应通过其子类使用
 * - 使用activate/deactivate方法时需注意root参数的正确使用
 */
export abstract class VNode<T extends VNodeType = VNodeType> {
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
   * 缓存
   *
   * 请勿外部修改此属性！
   */
  readonly #memo?: Array<any>
  /**
   * 唯一标识符
   */
  readonly #key?: UniqueKey
  #shadowElement?: Comment
  /**
   * 引用
   */
  #ref?: NonNullable<VNodeProps<T>>['ref']
  /**
   * 静态节点
   * @private
   */
  readonly #isStatic: boolean = false
  /**
   * 创建一个虚拟节点实例
   * @param type 虚拟节点的类型，可以是标签名、组件函数或其他类型
   * @param props 虚拟节点的属性对象
   */
  constructor(type: T, props: VNodeProps<T> | null = null) {
    Object.defineProperty(this, VNODE_SYMBOL, { value: true })
    // 节点类型
    this.#type = type
    // 节点属性
    this.#props = props ?? ({} as VNodeProps<T>)
    if (props) {
      // 提取key属性
      this.#key = popProperty(props, 'key')
      // 引用
      this.#ref = popProperty(props, 'ref')
      // 缓存
      const memo = popProperty(props, 'v-memo')
      // 初始化缓存
      if (Array.isArray(memo) && !MEMO_STORE.get(memo)) {
        // 备份之前的值
        this.#memo = Array.from(memo)
        MEMO_STORE.set(memo, this)
      }
      this.#isStatic = !!popProperty(props, 'v-static')
    }
    this.propsHandler()
  }

  /**
   * 获取一个布尔值，表示当前元素是否为静态定位
   * @returns {boolean} 如果元素是静态定位则返回true，否则返回false
   */
  get isStatic(): boolean {
    return this.#isStatic
  }

  /**
   * 获取节点的唯一标识符
   *
   * @returns {UniqueKey | null} 返回节点的key值，如果未设置则返回null
   */
  get key(): UniqueKey | undefined {
    return this.#key
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
   * 获取节点的引用属性
   *
   * @returns {NonNullable<VNodeProps<T>>['ref'] | null} 返回节点的ref值，如果未设置则返回null
   */
  get ref(): NonNullable<VNodeProps<T>>['ref'] | undefined {
    return this.#ref
  }

  /**
   * 设置引用属性的方法
   * @param value - 新的引用值，类型为 NonNullable<VNodeProps<T>>['ref'] 或 undefined
   */
  protected set ref(value: NonNullable<VNodeProps<T>>['ref'] | undefined) {
    // 将传入的值赋给实例的私有属性 #ref
    this.#ref = value
  }
  /**
   * 获取存储在类中的备忘录数组
   * 这是一个getter方法，用于返回私有属性#memo的值
   * @returns {Array<any> | undefined} 返回存储的备忘录数组，如果未设置则返回undefined
   */
  get memo(): Array<any> | undefined {
    return this.#memo
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
   * 从内存存储中获取指定索引对应的虚拟节点(VNode)
   *
   * @param memo - memo条件数组，用于匹配缓存的节点
   * @returns {VNode|undefined} 返回找到的且匹配则VNode，如果未找到则返回undefined
   */
  static getMemoNode(memo: Array<any>): VNode | undefined {
    const node = MEMO_STORE.get(memo)
    return node && isArrayEqual(memo, node.memo!) ? node : undefined
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
    addParentVNodeMapping(child, parent)
  }

  /**
   * 查找父节点
   *
   * @param {VNode} vnode - 虚拟节点对象
   * @return {VNode|undefined} - 如果存在父节点则返回父节点的VNode对象
   */
  static findParentVNode(vnode: VNode): VNode | undefined {
    return findParentVNode(vnode)
  }

  /**
   * 判断给定值是否为VNode实例
   *
   * @param val - 需要判断的值
   * @returns {boolean} 如果对象是VNode实例则返回true，否则返回false
   */
  static is(val: any): val is VNode {
    return isVNode(val)
  }

  /**
   * 挂载虚拟节点到指定的容器中
   *
   * @param [container] - 可选的容器元素，可以是HTML元素、SVG元素或片段元素
   */
  abstract mount(container?: ParentNode): void
  /**
   * 卸载元素或组件的方法
   *
   * 此方法需实现元素/组件的卸载逻辑
   *
   * @param {boolean} [root] - 绝对是否做为根元素卸载
   */
  abstract unmount(root?: boolean): void

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
   * 设置 shadow 元素
   * @param el - Comment 类型的 DOM 节点，作为 shadow 元素
   */
  protected set shadowElement(el: Comment) {
    this.#shadowElement = el // 设置 shadow 元素
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
