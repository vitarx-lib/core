import { watch } from '@vitarx/responsive'
import {
  getInstance,
  isView,
  onMounted,
  onViewSwitch,
  resolveDirective,
  type View
} from '@vitarx/runtime-core'
import type { BaseTransitionProps } from './Transition.types.js'
import { cancelTransition, isElement, runTransition } from './Transition.utils.js'

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
 * 过渡组件：为子节点提供进入/离开动画
 *
 * 支持 CSS 过渡/动画或 JavaScript 钩子控制，可与 `v-if`、`v-show`、`Dynamic`、`Freeze` 等配合使用。
 *
 * @note 会阻断 `onViewSwitch` 事件
 *
 * @example v-if 条件渲染
 * ```tsx
 * <Transition><div v-if="show">内容</div></Transition>
 * ```
 *
 * @example v-if 块
 * ```tsx
 * <Transition>
 *   <IfBlock>
 *     <h1 v-if="show">标题</h1>
 *     <h2 v-else>备用标题</h2>
 *   </IfBlock>
 * </Transition>
 * ```
 *
 * @example v-show 指令
 * ```tsx
 * <Transition><div v-show="show">内容</div></Transition>
 * ```
 *
 * @example Dynamic 组件
 * ```tsx
 * <Transition><Dynamic is={show.value ? A : B} memo /></Transition>
 * ```
 *
 * @example Freeze 组件
 * ```tsx
 * <Transition><Freeze is={current} max={3} /></Transition>
 * ```
 */
function Transition(props: TransitionProps): View {
  if (__VITARX_SSR__) return props.children

  const instance = getInstance()

  if (props.appear) {
    onMounted(() => {
      runTransition(instance.view.node, 'appear', props)
    })
  }

  if (isView(props.children)) {
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
  }

  // 兼容条件渲染
  onViewSwitch(tx => {
    const { prev, next } = tx
    // 非挂载状态直接返回，不进行任何处理
    if (!prev.isMounted) return void 0
    if (!prev.isActive) return void 0
    tx.stopPropagation()
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
        break
      case 'in-out':
        tx.commitNext(true)
        // 先执行进入动画，完成后再执行离开动画
        if (next.isMounted) {
          runTransition(next.node, 'enter', props, () => {
            if (prev.isMounted) runTransition(prev.node, 'leave', props, tx.commitPrev.bind(tx))
          })
        } else {
          runTransition(prev.node, 'leave', props, tx.commitPrev.bind(tx))
        }
        break
      default:
        tx.commitNext(true)
        if (next.isMounted) runTransition(next.node, 'enter', props)
        runTransition(prev.node, 'leave', props, tx.commitPrev.bind(tx))
        break
    }
  })

  return props.children
}
export { Transition, type TransitionProps }
