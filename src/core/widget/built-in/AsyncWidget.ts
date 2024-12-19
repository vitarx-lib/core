import { type BuildVNode, FnWidget } from '../fn-widget.js'
import type { ErrorInfo } from '../life-cycle.js'
import { type Element, Widget } from '../widget.js'
import { createVNode } from '../../vnode/index.js'

/**
 * onError生命周期钩子
 *
 * @param {unknown} error - 捕获到的异常，通常是Error对象，也有可能是子组件抛出的其他异常
 * @param {ErrorInfo} info - 捕获异常的阶段，可以是`build`或`render`
 * @returns {void|Element} - 可以返回一个`Element`虚拟节点，做为后备内容展示。
 */
export type AsyncWidgetErrorCallback = (
  this: AsyncWidget,
  error: unknown,
  info: ErrorInfo
) => void | Element
/**
 * 异步函数小部件
 *
 * 示例：
 * ```tsx
 * import {withAsyncContext} from 'vitarx'
 *
 * async function YourAsyncFnWidget(props: { name: string }) {
 *   // 必需使用withAsyncContext包裹异步加载数据的异步函数，withAsyncContext函数内部维护了异步上下文的切换
 *   // 后期可能会在vite-plugin-vitarx编译插件中自动处理withAsyncContext
 *   const userInfo = await withAsyncContext(()=>fetchUserInfo)
 *   return <div>Hello, {userInfo.name}!</div>
 * }
 * ```
 */
export type AsyncFnWidget = (this: FnWidget) => Promise<BuildVNode>

export interface AsyncWidgetProps {
  /**
   * 异步函数小部件
   */
  children: AsyncFnWidget
  /**
   * onError生命周期钩子
   */
  onError?: AsyncWidgetErrorCallback
}

/**
 * ## 异步小部件
 *
 * 它的存在仅为了更好的TSX开发体验，由于异步函数组件需使用async关键词，导致不能通过TSX类型校验。
 * 因此，我们提供了一个`AsyncWidget`小部件，你只需要将异步函数组件做为children传入即可。
 *
 * JSX示例：
 * ```tsx
 * import {withAsyncContext,AsyncWidget,createVNode,createElement} from 'vitarx'
 *
 * async function UserInfoCard() {
 *  // 使用withAsyncContext来保持上下文，如果不使用withAsyncContext会导致上下文丢失！！！
 *  const data = await withAsyncContext(() => fetch('/api/user-info'))
 *  return <div>{data.name}</div>
 * }
 *
 * function App() {
 *  return <AsyncWidget>{UserInfoCard}</AsyncWidget>
 *  return <AsyncWidget children={UserInfoCard} /> // 也可以这样写
 *  return <div>{UserInfoCard}</div> // 错误
 *  return <div>{createVNode(AsyncLoadData)}</div> // 创建VNode节点用法
 *  return <div>{createElement(AsyncLoadData)}</div> // createElement和createVNode是一样的
 *  return <div>{createVNode(AsyncLoadData,{key:1})}</div> // 可以传入props参数
 * }
 * ```
 */
export class AsyncWidget extends Widget<AsyncWidgetProps> {
  constructor(props: AsyncWidgetProps) {
    super(props)
    if (props.onError) {
      if (typeof props.onError !== 'function') {
        console.warn(
          `[Vitarx.AsyncWidget][WARN]：onError属性期望得到一个回调函数，给定${typeof props.onError}`
        )
      } else {
        this.onError = props.onError
      }
    }
  }

  protected build(): Element {
    return createVNode(this.children)
  }
}
