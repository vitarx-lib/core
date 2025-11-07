import { toCapitalize } from '@vitarx/utils'
import { useDomAdapter } from '../../adapter/index.js'
import type {
  HostElements,
  HostNodeElements,
  VNodeChild,
  VNodeChildren
} from '../../types/index.js'
import { VNode } from '../../vnode/index.js'
import { Widget } from '../core/index.js'

/**
 * 过渡钩子函数接口
 *
 * 定义了过渡过程中各个阶段的回调函数，用于实现 JavaScript 控制的过渡效果。
 * 这些钩子函数允许在过渡的不同阶段执行自定义逻辑。
 */
export interface TransitionHooks {
  /** 进入动画被取消时调用 */
  onEnterCancelled?: (el: HostElements) => void
  /** 离开动画被取消时调用 */
  onLeaveCancelled?: (el: HostElements) => void
  /** 首次出现动画被取消时调用 */
  onAppearCancelled?: (el: HostElements) => void

  /** 进入动画开始前调用 */
  onBeforeEnter?(el: HostElements): void
  /** 进入动画开始时调用，需要手动调用 done() 来表示动画完成 */
  onEnter?(el: HostElements, done: () => void): void
  /** 进入动画完成后调用 */
  onAfterEnter?(el: HostElements): void

  /** 离开动画开始前调用 */
  onBeforeLeave?(el: HostElements): void
  /** 离开动画开始时调用，需要手动调用 done() 来表示动画完成 */
  onLeave?(el: HostElements, done: () => void): void
  /** 离开动画完成后调用 */
  onAfterLeave?(el: HostElements): void

