import { type Element, Widget } from '../widget.js'
import type { TargetContainerElement } from '../life-cycle.js'
import { isVNode } from '../../vnode/index.js'

interface TeleportProps {
  /**
   * 传送的目标选择器或DOM元素实例
   */
  to: string | TargetContainerElement
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
  children: Element
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
 */
export default class Teleport extends Widget<TeleportProps> {
  protected target?: TargetContainerElement

  constructor(props: TeleportProps) {
    super(props)
    if (!isVNode(props.children)) {
      throw new TypeError(`[Vitarx.Teleport]：Teleport小部件的children属性必须为VNode对象`)
    }
    if (typeof props.to === 'string') {
      const target = document.querySelector(props.to)
      if (!target) {
        console.warn(`[Vitarx.Teleport]: document.querySelector(${props.to}) 未找到元素`)
      } else {
        this.target = target
      }
    } else {
      if (props.to instanceof Element) {
        this.target = props.to
      } else {
        console.warn(
          `[Vitarx.Teleport]: to属性期望得到一个选择器字符串或DOM元素实例，给定${typeof props.to}`
        )
      }
    }
  }

  protected override onBeforeMount(): void | TargetContainerElement {
    return this.props.disabled ? void 0 : this.target
  }

  protected build(): Element {
    return this.children
  }
}
