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
export { Transition }
