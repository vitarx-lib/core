import { computed } from '@vitarx/responsive'
import { isArray, logger } from '@vitarx/utils/src/index.js'
import { useDomAdapter } from '../../host-adapter/index.js'
import type { HostElement, HostNodeElement } from '../../types/index.js'
import { VNodeChild } from '../../types/vnode.js'
import { isNonElementNode, VNode } from '../../vnode/index.js'
import { Widget } from '../base/index.js'

interface TransitionHooks {
  onEnterCancelled?: (el: HostElement) => void
  onLeaveCancelled?: (el: HostElement) => void
  onAppearCancelled?: (el: HostElement) => void

  onBeforeEnter?(el: HostElement): void
  onEnter?(el: HostElement, done: () => void): void
  onAfterEnter?(el: HostElement): void

  onBeforeLeave?(el: HostElement): void
  onLeave?(el: HostElement, done: () => void): void
  onAfterLeave?(el: HostElement): void

  onBeforeAppear?(el: HostElement): void
  onAppear?(el: HostElement, done: () => void): void
  onAfterAppear?(el: HostElement): void
}

interface TransitionCssClass {
  enterFromClass?: string
  enterActiveClass?: string
  enterToClass?: string
  appearFromClass?: string
  appearActiveClass?: string
  appearToClass?: string
  leaveFromClass?: string
  leaveActiveClass?: string
  leaveToClass?: string
}

interface TransitionProps extends TransitionHooks, TransitionCssClass {
  children: VNode | VNode[]
  name?: string
  appear?: boolean
  mode?: 'out-in' | 'in-out' | 'default'
  css?: boolean
  duration?: number | { enter: number; leave: number }
  type?: 'transition' | 'animation'
}

const DEFAULT_PROPS = {
  name: 'v',
  appear: false,
  mode: 'default',
  css: true,
  type: 'transition',
  enterFromClass: 'enter-from',
  enterActiveClass: 'enter-active',
  enterToClass: 'enter-to',
  appearFromClass: 'appear-from',
  appearActiveClass: 'appear-active',
  appearToClass: 'appear-to',
  leaveFromClass: 'leave-from',
  leaveActiveClass: 'leave-active',
  leaveToClass: 'leave-to'
} as const satisfies Omit<TransitionProps, 'children'>

export class Transition extends Widget<TransitionProps, typeof DEFAULT_PROPS> {
  static override defaultProps = DEFAULT_PROPS

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

  // 支持 NodeJS 环境 setTimeout 类型
  private activeTransitions = new Map<HostElement, number | NodeJS.Timeout>()

  override build(): VNodeChild {
    return this.child.value
  }