  /** 首次出现动画开始前调用 */
  onBeforeAppear?(el: HostElements): void
  /** 首次出现动画开始时调用，需要手动调用 done() 来表示动画完成 */
  onAppear?(el: HostElements, done: () => void): void
  /** 首次出现动画完成后调用 */
  onAfterAppear?(el: HostElements): void
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

/**
 * Transition 组件属性接口
 *
 * 定义了 Transition 组件的所有可配置属性，包括钩子函数、CSS 类名、
 * 过渡模式、持续时间等设置。
 */
export interface BaseTransitionProps extends TransitionHooks, TransitionCssClass {
  /**
   * 子节点
   *
   * 可以是单个，也可以是多个
   * 仅元素类型/组件类型节点支持过渡。
   *
   * @example
   * ```tsx
   * <Transition>
   *   <div v-if="show">内容</div>
   *   <div v-if="!show">内容</div>
   * </Transition>
   * ```
   */
  children: VNodeChild | VNodeChildren
  /** 过渡名称前缀，用于生成 CSS 类名，默认为 'v' */
  name?: string
  /** 是否在初始渲染时触发过渡，默认为 false */
  appear?: boolean
  /** 是否使用 CSS 过渡类，默认为 true。设为 false 时将只使用 JavaScript 钩子 */
  css?: boolean
  /** 过渡持续时间（毫秒），可以是单个数字或包含 enter/leave 的对象 */
  duration?: number | { enter: number; leave: number }
  /**
   * 指定过渡类型，用于计算持续时间：
   *
   * - 'transition': 使用 CSS transition
   * - 'animation': 使用 CSS animation
   * - 'default': 自动计算持续时间较长的类型
   */
  type?: 'transition' | 'animation' | 'default'
}

/**
 * Transition 组件的默认属性
 *
 * 定义了组件在没有显式指定属性时使用的默认值。
 * 这些默认值确保组件在基本配置下能够正常工作。
 */
const DEFAULT_PROPS = {
  /** 默认过渡名称前缀 */
  name: 'v',
  /** 默认不在初始渲染时触发过渡 */
  appear: false,
  /** 默认使用 CSS 过渡类 */
  css: true,
  /** 默认使用自动计算 */
  type: 'default',
  /** 默认进入动画开始状态类名 */
  enterFromClass: 'enter-from',
  /** 默认进入动画进行中类名 */
  enterActiveClass: 'enter-active',
  /** 默认进入动画结束状态类名 */
  enterToClass: 'enter-to',
  /** 默认首次出现动画开始状态类名 */
  appearFromClass: 'appear-from',
  /** 默认首次出现动画进行中类名 */
  appearActiveClass: 'appear-active',
  /** 默认首次出现动画结束状态类名 */
  appearToClass: 'appear-to',
  /** 默认离开动画开始状态类名 */
  leaveFromClass: 'leave-from',
  /** 默认离开动画进行中类名 */
  leaveActiveClass: 'leave-active',
  /** 默认离开动画结束状态类名 */
  leaveToClass: 'leave-to'
} as const satisfies Omit<BaseTransitionProps, 'children'>

/**
 * 过渡组件基类
 *
 * 提供了过渡动画的核心功能，包括进入、离开和首次出现动画。
 * 支持 CSS 过渡和 JavaScript 钩子两种方式实现动画效果。
 *
 * ## 主要特性
 *
 * - 支持三种过渡类型：enter（进入）、leave（离开）、appear（首次出现）
 * - 支持 CSS 过渡和 JavaScript 钩子两种实现方式
 * - 可自定义过渡持续时间
 * - 可自定义 CSS 类名
 * - 提供完整的生命周期钩子函数
 * - 支持取消正在进行的动画
 *
 * ## 使用示例
 *
 * ### 基础用法
 *
 * ```tsx
 * class MyTransition extends BaseTransition {
 *   // 实现具体的过渡逻辑
 * }
 *
 * // 使用 CSS 过渡
 * <MyTransition name="fade">
 *   {show && <div>内容</div>}
 * </MyTransition>
 *
 * // 对应的 CSS
 * .fade-enter-active, .fade-leave-active {
 *   transition: opacity 0.5s;
 * }
 * .fade-enter-from, .fade-leave-to {
 *   opacity: 0;
 * }
 * ```
 *
 * ### 使用 JavaScript 钩子
 *
 * ```tsx
 * <MyTransition
 *   onBeforeEnter={(el) => console.log('进入前', el)}
 *   onEnter={(el, done) => {
 *     // 执行进入动画
 *     setTimeout(() => done(), 500)
 *   }}
 *   onAfterEnter={(el) => console.log('进入完成', el)}
 *   onBeforeLeave={(el) => console.log('离开前', el)}
 *   onLeave={(el, done) => {
 *     // 执行离开动画
 *     setTimeout(() => done(), 500)
 *   }}
 *   onAfterLeave={(el) => console.log('离开完成', el)}
 * >
 *   {show && <div>内容</div>}
 * </MyTransition>
 * ```
 *
 * ## 过渡类名
 *
 * 当使用 CSS 过渡时，BaseTransition 会自动应用以下类名：
 *
 * - `v-enter-from`：定义进入过渡的开始状态
 * - `v-enter-active`：定义进入过渡生效时的状态
 * - `v-enter-to`：定义进入过渡的结束状态
 * - `v-leave-from`：定义离开过渡的开始状态
 * - `v-leave-active`：定义离开过渡生效时的状态
 * - `v-leave-to`：定义离开过渡的结束状态
 * - `v-appear-from`：定义首次出现过渡的开始状态
 * - `v-appear-active`：定义首次出现过渡生效时的状态
 * - `v-appear-to`：定义首次出现过渡的结束状态
 *
 * 其中 `v` 是 Transition 组件的 name 属性值，默认为 "v"。
 *
 * ## 注意事项
 *
 * - 这是一个抽象基类，需要通过继承来实现具体的过渡组件
 * - 子类需要实现具体的过渡逻辑和渲染逻辑
 * - 当使用 CSS 过渡时，确保在 CSS 中正确定义了过渡或动画属性
 */
export abstract class BaseTransition<
  P extends BaseTransitionProps,
  D extends Partial<P> = {}
> extends Widget<P, D & typeof DEFAULT_PROPS> {
  /** 组件默认属性 */
  static override defaultProps = DEFAULT_PROPS

  /**
   * 存储正在进行中的过渡动画定时器
   *
   * 用于跟踪每个元素的过渡动画，以便在需要时取消动画。
   * 支持 NodeJS 环境的 setTimeout 类型
   */
  private activeTransitions = new WeakMap<
    HostElements,
    { id: ReturnType<typeof setTimeout> | null; cancel: () => void }
  >()

  /**
   * 执行首次出现动画
   *
   * 当组件设置了 appear 属性为 true 时，在组件首次挂载时调用。
   * 该方法调用 runTransition 方法执行具体的过渡逻辑。
   *
   * @param el - 要执行动画的元素
   */
  protected runAppear(el: HostNodeElements) {
    this.runTransition(el, 'appear')
  }

  /**
   * 执行进入动画
   *
   * 必须先挂载节点
   *
   * 处理新节点的进入动画。
   *
   * 如果目标元素不是有效的 DOM 元素，则直接挂载并调用完成回调。
   *
   * @param newChild - 要进入的新子节点 VNode
   * @param done - 动画完成后的回调函数（可选）
   */
  protected runEnter(newChild: VNode, done?: () => void) {
    this.runTransition(newChild.element, 'enter', done)
  }

  /**
   * 执行离开动画
   *
   * 处理旧节点的离开动画。如果目标元素不是有效的 DOM 元素，则直接移除并调用完成回调。
   * 否则执行过渡动画，并在动画完成后移除元素。
   *
   * @param oldChild - 要离开的旧节点
   * @param done - 动画完成后的回调函数（可选）
   */
  protected runLeave(oldChild: VNode, done?: () => void) {
    // 执行离开过渡动画，动画结束后移除元素
    this.runTransition(oldChild.element, 'leave', done)
  }

  /**
   * 核心动画逻辑，统一处理 appear / enter / leave
   *
   * 这是 Transition 组件的核心方法，负责处理所有类型的过渡动画。
   * 根据 css 属性决定使用 CSS 过渡还是 JavaScript 钩子。
   *
   * @param el - 要执行动画的元素
   * @param type - 动画类型：'enter'、'leave' 或 'appear'
   * @param doneCallback - 动画完成后的回调函数
   */
  protected runTransition(
    el: HostNodeElements,
    type: 'enter' | 'leave' | 'appear',
    doneCallback?: () => void
  ): void {
    if (this.$vnode.appContext?.config.ssr) {
      return doneCallback?.()
    }
    const dom = useDomAdapter()
    // 如果不是元素节点，不执行动画，但离开时需要删除元素
    if (!dom.isElement(el)) return doneCallback?.()
    const capitalizeType = toCapitalize(type)
    // 获取钩子
    const beforeHookRaw = this.props[`onBefore${capitalizeType}`]
    const hookRaw = this.props[`on${capitalizeType}`]
    const afterHookRaw = this.props[`onAfter${capitalizeType}`]
    const cancelledHookRaw = this.props[`on${capitalizeType}Cancelled`]
    // 类型守卫，确保都是函数
    const beforeHook = typeof beforeHookRaw === 'function' ? beforeHookRaw : undefined
    const hook = typeof hookRaw === 'function' ? hookRaw : undefined
    const afterHook = typeof afterHookRaw === 'function' ? afterHookRaw : undefined
    const cancelledHook = typeof cancelledHookRaw === 'function' ? cancelledHookRaw : undefined
    // 取消已有动画
    this.cancelTransition(el, cancelledHook)
    // 执行动画开始前的钩子
    beforeHook?.(el)
    if (this.props.css) {
      // CSS 过渡模式
      const cssPrefix = `${this.props.name}-${type}`
      const from = this.props[`${type}FromClass`] || `${cssPrefix}-from`
      const active = this.props[`${type}ActiveClass`] || `${cssPrefix}-active`
      const to = this.props[`${type}ToClass`] || `${cssPrefix}-to`

      // 添加开始和进行中的类
      dom.addClass(el, from)
      dom.addClass(el, active)

      // 获取动画持续时间
      const duration = this.getDuration(el, type)
      // 💡 强制（浏览器）重排，确保动画触发
      if ('offsetWidth' in el) void (el as Record<'offsetWidth', number>).offsetWidth
      // 下一帧切换到结束状态
      dom.requestAnimationFrame(() => {
        dom.removeClass(el, from)
        dom.addClass(el, to)
        hook?.(el, () => void 0) // JS 钩子通知进入中，done不触发任何效果
      })
      let ended = false
      // 设置定时器，在动画完成后清理
      const timer = setTimeout(() => {
        if (ended) return
        ended = true
        this.activeTransitions.delete(el)
        dom.removeClass(el, to)
        dom.removeClass(el, active)
        try {
          afterHook?.(el)
        } finally {
          doneCallback?.()
        }
      }, duration + 16)
      // 记录定时器以便取消
      this.activeTransitions.set(el, {
        id: timer,
        cancel: () => {
          if (ended) return
          ended = true
          dom.removeClass(el, to)
          dom.removeClass(el, active)
        }
      })
    } else {
      // JavaScript-only 模式，钩子自行控制 done
      let ended = false
      const end = () => {
        if (ended) return
        this.activeTransitions.delete(el)
        ended = true
        try {
          afterHook?.(el)
        } finally {
          doneCallback?.()
        }
      }
      const cancel = () => {
        ended = true
        this.activeTransitions.delete(el)
      }
      this.activeTransitions.set(el, { id: null, cancel })
      dom.requestAnimationFrame(() => {
        if (hook) hook(el, end)
        else end()
      })
    }
  }

  /**
   * 获取动画持续时间
   *
   * 根据组件的 duration 属性和 type 属性计算动画持续时间。
   * 优先级：显式设置的 duration > CSS 计算的持续时间。
   *
   * @param el - 目标元素
   * @param type - 动画类型，'enter' 或 'leave'
   * @returns {number} 动画最长耗时
   */
  protected getDuration(el: HostElements, type: 'enter' | 'leave' | 'appear'): number {
    // 如果 duration 是数字，直接返回
    if (typeof this.props.duration === 'number') {
      return this.props.duration
    }

    // 如果 duration 是对象，根据 type 返回对应的值
    if (typeof this.props.duration === 'object') {
      return this.props.duration[type === 'appear' ? 'enter' : type] || 0
    }
    // 否则从元素的 CSS 中计算持续时间
    const dom = useDomAdapter()
    switch (this.props.type) {
      case 'transition':
        return dom.getTransitionDuration(el)
      case 'animation':
        return dom.getAnimationDuration(el)
      default:
        const td = dom.getTransitionDuration(el)
        const ad = dom.getAnimationDuration(el)
        return Math.max(td, ad)
    }
  }

  /**
   * 取消元素上正在进行的过渡动画
   *
   * 清除元素上的定时器，从活动过渡映射中移除该元素，
   * 并触发取消钩子函数（如果提供）。
   *
   * @param el - 要取消动画的元素
   * @param cancelledHook - 动画被取消时的钩子函数（可选）
   */
  private cancelTransition(el: HostElements, cancelledHook?: (el: HostElements) => void) {
    const tick = this.activeTransitions.get(el)
    if (tick) {
      this.activeTransitions.delete(el)
      tick.id && clearTimeout(tick.id)
      try {
        tick.cancel()
      } finally {
        cancelledHook?.(el)
      }
    }
  }
}
