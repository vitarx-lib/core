import {
  CommentView,
  getInstance,
  isView,
  onBeforeMount,
  onDispose,
  onHide,
  onInit,
  onMounted,
  onShow,
  type View
} from '@vitarx/runtime-core'
import { isString } from '@vitarx/utils'
import { getTarget } from './Teleport.utils.js'

interface TeleportProps {
  /**
   * 要被传送的节点
   *
   * @example
   * ```tsx
   * <Teleport to="#container">
   *   <div>对话框...</div>
   * </Teleport>
   * ```
   */
  children: View
  /** 传送的目标 */
  to: string
  /**
   * 是否延迟渲染
   *
   * @default false
   */
  defer: boolean
  /**
   * 是否禁用传送
   *
   * @default false
   */
  disabled: boolean
}

/**
 * Teleport 组件，用于将其子组件渲染到 DOM 树的其他位置
 *
 * @param {TeleportProps} { children, to, defer, disabled } - 组件属性
 *   - children: 要被传送的子组件
 *   - to: 目标位置的选择器
 *   - defer: 是否延迟挂载（在 mounted 阶段挂载）
 *   - disabled: 是否禁用传送功能
 * @returns {View} 返回一个锚点视图
 *
 * @example
 * ```jsx
 * // 基本用法
 * <Teleport to="#modal">
 *   <ModalContent />
 * </Teleport>
 * ```
 *
 * @example
 * ```jsx
 * // 延迟挂载
 * <Teleport to="#modal" defer>
 *   <ModalContent />
 * </Teleport>
 * ```
 *
 * @example
 * ```jsx
 * // 禁用传送
 * <Teleport to="#modal" disabled>
 *   <ModalContent />
 * </Teleport>
 * ```
 */
function Teleport({ children, to, defer, disabled }: TeleportProps): View {
  if (__SSR__) return new CommentView(`teleport to ${to}`)
  if (disabled) return children
  const instance = getInstance()!
  let teleported = false
  onInit(() => {
    children.init(instance.subViewContext)
  })
  const mount = () => {
    const target = getTarget(to, instance.view.location)
    if (target) {
      children.mount(target)
      teleported = true
    }
  }
  if (defer) {
    onMounted(mount)
  } else {
    onBeforeMount(mount)
  }
  if (teleported) {
    // 兼容停用/恢复
    onShow(() => {
      if (!children.active) children.activate()
    })
    onHide(() => {
      children.deactivate()
    })
  }
  onDispose(() => children.dispose())
  return new CommentView('teleport')
}

Teleport.defaultProps = { defer: false, disabled: false } as const
Teleport.validateProps = (props: Record<string, any>): void => {
  if (!isView(props.children)) {
    throw new TypeError(
      `Teleport.children expects a View object but received ${typeof props.children}: ${props.children}. Ensure the child is created with createView().`
    )
  }
  if (!props.disabled && !isString(props.to)) {
    throw new TypeError(
      `Teleport.to expects a string selector but received ${typeof props.to}: ${props.to}. When disabled=false, a valid CSS selector string is required.`
    )
  }
}

export { Teleport, TeleportProps }
