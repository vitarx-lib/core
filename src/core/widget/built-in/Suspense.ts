import { type Element, Widget } from '../widget'
import { Ref, ref } from '../../responsive/index.js'
import {
  createVNode,
  Fragment,
  inject,
  isVNode,
  provide,
  updateParentVNodeMapping
} from '../../vnode/index.js'
import { watch } from '../../observer/index.js'
import { renderElement } from '../../renderer/web-runtime-dom/index.js'
import type { ErrorInfo } from '../life-cycle.js'

/**
 * onError生命周期钩子
 *
 * @param {unknown} error - 捕获到的异常，通常是Error对象，也有可能是子组件抛出的其他异常
 * @param {ErrorInfo} info - 捕获异常的阶段，可以是`build`或`render`
 * @returns {void|Element} - 可以返回一个`Element`虚拟节点，做为后备内容展示。
 */
type OnErrorCallback = (this: Suspense, error: unknown, info: ErrorInfo) => void | Element

/**
 * Suspense小部件的配置选项
 *
 * @property {Element} fallback - 回退内容
 * @property {Element} children - 子节点
 * @property {OnErrorCallback} onError - 异常处理钩子
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
}

const provideSymbol = Symbol('SuspenseSymbol')

/**
 * 同步等待加载子节点
 *
 * 该组件可以等待子节点的异步加载完成
 *
 * 通常它与`AsyncWidget`、`LazyWidget`搭配使用。
 */
export default class Suspense extends Widget<SuspenseProps> {
  protected counter = ref(0)
  protected showFallback = true

  constructor(props: SuspenseProps) {
    super(props)
    if (props.fallback && !isVNode(props.fallback)) {
      console.warn(
        `[Vitarx.Suspense]：fallback属性期望得到一个VNode对象，给定${typeof props.fallback}`
      )
    }
    if (props.onError) {
      if (typeof props.onError !== 'function') {
        console.warn(
          `[Vitarx.Suspense]：onError属性期望得到一个回调函数，给定${typeof props.onError}`
        )
      } else {
        this.onError = props.onError
      }
    }
    provide(provideSymbol, this.counter, this)
    // 监听计数器变化，手动管理视图更新，优化性能
    watch(this.counter, () => {
      const newValue = this.counter.value
      const shouldShowFallback = newValue >= 1
      if (shouldShowFallback !== this.showFallback) {
        this.showFallback = shouldShowFallback
        // 强制更新视图
        this.update()
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
      this.showFallback = false
      this.update()
    }
  }

  get fallback() {
    return this.props.fallback || createVNode(Fragment)
  }

  protected build(): Element {
    return this.showFallback ? this.fallback : this.children
  }
}

/**
 * 获取上级 Suspense 组件的计数器
 *
 * @param instance - 当前小部件实例
 * @returns {Ref<number> | undefined} 如果存在则返回计数器Ref，不存在则返回undefined
 */
export function getSuspenseCounter(instance: Widget): Ref<number> | undefined {
  return inject<Ref<number> | undefined>(provideSymbol, undefined, instance)
}
