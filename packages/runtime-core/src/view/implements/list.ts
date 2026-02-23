import { ViewKind } from '../../constants/index.js'
import { getRenderer } from '../../runtime/index.js'
import { isView } from '../../shared/index.js'
import type {
  CodeLocation,
  HostContainer,
  HostFragment,
  HostNode,
  MountType,
  View
} from '../../types/index.js'
import { BaseView } from './base.js'

type ListItemView = View & {
  __parent?: ListView
  __prev?: ListItemView | null
  __next?: ListItemView | null
}
/**
 * ListView 是一个用于管理列表视图的类，继承自 BaseView。
 * 它提供了对列表项的增删改查功能，并维护列表项之间的顺序关系。
 *
 * 核心功能：
 * - 添加视图到列表末尾（append）
 * - 在指定位置插入视图（insert）
 * - 移动视图到新位置（move）
 * - 从列表中移除视图（remove）
 * - 获取列表的长度、首尾元素和子视图迭代器
 *
 * 使用示例：
 * ```typescript
 * const list = new ListView([item1, item2]);
 * list.append(item3);
 * list.insert(item4, item2);
 * list.move(item3, item1);
 * list.remove(item2);
 * ```
 *
 * 构造函数参数：
 * @param items - 可选参数，初始化时要添加到列表中的视图数组
 * @param location - 可选参数，代码位置信息
 *
 * 特殊说明：
 * - 视图之间的顺序关系通过 __prev 和 __next 属性维护
 * - 在开发模式下，会对参数类型进行严格检查
 * - 所有操作都仅影响链表指针，需自行管理视图生命周期状态和DOM位置
 */
export class ListView extends BaseView<ViewKind.LIST, HostFragment> {
  public readonly kind = ViewKind.LIST
  protected hostNode: HostFragment | null = null
  private head?: ListItemView | null = null
  private tail?: ListItemView | null = null
  private size = 0
  constructor(items?: View[], location?: CodeLocation) {
    super(location)
    if (Array.isArray(items)) for (const item of items) this.append(item)
  }
  get length(): number {
    return this.size
  }
  get first(): ListItemView | null {
    return this.head ?? null
  }
  get last(): ListItemView | null {
    return this.tail ?? null
  }

  get children(): IterableIterator<ListItemView> {
    return this.safeChildren()
  }

  /**
   * 往列表中追加视图
   *
   * @param child
   */
  append(child: ListItemView): void {
    if (__VITARX_DEV__ && !isView(child)) {
      throw new TypeError('child must be a view')
    }
    child.__parent = this
    if (!this.head) {
      this.head = this.tail = child
      child.__prev = null
      child.__next = null
    } else {
      child.__prev = this.tail
      child.__next = null
      this.tail!.__next = child
      this.tail = child
    }
    this.size++
  }
  /**
   * 插入一个视图到指定锚点之前
   *
   * @param child - 要插入的视图
   * @param anchor - 插入位置
   */
  insert(child: ListItemView, anchor: ListItemView | null): void {
    if (!anchor) return this.append(child)
    if (__VITARX_DEV__ && !isView(child)) {
      throw new TypeError('child must be a view')
    }
    if (anchor.__parent !== this) {
      throw new Error('anchor must be a child of this list')
    }
    child.__parent = this
    const prev = anchor.__prev
    child.__next = anchor
    child.__prev = prev
    anchor.__prev = child
    if (prev) {
      prev.__next = child
    } else {
      this.head = child
    }
    this.size++
  }
  /**
   * 移动一个视图到指定锚点之前
   *
   * @param child - 要移动的视图
   * @param anchor - 移动位置，传入 null 等同于 append
   */
  move(child: ListItemView, anchor: ListItemView | null): void {
    // 如果子视图已经在列表中，先移除它
    if (child.__parent === this) this.remove(child)
    if (anchor) {
      this.insert(child, anchor)
    } else {
      this.append(child)
    }
  }
  /**
   * 从列表删除一个视图
   *
   * @param child
   */
  remove(child: ListItemView): void {
    if (__VITARX_DEV__ && !isView(child)) {
      throw new TypeError('child must be a view')
    }
    const prev = child.__prev
    const next = child.__next
    if (prev) prev.__next = next
    else this.head = next
    if (next) next.__prev = prev
    else this.tail = prev
    delete child.__prev
    delete child.__next
    delete child.__parent
    this.size--
  }

  protected override doInit(): void {
    for (const safeChild of this.safeChildren()) safeChild.init(this.ctx)
  }
  protected override doMount(target: HostContainer | HostNode, type: MountType): void {
    const renderer = getRenderer()
    if (!this.hostNode) {
      this.hostNode = renderer.createFragment(this)
    }
    renderer[type](this.hostNode, target)
    for (const safeChild of this.safeChildren()) safeChild.mount(this.hostNode, 'append')
  }
  protected override doActivate() {
    for (const safeChild of this.safeChildren()) safeChild.activate()
  }
  protected override doDeactivate() {
    for (const safeChild of this.safeChildren()) safeChild.deactivate()
  }
  protected override doDispose() {
    for (const safeChild of this.safeChildren()) {
      this.remove(safeChild)
      safeChild.dispose()
    }
    if (this.hostNode) getRenderer().remove(this.hostNode)
  }

  /**
   * 获取视图列表迭代器
   *
   * @returns {IterableIterator<ListItemView>}
   */
  private *safeChildren(): IterableIterator<ListItemView> {
    let current = this.head
    while (current) {
      const next = current.__next ?? null
      yield current
      current = next
    }
  }
}
