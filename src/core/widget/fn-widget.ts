import { Widget } from './widget.js'
import { isPromise } from '../../utils/index.js'
import {
  type HookParameter,
  type HookReturnType,
  type LifeCycleHookMethods,
  LifeCycleHooks
} from './life-cycle.js'
import { __widgetIntrinsicPropKeywords__ } from './constant.js'
import {
  createVNode,
  Fragment,
  type IntrinsicAttributes,
  isVNode,
  type VNode,
  type WidgetVNode
} from '../vnode/index.js'
import { _hooksCollector, type CollectResult } from './hooks.js'
import { getSuspenseCounter } from './built-in/index.js'
import CoreLogger from '../CoreLogger.js'

type AnyProps = Record<string, any>
/**
 * 构建虚拟节点函数类型
 */
export type BuildVNode = (() => VNode) | VNode

/**
 * 简单小部件类型
 */
export interface SimpleWidget<T extends AnyProps = any, R extends VNode = VNode> {
  [SIMPLE_WIDGET_SYMBOL]: true

  (props: T & IntrinsicAttributes): R
}
/**
 * 函数小部件类型
 */
export type FnWidgetConstructor<P extends AnyProps = any> = (
  this: FnWidget,
  props: P & IntrinsicAttributes
) => BuildVNode | Promise<BuildVNode>

/**
 * 函数小部件类型，兼容TSX语法
 */
export type FnWidgetType<P extends AnyProps = any> = (
  this: FnWidget,
  props: P & IntrinsicAttributes
) => VNode

/**
 * 异步小部件类型
 */
export type AsyncFnWidget<P extends AnyProps = any> = (
  this: FnWidget,
  props: P & IntrinsicAttributes
) => Promise<VNode>

type InitData = CollectResult & { build: BuildVNode }

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
  #init: boolean = false
  #triggered: Record<string, any[]> = {}

  constructor(props: AnyProps) {
    super(props)
  }

  // 初始化实例
  async [__initializeMethod](data: CollectResult): Promise<FnWidget> {
    if (isPromise(data.build)) {
      const suspenseCounter = getSuspenseCounter(this)
      // 如果有上级暂停计数器则让计数器+1
      if (suspenseCounter) suspenseCounter.value++
      try {
        data.build = await data.build
      } catch (err) {
        // 让build方法抛出异常
        data.build = () => {
          throw err
        }
      } finally {
        this.#initialize(data as InitData)
        // 如果组件未卸载，则强制更新视图
        if (this['_$renderer'] && this['_$renderer'].state !== 'unloaded') this.update()
        // 如果有上级暂停计数器则让计数器-1
        if (suspenseCounter) suspenseCounter.value--
      }
    } else {
      this.#initialize(data as InitData)
      // 如果组件已渲染，则强制更新视图
      if (this['_$renderer'] && this['_$renderer'].state !== 'notRendered') this.update()
    }
    return this
  }

  /**
   * @inheritDoc
   */
  protected override callLifeCycleHook<K extends LifeCycleHooks>(
    hook: K,
    ...args: HookParameter<K>
  ): HookReturnType<K> {
    if (!this.#init) {
      this.#triggered[hook] = args
      return undefined as any
    }
    return super.callLifeCycleHook(hook, ...args)
  }

  /**
   * @inheritDoc
   */
  protected build(): VNode {
    return createVNode(Fragment)
  }

  /**
   * 初始化函数小部件
   *
   * @param build
   * @param exposed
   * @param lifeCycleHooks
   * @private
   */
  #initialize({ build, exposed, lifeCycleHooks }: InitData) {
    this.build = isVNode(build) ? () => build : build
    this.#injectExposed(exposed)
    this.#injectLifeCycleHooks(lifeCycleHooks)
    this.#init = true
    // 触发生命周期钩子
    for (const triggeredKey in this.#triggered) {
      this.callLifeCycleHook(
        triggeredKey as LifeCycleHooks,
        ...(this.#triggered[triggeredKey as LifeCycleHooks] as any)
      )
    }
    // @ts-ignore 清除已触发的钩子
    this.#triggered = undefined
  }

  /**
   * 注入生命周期钩子到实例中
   *
   * @param lifeCycleHooks
   */
  #injectLifeCycleHooks(lifeCycleHooks: CollectResult['lifeCycleHooks']) {
    for (const lifeCycleHook in lifeCycleHooks || {}) {
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
    const name = this.vnode.type?.name || 'anonymous'
    for (const exposedKey in exposed || {}) {
      if (__widgetIntrinsicPropKeywords__.includes(exposedKey as any)) {
        CoreLogger.warn(
          'FnWidget.Exposed',
          `${name} 函数小部件暴露的属性名${exposedKey}是Widget类内部保留关键字，请修改。`
        )
      }
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
 * 如果你的代码不是位于函数的顶级作用域中，或返回的是一个三元运算等不被支持自动优化的情况，请使用`build`函数包裹。
 *
 * 如果你没有使用tsx，则可以直接使用 `return () => <div>...</div>` 这样的语法。
 *
 * ```tsx
 * // 下面的两个return语句的效果是一致的
 * // 它们的不同之处是在tsx文件中返回箭头函数用于构建ui会导致类型错误，所以在tsx文件中需要使用build包裹
 * return build(() => state ? <div>真</div> : <div>假</div>)
 * return () => state ? <div>真</div> : <div>假</div>
 * ```
 *
 * @param element - 虚拟节点对象或闭包函数返回虚拟节点对象
 */
export function build(element: VNode | (() => VNode)): VNode {
  if (typeof element === 'function') return element as unknown as VNode
  if (isVNode(element)) {
    return (() => element) as unknown as VNode
  }
  throw new TypeError('[Vitarx.build]：参数1(element)必须是VNode对象或返回值是VNode对象的函数')
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
  const result = _hooksCollector(vnode)
  const instance = vnode.instance as FnWidget
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
 * @param build - 构建函数
 */
export function simple<T extends AnyProps, R extends VNode>(
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
 * 你完全可以不使用此函数，直接用 `async function MyAsyncWidget(){...} as unknown as FnWidgetType<PropsType>`
 * 语法使得异步函数组件兼容`tsx`类型推断，但这并不美观。
 *
 * @example
 * ```tsx
 * import { defineAsyncWidget,withAsyncContext } from 'vitarx'
 *
 * const AsyncWidget = defineAsyncWidget(async function(props:{id:string}){
 *    // 使用withAsyncContext来保持上下文，如果不使用withAsyncContext会导致上下文丢失！！！
 *    const data = await withAsyncContext(() => fetch("/api/user-info"))
 *    return <div>用户id: {props.id}，用户名:{data.name}</div>
 * })
 * export default function App() {
 *   // 渲染一个异步组件，TSX能够正常识别组件
 *   return (
 *      <div>
 *        <AsyncWidget id="123"/>
 *      </div>
 *   )
 * }
 * ```
 *
 * @param {AsyncFnWidget} fn - 异步函数小部件。
 * @returns {FnWidgetType} - 重载类型过后的异步函数组件。
 */
export function defineAsyncWidget<P extends AnyProps>(fn: AsyncFnWidget<P>): FnWidgetType<P> {
  return fn as unknown as FnWidgetType<P>
}
