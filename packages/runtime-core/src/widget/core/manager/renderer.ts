import type { RuntimeNoTagElement } from '../../../renderer/index'
import type { Widget } from '../widget'

/**
 * 渲染状态
 *
 * - notRendered：未渲染
 * - notMounted：未挂载
 * - activated：活跃
 * - deactivating：停用中
 * - deactivated：不活跃
 * - uninstalling：卸载中
 * - unloaded：已卸载
 */
export type WidgetState =
  | 'notRendered'
  | 'notMounted'
  | 'activated'
  | 'deactivating'
  | 'deactivated'
  | 'uninstalling'
  | 'unloaded'

export class WidgetRenderer<T extends Widget> {
  /**
   * 状态值
   *
   * @protected
   */
  protected _state: WidgetState = 'notRendered'
  /**
   * 等待更新
   *
   * @protected
   */
  protected _pendingUpdate = false
  /**
   * 影子占位元素
   *
   * @protected
   */
  protected _shadowElement: RuntimeNoTagElement | null = null

  constructor(protected _widget: T) {}

  /**
   * 小部件实例
   *
   * @returns {Widget}
   */
  get widget(): T {
    return this._widget
  }
}
