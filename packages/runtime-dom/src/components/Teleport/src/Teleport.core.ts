import {
  createCommentView,
  defineValidate,
  getInstance,
  onBeforeMount,
  onDispose,
  onHide,
  onInit,
  onMounted,
  onShow,
  useFastChild,
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
  /**
   * 传送的目标
   *
   * @example
   * ```tsx
   * <Teleport to="#container">
   *   <div>传送到id为container的元素中...</div>
   * </Teleport>
   * <Teleport to="body">
   *   <div>传送到body中...</div>
   * </Teleport>
   * <Teleport to="head">
   *   <div>传送到head中...</div>
   * </Teleport>
   * ```
   */
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
 * 注意：渲染后修改 to defer disabled 属性均不会生效。
 *
 * @param props - 属性
 * @param props.children - 要被传送的子组件
 * @param props.to - 目标位置的选择器
 * @param [props.defer=false] - 是否延迟挂载（在 mounted 阶段挂载）
 * @param [props.disabled=false] - 是否禁用传送功能
 *
 * @returns {View} 返回一个锚点视图
 *
 * @example
 * ```jsx
 * // 基本用法 to 支持 id class tag
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
function Teleport(props: TeleportProps): View {
  const { children, to, defer, disabled } = props
  const child = useFastChild(children)
  // If there's no child, return a placeholder comment
  if (!child) return createCommentView('teleport:empty')
  // 禁用时返回子组件
  if (disabled) return child
  // Create a placeholder comment
  const placeholder = createCommentView(`teleport -> ${to}`)
  // 服务端渲染时提前返回占位符
  if (__VITARX_SSR__) return placeholder
  const instance = getInstance()!
  onInit(() => {
    child.init(instance.subViewContext)
  })
  const mount = () => {
    const target = getTarget(to, instance.view.location)
    if (target) child.mount(target)
  }
  if (defer) {
    onMounted(mount)
  } else {
    onBeforeMount(mount)
  }
  // 兼容停用/恢复
  onShow(() => {
    if (child.isRuntime && !child.isActive) {
      child.activate()
    }
  })
  onHide(() => {
    if (child.isRuntime && child.isActive) {
      child.deactivate()
    }
  })
  // 销毁时销毁子组件
  onDispose(() => child.dispose())
  return placeholder
}

Teleport.defaultProps = { defer: false, disabled: false } as const

defineValidate(Teleport, (props: Record<string, any>): void => {
  if (!props.disabled && !isString(props.to)) {
    throw new TypeError(`[Teleport] to expects a string selector, received ${typeof props.to}`)
  }
})

export { Teleport, type TeleportProps }
