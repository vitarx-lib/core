import { getContext, runInContext } from '@vitarx/responsive'
import { AnyCallback, logger } from '@vitarx/utils'
import { LifecycleHooks } from '../constants/hook.js'
import { __WIDGET_INTRINSIC_KEYWORDS__ } from '../constants/widget.js'
import type {
  FunctionWidget,
  LifecycleHookParameter,
  LifecycleHookReturnType,
  ValidBuildElement
} from '../types/index.js'
import type { StatefulWidgetNode } from '../vnode/index.js'
import type { Widget } from '../widget/index.js'

interface CollectContext {
  exposed: Record<string, any>
  hooks: Record<LifecycleHooks, AnyCallback>
}

/**
 * 收集结果
 */
export interface HookCollectResult extends CollectContext {
  buildResult: ValidBuildElement
}

const HOOK_COLLECTOR_CONTEXT = Symbol('HookCollectorContext')
/**
 * HookCollector 是一个用于收集和管理组件钩子的工具类。
 * 该类主要负责收集函数式组件中的生命周期钩子和暴露的数据，并提供统一的访问接口。
 *
 * 核心功能：
 * - 收集和管理组件的生命周期钩子
 * - 收集和管理组件暴露的数据
 * - 提供上下文访问机制
 *
 * 使用示例：
 * ```ts
 * // 在函数式组件中收集钩子
 * const result = HookCollector.collect(vnode, instance);
 *
 * // 添加生命周期钩子
 * HookCollector.addLifeCycle('onMount', () => console.log('mounted'));
 *
 * // 添加暴露数据
 * HookCollector.addExposed({ count: 0 });
 * ```
 *
 * 构造函数参数：
 * 该类为静态工具类，无需构造函数实例化。
 *
 * 特殊说明：
 * - 该类所有方法均为静态方法，直接通过类名调用
 * - 需要在正确的上下文中使用，否则某些操作可能无效
 * - collect 方法必须在组件渲染过程中调用
 */
