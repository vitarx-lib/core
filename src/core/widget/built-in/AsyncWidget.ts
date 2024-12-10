import { __WidgetPropsSelfNodeSymbol__ } from '../constant.js'
import { createScope } from '../../scope/index.js'
import { getSuspenseCounter } from './Suspense.js'
import type { Ref } from '../../variable/index.js'
import { type AsyncVNode, createAsyncFnWidget, type FnWidgetConstructor } from '../fn-widget.js'
import { type Element, Widget } from '../widget.js'
import { __updateParentVNode, createVNode, Fragment, isVNode } from '../../vnode/index.js'
import type { ErrorInfo } from '../life-cycle.js'

/** 异步函数小部件类型 */
export type AsyncFnWidget = () => Promise<Element>

/**
 * onError生命周期钩子
 *
 * @param {unknown} error - 捕获到的异常，通常是Error对象，也有可能是子组件抛出的其他异常
 * @param {ErrorInfo} info - 捕获异常的阶段，可以是`build`或`render`
 * @returns {void|Element} - 可以返回一个`Element`虚拟节点，做为后备内容展示。
 */
type AsyncWidgetErrorCallback = (
  this: AsyncWidget,
  error: unknown,
  info: ErrorInfo
) => void | Element

/**
 * 异步小部件的配置选项
 */
export interface AsyncWidgetProps {
  /**
   * 异步函数小部件
   *
   * 通俗的来说它就是一个返回Promise<Element>的函数式声明小部件
   *
   * 它不能单独做为节点使用，因为它的渲染逻辑，构造逻辑都由`AsyncWidget`控制。
   *
   *
   * 示例：
   * ```jsx
   * async function MyWidget() {
   *   const data = await fetch('http://xxx')
   *   return <div>展示data中的数据...</div>
   * }
   * ```
   */
  children: AsyncFnWidget
  /**
   * 加载成功之前要显示的组件
   */
  loading?: Element
  /**
   * 加载失败时要显示的组件
   */
  onError?: AsyncWidgetErrorCallback
}

/**
 * ## 异步小部件
 *
 * 异步小部件是一个特殊的小部件，它支持异步的函数式组件渲染。
 */
export default class AsyncWidget extends Widget<AsyncWidgetProps> {
  protected _childVNode: Element | undefined = undefined
  // 暂停计数器
  protected suspenseCounter: Ref<number> | undefined = undefined
  // 标记是否需要更新
  private toBeUpdated: boolean = false

  constructor(props: AsyncWidgetProps) {
    super(props)
    if (props.loading && isVNode(props.loading)) {
      this._childVNode = props.loading
    } else {
      this.suspenseCounter = getSuspenseCounter(this)
      // 如果有上级暂停计数器则让计数器+1
      if (this.suspenseCounter) this.suspenseCounter.value++
    }
    if (props.onError) {
      if (typeof props.onError !== 'function') {
        console.warn(
          `[Vitarx.AsyncWidget]：onError属性期望得到一个回调函数，给定${typeof props.onError}`
        )
      } else {
        this.onError = props.onError
      }
    }
    this.load()
  }

  protected updateChildVNode(vnode: Element) {
    this._childVNode = vnode
    if (this.suspenseCounter) {
      this.suspenseCounter.value--
    }
    // 如果还未挂载状态则标记待更新
    if (this.renderer.state === 'notMounted') {
      this.toBeUpdated = true
    } else {
      this.update()
    }
  }

  protected load() {
    createScope(() => {
      const asyncVnode = createVNode(this.children as unknown as FnWidgetConstructor)
      // 更新父节点
      __updateParentVNode(asyncVnode, this.vnode)
      Object.defineProperty(asyncVnode.props, __WidgetPropsSelfNodeSymbol__, {
        value: asyncVnode
      })
      try {
        createAsyncFnWidget(asyncVnode as unknown as AsyncVNode).then(instance => {
          // 得到异步小部件实例
          asyncVnode.instance = instance
          // 渲染小部件
          asyncVnode.el = instance.renderer.render()
          this.updateChildVNode(asyncVnode)
        })
      } catch (e) {
        if ('onError' in this) {
          const el = this.onError!(e, 'build')
          if (isVNode(el)) {
            return this.updateChildVNode(el)
          }
        }
      }
    })
  }

  protected override onMounted() {
    if (this.toBeUpdated) this.update()
  }

  protected build(): Element {
    return this._childVNode || createVNode(Fragment)
  }
}
