import { logger } from '@vitarx/utils'
import { useRenderer } from '../../renderer/index.js'
import type { HostNodeElements, HostParentElement, VNode } from '../../types/index.js'
import { VNodeChild } from '../../types/vnode.js'
import { __DEV__, isVNode, onPropChange } from '../../utils/index.js'
import { patchUpdate } from '../../vnode/core/update.js'
import { createCommentVNode, mountNode, renderNode, unmountNode } from '../../vnode/index.js'
import { Widget } from '../base/index.js'

interface TeleportProps {
  /**
   * 要被传送的节点 - 不支持动态修改
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
   * 传送的目标 - 不支持动态修改
   *
   * - string: 选择器
   * - HostParentElement: 父元素-支持插入子元素
   */
  to: string | HostParentElement
  /**
   * 是否延迟渲染
   *
   * @default false
   */
  defer?: boolean
  /**
   * 是否禁用传送
   *
   * @default false
   */
  disabled?: boolean
}

/**
 * Teleport 传送组件 - 内置组件
 *
 * 将子节点渲染到 DOM 树中的其他位置，而不是当前组件的父容器中。
 * 常用于实现模态框、弹窗、通知等需要脱离当前 DOM 层级的 UI 组件。
 *
 * @example
 * ```tsx
 * // 传送到 body
 * <Teleport to="body">
 *   <div class="modal">模态框内容</div>
 * </Teleport>
 *
 * // 传送到指定选择器
 * <Teleport to="#modal-container">
 *   <div>弹窗内容</div>
 * </Teleport>
 *
 * // 传送到 DOM 元素
 * const container = document.getElementById('container')
 * <Teleport to={container}>
 *   <div>内容</div>
 * </Teleport>
 *
 * // 延迟渲染
 * <Teleport to="body" defer>
 *   <div>延迟渲染的内容</div>
 * </Teleport>
 *
 * // 禁用传送（渲染到当前位置）
 * <Teleport to="body" disabled>
 *   <div>不会被传送</div>
 * </Teleport>
 * ```
 *
 * @remarks
 * - `to`,`disabled`,`defer` 属性不支持动态修改
 * - 当 `disabled` 为 true 时，子节点将在原地渲染
 * - `defer` 为 true 时，会在 mounted 后挂载，否则在 beforeMount 阶段挂载
 * - 目标元素必须是支持插入子元素的容器元素
 */
export class Teleport extends Widget<TeleportProps, Required<TeleportProps>> {
  static defaultProps = { defer: false, disabled: false } as const
  private teleported: boolean = false
  private readonly disabled: boolean

  constructor(props: TeleportProps) {
    super(props)
    this.disabled = !!props.disabled
    if (!this.disabled) {
      onPropChange(
        props,
        'children',
        newValue => {
          if (this.teleported) patchUpdate(this.children, newValue)
        },
        {
          flush: 'sync'
        }
      )
    }
  }

  static validateProps(props: Record<string, any>): void {
    if (!isVNode(props.children)) {
      throw new TypeError(
        `Teleport.children property expects to get a node object, given ${typeof props.children}`
      )
    }
    if (!props.disabled && !props.to) {
      throw new TypeError(
        `Teleport.to property expects to get a selector or DOM element, given ${typeof props.to}`
      )
    }
  }

  override onRender() {
    if (this.disabled) return
    renderNode(this.children)
  }

  override onBeforeMount() {
    if (this.disabled || this.props.defer) return
    const target = this.getTarget()
    if (target) {
      mountNode(this.children, target)
      this.teleported = true
    }
  }

  override onMounted() {
    if (this.disabled || !this.props.defer) return
    const target = this.getTarget()
    if (target) {
      mountNode(this.children, target)
      this.teleported = true
    }
  }

  override onBeforeUnmount() {
    if (this.disabled) return
    if (this.teleported) unmountNode(this.children)
  }

  override build(): VNodeChild {
    return this.disabled ? this.children : createCommentVNode({ value: 'teleport anchor' })
  }

  private getTarget(): HostParentElement | null {
    const dom = useRenderer()
    const to = this.props.to
    const target: HostNodeElements | null = typeof to === 'string' ? dom.querySelector(to) : to
    if (__DEV__ && !target) {
      logger.warn(
        `Teleport.to parse failed, it may not be a valid parent element or does not exist at all`,
        this.$vnode.devInfo?.source
      )
    }
    if (!target) return null
    if (!dom.isContainer(target)) return null
    return target as HostParentElement
  }
}
