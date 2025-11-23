import { shallowRef, Subscriber, watch } from '@vitarx/responsive'
import { NodeState, SUSPENSE_COUNTER_SYMBOL } from '../../constants/index.js'
import { linkParentNode, provide } from '../../runtime/index.js'
import type { AnyProps, ErrorHandler, VNode, VNodeChild } from '../../types/index.js'
import { isVNode } from '../../utils/index.js'
import { cloneVNode, createCommentNode, renderNode } from '../../vnode/index.js'
import { Widget } from '../base/Widget.js'

/**
 * Suspense小部件的配置选项
 *
 * @property {VNode} fallback - 回退内容
 * @property {VNode} children - 子节点
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
  fallback?: VNode
  /**
   * 子节点
   */
  children: VNode
  /**
   * 异常处理钩子
   */
  onError?: ErrorHandler
  /**
   * 监听子节点渲染完成
   *
   * 该钩子会在子节点全部渲染完成后执行
   */
  onResolved?: () => void
  /**
   * 是否持续监听异步子节点
   *
   * 默认为 false。若为 true，则即使首次异步完成，Suspense 仍保持监听，
   * 当计数器再次增加时，会重新显示 fallback。
   *
   * @defaultValue false
   */
  persistent?: boolean
}

/**
 * Suspense 小部件
 *
 * Suspense 用于在异步子节点加载期间显示备用内容（fallback），
 * 异步完成后自动切换到子节点内容。通常与异步函数组件、LazyWidget 搭配使用。
 *
 * 特性：
 * - 首次异步加载显示 fallback，完成后显示子节点
 * - 支持一次性回调 onResolved，在子节点首次渲染完成后触发
 * - 可选 persistent 模式，持续监听子节点异步加载，子节点再次异步渲染时重新显示 fallback 并，渲染完成重新触发 onResolved
 * - 安全处理卸载状态，避免已卸载组件更新
 *
 * @example 基本用法
 * ```tsx
 * <Suspense
 *   fallback={<div>加载中...</div>}
 * >
 *   <LazyWidget children={() => import('./MyWidget.js')} />
 * </Suspense>
 * ```
 *
 * @example 使用 onResolved 回调
 * ```tsx
 * <Suspense
 *   fallback={<div>加载中...</div>}
 *   onResolved={() => console.log('子节点渲染完成')}
 * >
 *   <LazyWidget children={() => import('./MyWidget.js')} />
 * </Suspense>
 * ```
 *
 * @example persistent 模式（持续监听）
 * ```tsx
 * <Suspense
 *   fallback={<div>加载中...</div>}
 *   persistent
 *   onResolved={() => console.log('每次子节点从 fallback 切换完成时触发')}
 * >
 *   <LazyWidget children={() => import('./MyWidget.js')} />
 * </Suspense>
 * ```
 *
 * @template P - SuspenseProps 类型
 */
export class Suspense extends Widget<SuspenseProps> {
  protected counter = shallowRef(0)
  protected showFallback = true
  private listener?: Subscriber
  private pendingOnResolved: boolean = false
  private ssrPromise?: (value: void) => void
  private fallback: VNode
  constructor(props: SuspenseProps) {
    super(props)
    provide(SUSPENSE_COUNTER_SYMBOL, this.counter)
    if (typeof props.onError === 'function') this.onError = props.onError
    this.fallback = isVNode(props.fallback)
      ? props.fallback
      : createCommentNode({ value: 'suspense fallback' })
    // 监听计数器变化，手动管理视图更新，优化性能
    this.listener = watch(this.counter, newValue => {
      // 如果为true则显示回退内容
      const shouldShowFallback = newValue >= 1
      if (shouldShowFallback && !this.showFallback) {
        // 计数器增加且 persistent 模式开启，重新显示 fallback
        if (this.props.persistent) {
          this.showFallback = true
          if (this.fallback.state !== NodeState.Created) {
            this.fallback = cloneVNode(this.fallback)
          }
          this.$forceUpdate()
        }
      } else if (!shouldShowFallback && this.showFallback) {
        // 首次或计数器归零，停止 fallback
        this.stopSuspense()
      }
    })
  }
  /**
   * 验证组件属性的类型和值是否符合预期
   * @static 静态方法，可以通过类名直接调用
   * @override 重写父类的validateProps方法
   * @param {AnyProps} props 需要验证的属性对象
   * @throws {TypeError} 当属性不符合预期时抛出类型错误
   */
  static override validateProps(props: AnyProps) {
    // 检查children属性是否存在且为VNode对象
    if (!isVNode(props.children)) {
      throw new TypeError(`Suspense.children属性期望得到一个节点对象，给定${typeof props.children}`)
    }
    // 检查fallback属性是否存在，且是否为VNode对象
    if (props.fallback && !isVNode(props.fallback)) {
      return `Suspense.fallback属性期望得到一个节点对象，给定${typeof props.fallback}`
    }
    // 检查onError属性是否存在，且是否为函数类型
    if (props.onError && typeof props.onError !== 'function') {
      return `Suspense.onError属性期望得到一个回调函数，给定${typeof props.onError}`
    }
  }
  override async onRender(): Promise<void> {
    // 链接父子关系
    linkParentNode(this.children, this.$vnode)
    // 渲染子节点
    renderNode(this.children)
    // 如果计数器为0，则直接显示子节点
    if (this.counter.value === 0) {
      this.showFallback = false
      return void 0
    }
    return new Promise(resolve => (this.ssrPromise = resolve))
  }
  override onActivated() {
    this.complete()
  }
  /**
   * 完成状态处理方法
   * 当状态更新完成时调用此方法，处理等待中的回调函数
   */
  private complete() {
    // 如果是等待更新状态，则调用onUpdated钩子触发onResolved回调
    if (this.pendingOnResolved) {
      this.pendingOnResolved = false // 将等待状态标记为已完成
      if (this.ssrPromise) {
        this.ssrPromise() // 执行服务端渲染相关的Promise回调
        this.ssrPromise = undefined // 清除服务端渲染Promise引用
      }
      if (typeof this.props.onResolved === 'function') {
        this.props.onResolved() // 执行onResolved回调函数
      }
    }
  }
  build(): VNodeChild {
    return this.showFallback ? this.fallback : this.children
  }
  /**
   * 停止挂起状态
   *
   * @private
   */
  private stopSuspense() {
    if (this.showFallback) {
      if (this.$vnode.state === NodeState.Unmounted) return
      if (!this.props.persistent) {
        this.listener?.dispose()
        this.listener = undefined
      }
      this.showFallback = false
      if (this.$vnode.state === NodeState.Deactivated) {
        this.pendingOnResolved = true
      } else {
        this.$forceUpdate()
        this.complete()
      }
    }
  }
}
