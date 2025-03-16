import { type ClassWidgetConstructor, Widget } from './widget.js'
import { isPromise } from '../../utils/index.js'
import { type LifeCycleHookMethods } from './life-cycle.js'
import { __widgetIntrinsicPropKeywords__ } from './constant.js'
import {
  createVNode,
  type IntrinsicAttributes,
  isVNode,
  type VNode,
  type WidgetType,
  type WidgetVNode
} from '../vnode/index.js'
import { _hooksCollector, type CollectResult } from './hooks.js'
import { getSuspenseCounter } from './built-in/index.js'
import { withAsyncContext } from '../context/index.js'

type AnyProps = Record<string, any>

/**
 * 有效的视图类型
 */
export type ValidView = VNode | null

/**
 * 视图构建器
 */
export type BuildVNode = () => ValidView
/**
 * 函数小部件有效地返回值
 *
 * - `null`：不渲染任何内容
 * - `VNode`：直接返回虚拟节点
 * - `Promise<null>`：异步返回null
 * - `Promise<VNode>`：异步返回虚拟节点
 * - `Promise<()=>VNode|null>`：异步返回视图构建器
 * - `Promise<{ default: WidgetType }>`：异步返回EsModule对象，必须有默认导出
 *
 */
export type ValidFnWidgetReturnValue =
  | ValidView
  | BuildVNode
  | Promise<ValidView | BuildVNode>
  | Promise<{ default: WidgetType }>

/**
 * 简单小部件类型
 */
export interface SimpleWidget<T extends AnyProps = any, R extends VNode | null = VNode> {
  [SIMPLE_WIDGET_SYMBOL]: true

  (props: T & IntrinsicAttributes): R
}

/**
 * 函数小部件类型
 */
export type FnWidgetConstructor<P extends AnyProps = any> = (
  this: FnWidget,
  props: P & IntrinsicAttributes
) => ValidFnWidgetReturnValue

/**
 * 函数小部件类型，兼容TSX语法
 */
export type FnWidgetType<P extends AnyProps = any> = (
  this: FnWidget,
  props: P & IntrinsicAttributes
) => ValidView

/**
 * 懒加载小部件类型
 */
export type LazyLoadWidget<P extends AnyProps = any> = () => Promise<{
  default: FnWidgetConstructor<P> | ClassWidgetConstructor<P>
}>

/**
 * 异步小部件类型
 */
export type AsyncWidget<P extends AnyProps = any> = (
  this: FnWidget,
  props: P & IntrinsicAttributes
) => Promise<BuildVNode | ValidView>

/**
 * TSX 类型支持工具
 *
 * 将异步组件，懒加载组件，等受 `Vitarx` 支持，但不被TSX支持的组件类型，
 * 重载为受支持的TSX组件类型，提供友好的参数类型校验。
 *
 * @example
 * ```tsx
 * async function AsyncWidget() {
 *   await new Promise((resolve) => setTimeout(resolve, 1000))
 *   return <div>Hello World</div>
 * }
 * export default AsyncWidget
 * // ❌ TSX 语法校验不通过！
 * <AsyncWidget />
 *
 * export default AsyncWidget as unknown as TSWidget<typeof AsyncWidget>
 * // ✅ TSX 语法校验通过！
 * <AsyncWidget2 />
 * ```
 */
export type TSWidget<T extends WidgetType> = FnWidgetType<T extends WidgetType<infer P> ? P : {}>

// 初始化方法
const __initializeMethod = Symbol('InitializeFnWidgetBuild')

/**
 * 函数小部件实例
 *
 * 不要单独使用该小部件，内部会自动会为函数式小部件创建`FnWidget`实例
 *
 * @internal
 */
export class FnWidget extends Widget {
  // 初始化实例
  async [__initializeMethod](data: CollectResult): Promise<FnWidget> {
    // 注入暴露的属性和方法
    this.#injectExposed(data.exposed)
    const exposedCount = Object.keys(data.exposed).length
    // 注入生命周期钩子到实例中
    this.#injectLifeCycleHooks(data.lifeCycleHooks)
    const hookCount = Object.keys(data.lifeCycleHooks).length
    const updateView = () => {
      if (
        this['_$renderer'] &&
        (this['_$renderer'].state === 'notMounted' || this['_$renderer'].state === 'activated')
      ) {
        this.update()
      }
    }
    let build: BuildVNode | ValidView | { default: WidgetType } = data.build as BuildVNode
    if (isPromise(data.build)) {
      const suspenseCounter = getSuspenseCounter(this)
      // 如果有上级暂停计数器则让计数器+1
      if (suspenseCounter) suspenseCounter.value++
      try {
        build = await withAsyncContext(data.build as Promise<BuildVNode>)
      } catch (err) {
        // 让build方法抛出异常
        build = () => {
          throw err
        }
      } finally {
        this.#setBuild(build)
        // 如果有新增钩子则重新注入生命周期钩子
        if (hookCount !== Object.keys(data.lifeCycleHooks).length) {
          this.#injectLifeCycleHooks(data.lifeCycleHooks)
        }
        // 如果组件有新增暴露的属性和方法，则重新注入到实例中
        if (exposedCount !== Object.keys(data.exposed).length) {
          this.#injectExposed(data.exposed)
        }
        updateView()
        // 如果有上级暂停计数器则让计数器-1
        if (suspenseCounter) suspenseCounter.value--
      }
    } else {
      this.#setBuild(data.build)
      updateView()
    }
    return this
  }

