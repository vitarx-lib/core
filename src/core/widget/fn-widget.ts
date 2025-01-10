// noinspection JSUnusedGlobalSymbols

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
import { type CollectResult, hooksCollector } from './hooks.js'
import { getSuspenseCounter } from './built-in/index.js'


/**
 * 构建虚拟节点函数类型
 */
export type BuildVNode = (() => VNode) | VNode

/**
 * 函数小部件类型
 */
export type FnWidgetConstructor<P extends Record<string, any> = any> = (
  this: FnWidget,
  props: P & IntrinsicAttributes
) => BuildVNode | Promise<BuildVNode>

type InitData = CollectResult & { build: BuildVNode }

// 设置build方法
const __initialization = Symbol('InitializationFnWidgetBuild')

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
  constructor(props: Record<string, any>) {
    super(props)
  }

  // 初始化实例
  async [__initialization](data: CollectResult): Promise<FnWidget> {
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
        if (this._renderer && this._renderer.state !== 'unloaded') this.update()
        // 如果有上级暂停计数器则让计数器-1
        if (suspenseCounter) suspenseCounter.value--
      }
    } else {
      this.#initialize(data as InitData)
      // 如果组件已渲染，则强制更新视图
      if (this._renderer && this._renderer.state !== 'notRendered') this.update()
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
    if (isVNode(build)) {
      this.build = () => build
    } else {
      this.build = build
    }
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
        console.warn(
          `[Vitarx.FnWidget]：${name} 函数小部件暴露的属性名${exposedKey}是Widget类内部保留关键字，请修改。`
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
  throw new TypeError('[Vitarx.build]：参数1(element)必须是VNode对象或返回VNode对象的函数')
}

/**
 * ## 创建函数小部件实例
 *
 * 内部函数，仅供框架内部逻辑使用。
 *
 * @internal
 * @param vnode
 */
export function _createFnWidget(vnode: WidgetVNode<FnWidgetConstructor>): Promise<FnWidget> {
  const result = hooksCollector(vnode)
  const instance = vnode.instance as FnWidget
  return instance[__initialization](result)
}
