import { NON_SIGNAL_SYMBOL, unref } from '@vitarx/responsive'
import { isObject, isRecordObject, popProperty } from '@vitarx/utils'
import { getDomAdapter } from '../../host-adapter/index.js'
import type {
  BindParentElement,
  HostAdapter,
  HostAnchorElement,
  HostElementInstance,
  HostParentElement,
  MountType,
  NodeDevInfo,
  NodeNormalizedProps,
  NodeTypes,
  UniqueKey,
  VNodeInputProps,
  VNodeIntrinsicAttributes
} from '../../types/index.js'
import {
  INTRINSIC_ATTRIBUTES,
  NodeShapeFlags,
  NodeState,
  VIRTUAL_NODE_SYMBOL,
  VNODE_PROPS_DEV_INFO_KEY_SYMBOL
} from '../constants/index.js'
import { isRefEl, type RefEl } from '../runtime/ref.js'
import { StyleUtils } from '../utils/index.js'

/**
 * 待规范化的属性类型
 *
 * 去除了固有属性，只保留了用户输入的其他属性
 */
export type WaitNormalizedProps<T extends NodeTypes> = Omit<
  VNodeInputProps<T>,
  keyof VNodeIntrinsicAttributes
>

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
 * - anchor 元素处理
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
export abstract class VNode<T extends NodeTypes = NodeTypes> {
  /**
   * 标记为非信号状态的getter
   */
  readonly [NON_SIGNAL_SYMBOL]: true = true
  /**
   * 标记为虚拟节点的 getter 方法
   */
  readonly [VIRTUAL_NODE_SYMBOL]: true = true
  /**
   * 节点标志位
   */
  public abstract readonly shapeFlags: NodeShapeFlags
  /**
   * 虚拟节点的调试信息
   *
   * 仅在开发模式下存在
   */
  public devInfo?: NodeDevInfo
  /**
   * 虚拟节点类型
   * 可以是标签名（如 'div'）、组件（函数或类）或特殊符号
   *
   * @readonly - 外部只读，请勿修改！
   */
  public type: T
  /**
   * 唯一标识符
   *
   * @readonly - 外部只读，请勿修改！
   */
  public readonly key: UniqueKey | null = null
  /**
   * 引用
   */
  public ref: RefEl<any> | null = null
  /**
   * 静态节点
   *
   * @readonly - 外部只读，请勿修改！
   */
  public isStatic: boolean = false
  /**
   * 规范化后的属性对象
   *
   * @readonly - 外部只读，请勿修改！
   */
  public props: NodeNormalizedProps<T>

  /**
   * 创建一个虚拟节点实例
   * @param type 虚拟节点的类型，可以是标签名、组件函数或其他类型
   * @param props 虚拟节点的属性对象
   */
  constructor(type: T, props: VNodeInputProps<T>) {
    // 节点类型
    this.type = type
    if (Object.keys(props).length) {
      // 提取key属性
      this.key = popProperty(props, 'key') ?? null
      const ref = popProperty(props, 'ref')
      // 引用
      this.ref = isRefEl(ref) ? ref : null
      // 提取显示属性
      this._show = 'v-show' in props ? !!unref(popProperty(props, 'v-show')) : true
      // 静态节点
      this.isStatic = !!unref(popProperty(props, 'v-static'))
      // TODO 待实现缓存
      const memo = popProperty(props, 'v-memo')
      // 传送目标
      this._teleport = popProperty(props, 'v-parent') || null
      // 开发模式下的调试信息
      this.devInfo = popProperty(props, VNODE_PROPS_DEV_INFO_KEY_SYMBOL)
      /**
       * 处理绑定属性
       */
      VNode.handleBindProps(props)
    }
    this.props = this.normalizeProps(props)
  }

  /**
   * 显示状态
   *
   * @readonly - 外部只读，请勿修改！
   */
  private _show: boolean = true

  get show(): boolean {
    return this._show
  }
  /**
   * 设置v-show的属性值
   * @param value - 传入的显示状态值，可以是响应式引用或普通值
   */
  set show(value: boolean) {
    if (value !== this.show) {
      // 比较新值与当前值，只在不同时更新
      this._show = value // 更新内部显示状态
      this.handleShowState(value)
    }
  }

