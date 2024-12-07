import { type Element, Widget } from '../widget.js'
import { WidgetRenderer } from '../../renderer/index.js'
import { createVNode, type VNode } from '../../vnode/index.js'
import type { WidgetType } from '../constant.js'
import { watchProp } from '../../observer/index.js'
import { insertBeforeExactly, renderElement } from '../../renderer/web-runtime-dom/index.js'

interface KeepAliveProps {
  /**
   * 当前展示的小部件
   */
  children: WidgetType
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
 * 缓存小部件实例，以减少小部件的创建和销毁开销。
 *
 * 这在某些场景下非常有用，例如：数据列表，频繁从树中移除又创建的小部件。
 */
export default class KeepAlive extends Widget<KeepAliveProps> {
  protected cache: Map<WidgetType, VNode<WidgetType>> = new Map()
  protected currentChild: VNode<WidgetType>

  constructor(props: KeepAliveProps) {
    super(props)
    if (typeof this.children !== 'function') {
      throw new Error(
        `[Vitarx.KeepAlive]：KeepAlive children 必须是函数式小部件或类小部件，给定${typeof this.children}`
      )
    }
    // 缓存当前展示的小部件
    this.currentChild = createVNode(this.children)
    // 开始监听 props.children
    watchProp(this.props, 'children', this.handleChildChange.bind(this))
  }

  get include() {
    if (!this.props.include) return []
    return this.props.include
  }

  get exclude() {
    if (!this.props.exclude) return []
    return this.props.exclude
  }

  get max() {
    return this.props.max ?? 10
  }

  override get renderer() {
    if (!this._renderer) {
      this._renderer = new KeepAliveRenderer(this)
    }
    return this._renderer
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
   * 添加缓存
   *
   * @param vnode
   */
  addCache(vnode: VNode<WidgetType>) {
    const type = vnode.type
    if (this.isKeep(type)) {
      // 如果缓存中已存在该类型，先移除
      if (this.cache.has(type)) {
        this.cache.delete(type)
      }
      // 添加到缓存（更新顺序）
      this.cache.set(type, vnode)
      // 检查缓存大小是否超过限制
      if (this.max > 0 && this.cache.size > this.max) {
        // 超出限制，移除第一个缓存（最旧的）
        const firstKey = this.cache.keys().next().value!
        // 销毁节点
        this.cache.get(firstKey)?.instance?.renderer?.unmount()
        this.cache.delete(firstKey)
      }
    }
  }

  /**
   * 处理子部件类型变化
   *
   * @protected
   */
  protected handleChildChange() {
    if (this.children !== this.currentChild.type) {
      this.addCache(this.currentChild)
      const cacheVNode = this.cache.get(this.children)
      this.currentChild = cacheVNode || createVNode(this.children)
      this.update()
    }
  }

  protected build(): Element {
    return this.currentChild
  }

  protected override onBeforeUnmount(root: boolean): void {
    if (root) {
      this.cache.forEach(vnode => {
        vnode.instance?.renderer.unmount()
      })
    }
  }
}

/**
 * KeepAlive小部件专属渲染器
 *
 * @internal
 */
class KeepAliveRenderer<T extends KeepAlive> extends WidgetRenderer<T> {
  protected override patchUpdate(oldVNode: VNode<WidgetType>, newVNode: VNode<WidgetType>): VNode {
    const oldRenderer = oldVNode.instance!.renderer
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
      // 如果新节点已实例化，激活它
      newVNode.instance.renderer.activate()
    } else {
      // 如果新节点未实例化，渲染并挂载它
      const el = renderElement(newVNode)
      const newRenderer = newVNode.instance!.renderer

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
