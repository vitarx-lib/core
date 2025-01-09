import { Widget } from './widget.js'
import { type HookParameter, type HookReturnType, LifeCycleHooks } from './life-cycle.js'
import { __widgetIntrinsicPropKeywords__ } from './constant.js'
import { getCurrentVNode, type WidgetVNode } from '../vnode/index.js'
import type { ContainerElement } from '../renderer/index.js'
import { getContext, runContext } from '../context/index.js'
import { type BuildVNode, FnWidget, type FnWidgetConstructor } from './fn-widget.js'
import { isRecordObject } from '../../utils/index.js'

/**
 * 生命周期钩子回调函数
 */
type LifeCycleHookCallback<T extends LifeCycleHooks> = (
  this: FnWidget,
  ...params: HookParameter<T>
) => HookReturnType<T>

interface CollectContext {
  exposed: Record<string, any>
  lifeCycleHooks: Record<LifeCycleHooks, AnyCallback>
}

/**
 * 收集结果
 */
export interface CollectResult extends CollectContext {
  build: BuildVNode | Promise<BuildVNode>
}

type BeforeRemoveCallback<T extends ContainerElement> = (
  this: FnWidget,
  el: T,
  type: 'unmount' | 'deactivate'
) => Promise<void> | void

/**
 * 钩子收集器
 */
class HooksCollector {
  static #hookCollectorContext = Symbol('HookCollectorContext')