  /**
   * 节点状态
   *
   * @readonly - 外部只读，请勿修改！
   */
  private _state: NodeState = NodeState.Created

  /**
   * 获取当前节点的状态
   * 这是一个getter方法，用于返回VNode的内部状态
   * @returns {NodeState} 返回当前VNode的内部状态
   */
  get state(): NodeState {
    return this._state
  }

  /**
   * 设置虚拟节点状态的受保护方法
   *
   * @protected
   * @param state - 要设置的新的虚拟节点状态
   */
  protected set state(state: NodeState) {
    // 如果设置的状态与当前状态相同，则直接返回，不做任何处理
    if (state === this._state) return
    // 如果设置的状态为未挂载(Unmounted)状态
    if (state === NodeState.Unmounted || state === NodeState.Created) {
      // 清除锚点引用
      this._anchor = null
    }
    this._state = state
  }

  /**
   * 传送目标
   */
  private _teleport: Exclude<BindParentElement, undefined> = null

  /**
   * 获取teleport属性的方法
   * 这是一个getter，用于获取或计算teleport的目标元素
   * @returns {HostParentElement | null} 返回宿主父级元素，如果不存在则返回null
   */
  get teleport(): HostParentElement | null {
    if (typeof this._teleport === 'string') {
      // 检查_teleport是否为字符串类型
      const target = this.dom.querySelector(this._teleport) // 如果是字符串，则使用该字符串作为选择器查询DOM元素
      if (target && this.dom.isContainer(target)) {
        // 检查查询到的元素是否存在以及是否为容器元素
        return (this._teleport = target as HostParentElement) // 如果验证通过，将_teleport更新为该元素并返回
      }
      return null // 如果验证不通过，返回null
    }
    return this._teleport // 如果_teleport不是字符串，直接返回其值
  }

  /**
   * 设置teleport属性
   *
   * @param value - 绑定的父元素，类型为BindParentElement
   */
  set teleport(value: BindParentElement) {
    const oldTeleport = this.teleport // 保存当前的teleport元素
    this._teleport = value || null // 更新teleport元素，如果value为undefined或null则设为null
    const newTeleport = this.teleport // 获取更新后的teleport元素
    // 如果是活跃状态，则
    if (this._state !== NodeState.Activated) return
    // 如果清空teleport元素，则用当前元素替换占位锚点
    if (oldTeleport && !newTeleport) {
      this.dom.replace(this.element, this.anchor)
    }
    // 如果设置teleport元素
    if (newTeleport && !oldTeleport) {
      // 占位锚点替换当前元素
      this.dom.replace(this.anchor, this.element)
      // 当前元素插入到新的锚点中
      this.dom.appendChild(newTeleport, this.element)
    }
  }

  /**
   * 返回节点的元素实例
   *
   * 如果是组件类型节点则返回组件的根元素实例
   */
  abstract readonly element: HostElementInstance<T>
  /**
   * 获取 Dom 适配器实例
   */
  get dom(): HostAdapter {
    return getDomAdapter()
  }

  /**
   * 获取名称的getter方法
   * 根据type的类型返回对应的名称
   *
   * @returns {string} 返回名称字符串
   */
  get name(): string {
    // 如果this.type是字符串类型，则直接返回该字符串
    // 否则返回this.type的displayName|name属性
    return typeof this.type === 'string'
      ? this.type
      : ((this.type as unknown as { displayName: string }).displayName ?? this.type.name)
  }

  /**
   * DOM 锚点（Anchor Node）
   *
   * 用于在节点启用传送（teleport）或临时停用（deactivate）时，
   * 记录该节点在原始 DOM 树中的实际插入位置。
   *
   * 框架通过此锚点在重新激活（activate）时恢复节点顺序，
   * 或在传送结束时将节点还原至原始位置。
   */
  private _anchor: HostAnchorElement | null = null

  /**
   * 获取或创建当前组件的锚点元素
   * 这是一个受保护属性，用于在DOM中标记组件的位置
   * @returns {HostAnchorElement} 返回一个注释节点作为锚点，用于在DOM中标记组件的位置
   */
  public get anchor(): HostAnchorElement {
    // 如果锚点元素尚未创建，则创建一个新的注释节点作为锚点
    if (!this._anchor) {
      // 创建一个注释节点，内容包含组件名称和"anchor placeholder"标记
      // 这个注释节点将作为组件在DOM中的位置标记
      return (this._anchor = this.dom.createComment(`${this.name} placeholder anchor`))
    }
    // 如果锚点元素已存在，直接返回它
    return this._anchor
  }

