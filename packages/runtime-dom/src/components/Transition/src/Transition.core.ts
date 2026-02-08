import { watch } from '@vitarx/responsive'
import { getInstance, onMounted, onViewSwitch, resolveDirective } from '@vitarx/runtime-core'
import type { TransitionProps } from './Transition.types.js'
import { cancelTransition, createAnchor, isElement, runTransition } from './Transition.utils.js'

/**
 * Transition 组件：控制子节点的进入/离开动画
 *
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
 *   <div v-if={show}>内容</div>
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
 * - `v-appear-from`: 定义初次渲染时的进入过渡开始状态
 * - `v-appear-active`: 定义初次渲染时的进入过渡生效时的状态
 * - `v-appear-to`: 定义初次渲染时的进入过渡结束状态
 *
 * 其中 `v` 是 Transition 组件的 name 属性值，默认为 "v"。
 *
 * ## 注意事项
 * - Transition 组件只能包裹单个子元素或组件。如果需要过渡多个元素，请使用 TransitionGroup
 * - 当使用 CSS 过渡时，确保在 CSS 中正确定义了过渡或动画属性
 */
function Transition(props: TransitionProps) {
  const instance = getInstance()!
  if (props.appear) {
    onMounted(() => {
      runTransition(instance.view.node, 'appear', props)
    })
  }
  // 兼容 v-show 指令切换
  const dirs = props.children.directives
  if (dirs) {
    const dir = resolveDirective('show')!
    const show = dirs.get(dir)
    if (show) {
      watch(
        () => show.value,
        newValue => {
          if (instance.subView.isMounted) {
            if (newValue) {
              runTransition(instance.subView.node, 'enter', props)
            } else {
              runTransition(instance.subView.node, 'leave', props)
            }
          }
        }
      )
    }
  }
  // 兼容条件渲染
  onViewSwitch(tx => {
    const { prev, next } = tx
    // 非挂载状态直接返回，不进行任何处理
    if (!prev.isMounted) return void 0
    if (!next.isRuntime) next.init(prev.ctx)
    // 根据不同的过渡模式执行动画
    switch (props.mode) {
      case 'out-in':
        // 取消上一次未完成的任务
        if (isElement(prev.node)) cancelTransition(prev.node)
        // 先执行离开动画，完成后再执行进入动画
        runTransition(prev.node, 'leave', props, () => {
          tx.commit()
          if (next.isMounted) runTransition(next.node, 'enter', props)
        })
        return false
      case 'in-out':
        if (next.isInitialized) next.mount(createAnchor(prev.node), 'replace')
        // 先执行进入动画，完成后再执行离开动画
        runTransition(next.node, 'enter', props, () => {
          runTransition(prev.node, 'leave', props, prev.dispose.bind(prev))
        })
        break
      default:
        if (next.isInitialized) next.mount(createAnchor(prev.node), 'replace')
        runTransition(next.node, 'enter', props)
        runTransition(prev.node, 'leave', props, prev.dispose.bind(prev))
        break
    }
    tx.commit({ mode: 'pointer-only' })
    return false
  })

  return props.children
}
Transition.defaultProps = {
  /** 默认过渡名称前缀 */
  name: 'v',
  /** 默认不在初始渲染时触发过渡 */
  appear: false,
  /** 默认使用 CSS 过渡类 */
  css: true,
  /** 默认使用自动计算 */
  type: 'auto',
  /** 默认过渡持续时间 */
  mode: 'default'
} as const
export { Transition }
