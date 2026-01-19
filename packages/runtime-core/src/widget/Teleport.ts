import { logger } from '@vitarx/utils'
import { getInstance, onBeforeMount, onDispose, onMounted, onPrepare } from '../runtime/index.js'
import { isView } from '../shared/index.js'
import type { CodeLocation, HostContainer, View } from '../types/index.js'
import { createAnchorView, disposeView, mountView, renderView } from '../view/index.js'

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
  /**
   * 传送的目标
   *
   * - string: 选择器
   * - HostContainer: 父元素
   */
  to: string | HostContainer
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
const getTarget = (to: string | HostContainer, location?: CodeLocation): HostContainer | null => {
  const target: HostContainer | null = typeof to === 'string' ? document.querySelector(to) : to
  if (__DEV__ && !target) {
    logger.warn(
      `Teleport.to parse failed, it may not be a valid parent element or does not exist at all`,
      location
    )
  }
  if (!target) return null
  return target
}

/**
 * Teleport 组件，用于将其子组件渲染到 DOM 树的其他位置
 *
 * @param {TeleportProps} { children, to, defer, disabled } - 组件属性
 *   - children: 要被传送的子组件
 *   - to: 目标位置的选择器或元素
 *   - defer: 是否延迟挂载（在 mounted 阶段挂载）
 *   - disabled: 是否禁用传送功能
 * @returns {View} 返回一个锚点视图
 *
 * @example
 * // 基本用法
 * <Teleport to="#modal">
 *   <ModalContent />
 * </Teleport>
 *
 * @example
 * // 延迟挂载
 * <Teleport to="#modal" defer>
 *   <ModalContent />
 * </Teleport>
 *
 * @example
 * // 禁用传送
 * <Teleport to="#modal" disabled>
 *   <ModalContent />
 * </Teleport>
 */
function Teleport({ children, to, defer, disabled }: TeleportProps): View {
  if (disabled) return children
  const instance = getInstance()!
  let teleported = false
  onPrepare(() => {
    renderView(children, instance.view, instance, instance.app)
  })
  const mount = () => {
    const target = getTarget(to, instance.view.location)
    if (target) {
      mountView(children, target)
      teleported = true
    }
  }
  if (defer) {
    onMounted(mount)
  } else {
    onBeforeMount(mount)
  }
  if (teleported) {
    onDispose(() => {
      disposeView(children)
    })
  }
  return createAnchorView('teleport')
}

Teleport.defaultProps = { defer: false, disabled: false } as const
Teleport.validateProps = (props: Record<string, any>): void => {
  if (!isView(props.children)) {
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

export { Teleport, TeleportProps }
