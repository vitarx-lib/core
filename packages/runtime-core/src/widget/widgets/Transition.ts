import { computed } from '@vitarx/responsive'
import { isArray, logger, toCapitalize } from '@vitarx/utils/src/index.js'
import { useDomAdapter } from '../../host-adapter/index.js'
import type { HostElement, HostNodeElement } from '../../types/index.js'
import { VNodeChild } from '../../types/vnode.js'
import { isNonElementNode, VNode, VNodeUpdate } from '../../vnode/index.js'
import { Widget } from '../base/index.js'

/**
 * 过渡钩子函数接口
 *
 * 定义了过渡过程中各个阶段的回调函数，用于实现 JavaScript 控制的过渡效果。
 * 这些钩子函数允许在过渡的不同阶段执行自定义逻辑。
 */
interface TransitionHooks {
  /** 进入动画被取消时调用 */
  onEnterCancelled?: (el: HostElement) => void
  /** 离开动画被取消时调用 */
  onLeaveCancelled?: (el: HostElement) => void
  /** 首次出现动画被取消时调用 */
  onAppearCancelled?: (el: HostElement) => void

  /** 进入动画开始前调用 */
  onBeforeEnter?(el: HostElement): void
  /** 进入动画开始时调用，需要手动调用 done() 来表示动画完成 */
  onEnter?(el: HostElement, done: () => void): void
  /** 进入动画完成后调用 */
  onAfterEnter?(el: HostElement): void

  /** 离开动画开始前调用 */
  onBeforeLeave?(el: HostElement): void
  /** 离开动画开始时调用，需要手动调用 done() 来表示动画完成 */
  onLeave?(el: HostElement, done: () => void): void
  /** 离开动画完成后调用 */
  onAfterLeave?(el: HostElement): void

  /** 首次出现动画开始前调用 */
  onBeforeAppear?(el: HostElement): void
  /** 首次出现动画开始时调用，需要手动调用 done() 来表示动画完成 */
  onAppear?(el: HostElement, done: () => void): void
  /** 首次出现动画完成后调用 */
  onAfterAppear?(el: HostElement): void
}

/**
 * 自定义 CSS 类名接口
 *
 * 允许覆盖默认的 CSS 类名，以实现更灵活的样式控制。
 * 如果不提供，将使用默认的命名规则：`${name}-${type}-{state}`。
 */