  /**
   * @inheritDoc
   */
  protected build(): VNode | null {
    return null
  }

  /**
   * 初始化函数小部件
   *
   * @param {BuildVNode} build - 构建函数
   * @private
   */
  #setBuild(build: BuildVNode | ValidView | { default: WidgetType }) {
    // 如果是函数，则直接赋值给build方法
    if (typeof build === 'function') {
      this.build = build
      return
    }
    // 如果是vnode，则让build方法返回节点
    if (isVNode(build)) {
      this.build = () => build
      return
    }
    if (build === null) return
    // 如果是module对象，则判断是否存在default导出
    if (typeof build === 'object' && 'default' in build! && typeof build.default === 'function') {
      this.build = () => createVNode(build.default, this.props)
      return
    }
    // 如果不符合要求，则在build方法中抛出异常
    this.build = () => {
      throw new Error(
        `[Vitarx.FnWidget]：函数组件的返回值必须是VNode、()=>VNode、Promise<{ default: 函数组件/类组件 }>、null，实际返回的却是${typeof build}`
      )
    }
  }

  /**
   * 注入生命周期钩子到实例中
   *
   * @param lifeCycleHooks
   */
  #injectLifeCycleHooks(lifeCycleHooks: CollectResult['lifeCycleHooks']) {
    for (const lifeCycleHook in lifeCycleHooks) {
      const k = lifeCycleHook as LifeCycleHookMethods
      this[k] = lifeCycleHooks[k]
    }
  }

  /**
   * 将暴露的属性和方法注入到实例中
   *
   * @param exposed
   */
  #injectExposed(exposed: CollectResult['exposed']) {
    for (const exposedKey in exposed || {}) {
      if (__widgetIntrinsicPropKeywords__.includes(exposedKey as any)) continue
      if (!(exposedKey in this)) (this as any)[exposedKey] = exposed[exposedKey]
    }
  }
}

/**
 * ## 视图构建器。
 *
 * > 注意：在类小部件中不要使用`build`函数，类中的build方法就是构建器。
 *
 * 主要作用是优化TSX类型校验，TSX不支持返回()=>Element，所以通过此函数来辅助类型转换。
 *
 * 代码块中的顶级return语句如果是jsx语法，则会被自动添加箭头函数，使其成为一个UI构造器。
 *
 * 如果你具有多个return语句，或使用了条件渲染，则需要使用build包裹，否则组件将会丢失响应式。
 *
 * 如果你没有使用tsx，则可以直接使用 `return () => <div>...</div>` 这样的语法。
 *
 * ```tsx
 * // ❌ 错误的示例
 * return state ? <div>真</div> : <div>假</div>
 * // 下面的两个return语句的效果是一致的
 * // 它们的不同之处是在tsx文件中返回箭头函数用于构建ui会提示类型错误，所以在tsx文件中需要使用build包裹
 * return build(() => state ? <div>真</div> : <div>假</div>) // ✅
 * return () => state ? <div>真</div> : <div>假</div> // ✅
 * ```
 *
 * @param element - 虚拟节点对象|视图构建器函数|null
 * @returns - 为了符合TSX类型校验，会将视图构建器函数重载为VNode类型
 * @throws TypeError - 如果传入的参数不符合要求，则会抛出TypeError异常
 */
export function build<T extends BuildVNode>(element: T): T extends null ? null : VNode {
  if (element === null) return null as any
  if (typeof element === 'function') return element as any
  if (isVNode(element)) return element as any
  throw new TypeError('[Vitarx.build]：函数组件返回值只能是null、VNode、() => VNode | null')
}

/**
 * ## 创建函数小部件实例
 *
 * 内部函数，仅供框架内部逻辑使用。
 *
 * @internal
 * @param vnode
 */
export function _createFnWidget(vnode: WidgetVNode<FnWidgetConstructor>): FnWidget {
  const instance = new FnWidget(vnode.props)
  vnode.instance = instance
  const result = _hooksCollector(vnode, instance)
  instance[__initializeMethod](result)
  return instance
}

const SIMPLE_WIDGET_SYMBOL = Symbol('simple_widget_type')

