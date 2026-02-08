import { watch } from '@vitarx/responsive'
import {
  getInstance,
  onMounted,
  onViewSwitch,
  resolveDirective,
  type View
} from '@vitarx/runtime-core'
import type { BaseTransitionProps } from './Transition.types.js'
import { cancelTransition, createAnchor, isElement, runTransition } from './Transition.utils.js'

/**
 * Transition 组件属性接口
 *
 * 定义了 Transition 组件的所有可配置属性，包括钩子函数、CSS 类名、
 * 过渡模式、持续时间等设置。
 */
interface TransitionProps extends BaseTransitionProps {
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
/**
 * Transition 组件：控制子节点的进入/离开动画
 *
 * Transition 会自动应用进入/离开过渡，可以由 CSS 过渡或动画库控制，
 * 也可以通过 JavaScript 钩子手动控制。
 *
 * @example
 * ```jsx
 * <Transition>
 *   <p v-if="show">Hello Vitarx</p>
 * </Transition>
 * <Transition>
 *   <p v-show="show">Hello Vitarx</p>
 * </Transition>
 * ```
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
    if (next.isDetached) next.init(prev.ctx)
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
        if (next.isMounted) {
          runTransition(next.node, 'enter', props, () => {
            runTransition(prev.node, 'leave', props, prev.dispose.bind(prev))
          })
        } else {
          runTransition(prev.node, 'leave', props, prev.dispose.bind(prev))
        }
        break
      default:
        if (next.isInitialized) next.mount(createAnchor(prev.node), 'replace')
        if (next.isMounted) runTransition(next.node, 'enter', props)
        runTransition(prev.node, 'leave', props, prev.dispose.bind(prev))
        break
    }
    tx.commit({ mode: 'pointer-only' })
    return false
  })

  return props.children
}
export { Transition, type TransitionProps }
