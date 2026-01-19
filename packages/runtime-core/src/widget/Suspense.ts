import { nextTick, shallowRef, watch } from '@vitarx/responsive'
import { isFunction } from '@vitarx/utils'
import { getInstance, onPrepare, provide } from '../runtime/index.js'
import { SUSPENSE_COUNTER } from '../shared/constants/symbol.js'
import { isView } from '../shared/index.js'
import type { AnyProps, ValidChild, View } from '../types/index.js'
import { build, createAnchorView, renderView } from '../view/index.js'

/**
 * Suspense小部件的配置选项
 *
 * @property {View} fallback - 回退内容
 * @property {View} children - 子节点
 * @property {ErrorHandler<Suspense>} onError - 异常处理钩子
 * @property {() => void} onResolved - 子节点渲染完成时触发的钩子
 */
interface SuspenseProps {
  /**
   * 回退内容
   *
   * 在异步子节点加载完成之前会显示该属性传入的节点，
   * 加载完成过后会立即切换为子节点内容。
   */
  fallback?: ValidChild
  /**
   * 子节点
   */
  children: View
  /**
   * 监听子节点渲染完成
   *
   * 该钩子会在子节点全部渲染完成后执行
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
 */
function Suspense({ fallback, children, onResolved }: SuspenseProps): View {
  const instance = getInstance()!
  const counter = shallowRef(0)
  const showFallback = shallowRef(true)
  const fallbackView = isView(fallback) ? fallback : createAnchorView('Suspense:fallback')
  // 提供计数器给子组件使用
  provide(SUSPENSE_COUNTER, counter)

  // 存储Promise resolve函数
  let resolvePromise: (() => void) | undefined

  // 监听计数器变化
  const counterWatcher = watch(
    counter,
    newValue => {
      const shouldShowFallback = newValue >= 1

      // 当计数器归零且当前显示fallback时，切换到子节点
      if (!shouldShowFallback && showFallback.value) {
        counterWatcher.dispose()
        showFallback.value = false
        nextTick(handleResolved)
      }
    },
    { flush: 'post' }
  )

  // 处理解析完成
  const handleResolved = () => {
    if (isFunction(onResolved)) {
      onResolved()
    }
    resolvePromise?.()
  }

  // 准备阶段渲染子节点
  onPrepare(() => {
    renderView(children, instance.view, instance, instance.app)
    // 如果计数器为0，立即显示子节点
    if (counter.value === 0) {
      showFallback.value = false
      return
    }
    // 返回Promise等待异步内容加载
    return new Promise<void>(resolve => (resolvePromise = resolve))
  })

  return build(() => (showFallback.value ? fallbackView : children))
}

Suspense.validateProps = (props: AnyProps) => {
  // 验证children属性
  if (!isView(props.children)) {
    throw new TypeError(
      `Suspense.children属性期望得到一个视图节点对象，给定${typeof props.children}`
    )
  }

  // 验证fallback属性
  if (props.fallback !== undefined && !isView(props.fallback)) {
    return `Suspense.fallback属性期望得到一个视图节点对象，给定${typeof props.fallback}`
  }

  // 验证onResolved属性
  if (props.onResolved !== undefined && typeof props.onResolved !== 'function') {
    return `Suspense.onResolved属性期望得到一个函数，给定${typeof props.onResolved}`
  }
}

export { Suspense, SuspenseProps }