interface TransitionCssClass {
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
interface TransitionProps extends TransitionHooks, TransitionCssClass {
  /** 子节点，可以是单个 VNode 或 VNode 数组 */
  children: VNode | VNode[]
  /** 过渡名称前缀，用于生成 CSS 类名，默认为 'v' */
  name?: string
  /** 是否在初始渲染时触发过渡，默认为 false */
  appear?: boolean
  /** 过渡模式：
   * - 'out-in': 当前元素先离开，新元素后进入
   * - 'in-out': 新元素先进入，当前元素后离开
   * - 'default': 同时进行进入和离开
   *
   * 默认为 'default'
   * @default 'default'
   */
  mode?: 'out-in' | 'in-out' | 'default'
  /** 是否使用 CSS 过渡类，默认为 true。设为 false 时将只使用 JavaScript 钩子 */
  css?: boolean
  /** 过渡持续时间（毫秒），可以是单个数字或包含 enter/leave 的对象 */
  duration?: number | { enter: number; leave: number }
  /** 指定过渡类型，用于计算持续时间：
   * - 'transition': 使用 CSS transition
   * - 'animation': 使用 CSS animation
   *
   * 默认为 'transition'
   * @default 'transition'
   */
  type?: 'transition' | 'animation'
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
  /** 默认过渡模式为同时进行 */
  mode: 'default',
  /** 默认使用 CSS 过渡类 */
  css: true,
  /** 默认使用 CSS transition 计算持续时间 */
  type: 'transition',
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
} as const satisfies Omit<TransitionProps, 'children'>

/**
 * Transition 组件：控制子节点的进入/离开动画
 *
 * 该组件完全模仿 Vue 的 <transition> 组件，为单个元素或组件提供过渡效果。
 * Transition 会自动应用进入/离开过渡，可以由 CSS 过渡或动画库控制，
 * 也可以通过 JavaScript 钩子手动控制。
 *
 * ## 主要特性
 *
 * - 自动应用进入/离开过渡效果
 * - 支持通过 CSS 过渡或动画实现效果
 * - 支持 JavaScript 钩子函数控制过渡过程
 * - 支持三种过渡模式：default（同时进行）、out-in（先离开后进入）、in-out（先进入后离开）
 * - 可以自定义过渡持续时间
 * - 支持取消正在进行的过渡
 *
 * ## 使用示例
 *
 * ### 基础用法
 *
 * ```tsx
 * // 使用 CSS 过渡
 * <Transition name="fade">
 *   <div v-show={show}>内容</div>
 * </Transition>
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
 * <Transition
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
 *   <div v-show={show}>内容</div>
 * </Transition>
 * ```
 *
 * ### 指定过渡模式
 *
 * ```tsx
 * // out-in 模式：当前元素先离开，新元素后进入
 * <Transition mode="out-in">
 *   {currentTab === 'home' ? <Home /> : <About />}
 * </Transition>
 *
 * // in-out 模式：新元素先进入，当前元素后离开
 * <Transition mode="in-out">
 *   {currentTab === 'home' ? <Home /> : <About />}
 * </Transition>
 * ```
 *
 * ### 自定义持续时间
 *
 * ```tsx
 * // 使用数字指定持续时间（毫秒）
 * <Transition duration={300}>
 *   <div v-show={show}>内容</div>
 * </Transition>
 *
 * // 使用对象分别指定进入和离开的持续时间
 * <Transition duration={{ enter: 500, leave: 800 }}>
 *   <div v-show={show}>内容</div>
 * </Transition>
 * ```
 *
 * ## 过渡类名
 *
 * 当使用 CSS 过渡时，Transition 组件会自动应用以下类名：
 *
 * - `v-enter-from`：定义进入过渡的开始状态
 * - `v-enter-active`：定义进入过渡生效时的状态
 * - `v-enter-to`：定义进入过渡的结束状态
 * - `v-leave-from`：定义离开过渡的开始状态
 * - `v-leave-active`：定义离开过渡生效时的状态
 * - `v-leave-to`：定义离开过渡的结束状态
 *
 * 其中 `v` 是 Transition 组件的 name 属性值，默认为 "v"。
 *
 * ## 注意事项
 *
 * - Transition 组件只能包裹单个子元素或组件。如果需要过渡多个元素，请使用 TransitionGroup
 * - 当子元素是动态渲染时，确保使用条件渲染（如 `{ show && <div v-show={show} v-if={show}/> }` 示例中是三种不同的条件渲染方式）或 key 属性来触发过渡
 * - 当使用 CSS 过渡时，确保在 CSS 中正确定义了过渡或动画属性
 */
export class Transition extends Widget<TransitionProps, typeof DEFAULT_PROPS> {
  /** 组件默认属性 */
  static override defaultProps = DEFAULT_PROPS

  /**
   * 计算当前要渲染的子节点
   *
   * 从子节点数组中找到第一个非元素节点且显示的节点作为当前子节点。
   * 如果找不到子节点，会记录警告日志。
   */
  protected child = computed(() => {
    if (isArray(this.children)) {
      const rootChild = this.children.find(item => !isNonElementNode(item) && item.show)
      if (!rootChild) {
        logger.warn('<Transition> No child node found', this.$vnode.devInfo?.source)
      }
      return rootChild
    }
    if (!this.children) {
      logger.warn('<Transition> No child node found', this.$vnode.devInfo?.source)
    }
    return this.children
  })

  /**
   * 存储正在进行中的过渡动画定时器
   *
   * 用于跟踪每个元素的过渡动画，以便在需要时取消动画。
   * 支持 NodeJS 环境的 setTimeout 类型
   */
  private activeTransitions = new Map<HostElement, number | NodeJS.Timeout>()

  /**
   * 构建组件渲染内容
   *
   * @returns {VNodeChild} 当前子节点的 VNode
   */
  override build(): VNodeChild {
    return this.child.value
  }

  /**
   * 组件挂载后的生命周期钩子
   *
   * 如果设置了 appear 属性为 true，则在组件首次挂载时触发出现动画。
   */
  override onMounted() {
    // 首次渲染触发 appear
    if (this.props.appear) {
      if (this.$el) this.runAppear(this.$el)
    }
  }

