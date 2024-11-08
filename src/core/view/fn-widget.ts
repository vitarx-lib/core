import { type IntrinsicAttributes, type VNode } from './VNode.js'
import { Widget } from './widget.js'
import { isFunction, isRecordObject } from '../../utils/index.js'
import { LifeCycleHooks } from './life-cycle.js'

/**
 * 构建虚拟节点函数类型
 */
export type BuildVNode = () => VNode
/**
 * 函数组件类型
 */
export type FnWidget<P extends Record<string, any> = {}> = (
  props: P & IntrinsicAttributes
) => BuildVNode
interface CollectMap {
  exposed: Record<string, any> | undefined
  lifeCycleHooks: Record<LifeCycleHooks, AnyCallback> | undefined
}

/**
 * 函数组件代理
 */
class FnWidgetProxy extends Widget {
  readonly #buildVnode

  constructor(
    build: BuildVNode,
    exposed?: Record<string, any>,
    lifeCycleHooks?: Record<LifeCycleHooks, AnyCallback>
  ) {
    super({})
    this.#buildVnode = build
    if (lifeCycleHooks) {
      Object.entries(lifeCycleHooks).forEach(item => {
        const [name, fn] = item
        ;(this as any)[name] = fn
      })
    }
    if (isRecordObject(exposed)) {
      Object.entries(exposed).forEach(item => {
        const [key, value] = item
        if (!(key in this)) (this as any)[key] = value
      })
    }
  }
  /**
   * @inheritDoc
   *
   * @protected
   */
  public build(): VNode {
    return this.#buildVnode()
  }
}

/**
 * 收集hook
 */
class FnWidgetHookHandler {
  static #collectMap: CollectMap | undefined = undefined

  static trackExposed(exposed: Record<string, any>) {
    if (this.#collectMap) this.#collectMap.exposed = exposed
  }

  static trackLifeCycle(name: LifeCycleHooks, fn: AnyCallback) {
    if (this.#collectMap) {
      if (!this.#collectMap.lifeCycleHooks) {
        this.#collectMap.lifeCycleHooks = { [name]: fn } as any
      } else {
        this.#collectMap.lifeCycleHooks[name] = fn
      }
    }
  }

  static collect<P extends Record<string, any>>(
    fn: FnWidget<P>,
    props: P
  ): CollectMap & {
    build: BuildVNode
  } {
    const oldBackup = this.#collectMap
    this.#collectMap = {
      exposed: undefined,
      lifeCycleHooks: undefined
    }
    const build = fn(props || {})
    const collectMap = this.#collectMap
    this.#collectMap = oldBackup
    return { ...collectMap, build }
  }
}

/**
 * 暴露函数组件的内部方法或变量，供外部使用。
 *
 * 一般情况下是用于暴露一个函数，给父组件调用，但也可以暴露一个变量
 *
 * @example
 * ```ts
 * import { defineExpose,ref,build } from 'vitarx'
 *
 * function Foo() {
 *  const count = ref(0);
 *  const add = () => count.value++;
 *  // 暴露 count 和 add
 *  defineExpose({ count, add });
 *  // 构建组件
 *  return () => <div onClick={add}>{count.value}</div>;
 * }
 * ```
 *
 * @param exposed
 */
export function defineExpose(exposed: Record<string, any>) {
  FnWidgetHookHandler.trackExposed(exposed)
}

/**
 * 注册组件创建钩子
 *
 * 会立即执行`fn`回调，所以注册该钩子是无意义的
 *
 * @param fn
 */
export function onCreated(fn: VoidCallback) {
  if (!isFunction(fn)) throw new TypeError(`无效的钩子函数，${typeof fn}`)
  fn()
}

/**
 * 注册组件挂载钩子
 *
 * @param fn
 */
export function onMounted(fn: VoidCallback) {
  if (!isFunction(fn)) throw new TypeError(`无效的钩子函数，${typeof fn}`)
  FnWidgetHookHandler.trackLifeCycle(LifeCycleHooks.mounted, fn)
}

/**
 * 注册组件暂时停用钩子
 *
 * @param fn
 */
export function onDeactivate(fn: VoidCallback) {
  if (!isFunction(fn)) throw new TypeError(`无效的钩子函数，${typeof fn}`)
  FnWidgetHookHandler.trackLifeCycle(LifeCycleHooks.deactivate, fn)
}

/**
 * 注册组件恢复使用钩子
 *
 * @param fn
 */
export function onActivated(fn: VoidCallback) {
  if (!isFunction(fn)) throw new TypeError(`无效的钩子函数，${typeof fn}`)
  FnWidgetHookHandler.trackLifeCycle(LifeCycleHooks.activated, fn)
}

/**
 * 注册组件销毁钩子
 *
 * @param fn
 */
export function onUnmounted(fn: VoidCallback) {
  if (!isFunction(fn)) throw new TypeError(`无效的钩子函数，${typeof fn}`)
  FnWidgetHookHandler.trackLifeCycle(LifeCycleHooks.unmounted, fn)
}

/**
 * 注册组件更新钩子
 *
 * @param fn
 */
export function onUpdated(fn: VoidCallback) {
  if (!isFunction(fn)) throw new TypeError(`无效的钩子函数，${typeof fn}`)
  FnWidgetHookHandler.trackLifeCycle(LifeCycleHooks.updated, fn)
}

/**
 * 注册组件销毁前的钩子
 *
 * @param fn
 */
export function onBeforeUnmount(fn: VoidCallback) {
  if (!isFunction(fn)) throw new TypeError(`无效的钩子函数，${typeof fn}`)
  FnWidgetHookHandler.trackLifeCycle(LifeCycleHooks.beforeUnmount, fn)
}
/**
 * 注册组件渲染错误时的钩子
 *
 * @param fn
 */
export function onError(fn: (error: any) => Vitarx.VNode | void) {
  if (!isFunction(fn)) throw new TypeError(`无效的钩子函数，${typeof fn}`)
  FnWidgetHookHandler.trackLifeCycle(LifeCycleHooks.error, fn)
}

/**
 * 创建函数组件
 *
 * @param fn
 * @param props
 */
export function createFnWidget<P extends Record<string, any>>(
  fn: FnWidget<P>,
  props: P
): FnWidgetProxy {
  let { build, exposed, lifeCycleHooks } = FnWidgetHookHandler.collect(fn, props)
  if (!isFunction(build)) {
    throw new Error(
      `[Vitarx]：函数式小部件需要返回一个build函数创建响应式UI，示例：()=>Vitarx.VNode`
    )
  }
  return new FnWidgetProxy(build, exposed, lifeCycleHooks)
}