export class HookCollector {
  /**
   * 获取当前上下文的方法
   * 这是一个静态getter方法，用于获取名为CollectContext的上下文对象
   * @returns {CollectContext|undefined} 返回CollectContext类型的上下文对象
   */
  static get context(): CollectContext | undefined {
    return getContext<CollectContext>(HOOK_COLLECTOR_CONTEXT) // 调用getContext函数，传入类型参数CollectContext和常量HOOK_COLLECTOR_CONTEXT
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
  static addLifeCycle(name: LifecycleHooks, fn: AnyCallback) {
    const ctx = this.context
    if (ctx && typeof fn === 'function') {
      if (!ctx.hooks) {
        ctx.hooks = { [name]: fn } as any
      } else {
        ctx.hooks[name] = fn
      }
    }
  }

  /**
   * 收集函数中使用的HOOK
   *
   * @param vnode - 节点
   * @param instance - 实例
   * @returns {HookCollectResult} - 同步收集结果
   */
  static collect(vnode: StatefulWidgetNode<FunctionWidget>, instance: Widget): HookCollectResult {
    // 创建新的上下文
    const context: HookCollectResult = {
      exposed: {},
      hooks: {}
    } as HookCollectResult
    const callFnWidget = () => vnode.type.call(instance, vnode.props)
    // 运行函数式组件
    context.buildResult = runInContext(HOOK_COLLECTOR_CONTEXT, context, callFnWidget)
    return context
  }
}

/**
 * 生命周期钩子回调函数
 */
type LifecycleHookCallback<T extends LifecycleHooks> = (
  ...params: LifecycleHookParameter<T>
) => LifecycleHookReturnType<T>

/**
 * 钩子工厂函数，返回具体的钩子注册方法
 */
function createLifecycleHook<T extends LifecycleHooks>(
  hook: T
): (cb: LifecycleHookCallback<T>) => void {
  return (cb: LifecycleHookCallback<T>) => {
    if (typeof cb !== 'function') {
      throw new TypeError(
        `[Vitarx.LifeCycleHook][ERROR]：${hook}钩子必须是回调函数，给定${typeof cb}`
      )
    }
    HookCollector.addLifeCycle(hook, cb)
  }
}

/**
 * 小部件创建时触发的钩子
 *
 * 因函数式组件被调用之前实例就已完成了创建，
 * 所以此钩子注册的函数将会被立即执行;
 *
 * @param {Function} cb - 回调函数
 */
export const onCreate = (cb: () => void) => cb()
/**
 * 小部件挂载前要触发的钩子
 *
 * 可以返回一个 DOM 元素作为挂载目标容器
 *
 * @param {Function} cb - 回调函数，小部件挂载之前触发
 */
export const onBeforeMount = createLifecycleHook(LifecycleHooks.beforeMount)
/**
 * 小部件挂载完成时触发的钩子
 *
 * @param {Function} cb - 回调函数，小部件挂载完成后触发
 */
export const onMounted = createLifecycleHook(LifecycleHooks.mounted)
/**
 * 小部件被临时停用触发的钩子
 *
 * 此钩子由 `KeepAlive` 触发。
 *
 * @param {Function} cb - 回调函数，当小部件被临时停用时触发
 */
export const onDeactivated = createLifecycleHook(LifecycleHooks.deactivated)
/**
 * 小部件被激活时触发的钩子
 *
 * @param {Function} cb - 回调函数，当小部件从停用状态恢复时触发
 */
export const onActivated = createLifecycleHook(LifecycleHooks.activated)
/**
 * 小部件实例被销毁前触发的钩子
 *
 * @param {Function} cb - 回调函数，小部件实例销毁前触发
 */
export const onBeforeUnmount = createLifecycleHook(LifecycleHooks.beforeUnmount)
/**
 * 小部件被卸载时完成触发的钩子
 *
 * @param {Function} cb - 回调函数，小部件卸载完成后触发
 */
export const onUnmounted = createLifecycleHook(LifecycleHooks.unmounted)
/**
 * 小部件更新前触发的钩子
 *
 * @param {Function} cb - 回调函数，在小部件更新之前触发
 */
export const onBeforeUpdate = createLifecycleHook(LifecycleHooks.beforeUpdate)
/**
 * 小部件更新完成时触发的钩子
 *
 * @param {Function} cb - 回调函数，小部件更新完成后触发
 */
export const onUpdated = createLifecycleHook(LifecycleHooks.updated)
/**
 * 小部件渲染或构建过程中捕获到异常时触发的钩子
 *
 * @example
 * ```ts
 * onError((error, info:ErrorInfo) => {
 *   console.error(error, info)
 *   // 返回一个备用元素展示错误提示，error通常是Error，强制转换字符串过后会显示 message
 *   return <div>{String(error)}</div>
 * })
 *```
 *
 * @param {Function} cb - 回调函数，遇到错误时触发
 */
export const onError = createLifecycleHook(LifecycleHooks.error)
/**
 * 小部件渲染前钩子
 *
 * - 在客户端渲染时，其执行时机等同于 onBeforeMount。
 *   如果返回 Promise，不会阻塞渲染，依赖响应式更新机制会自动触发视图更新。
 *
 * - 在服务端渲染（SSR）时：
 *   - 渲染流程会先渲染一个占位节点。
 *   - 如果返回 Promise，Promise 完成后会用真实节点替换占位节点。
 *   - 这种行为类似异步组件的渲染逻辑，保证 SSR 不被阻塞。
 *
 * 使用建议：
 * - 可在此钩子中处理异步数据获取、依赖初始化等操作。
 * - 如果希望客户端在数据未加载完成时不渲染真实组件，应使用异步组件。
 *
 * @returns {Promise<unknown> | void} - 可返回 Promise 以延迟占位节点替换为真实节点，客户端不会阻塞渲染。
 */
export const onRender = createLifecycleHook(LifecycleHooks.render)

/**
 * 暴露函数组件的内部方法或变量，供外部使用。
 *
 * 它们会被注入到`FnWidget`实例中，注意`this`指向！
 *
 * @example
 * ```tsx
 * import { defineExpose,ref } from 'vitarx'
 *
 * function Foo() {
 *  const count = ref(0);
 *  const add = () => count.value++;
 *  // 暴露 count 和 add
 *  defineExpose({ count, add });
 *  return <div onClick={add}>{count.value}</div>;
 * }
 * ```
 *
 * 注意：键不能和{@link Widget}类中固有属性或方法重名，包括但不限于`props`，`build`...
 * (所有保留关键词：{@linkcode __WIDGET_INTRINSIC_KEYWORDS__})
 *
 * @param {Record<string, any>} exposed 键值对形式的对象，其中键为暴露的名称，值为要暴露的值。
 */
export function defineExpose(exposed: Record<string, any>): void {
  for (const exposedKey in exposed) {
    if (__WIDGET_INTRINSIC_KEYWORDS__.has(exposedKey)) {
      logger.warn(
        `${exposedKey} is an internal reserved keyword in the Widget class, please modify.`
      )
      // 删除
      delete exposed[exposedKey]
    }
  }
  HookCollector.addExposed(exposed)
}