  override onMounted() {
    // 首次渲染触发 appear
    if (this.props.appear) {
      if (this.$el) this.runAppear(this.$el)
    }
  }
  override onBeforeUnmount() {
    // 给 child 执行 leave 动画
    this.runLeave(this.$el)
  }
  override onActivated() {
    // 给 child 执行 leave 动画
    this.runLeave(this.$el)
  }
  override $patchUpdate(oldChild: VNode, newChild: VNode): VNode {
    // 节点类型相同，key相同，则直接更新
    if (oldChild.type === newChild.type && oldChild.key === newChild.key) {
      return super.$patchUpdate(oldChild, newChild)
    }
    const dom = useDomAdapter()
    const anchor = dom.createText('')
    dom.insertBefore(anchor, oldChild.operationTarget)
    const oldEl = oldChild.element
    oldChild.unmount(false)

    switch (this.props.mode) {
      case 'out-in':
        this.runLeave(oldEl, () => this.runEnter(newChild, anchor))
        break
      case 'in-out':
        this.runEnter(newChild, anchor, () => this.runLeave(oldEl))
        break
      default:
        this.runLeave(oldEl)
        this.runEnter(newChild, anchor)
    }
    return newChild
  }
  protected getDuration(el: HostElement, type: 'enter' | 'leave'): number {
    if (typeof this.props.duration === 'number') return this.props.duration
    if (typeof this.props.duration === 'object') return this.props.duration[type] || 0
    const dom = useDomAdapter()
    return this.props.type === 'transition'
      ? dom.getTransitionDuration(el)
      : dom.getAnimationDuration(el)
  }
  /** ========== appear ========== */
  private runAppear(el: HostNodeElement) {
    this.runTransition(
      el,
      'appear',
      this.props.appearFromClass,
      this.props.appearActiveClass,
      this.props.appearToClass,
      this.props.onBeforeAppear,
      this.props.onAppear,
      this.props.onAfterAppear,
      this.props.onAppearCancelled
    )
  }
  /** ========== enter ========== */
  private runEnter(newChild: VNode, anchor: HostNodeElement, done?: () => void) {
    const el = newChild.element
    if (!useDomAdapter().isElement(el)) {
      newChild.mount(anchor, 'replace')
      done?.()
      return
    }
    newChild.mount(anchor, 'replace')
    this.runTransition(
      el,
      'enter',
      this.props.enterFromClass,
      this.props.enterActiveClass,
      this.props.enterToClass,
      this.props.onBeforeEnter,
      this.props.onEnter,
      this.props.onAfterEnter,
      this.props.onEnterCancelled,
      done
    )
  }
  /** ========== leave ========== */
  private runLeave(oldEl: HostNodeElement, done?: () => void) {
    if (!useDomAdapter().isElement(oldEl)) {
      useDomAdapter().remove(oldEl)
      done?.()
      return
    }
    this.runTransition(
      oldEl,
      'leave',
      this.props.leaveFromClass,
      this.props.leaveActiveClass,
      this.props.leaveToClass,
      this.props.onBeforeLeave,
      this.props.onLeave,
      this.props.onAfterLeave,
      this.props.onLeaveCancelled,
      done,
      true
    )
  }
  /**
   * 核心动画逻辑，统一处理 appear / enter / leave
   */
  private runTransition(
    el: HostNodeElement,
    type: 'enter' | 'leave' | 'appear',
    fromClass?: string,
    activeClass?: string,
    toClass?: string,
    beforeHook?: (el: HostElement) => void,
    hook?: (el: HostElement, done: () => void) => void,
    afterHook?: (el: HostElement) => void,
    cancelledHook?: (el: HostElement) => void,
    doneCallback?: () => void,
    removeOnEnd = false
  ) {
    const dom = useDomAdapter()

    if (!dom.isElement(el)) {
      // 非元素节点，不执行动画，但 leave 需要删除
      if (type === 'leave') dom.remove(el)
      doneCallback?.()
      return
    }

    // 取消已有动画
    this.cancelTransition(el, cancelledHook)

    beforeHook?.(el)

    if (this.props.css) {
      const from = fromClass || `${this.props.name}-${type}-from`
      const active = activeClass || `${this.props.name}-${type}-active`
      const to = toClass || `${this.props.name}-${type}-to`

      dom.addClass(el, from)
      dom.addClass(el, active)

      const duration =
        type === 'leave' ? this.getDuration(el, 'leave') : this.getDuration(el, 'enter')

      dom.requestAnimationFrame(() => {
        dom.removeClass(el, from)
        dom.addClass(el, to)
        hook?.(el, () => {}) // JS 钩子
      })

      const timer = setTimeout(() => {
        if (removeOnEnd) dom.remove(el)
        dom.removeClass(el, to)
        dom.removeClass(el, active)
        afterHook?.(el)
        doneCallback?.()
        this.activeTransitions.delete(el)
      }, duration)

      this.activeTransitions.set(el, timer)
    } else {
      // JS-only 模式，钩子自行调用 done
      let ended = false
      const end = () => {
        if (ended) return
        ended = true
        if (removeOnEnd) dom.remove(el)
        afterHook?.(el)
        doneCallback?.()
      }
      hook?.(el, end)
    }
  }

  /** 取消动画并触发 cancelledHook */
  private cancelTransition(el: HostElement, cancelledHook?: (el: HostElement) => void) {
    const timer = this.activeTransitions.get(el)
    if (timer) {
      clearTimeout(timer as number)
      this.activeTransitions.delete(el)
      cancelledHook?.(el)
    }
  }
}