  static get context() {
    return getContext<CollectContext>(HooksCollector.#hookCollectorContext)
  }

  /**
   * 暴露数据
   *
   * @param exposed
   */
  static addExposed(exposed: Record<string, any>) {
    const ctx = this.context
    if (ctx) ctx.exposed = exposed
  }

  /**
   * 添加生命周期钩子
   *
   * @param name
   * @param fn
   */
  static addLifeCycle(name: LifeCycleHooks, fn: AnyCallback) {
    const ctx = this.context
    if (ctx && typeof fn === 'function') {
      if (!ctx.lifeCycleHooks) {
        ctx.lifeCycleHooks = { [name]: fn } as any
      } else {
        ctx.lifeCycleHooks[name] = fn
      }
    }
  }

  /**
   * 收集函数中使用的HOOK
   *
   * @param vnode
   * @returns {CollectResult} - 同步收集结果
   */
  static collect(vnode: WidgetVNode<FnWidgetConstructor>): CollectResult {
    const instance = new FnWidget(vnode.props)
    // 新的实例
    vnode.instance = instance
    // 创建新的上下文
    const context: CollectResult = {
      exposed: {},
      lifeCycleHooks: {}
    } as CollectResult
    // 为组件注入`instance`
    const callFnWidget = () => vnode.type.call(instance, vnode.props)
    // 运行函数式组件
    context.build = runContext(this.#hookCollectorContext, context, callFnWidget)
    return context
  }
}

/**
 * 暴露函数小部件的内部方法或变量，供外部使用。
 *
 * 它们会被注入到`FnWidget`实例中，注意`this`指向！
 *
 * @example
 * ```ts
 * import { defineExpose,ref } from 'vitarx'
 *
 * function Foo() {
 *  const count = ref(0);
 *  const add = () => count.value++;
 *  // 暴露 count 和 add，父小部件可以通过refEl.value 访问到 count 和 add。
 *  defineExpose({ count, add });
 *  return <div onClick={add}>{count.value}</div>;
 * }
 * ```
 *
 * 注意：键不能和{@link Widget}类中固有属性或方法重名，包括但不限于`生命周期方法`，`build`...
 * (所有固有关键词：{@linkcode __widgetIntrinsicPropKeywords__})
 *
 * @param {Record<string, any>} exposed 键值对形式的对象，其中键为暴露的名称，值为要暴露的值。
 */
export function defineExpose(exposed: Record<string, any>): void {
  HooksCollector.addExposed(exposed)
}

/**
 * 钩子工厂函数，返回具体的钩子注册方法
 */
function createLifeCycleHook<T extends LifeCycleHooks>(
  hook: T
): (cb: LifeCycleHookCallback<T>) => void {
  return function (cb: LifeCycleHookCallback<T>) {
    if (typeof cb !== 'function') {
      throw new TypeError(`[Vitarx.LifeCycle]：${hook}钩子必须是回调函数，给定${typeof cb}`)
    }
    HooksCollector.addLifeCycle(hook, cb)
  }
}

/**
 * 定义属性
 *
 * 此函数在类定义小部件中也可以使用，通常位于构造函数或`onCreated`钩子中。
 *
 * 可以把props做为第二个参数传入，这在函数式组件中能够获得更好的类型提示与校验。
 * @example
 * ```tsx
 * interface Props {
 *  name: string
 *  age?: number
 * }
 * function Foo(_props: Props) {
 *   const props = defineProps<Props>({
 *     age: 'vitarx'
 *   },_props)
 *   // props 推导类型如下
 *   interface Props {
 *     name: string
 *     age: number
 *   }
 * }
 * ```
 *
 * @param {Record<string, any>} defaultProps - 默认属性
 * @returns {Readonly<Record<string, any>} - 合并过后的只读对象
 */
export function defineProps<D extends Record<string, any>>(defaultProps: D): Readonly<D>
/**
 * 定义属性
 *
 * 此函数在类定义小部件中也可以使用，通常位于构造函数或`onCreated`钩子中。
 *
 * @param {Record<string, any>} defaultProps - 默认属性
 * @param {Record<string, any>} inputProps - 外部传入给组件的props
 * @returns {Readonly<Record<string, any>} - 合并过后的只读对象
 */
export function defineProps<D extends Record<string, any>, T extends Record<string, any>>(
  defaultProps: D,
  inputProps: T
): Readonly<T & D>
export function defineProps<D extends Record<string, any>, T extends Record<string, any> = {}>(
  defaultProps: D,
  inputProps?: T
): Readonly<T & D> {
  if (!isRecordObject(defaultProps)) {
    throw new TypeError('[Vitarx.defineProps][ERROR]：参数1(defaultProps)必须是对象')
  }
  if (!inputProps) {
    const props = getCurrentVNode()!.props as T
    if (!props) {
      throw new Error(
        '[Vitarx.defineProps][ERROR]：defineProps 必须在小部件作用域下调用（初始化阶段）。'
      )
    }
    inputProps = props
  }
  for (const key in defaultProps) {
    if (!(key in inputProps) || inputProps[key] === undefined) {
      inputProps[key] = defaultProps[key] as any
    }
  }
  return defaultProps as T & D
}


/**
 * 小部件创建完成时触发的钩子
 *
 * @param cb - 回调函数，小部件实例创建后触发
 */
export const onCreated = createLifeCycleHook(LifeCycleHooks.created)

/**
 * 小部件挂载前要触发的钩子
 *
 * 可以返回一个 DOM 元素作为挂载目标容器
 *
 * @param cb - 回调函数，小部件挂载之前触发
 */
export const onBeforeMount = createLifeCycleHook(LifeCycleHooks.beforeMount)

/**
 * 小部件挂载完成时触发的钩子
 *
 * @param cb - 回调函数，小部件挂载完成后触发
 */
export const onMounted = createLifeCycleHook(LifeCycleHooks.mounted)

/**
 * 小部件被临时停用触发的钩子
 *
 * @param cb - 回调函数，当小部件被临时停用时触发
 */
export const onDeactivate = createLifeCycleHook(LifeCycleHooks.deactivate)

/**
 * 小部件从停用后又恢复时触发的钩子
 *
 * @param cb - 回调函数，当小部件从停用状态恢复时触发
 */
export const onActivated = createLifeCycleHook(LifeCycleHooks.activated)

/**
 * 小部件实例被销毁前触发的钩子
 *
 * @param cb - 回调函数，小部件实例销毁前触发
 */
export const onBeforeUnmount = createLifeCycleHook(LifeCycleHooks.beforeUnmount)

/**
 * 小部件被卸载时完成触发的钩子
 *
 * @param cb - 回调函数，小部件卸载完成后触发
 */
export const onUnmounted = createLifeCycleHook(LifeCycleHooks.unmounted)

/**
 * 小部件更新前触发的钩子
 *
 * @param cb - 回调函数，在小部件更新之前触发
 */
export const onBeforeUpdate = createLifeCycleHook(LifeCycleHooks.beforeUpdate)

/**
 * 小部件更新完成时触发的钩子
 *
 * @param cb - 回调函数，小部件更新完成后触发
 */
export const onUpdated = createLifeCycleHook(LifeCycleHooks.updated)

/**
 * 小部件渲染或构建过程中捕获到异常时触发的钩子
 *
 * @example
 * onError((error, info) => {
 *   console.error(error, info)
 *   // 返回一个备用元素展示错误提示，error通常是Error，强制转换字符串过后会显示 message
 *   return <div>{error}</div>
 * })
 *
 * info值说明：
 *  - build: 构建时抛出的异常，通常是自身小部件的构建错误
 *  - render: 渲染时抛出的异常，通常是子组件抛出的异常
 *
 * @param cb - 回调函数，遇到错误时触发
 */
export const onError = createLifeCycleHook(LifeCycleHooks.error)

/**
 * 真实的`Element`被移除前触发的钩子
 *
 * 可以返回`Promise`来延迟移除
 *
 * @param cb - 回调函数，元素从DOM中被移除前触发
 */
export function onBeforeRemove<T extends ContainerElement>(cb: BeforeRemoveCallback<T>) {
  if (typeof cb !== 'function') {
    throw new TypeError(
      `[Vitarx.LifeCycle]：${LifeCycleHooks.beforeRemove}钩子必须是回调函数，给定${typeof cb}`
    )
  }
  HooksCollector.addLifeCycle(LifeCycleHooks.beforeRemove, cb)
}

/**
 * 收集函数中使用的HOOK
 *
 * @param vnode
 * @returns {CollectResult} - 同步收集结果
 */
export function hooksCollector(vnode: WidgetVNode<FnWidgetConstructor>): CollectResult {
  return HooksCollector.collect(vnode)
}