  /**
   * 组件卸载前的生命周期钩子
   *
   * 在组件卸载前执行离开动画，确保元素以动画形式消失。
   */
  override onBeforeUnmount() {
    // 给 child 执行 leave 动画
    this.runLeave(this.$el)
  }

  /**
   * 组件被停用时的生命周期钩子
   *
   * 当组件被 keep-alive 缓存并停用时，执行离开动画。
   */
  override onDeactivated() {
    // 给 child 执行 leave 动画
    this.runLeave(this.$el)
  }
  /**
   * 更新组件时处理过渡逻辑
   *
   * 根据新旧子节点的类型和 key 判断是否需要执行过渡动画。
   * 如果类型和 key 相同，则执行普通更新；否则根据 mode 属性执行相应的过渡动画。
   *
   * @param oldChild - 旧的子节点 VNode
   * @param newChild - 新的子节点 VNode
   * @returns {VNode} 返回新的子节点 VNode
   */
  override $patchUpdate(oldChild: VNode, newChild: VNode): VNode {
    // 节点类型相同，key相同，则直接更新
    if (oldChild.type === newChild.type && oldChild.key === newChild.key) {
      // 静态不更新
      if (oldChild.isStatic) return oldChild
      if (oldChild.show !== newChild.show) {
        if (oldChild.show) {
          this.runTransition(oldChild.element, 'leave', () => (oldChild.show = false))
          VNodeUpdate.patchUpdateNode(oldChild, newChild, true)
        } else {
          VNodeUpdate.patchUpdateNode(oldChild, newChild)
          this.runTransition(oldChild.element, 'enter')
        }
      } else {
        VNodeUpdate.patchUpdateNode(oldChild, newChild)
      }
      return oldChild
    }

    // 创建锚点元素，用于新节点的插入位置
    const dom = useDomAdapter()
    const anchor = dom.createText('')
    dom.insertBefore(anchor, oldChild.operationTarget)
    const oldEl = oldChild.element
    oldChild.unmount(false) // 保留 DOM，不立即删除

    // 根据不同的过渡模式执行动画
    switch (this.props.mode) {
      case 'out-in':
        // 先执行离开动画，完成后再执行进入动画
        this.runLeave(oldEl, () => this.runEnter(newChild, anchor))
        break
      case 'in-out':
        // 先执行进入动画，完成后再执行离开动画
        this.runEnter(newChild, anchor, () => this.runLeave(oldEl))
        break
      default:
        // 同时执行进入和离开动画
        this.runLeave(oldEl)
        this.runEnter(newChild, anchor)
    }
    return newChild
  }
  /**
   * 获取动画持续时间
   *
   * 根据组件的 duration 属性和 type 属性计算动画持续时间。
   * 优先级：显式设置的 duration > CSS 计算的持续时间。
   *
   * @param el - 目标元素
   * @param type - 动画类型，'enter' 或 'leave'
   * @returns {number} 动画持续时间（毫秒）
   */
  protected getDuration(el: HostElement, type: 'enter' | 'leave'): number {
    // 如果 duration 是数字，直接返回
    if (typeof this.props.duration === 'number') return this.props.duration

    // 如果 duration 是对象，根据 type 返回对应的值
    if (typeof this.props.duration === 'object') return this.props.duration[type] || 0

    // 否则从元素的 CSS 中计算持续时间
    const dom = useDomAdapter()
    return this.props.type === 'transition'
      ? dom.getTransitionDuration(el)
      : dom.getAnimationDuration(el)
  }
  /**
   * 执行首次出现动画
   *
   * 当组件设置了 appear 属性为 true 时，在组件首次挂载时调用。
   * 该方法调用 runTransition 方法执行具体的过渡逻辑。
   *
   * @param el - 要执行动画的元素
   */
  private runAppear(el: HostNodeElement) {
    this.runTransition(el, 'appear')
  }
  /**
   * 执行进入动画
   *
   * 处理新节点的进入动画。首先挂载新节点，然后根据配置执行过渡动画。
   * 如果目标元素不是有效的 DOM 元素，则直接挂载并调用完成回调。
   *
   * @param newChild - 要进入的新子节点 VNode
   * @param anchor - 插入位置的锚点元素
   * @param done - 动画完成后的回调函数（可选）
   */
  private runEnter(newChild: VNode, anchor: HostNodeElement, done?: () => void) {
    const el = newChild.element

    // 如果不是元素节点，直接挂载并调用完成回调
    if (!useDomAdapter().isElement(el)) {
      newChild.mount(anchor, 'replace')
      done?.()
      return
    }

    // 挂载新节点并执行过渡动画
    newChild.mount(anchor, 'replace')
    this.runTransition(el, 'enter', done)
  }
  /**
   * 执行离开动画
   *
   * 处理旧节点的离开动画。如果目标元素不是有效的 DOM 元素，则直接移除并调用完成回调。
   * 否则执行过渡动画，并在动画完成后移除元素。
   *
   * @param oldEl - 要离开的旧元素
   * @param done - 动画完成后的回调函数（可选）
   */
  private runLeave(oldEl: HostNodeElement, done?: () => void) {
    // 如果不是元素节点，直接移除并调用完成回调
    if (!useDomAdapter().isElement(oldEl)) {
      useDomAdapter().remove(oldEl)
      done?.()
      return
    }

    // 执行离开过渡动画，动画结束后移除元素
    this.runTransition(
      oldEl,
      'leave',
      done,
      true // 动画结束后移除元素
    )
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
   * @param removeOnEnd - 是否在动画结束后移除元素
   */
  private runTransition(
    el: HostNodeElement,
    type: 'enter' | 'leave' | 'appear',
    doneCallback?: () => void,
    removeOnEnd = false
  ) {
    const dom = useDomAdapter()
    const fromClass = this.props[`${type}FromClass`] || `${this.props.name}-${type}-from`
    const activeClass = this.props[`${type}ActiveClass`] || `${this.props.name}-${type}-active`
    const toClass = this.props[`${type}ToClass`] || `${this.props.name}-${type}-to`
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
    // 如果不是元素节点，不执行动画，但离开时需要删除元素
    if (!dom.isElement(el)) {
      if (type === 'leave') dom.remove(el)
      doneCallback?.()
      return
    }
    // 取消已有动画
    this.cancelTransition(el, cancelledHook)
    // 执行动画开始前的钩子
    beforeHook?.(el)
    if (this.props.css) {
      // CSS 过渡模式
      const from = fromClass || `${this.props.name}-${type}-from`
      const active = activeClass || `${this.props.name}-${type}-active`
      const to = toClass || `${this.props.name}-${type}-to`

      // 添加开始和进行中的类
      dom.addClass(el, from)
      dom.addClass(el, active)

      // 获取动画持续时间
      const duration =
        type === 'leave' ? this.getDuration(el, 'leave') : this.getDuration(el, 'enter')

      // 下一帧切换到结束状态
      dom.requestAnimationFrame(() => {
        dom.removeClass(el, from)
        dom.addClass(el, to)
        hook?.(el, () => {}) // JS 钩子通知进入中
      })

      // 设置定时器，在动画完成后清理
      const timer = setTimeout(() => {
        if (removeOnEnd) dom.remove(el)
        dom.removeClass(el, to)
        dom.removeClass(el, active)
        afterHook?.(el)
        doneCallback?.()
        this.activeTransitions.delete(el)
      }, duration)

      // 记录定时器以便取消
      this.activeTransitions.set(el, timer)
    } else {
      // JavaScript-only 模式，钩子自行控制 done
      let ended = false
      const end = () => {
        if (ended) return
        ended = true
        if (removeOnEnd) dom.remove(el)
        afterHook?.(el)
        doneCallback?.()
      }
      // 使用 requestAnimationFrame 确保下一帧再触发钩子
      if (hook) {
        dom.requestAnimationFrame(() => hook(el, end))
      } else {
        // 没有 hook 的情况下，直接结束动画（下一帧触发）
        dom.requestAnimationFrame(end)
      }
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
  private cancelTransition(el: HostElement, cancelledHook?: (el: HostElement) => void) {
    const timer = this.activeTransitions.get(el)
    if (timer) {
      clearTimeout(timer as number)
      this.activeTransitions.delete(el)
      cancelledHook?.(el)
    }
  }
}
