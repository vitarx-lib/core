import { isVNode } from '../../vnode/guards.js'
import { type VNode } from '../../vnode/index.js'
import { type Element, Widget } from '../widget.js'

/**
 * Teleport小部件配置选项
 */
export interface TeleportProps {
  /**
   * 传送的目标选择器或DOM元素实例
   */
  to: string | ParentNode
  /**
   * 要被传送的元素
   *
   * 注意：`children`必须为VNode对象，否则会抛出异常
   *
   * @example
   * ```tsx
   * <Teleport to="#container">
   *   <div>对话框...</div>
   * </Teleport>
   * ```
   */
  children: VNode
  /**
   * 是否禁用传送
   *
   * 如果禁用，则会挂载到正常的DOM结构中。
   *
   * @default false
   */
  disabled?: boolean
}

/**
 * ## Teleport
 *
 * `Teleport`是一个内置组件，它可以将一个小部件内部的一部分内容`传送`到该小部件的`DOM`结构外层的位置去。
 *
 * 实现原理：在`onBeforeMount`生命周期钩子中返回`props.to`元素实例，来指定传送的目标位置。
 */
export class Teleport extends Widget<TeleportProps> {
  protected target?: ParentNode

  constructor(props: TeleportProps) {
    super(props)
    if (!isVNode(props.children)) {
      throw new TypeError(`[Vitarx.Teleport]：Teleport小部件的children属性必须为VNode对象`)
    }
    if (typeof props.to === 'string') {
      const target = document.querySelector(props.to)
      if (!target) {
        throw new Error(`[Vitarx.Teleport]：未找到指定选择器${props.to}对应的元素。`)
      } else {
        this.target = target
      }
    } else {
      if (props.to instanceof Element) {
        this.target = props.to
      } else {
        throw new TypeError(
          `[Vitarx.Teleport]：to属性期望得到一个选择器或DOM元素实例，给定${typeof props.to}`
        )
      }
    }
  }

  override onBeforeMount(): void | ParentNode {
    return this.props.disabled ? void 0 : this.target
  }

  override build(): Element {
    return this.children
  }
}