  /**
   * 处理属性绑定
   * @param props - 需要处理的属性对象
   */
  private static handleBindProps(props: Record<string, any>) {
    // 弹出 v-bind 属性
    const bind = popProperty(props, 'v-bind')
    // 如果 v-bind 不是对象，则直接返回
    if (!isObject(bind)) return
    // ---------- 提取绑定对象与排除列表 ----------
    let source: Record<string, any> | undefined // 源对象

    // 基础排除列表（包含固有属性）
    const exclude = INTRINSIC_ATTRIBUTES

    // 如果 v-bind 是数组形式
    if (Array.isArray(bind)) {
      source = bind[0] // 获取源对象
      // 如果源对象不是记录对象，则返回
      if (!isRecordObject(source)) return
      if (Array.isArray(bind[1])) {
        for (const extra of bind[1]) {
          exclude.add(extra)
        }
      }
    } else {
      source = bind // 直接使用 v-bind 作为源对象
    }

    // ---------- 遍历并合并属性 ----------
    // 遍历源对象的每个属性
    for (const [key, rawValue] of Object.entries(source)) {
      // 如果值为 undefined 或在排除列表中，则跳过
      if (rawValue === undefined || exclude.has(key)) continue
      // 如果属性已存在
      if (key in props) {
        // ---- 特殊处理 style ----
        if (key === 'style') {
          // 合并样式对象
          props[key] = StyleUtils.mergeCssStyle(unref(props[key]), unref(rawValue))
          continue
        }
        // ---- 特殊处理 class ----
        if (key === 'class' || key === 'className' || key === 'classname') {
          // 合并类名字符串或对象
          props[key] = StyleUtils.mergeCssClass(unref(props[key]), unref(rawValue))
          continue
        }
        continue
      }

      // ---- 普通属性 ----
      // 直接添加新属性
      props[key] = rawValue
    }
  }

  /**
   * 挂载虚拟节点到指定的容器中
   *
   * @param [target] - 挂载目标，仅根节点需要提供，其他节点在渲染时就已经形成真实的挂载关系，所以不需要提供
   * @param [type='appendChild'] - 挂载类型，可以是 insertBefore、insertAfter、replace 或 appendChild
   */
  abstract mount(target?: HostParentElement, type?: MountType): void

  /**
   * 让小部件恢复激活状态，重新挂载到父元素上。
   *
   * @param {boolean} root - 如果root为true，则需要重新挂载元素，false则不需要
   * @returns {void}
   */
  abstract activate(root: boolean): void

  /**
   * 卸载元素或组件的方法
   *
   * 此方法需实现元素/组件的卸载逻辑
   *
   * @param {boolean} [root] - 是否做为根元素卸载
   */
  abstract unmount(root?: boolean): void

  /**
   * 停用小部件
   *
   * 此方法用于停用当前节点及其子节点，处理相关的生命周期钩子，
   * 并根据是否为根节点执行不同的移除逻辑。
   *
   * @param root - 如果为true，则需要移除元素，false则不需要
   */
  abstract deactivate(root: boolean): void

  /**
   * 抽象方法，用于处理显示状态的变更
   * @param is 布尔值，表示新的显示状态
   */
  protected abstract handleShowState(is: boolean): void

  /**
   * 规范化组件属性的抽象方法
   * 该方法用于处理和验证组件特定的属性，排除全局属性
   * @param props - 需要规范化的组件属性对象，类型为排除全局属性后的有效创建属性
   */
  protected abstract normalizeProps(props: WaitNormalizedProps<T>): NodeNormalizedProps<T>

  /**
   * 移除锚点元素的方法
   * 如果存在锚点元素(_anchor)，则从DOM中移除该元素，并将锚点引用置为null
   */
  protected removeAnchor() {
    // 检查是否存在锚点元素
    if (this._anchor) {
      // 从DOM中移除锚点元素
      this.dom.remove(this._anchor)
      // 将锚点引用置为null
      this._anchor = null
    }
  }
}
