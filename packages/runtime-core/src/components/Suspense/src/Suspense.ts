import { queuePostFlushJob, shallowRef, watch } from '@vitarx/responsive'
import { isFunction } from '@vitarx/utils'
import { SUSPENSE_COUNTER } from '../../../constants/index.js'
import { CommentView, DynamicView } from '../../../core/index.js'
import { getInstance, onInit, provide } from '../../../runtime/index.js'
import { isView } from '../../../shared/index.js'
import type { AnyProps, View } from '../../../types/index.js'

/**
 * Suspense小部件的配置选项
 *
 * @property {View} fallback - 回退内容
 * @property {View} children - 子节点
 * @property {() => void} onResolved - 子节点渲染完成时触发的钩子
 */
interface SuspenseProps {
  /**
   * 子节点
   */
  children: View
  /**
   * 回退内容
   *
   * 在异步子节点加载完成之前会显示该属性传入的节点，
   * 加载完成过后会立即切换为子节点内容。
   */
  fallback?: View
  /**
   * 监听解析完成事件
   *
   * 该钩子会在子元素全部解析并替换完成后执行。
   */
  onResolved?: () => void
}

/**
 * Suspense 组件
 *
 * 用于处理异步组件加载时的占位显示
 *
 * @param {SuspenseProps} props - 组件属性
 * @param {View} props.fallback - 加载中显示的占位视图
 * @param {View} props.children - 实际要渲染的内容
 * @param {Function} [props.onResolved] - 异步加载完成时的回调函数
 * @returns {View} 返回渲染的视图
 *
 * @example
 * ```tsx
 * // 基本用法
 * <Suspense fallback={<div>Loading...</div>}>
 *   <AsyncComponent />
 * </Suspense>
 *
 * // 使用 onResolved 回调
 * <Suspense
 *   fallback={<div>Loading...</div>}
 *   onResolved={() => console.log('Async content loaded!')}>
 *   <AsyncComponent />
 * </Suspense>
 * ```
 */
function Suspense({ fallback, children, onResolved }: SuspenseProps): View {
  const instance = getInstance()!
  const counter = shallowRef(0)
  const fallbackView = isView(fallback) ? fallback : new CommentView('Suspense:fallback')
  const showView = shallowRef(fallbackView)
  // 提供计数器给子组件使用
  provide(SUSPENSE_COUNTER, counter)

  // 存储Promise resolve函数
  let resolvePromise: (() => void) | undefined

  // 监听计数器变化
  const counterWatcher = watch(
    counter,
    newValue => {
      // 当计数器归零且当前显示fallback时，切换到子节点
      if (showView.value === fallbackView && newValue <= 0) {
        counterWatcher.dispose()
        showView.value = children
        queuePostFlushJob(() => {
          if (isFunction(onResolved)) onResolved()
          resolvePromise?.()
        })
      }
    },
    {
      flush: 'sync'
    }
  )
  // 准备阶段渲染子节点
  onInit(() => {
    children.init(instance.subViewContext)
    // 如果计数器为0，立即显示子节点
    if (counter.value === 0) {
      showView.value = children
      return
    }
    // 返回Promise等待异步内容加载
    return new Promise<void>(resolve => (resolvePromise = resolve))
  })
  return new DynamicView(showView)
}

Suspense.validateProps = (props: AnyProps) => {
  // 验证children属性
  if (!isView(props.children)) {
    throw new TypeError(
      `[Suspense]: children property expects a view node object, received ${typeof props.children}`
    )
  }
  // 验证fallback属性
  if (props.fallback && !isView(props.fallback)) {
    throw new TypeError(
      `[Suspense]: fallback property expects a view node object, received ${typeof props.fallback}`
    )
  }
  // 验证onResolved属性
  if (props.onResolved && typeof props.onResolved !== 'function') {
    throw new TypeError(
      `[Suspense]: onResolved property expects a function, received ${typeof props.onResolved}`
    )
  }
}

export { Suspense, type SuspenseProps }
