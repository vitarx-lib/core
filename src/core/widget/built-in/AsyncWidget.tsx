import { __updateParentVNode, createVNode, Fragment, isVNode } from '../../vnode/VNode.js'
import { __WidgetPropsSelfNodeSymbol__ } from '../constant.js'
import { createScope } from '../../scope/index.js'
import { getSuspenseCounter } from './Suspense.js'
import type { Ref } from '../../variable/index.js'
import { type AsyncVNode, createAsyncFnWidget, type FnWidgetConstructor } from '../fn-widget.js'
import { type Element, Widget } from '../widget.js'

/** 异步函数组件类型 */
export type AsyncFnWidget = () => Promise<Element>

interface AsyncWidgetProps {
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
  error?: Element
}

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
        if (this.props.error && isVNode(this.props.error)) {
          this.updateChildVNode(this.props.error)
        } else {
          throw e
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
