import { type Element, Widget } from '../widget'
import { Ref, ref } from '../../variable/index.js'
import { __updateParentVNode, inject, isVNode, provide } from '../../vnode/index.js'
import { watch } from '../../observer/index.js'
import { renderElement } from '../../renderer/web-runtime-dom/index.js'

interface SuspenseProps {
  fallback: Element
  children: Element
  error?: Element
}

const provideSymbol = Symbol('SuspenseSymbol')

/**
 * 同步等待加载子节点
 *
 * 该组件可以等待子节点的异步加载完成
 *
 * 通常它与`AsyncWidget`组件配合使用
 */
export default class Suspense extends Widget<SuspenseProps> {
  protected counter = ref(0)
  protected showFallback = true

  constructor(props: SuspenseProps) {
    super(props)
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
    __updateParentVNode(this.children, this.vnode)
    // 预渲染子节点
    renderElement(this.children)
  }

  protected build(): Element {
    return this.showFallback ? this.props.fallback : this.children
  }

  protected override onError(error: Error) {
    if (this.props.error && isVNode(this.props.error)) {
      return this.props.error
    } else {
      throw error
    }
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
