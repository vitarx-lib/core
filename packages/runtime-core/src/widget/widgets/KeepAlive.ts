import { useRenderer } from '../../renderer/index.js'
import type {
  AnyProps,
  NodeElementType,
  StatefulWidgetVNode,
  TextVNodeType,
  UniqueKey,
  VNode,
  WidgetTypes,
  WidgetVNode
} from '../../types/index.js'
import { getNodeDomOpsTarget, isWidget, isWidgetNode, onPropChange } from '../../utils/index.js'
import {
  activateNode,
  createVNode,
  deactivateNode,
  mountNode,
  unmountNode
} from '../../vnode/index.js'
import { Widget } from '../base/index.js'

/**
 * KeepAlive配置选项
 */
export interface KeepAliveProps {
  /**
   * 当前展示的小部件或元素
   * @example
   * ```tsx
   * import { shallowRef,types WidgetType } from 'vitarx'
   * import User from './User.js'
   * import Home from './Home.js'
   * const showChild = shallowRef<WidgetType>(User)
   * // 使用 children attribute 传入子部件
   * <KeepAlive children={showChild}/>
   * // 使用插槽传入小部件
   * <KeepAlive>
   *   { showChild }
   * </KeepAlive>
   * // 使用 render 动态渲染
   * <KeepAlive>
   *   <render is={showChild} test="透传attr">
   * </KeepAlive>
   * // 更改显示的组件，User组件会触发onDeactivate钩子
   * showChild.value = Home
   * ```
   */
  children: WidgetTypes | VNode
  /**
   * 需要缓存的节点类型
   *
   * 当为空时，将缓存所有类型的节点
   *
   * @default []
   */
  include: WidgetTypes[]
  /**
   * 需要销毁状态的节点类型列表
   *
   * 优先级高于 include
   *
   * @default []
   */
  exclude: WidgetTypes[]
  /**
   * 最大缓存数量
   *
   * 如果小于1，则不限制缓存的数量
   *
   * @default 10
   */
  max: number
}

/**
 * KeepAlive
 *
 * 缓存小部件实例，以减少小部件的创建和销毁性能开销。
 *
 * 这在某些场景下非常有用，例如：数据列表，频繁从树中移除又创建的小部件。
 *
 * 核心功能：
 * - 缓存小部件实例，避免重复创建和销毁
 * - 支持配置最大缓存数量
 * - 支持指定需要缓存或排除缓存的小部件类型
 *
 * @example
 * ```tsx
 * import { shallowRef,types WidgetType } from 'vitarx'
 * import User from './User.js'
 * import Home from './Home.js'
 * const showChild = shallowRef<WidgetType>(User)
 * // 使用 children attribute 传入子部件
 * <KeepAlive children={showChild}/>
 * // 使用插槽传入小部件
 * <KeepAlive>
 *   { showChild }
 * </KeepAlive>
 * // 使用 render 动态渲染
 * <KeepAlive>
 *   <render is={showChild} test="透传attr">
 * </KeepAlive>
 * // 更改显示的组件，User组件会触发onDeactivate钩子
 * showChild.value = Home
 * ```
 *
 * @constructor
 * @param {KeepAliveProps} props - 组件属性
 * @param {WidgetTypes|VNode} props.children - 需要缓存的小部件
 * @param {number} [props.max=10] - 最大缓存数量
 * @param {string[]} [props.include=[]] - 需要缓存的小部件类型列表
 * @param {string[]} [props.exclude=[]] - 不需要缓存的小部件类型列表
 *
 * @note
 * - children 属性是必需的
 * - 当缓存数量超过 max 时，会按照先进先出的原则移除最早缓存的小部件
 * - 在组件卸载时会自动清理所有缓存的实例
 */
export class KeepAlive extends Widget<KeepAliveProps> {
  static override defaultProps = {
    max: 10,
    include: [],
    exclude: []
  }
  /**
   * 缓存的节点实例
   */
  public readonly cached: Map<WidgetTypes, Map<UniqueKey | undefined, WidgetVNode>> = new Map()
  /**
   * 当前展示的小部件
   * @protected
   */
  protected currentChild: WidgetVNode

  constructor(props: KeepAliveProps) {
    super(props)
    // 缓存当前展示的小部件
    this.currentChild = this.makeChildVNode(props.children)
    // 开始监听 props.children
    onPropChange(this.props, 'children', this.handleChildChange.bind(this))
  }

  /**
   * 缓存的最大数量
   */
  get max() {
    return this.props.max
  }

  /**
   * 需要缓存的小部件
   */
  get include() {
    return this.props.include
  }

  /**
   * 排除缓存的小部件
   */
  get exclude() {
    return this.props.exclude
  }