/**
 * 定义一个简单的小部件
 *
 * 通常在实际的项目开发中你可能会很少用到它，简单函数通常存在于组件库中，
 * 因为大部分组件可能只是提供了一些ui样式，并不需要生命周期，以及状态管理。
 *
 * 它会在父组件首次构建视图时被调用，在父组件更新时会被重新调用。
 *
 * 它只能做简单的视图构建工作，没有生命周期，不要在其内部存在任何副作用，包括但不限于：生命周期钩子，定时器，监听器，计算属性。
 *
 * ```tsx
 * interface Props {
 *   title: string,
 *   color?: string
 * }
 * // 构建一个简单的小部件，它内部不包含任何副作用代码，也没有生命周期钩子
 * const Title = simple(({title,color}:Props) => {
 *   // 对属性参数做一些处理
 *   color = color || 'black'
 *   // 返回需要渲染的元素
 *   return <h1 style={{color}}>{title}</div>
 * })
 * export default function App() {
 *   return <Title title="Hello Vitarx" color="red" />
 * }
 * ```
 *
 * @param build - 视图构建器，通过函数返回要渲染的视图虚拟节点
 * @returns {SimpleWidget} - 简单小部件
 */
export function simple<T extends AnyProps, R extends VNode | null>(
  build: (props: T) => R
): SimpleWidget<T, R> {
  Object.defineProperty(build, SIMPLE_WIDGET_SYMBOL, { value: true })
  return build as SimpleWidget<T, R>
}

/**
 * 判断是否为简单小部件
 *
 * @param {any} fn - 小部件
 * @returns {boolean} - true 表示为简单小部件
 */
export function isSimpleWidget(fn: any): fn is SimpleWidget {
  return !!(typeof fn === 'function' && fn[SIMPLE_WIDGET_SYMBOL])
}

/**
 * 辅助定义一个符合`tsx`类型推断的异步函数小部件
 *
 * 没有附加任何代码逻辑，只是使用断言重载了函数类型，使异步函数组件兼容`tsx`类型推断。
 *
 * 你完全可以不使用此函数，直接用 `export default MyAsyncWidget as unknown as TSWidget<typeof MyAsyncWidget>`
 * 语法使得异步函数组件兼容`tsx`类型推断，但这并不美观。
 *
 * @example
 * ```tsx
 * import { defineAsyncWidget,withAsyncContext } from 'vitarx'
 *
 * async function AsyncWidget(props:{id:string}){
 *    // 使用withAsyncContext来保持上下文，如果不使用withAsyncContext会导致上下文丢失！！！
 *    const data = await withAsyncContext(() => fetch("/api/user-info"))
 *    return <div>用户id: {props.id}，用户名:{data.name}</div>
 * }
 *
 * // 这么做的意义在于类型重载，使得tsx类型推断可以正确推断出异步函数组件的类型。
 * export default defineAsyncWidget(AsyncWidget)
 * ```
 *
 * @alias defineAsyncWidget
 * @param {AsyncWidget} fn - 异步函数小部件。
 * @returns {FnWidgetType} - 重载类型过后的异步函数组件。
 * @throws {TypeError} 如果传入的参数不是一个函数，则会抛出TypeError异常。
 */
export function defineAsyncWidget<P extends AnyProps>(fn: AsyncWidget<P>): FnWidgetType<P> {
  if (typeof fn !== 'function') {
    throw new TypeError('[Vitarx.defineAsyncWidget]：参数必须是一个函数！')
  }
  return fn as unknown as FnWidgetType<P>
}

/**
 * 辅助定义一个符合`tsx`类型推断的异步懒加载小部件
 *
 * 它和`defineAsyncWidget`一样，只是进行了类型推断重载，没有附加任何额外的副作用。
 *
 * @example
 * ```tsx
 * // button.tsx
 * export default function Button(props:{text:string}){
 *   return <button>{props.text}</button>
 * }
 *
 * // App.tsx
 * export default function App(){
 *   const LazyLoadButton = defineLazyWidget(()=>import('./button.js'))
 *   const show = ref(false)
 *   return <div>
 *     {show.value && <LazyLoadButton text="懒加载的按钮"/>}
 *     <button onClick={()=>show.value = !show.value}>{show.value ? '隐藏' : '显示'}</button>
 *   </div>
 * }
 * ```
 *
 * @alias defineLazyWidget
 * @param {()=>Promise<{default:WidgetType}>} fn - 异步懒加载函数小部件。
 * @returns {FnWidgetType} - 重载类型过后的异步懒加载函数组件。
 * @throws {TypeError} - 如果传入的参数不是一个函数，则会抛出TypeError异常。
 */
export function lazy<P extends AnyProps>(fn: LazyLoadWidget<P>): FnWidgetType<P> {
  if (typeof fn !== 'function') {
    throw new TypeError('[Vitarx.lazy]：参数必须是一个函数')
  }
  return fn as unknown as FnWidgetType<P>
}

export { lazy as defineLazyWidget }
