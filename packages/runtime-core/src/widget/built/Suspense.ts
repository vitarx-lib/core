import { Ref, ref, Subscriber, watch } from '@vitarx/responsive'
import { createVNode, defineProps, inject, provide, VNode } from '../../vnode/index.js'
import { type ErrorHandler } from '../types/index.js'
import { Widget } from '../widget.js'

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
  onError?: ErrorHandler<Suspense>
  /**
   * 监听子节点渲染完成
   *
   * 该钩子会在子节点全部渲染完成后执行
   */
  onShow?: () => void
}

const provideSymbol = Symbol('SuspenseSymbol')

/**
 * 同步等待加载子节点
 *
 * 该小部件可以等待子节点的异步加载完成后一同显示
 *
 * 通常它与`异步函数组件`、`LazyWidget`搭配使用。
 *
 * > 注意：在初次渲染完成后，子节点重新渲染发生的异步加载不会使`Suspense`节点重新回到挂起状态。
 */
export class Suspense extends Widget<SuspenseProps, Required<SuspenseProps>> {
  protected counter = ref(0)
  protected showFallback = true
  private listener?: Subscriber
  private onShow?: () => void

  constructor(props: SuspenseProps) {
    super(props)
    if (props.fallback && !VNode.is(props.fallback)) {
      throw new TypeError(
        `[Vitarx.Suspense]：fallback属性期望得到一个VNode对象，给定${typeof props.fallback}`
      )
    }
    defineProps({ fallback: createVNode('comment-node', { children: '异步节点加载失败' }) }, props)
    if (props.onError) {
      if (typeof props.onError !== 'function') {
        throw new TypeError(
          `[Vitarx.Suspense]：onError属性期望得到一个回调函数，给定${typeof props.onError}`
        )
      } else {
        this.onError = props.onError
      }
    }
    provide(provideSymbol, this.counter)
    // 监听计数器变化，手动管理视图更新，优化性能
    this.listener = watch(this.counter, () => {
      const newValue = this.counter.value
      const shouldShowFallback = newValue >= 1
      if (!shouldShowFallback && this.showFallback) {
        this.stopSuspense()
      }
    })
  }

  /**
   * 挂载完成后开始预渲染子节点
   *
   * @protected
   */
  override onMounted() {
    // 更新子节点的父节点
    VNode.addParentVNodeMapping(this.children, this.$vnode)
    // 预渲染子节点
    this.children.element
    // 如果计数器为0，则隐藏回退内容
    if (this.counter.value === 0) this.stopSuspense()
  }

  override onUpdated() {
    if (this.onShow) {
      const fn = this.onShow
      this.onShow = undefined
      fn()
    }
  }

  build(): VNode {
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
      this.update()
      if (typeof this.props.onShow === 'function') {
        this.onShow = this.props.onShow
      }
    }
  }
}

/**
 * 获取上级 `Suspense` 计数器
 *
 * @returns {Ref<number> | undefined} 如果存在则返回计数器Ref，不存在则返回undefined
 */
export function getSuspenseCounter(): Ref<number> | undefined {
  return inject<Ref<number> | undefined>(provideSymbol, undefined)
}
