import { watchProperty } from '@vitarx/responsive'
import { DomHelper } from '../../dom/index.js'
import { createVNode, type UniqueKey, VNode, WidgetType, WidgetVNode } from '../../vnode/index.js'
import { Widget } from '../widget.js'

/**
 * KeepAlive配置选项
 */
export interface KeepAliveProps {
  /**
   * 当前展示的小部件
   *
   * 可以直接传入小部件，也可以传入一个`VNode`对象，
   * 如果传入VNode对象需确保其是组件节点，而不是普通的元素节点或片段节点！
   */
  children: WidgetType | VNode
  /**
   * 需要保留状态的小部件列表
   *
   * 当为空时，将缓存所有小部件
   */
  include?: WidgetType[]
  /**
   * 需要销毁状态的小部件列表
   *
   * 优先级高于 include
   */
  exclude?: WidgetType[]
  /**
   * 最大缓存数量
   *
   * 如果小于1，则不限制缓存的数量
   *
   * @default 10
   */
  max?: number
}

/**
 * ## KeepAlive
 *
 * 缓存小部件实例，以减少小部件的创建和销毁性能开销。
 *
 * 这在某些场景下非常有用，例如：数据列表，频繁从树中移除又创建的小部件。
 */
export class KeepAlive extends Widget<KeepAliveProps> {
  /**
   * 缓存
   */
  public readonly cache: Map<WidgetType, Map<UniqueKey | undefined, VNode<WidgetType>>> = new Map()
  protected currentChild: VNode<WidgetType>

  constructor(props: KeepAliveProps) {
    super(props)
    // 缓存当前展示的小部件
    this.currentChild = this.makeChildVNode()
    // 开始监听 props.children
    watchProperty(this.props, 'children', this.handleChildChange.bind(this))
  }

  /**
   * 需要缓存的小部件
   */
  get include() {
    if (!this.props.include) return []
    return this.props.include
  }

  /**
   * 排除缓存的小部件
   */
  get exclude() {
    if (!this.props.exclude) return []
    return this.props.exclude
  }

  /**
   * 缓存的最大数量
   */
  get max() {
    return this.props.max ?? 10
  }

  /**
   * 判断是否需要缓存
   *
   * @param type
   */
  isKeep(type: WidgetType): boolean {
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
    this.cache.forEach(typeCache => {
      typeCache.forEach(vnode => vnode.unmount())
    })
    // 清空缓存
    this.cache.clear()
  }

  /**
   * @inheritDoc
   */
  override $patchUpdate(oldVNode: WidgetVNode, newVNode: WidgetVNode): VNode {
    // 提前检查是否需要创建占位符
    let placeholderElement: Text | null = null
    if (newVNode.state !== 'deactivated') {
      placeholderElement = document.createTextNode('')
      DomHelper.insertBefore(
        placeholderElement,
        oldVNode.teleport ? oldVNode.shadowElement : oldVNode.element
      )
    }

    // 统一处理旧节点的清理
    if (this.isKeep(oldVNode.type)) {
      oldVNode.deactivate()
    } else {
      oldVNode.unmount()
    }

    // 处理新节点的激活或挂载
    if (newVNode.state === 'deactivated') {
      newVNode.activate()
    } else {
      // 替换元素
      DomHelper.replace(
        newVNode.teleport ? newVNode.shadowElement : newVNode.element,
        placeholderElement!
      )
      newVNode.mount()
    }

    return newVNode
  }

  /**
   * 生成子节点
   */
  protected makeChildVNode(): VNode<WidgetType> {
    const isValidVNode = VNode.is(this.children)
    const type = isValidVNode ? this.children.type : this.children
    if (typeof type !== 'function') {
      const message = `[Vitarx.KeepAlive]：KeepAlive children 必须是函数式小部件或类小部件，给定${String(type)}`
      throw new Error(message)
    }
    if (isValidVNode) {
      return this.children as VNode<WidgetType>
    } else {
      return createVNode(this.children)
    }
  }

  /**
   * 处理子部件类型变化
   *
   * @protected
   */
  protected handleChildChange() {
    const newVNode = this.makeChildVNode()
    const newType = newVNode.type // 新的组件类型
    const newKey = newVNode.key // 新的组件唯一键
    const currentType = this.currentChild.type // 当前组件类型
    const currentKey = this.currentChild.key // 当前组件的唯一键
    // 如果类型或 key 不同，表示需要切换组件
    if (newType !== currentType || newKey !== currentKey) {
      // 缓存当前组件
      this.addCache(this.currentChild)

      // 查找缓存中是否存在新组件实例
      const typeCache = this.cache.get(newType)
      const cacheVNode = typeCache?.get(newKey)

      if (cacheVNode) {
        // 如果缓存中有符合的新组件实例，直接复用
        this.currentChild = cacheVNode
      } else {
        // 如果没有缓存，创建新的组件实例
        this.currentChild = newVNode
      }

      // 更新组件
      this.update()
    }
  }

  /**
   * 添加缓存
   *
   * @param vnode
   */
  protected addCache(vnode: VNode<WidgetType>) {
    const type = vnode.type
    const key = vnode.key
    if (this.isKeep(type)) {
      // 确保缓存存在对应的类型映射
      if (!this.cache.has(type)) {
        this.cache.set(type, new Map())
      }

      const typeCache = this.cache.get(type)!

      // 如果同 key 已存在，先移除旧缓存
      if (typeCache.has(key)) {
        typeCache.delete(key)
      }

      // 添加到缓存
      typeCache.set(key, vnode)

      // 检查缓存总大小
      if (this.max > 0) {
        let totalSize = 0
        for (const typeMap of this.cache.values()) {
          totalSize += typeMap.size
        }

        if (totalSize > this.max) {
          // 超出限制，移除第一个缓存（按插入顺序）
          const firstType = this.cache.keys().next().value!
          const firstTypeMap = this.cache.get(firstType)!
          const firstKey = firstTypeMap.keys().next().value!
          firstTypeMap.get(firstKey)?.unmount()
          firstTypeMap.delete(firstKey)

          // 如果该类型的缓存已空，移除类型
          if (firstTypeMap.size === 0) {
            this.cache.delete(firstType)
          }
        }
      }
    }
  }
}
