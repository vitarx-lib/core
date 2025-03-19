import { type Element, Widget } from '../widget.js'
import { Ref, ref } from '../../responsive/index.js'
import {
  createVNode,
  defineProps,
  Fragment,
  inject,
  isVNode,
  provide,
  updateParentVNodeMapping
} from '../../vnode/index.js'
import { Listener, watch } from '../../observer/index.js'
import { renderElement } from '../../renderer/web-runtime-dom/index.js'
import type { ErrorInfo, ErrorSource } from '../life-cycle.js'

/**
 * onError生命周期钩子
 *
 * @param {unknown} error - 捕获到的异常，通常是Error对象，也有可能是子组件抛出的其他异常
 * @param {ErrorSource} info - 捕获异常的阶段，可以是`build`或`render`
 * @returns {void|Element} - 可以返回一个`Element`虚拟节点，做为后备内容展示。
 */
type OnErrorCallback = (this: Suspense, error: unknown, info: ErrorInfo) => void | Element

/**
 * Suspense小部件的配置选项
 *
 * @property {Element} fallback - 回退内容
 * @property {Element} children - 子节点
 * @property {OnErrorCallback} onError - 异常处理钩子
 * @property {() => void} onShow - 子节点渲染完成钩子
 */
interface SuspenseProps {
  /**
   * 回退内容
   *
   * 在异步子节点加载完成之前会显示该属性传入的节点，
   * 加载完成过后会立即切换为子节点内容。
   */
  fallback?: Element
  /**
   * 子节点
   */
  children: Element
  /**
   * 异常处理钩子
   */
  onError?: OnErrorCallback
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
 * 该组件可以等待子节点的异步加载完成后一同显示
 *
 * 通常它与`异步函数组件`、`LazyWidget`搭配使用。
 *
 * > 注意：在初次渲染完成后，子节点重新渲染发生的异步加载不会使`Suspense`节点重新回到挂起状态。
 */
export class Suspense extends Widget<SuspenseProps, Required<SuspenseProps>> {
  protected counter = ref(0)
  protected showFallback = true
  private listener?: Listener
  private onShow?: () => void
  constructor(props: SuspenseProps) {
    super(props)
    if (props.fallback && !isVNode(props.fallback)) {
      throw new TypeError(
        `[Vitarx.Suspense]：fallback属性期望得到一个VNode对象，给定${typeof props.fallback}`
      )
    }
    defineProps({ fallback: createVNode(Fragment) }, props)
    if (props.onError) {
      if (typeof props.onError !== 'function') {
        throw new TypeError(
          `[Vitarx.Suspense]：onError属性期望得到一个回调函数，给定${typeof props.onError}`
        )
      } else {
        this.onError = props.onError
      }
    }
    provide(provideSymbol, this.counter, this)
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
  protected override onMounted() {
    // 更新子节点的父节点
    updateParentVNodeMapping(this.children, this.vnode)
    // 预渲染子节点
    renderElement(this.children)
    // 如果计数器为0，则隐藏回退内容
    if (this.counter.value === 0) {
      this.stopSuspense()
    }
  }

  protected override onUpdated() {
    if (this.onShow) {
      const fn = this.onShow
      this.onShow = undefined
      fn()
    }
  }

  protected build(): Element {
    return this.showFallback ? this.props.fallback : this.children
  }

  /**
   * 停止挂起状态
   *
   * @private
   */
  private stopSuspense() {
    if (this.showFallback) {
      this.listener?.destroy()
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
 * @param {Widget} [instance] - 当前小部件实例
 * @returns {Ref<number> | undefined} 如果存在则返回计数器Ref，不存在则返回undefined
 */
export function getSuspenseCounter(instance?: Widget): Ref<number> | undefined {
  return inject<Ref<number> | undefined>(provideSymbol, undefined, instance)
}
