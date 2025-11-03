import { ref, Subscriber, watch } from '@vitarx/responsive'
import type { AnyProps, ErrorHandler, VNodeChild } from '../../types/index.js'
import { isVNode, linkParentNode, NodeState, provide, VNode } from '../../vnode/index.js'
import { Widget } from '../base/Widget.js'
import { SUSPENSE_COUNTER_SYMBOL } from '../utils/index.js'

/**
 * Suspense小部件的配置选项
 *
 * @property {VNode} fallback - 回退内容
 * @property {VNode} children - 子节点
 * @property {ErrorHandler<Suspense>} onError - 异常处理钩子
 * @property {() => void} onShow - 子节点渲染完成时触发的钩子
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
  onShow?: () => void
}

/**
 * 同步等待加载子节点
 *
 * 该小部件可以等待子节点的异步加载完成后一同显示
 *
 * 通常它与`异步函数组件`、`LazyWidget`搭配使用。
 *
 * > 注意：在初次渲染完成后，子节点重新渲染发生的异步加载不会使`Suspense`节点重新回到挂起状态。
 */
export class Suspense extends Widget<SuspenseProps> {
  protected counter = ref(0)
  protected showFallback = true
  private listener?: Subscriber
  private onShow?: () => void
  constructor(props: SuspenseProps) {
    super(props)
    provide(SUSPENSE_COUNTER_SYMBOL, this.counter)
    if (props.onError) this.onError = props.onError
    if (typeof this.props.onShow === 'function') {
      this.onShow = this.props.onShow
    }
    // 监听计数器变化，手动管理视图更新，优化性能
    this.listener = watch(this.counter, newValue => {
      const shouldShowFallback = newValue >= 1
      if (!shouldShowFallback && this.showFallback) {
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
    // 检查fallback属性是否存在，且是否为VNode对象
    if (props.fallback && !isVNode(props.fallback)) {
      throw new TypeError(
        `[Vitarx.Suspense]：fallback属性期望得到一个VNode对象，给定${typeof props.fallback}`
      )
    }
    // 检查onError属性是否存在，且是否为函数类型
    if (props.onError && typeof props.onError !== 'function') {
      throw new TypeError(
        `[Vitarx.Suspense]：onError属性期望得到一个回调函数，给定${typeof props.onError}`
      )
    }
  }

  /**
   * 挂载前开始预渲染子节点
   *
   * @protected
   */
  override onBeforeMount() {
    // 更新子节点的父节点
    linkParentNode(this.children, this.$vnode)
    // 预渲染子节点
    this.children.render()
    // 如果计数器为0，则隐藏回退内容
    if (this.counter.value === 0) this.stopSuspense()
  }
  override onMounted() {
    this.$forceUpdate()
  }
  override onUpdated() {
    if (this.onShow) {
      const fn = this.onShow
      this.onShow = undefined
      fn()
    }
  }

  build(): VNodeChild {
    return this.showFallback ? this.props.fallback : this.children
  }

  /**
   * 停止挂起状态
   *
   * @private
   */
  private stopSuspense() {
    if (this.showFallback) {
      this.listener?.dispose()
      this.showFallback = false
      this.listener = undefined
      if (this.$vnode.state === NodeState.Activated) {
        this.$forceUpdate()
      }
    }
  }
}
