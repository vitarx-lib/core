import { computed } from '@vitarx/responsive'
import { isArray, logger } from '@vitarx/utils/src/index.js'
import { useDomAdapter } from '../../adapter/index.js'
import type { HostNodeElements } from '../../types/index.js'
import { VNodeChild } from '../../types/vnode.js'
import { isNonElementNode, VNode, VNodeUpdate } from '../../vnode/index.js'
import { BaseTransition, type BaseTransitionProps } from './BaseTransition.js'

interface TransitionProps extends BaseTransitionProps {
  /** 过渡模式：
   * - 'out-in': 当前元素先离开，新元素后进入
   * - 'in-out': 新元素先进入，当前元素后离开
   * - 'default': 同时进行进入和离开
   *
   * 默认为 'default'
   * @default 'default'
   */
  mode?: 'out-in' | 'in-out' | 'default'
}

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
export class Transition extends BaseTransition<TransitionProps, { mode: 'default' }> {
  /** 组件默认属性 */
  static override defaultProps = { ...BaseTransition.defaultProps, mode: 'default' } as const
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
    // 根据不同的过渡模式执行动画
    switch (this.props.mode) {
      case 'out-in':
        // 先执行离开动画，完成后再执行进入动画
        this.runLeave(oldChild, () => this.mountAndEnter(newChild, anchor))
        break
      case 'in-out':
        // 先执行进入动画，完成后再执行离开动画
        this.mountAndEnter(newChild, anchor, () => this.runLeave(oldChild))
        break
      default:
        // 同时执行进入和离开动画
        this.runLeave(oldChild)
        this.mountAndEnter(newChild, anchor)
    }
    return newChild
  }

  /**
   * @inheritDoc
   */
  protected override runLeave(oldChild: VNode, done?: () => void) {
    // 执行离开动画或过渡效果，done回调会在动画完成后执行（如果提供）
    super.runLeave(oldChild, () => {
      oldChild.unmount() // 卸载虚拟节点对应的DOM元素
      done?.() // 如果提供了done回调，则执行它
    })
  }

  /**
   * 挂载并执行进入新子节点动画
   * @param newChild - 新的虚拟节点(VNode)需要被挂载
   * @param anchor - 锚点(HostNodeElement)，用于确定新节点的插入位置
   * @param done - 可选的回调函数，在动画完成或操作完成后执行
   */
  private mountAndEnter(newChild: VNode, anchor: HostNodeElements, done?: () => void) {
    // 调用mount方法将新子节点挂载到指定锚点位置，使用'replace'模式
    newChild.mount(anchor, 'replace')
    // 执行进入动画或过渡效果，done回调会在动画完成后执行（如果提供）
    this.runEnter(newChild, done)
  }
}
