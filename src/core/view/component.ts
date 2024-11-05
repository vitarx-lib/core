import { Widget } from './widget.js'
import { popProperty } from '../../utils/index.js'

/**
 * 组件
 */
abstract class Component<P extends JSX.IntrinsicAttributes> extends Widget {
  private readonly _props: DeepReadonly<P>

  protected constructor(props: P) {
    super(popProperty(props, 'key'))
    this._props = props as DeepReadonly<P>
  }

  /**
   * 获取props
   */
  get props(): DeepReadonly<P> {
    return this._props
  }

  /**
   * ## 描述此 Widget 表示的用户界面部分。
   *
   * 当此 `widget` 即将被渲染为真实`dom`时，或者其依赖的`响应式变量`发生变化时，框架会调用此方法。
   *
   * > **注意**：此方法在同一生命周期内可能会多次被调用，因此，它仅应用于描述此`widget`如何呈现界面，
   * 不应具有其他任何副作用。
   *
   * @protected
   */
  protected abstract build(): Widget
}