  /**
   * 静态方法，用于验证组件的属性
   * @override 重写父类的验证方法
   * @param props - 需要验证的属性对象
   * @throws Error 当缺少children属性时抛出错误
   */
  static override validateProps(props: AnyProps) {
    // 检查是否存在children属性
    if (!props.children) throw new TypeError('KeepAlive children is required')
    if (!isWidgetNode(props.children) && typeof props.children !== 'function') {
      throw new TypeError('KeepAlive children must be a WidgetNode or a Widget')
    }
  }

  /**
   * 判断是否需要缓存
   *
   * @param type
   */
  isKeep(type: WidgetTypes): boolean {
    if (this.exclude.includes(type)) return false
    return this.include.length === 0 || this.include.includes(type)
  }

  /**
   * 构建并返回当前子节点的虚拟DOM节点
   * @returns {VNode} 返回当前子节点对应的虚拟DOM节点
   */
  build(): VNode {
    return this.currentChild // 直接返回当前子节点作为虚拟DOM节点
  }

  /**
   * 卸载前卸载所有已缓存的实例
   *
   * @protected
   */
  override onBeforeUnmount(): void {
    // 遍历缓存中的所有 VNode 并卸载其实例
    this.cached.forEach(typeCache => {
      // 遍历每个 VNode 卸载实例
      typeCache.forEach(vnode => vnode !== this.currentChild && unmountNode(vnode))
    })
    // 清空缓存
    this.cached.clear()
  }

  /**
   * @inheritDoc
   */
  override $patchUpdate(oldVNode: StatefulWidgetVNode, newVNode: StatefulWidgetVNode): VNode {
    // 提前检查是否需要创建占位符
    let placeholderElement: NodeElementType<TextVNodeType> | null = null
    const dom = useRenderer()
    if (newVNode.state !== 'deactivated') {
      placeholderElement = dom.createText('')
      dom.insertBefore(placeholderElement, getNodeDomOpsTarget(oldVNode))
    }

    // 统一处理旧节点的清理
    if (this.isKeep(oldVNode.type)) {
      deactivateNode(oldVNode, true)
    } else {
      unmountNode(oldVNode)
    }
    // 处理新节点的激活或挂载
    if (newVNode.state === 'deactivated') {
      activateNode(newVNode)
    } else {
      mountNode(newVNode, placeholderElement!, 'replace')
    }

    return newVNode
  }

  /**
   * 生成子节点
   */
  protected makeChildVNode(children: WidgetTypes | VNode): WidgetVNode {
    if (isWidgetNode(children)) {
      return children
    } else if (isWidget(children)) {
      return createVNode(children)
    }
    throw new TypeError('KeepAlive children must be a WidgetNode or a Widget')
  }

  /**
   * 处理子部件类型变化
   *
   * @protected
   */
  protected handleChildChange(child: WidgetTypes | VNode) {
    const newVNode = this.makeChildVNode(child)
    const newType = newVNode.type // 新的组件类型
    const newKey = newVNode.key // 新的组件唯一键
    const currentType = this.currentChild.type // 当前组件类型
    const currentKey = this.currentChild.key // 当前组件的唯一键
    // 如果类型或 key 不同，表示需要切换组件
    if (newType !== currentType || newKey !== currentKey) {
      // 缓存当前组件
      this.addCache(this.currentChild)

      // 查找缓存中是否存在新组件实例
      const typeCache = this.cached.get(newType)
      const cacheVNode = typeCache?.get(newKey)

      if (cacheVNode) {
        // 如果缓存中有符合的新组件实例，直接复用
        this.currentChild = cacheVNode
      } else {
        // 如果没有缓存，创建新的组件实例
        this.currentChild = newVNode
      }

      // 更新组件
      this.$forceUpdate()
    }
  }

  /**
   * 添加缓存
   *
   * @param vnode
   */
  protected addCache(vnode: WidgetVNode) {
    const type = vnode.type
    const key = vnode.key
    if (this.isKeep(type)) {
      // 确保缓存存在对应的类型映射
      if (!this.cached.has(type)) {
        this.cached.set(type, new Map())
      }

      const typeCache = this.cached.get(type)!

      // 如果同 key 已存在，先移除旧缓存
      if (typeCache.has(key)) {
        typeCache.delete(key)
      }

      // 添加到缓存
      typeCache.set(key, vnode)

      // 检查缓存总大小
      if (this.max > 0) {
        let totalSize = 0
        for (const typeMap of this.cached.values()) {
          totalSize += typeMap.size
        }

        if (totalSize > this.max) {
          // 超出限制，移除第一个缓存（按插入顺序）
          const firstType = this.cached.keys().next().value!
          const firstTypeMap = this.cached.get(firstType)!
          const firstKey = firstTypeMap.keys().next().value!
          const firstVNode = firstTypeMap.get(firstKey)
          if (firstVNode) {
            unmountNode(firstVNode)
            firstTypeMap.delete(firstKey)
          }
          // 如果该类型的缓存已空，移除类型
          if (firstTypeMap.size === 0) {
            this.cached.delete(firstType)
          }
        }
      }
    }
  }
}
