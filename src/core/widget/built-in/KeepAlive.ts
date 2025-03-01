import { type Element, Widget } from '../widget.js'
import { WidgetRenderer } from '../../renderer/index.js'
import {
  createVNode,
  isVNode,
  type OnlyKey,
  type VNode,
  type WidgetType
} from '../../vnode/index.js'
import { watchPropChange } from '../../observer/index.js'
import { insertBeforeExactly, renderElement } from '../../renderer/web-runtime-dom/index.js'

/**
 * KeepAlive配置选项
 */
export interface KeepAliveProps {
  /**
   * 当前展示的小部件
   *
   * 可以是`VNode`对象、类小部件构造函数、函数式小部件
   *
   * 如果需要给小部件传入一些参数，则应该传入`VNode`对象
   */
  children: WidgetType | VNode<WidgetType>
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
  /**
   * 唯一键
   *
   * 同类型小部件可以指定不同的onlyKey来维持不同的实例
   *
   * 如果`children`传入的是一个`VNode`对象，`key`未定义时会被自动设置为onlyKey
   */
  onlyKey?: OnlyKey
}

/**
 * ## KeepAlive
 *
 * 缓存小部件实例，以减少小部件的创建和销毁性能开销。
 *
 * 这在某些场景下非常有用，例如：数据列表，频繁从树中移除又创建的小部件。
 */
export class KeepAlive extends Widget<KeepAliveProps> {
  protected cache: Map<WidgetType, Map<OnlyKey | undefined, VNode<WidgetType>>> = new Map()
  protected currentChild: VNode<WidgetType>

  constructor(props: KeepAliveProps) {
    super(props)
    // 缓存当前展示的小部件
    this.currentChild = this.makeChildVNode()
    // 开始监听 props.children
    watchPropChange(this.props, 'children', this.handleChildChange.bind(this))
  }

  /**
   * 生成子节点
   */
  protected makeChildVNode() {
    const isValidVNode = isVNode(this.children)
    const type = isValidVNode ? this.children.type : this.children
    if (typeof type !== 'function') {
      const message = `[Vitarx.KeepAlive]：KeepAlive children 必须是函数式小部件或类小部件，给定${String(type)}`
      throw new Error(message)
    }
    if (isValidVNode) {
      if (!this.children.key && this.props.onlyKey) {
        this.children.key = this.props.onlyKey
      }
      return this.children
    } else {
      return createVNode(this.children, { key: this.props.onlyKey })
    }
  }

  /**
   * 添加缓存
   *
   * @param vnode
   */
  protected addCache(vnode: VNode<WidgetType>) {
    const type = vnode.type
    const key = vnode.key ?? undefined
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
          firstTypeMap.get(firstKey)?.instance?.['renderer'].unmount()
          firstTypeMap.delete(firstKey)

          // 如果该类型的缓存已空，移除类型
          if (firstTypeMap.size === 0) {
            this.cache.delete(firstType)
          }
        }
      }
    }
  }

  /**
   * 缓存专用渲染器
   */
  protected override initializeRenderer(): WidgetRenderer<this> {
    return new _KeepAliveRenderer(this)
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
   * 判断是否需要缓存
   *
   * @param type
   */
  isKeep(type: WidgetType): boolean {
    if (this.exclude.includes(type)) return false
    return this.include.length === 0 || this.include.includes(type)
  }

  /**
   * 卸载前卸载所有已缓存的实例
   *
   * @protected
   */
  protected override onBeforeUnmount(): void {
    // 遍历缓存中的所有 VNode 并卸载其实例
    this.cache.forEach(typeCache => {
      typeCache.forEach(vnode => {
        vnode.instance!['renderer'].unmount()
      })
    })
    // 清空缓存
    this.cache.clear()
  }

  protected build(): Element {
    return this.currentChild
  }
}

/**
 * KeepAlive小部件专属渲染器
 *
 * @internal
 */
export class _KeepAliveRenderer<T extends KeepAlive> extends WidgetRenderer<T> {
  protected override patchUpdate(oldVNode: VNode<WidgetType>, newVNode: VNode<WidgetType>): VNode {
    const oldRenderer = oldVNode.instance!['renderer']
    let parentEl: ParentNode | null = null
    let placeholderEl: Text | null = null

    // 如果新节点未实例化，需要创建占位符并插入文档
    if (!newVNode.instance) {
      placeholderEl = document.createTextNode('')
      parentEl = oldRenderer.teleport
        ? insertBeforeExactly(placeholderEl, oldRenderer.shadowElement)
        : insertBeforeExactly(placeholderEl, oldRenderer.el!)
    }

    // 根据是否需要保留旧节点，执行相应的销毁或停用逻辑
    if (this.widget.isKeep(oldVNode.type)) {
      oldRenderer.deactivate()
    } else {
      oldRenderer.unmount()
    }

    if (newVNode.instance) {
      // 如果新节点已实例化，则激活它
      newVNode.instance['renderer'].activate()
    } else {
      // 如果新节点未实例化，渲染并挂载它
      const el = renderElement(newVNode)
      const newRenderer = newVNode.instance!['renderer']

      // 根据是否为传送节点，执行替换逻辑
      if (newRenderer.teleport) {
        parentEl!.replaceChild(newRenderer.shadowElement, placeholderEl!)
      } else {
        parentEl!.replaceChild(el, placeholderEl!)
      }

      newRenderer.mount()
    }

    return newVNode
  }
}
