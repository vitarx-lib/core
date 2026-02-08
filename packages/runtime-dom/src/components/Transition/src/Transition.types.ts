import type { HostElement, View } from '@vitarx/runtime-core'

export type TransitionHandler = (el: HostElement) => void
/**
 * 过渡钩子函数接口
 *
 * 定义了过渡过程中各个阶段的回调函数，用于实现 JavaScript 控制的过渡效果。
 * 这些钩子函数允许在过渡的不同阶段执行自定义逻辑。
 */
export interface TransitionHooks {
  /** 进入动画被取消时调用 */
  onEnterCancelled?: TransitionHandler
  /** 离开动画被取消时调用 */
  onLeaveCancelled?: TransitionHandler
  /** 首次出现动画被取消时调用 */
  onAppearCancelled?: TransitionHandler

  /** 进入动画开始前调用 */
  onBeforeEnter?: TransitionHandler
  /** 进入动画完成后调用 */
  onAfterEnter?: TransitionHandler
  /** 离开动画开始前调用 */
  onBeforeLeave?: TransitionHandler
  /** 离开动画完成后调用 */
  onAfterLeave?: TransitionHandler
  /** 首次出现动画开始前调用 */
  onBeforeAppear?: TransitionHandler
  /** 首次出现动画完成后调用 */
  onAfterAppear?: TransitionHandler

  /** 进入动画开始时调用，需要手动调用 done() 来表示动画完成 */
  onEnter?(el: HostElement, done: () => void): void
  /** 离开动画开始时调用，需要手动调用 done() 来表示动画完成 */
  onLeave?(el: HostElement, done: () => void): void
  /** 首次出现动画开始时调用，需要手动调用 done() 来表示动画完成 */
  onAppear?(el: HostElement, done: () => void): void
}

/**
 * 自定义 CSS 类名接口
 *
 * 允许覆盖默认的 CSS 类名，以实现更灵活的样式控制。
 * 如果不提供，将使用默认的命名规则：`${name}-${type}-{state}`。
 */
export interface TransitionCssClass {
  /** 进入动画开始状态的类名 */
  enterFromClass?: string
  /** 进入动画进行中的类名 */
  enterActiveClass?: string
  /** 进入动画结束状态的类名 */
  enterToClass?: string
  /** 首次出现动画开始状态的类名 */
  appearFromClass?: string
  /** 首次出现动画进行中的类名 */
  appearActiveClass?: string
  /** 首次出现动画结束状态的类名 */
  appearToClass?: string
  /** 离开动画开始状态的类名 */
  leaveFromClass?: string
  /** 离开动画进行中的类名 */
  leaveActiveClass?: string
  /** 离开动画结束状态的类名 */
  leaveToClass?: string
}
export type TransitionDuration = number | { enter: number; leave: number }
export type TransitionType = 'transition' | 'animation' | 'auto'
export interface BaseTransitionProps extends TransitionHooks, TransitionCssClass {
  /** 过渡名称前缀，用于生成 CSS 类名，默认为 'v' */
  name: string
  /** 是否在初始渲染时触发过渡，默认为 false */
  appear: boolean
  /** 是否使用 CSS 过渡类，默认为 true。设为 false 时将只使用 JavaScript 钩子 */
  css: boolean
  /** 过渡持续时间（毫秒），可以是单个数字或包含 enter/leave 的对象 */
  duration?: TransitionDuration
  /**
   * 指定过渡类型，用于计算持续时间：
   *
   * - 'transition': 使用 CSS transition
   * - 'animation': 使用 CSS animation
   * - 'default': 自动计算持续时间较长的类型
   */
  type: TransitionType
}

/**
 * Transition 组件属性接口
 *
 * 定义了 Transition 组件的所有可配置属性，包括钩子函数、CSS 类名、
 * 过渡模式、持续时间等设置。
 */
export interface TransitionProps extends BaseTransitionProps {
  /**
   * 子节点
   *
   * 可以是单个，也可以是多个
   * 仅元素类型/组件类型节点支持过渡。
   *
   * @example
   * ```tsx
   * <Transition>
   *   {show && <div>内容</div>}
   * </Transition>
   *
   * <Transition>
   *   {show ? <A/> : <B/>}
   * </Transition>
   *
   * <Transition>
   *   <div v-if="show">内容</div>
   * </Transition>
   * ```
   */
  children: View
  /**
   * 过渡模式：
   * - 'out-in': 当前元素先离开，新元素后进入
   * - 'in-out': 新元素先进入，当前元素后离开
   * - `default`: 同时进行进入和离开
   *
   * @default `default`
   */
  mode?: 'out-in' | 'in-out'
}
