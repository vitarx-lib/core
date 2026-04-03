import { isFunction, logger, toCapitalize } from '@vitarx/utils'
import { Lifecycle } from '../constants/lifecycle.js'
import type {
  AnyProps,
  Component,
  ErrorHandler,
  HookCallback,
  ValidateProps
} from '../types/index.js'
import type { ViewSwitchHandler } from '../view/index.js'
import { getInstance } from './context.js'

/**
 * 钩子工厂函数，注册方法
 */
function createHookRegistrar<T extends Lifecycle>(hook: T): (cb: HookCallback<T>) => void {
  return (cb: HookCallback<T>): void => {
    if (__VITARX_DEV__ && !isFunction(cb)) {
      throw new TypeError(
        `[Hook] on${toCapitalize(hook)}() callback must be a function, received ${typeof cb}`
      )
    }
    const ctx = getInstance(true)
    if (!ctx) {
      logger.error(`[Hook] on${toCapitalize(hook)}() must be called in a component context`)
      return void 0
    }
    if (ctx.hooks[hook]) {
      ctx.hooks[hook].push(cb)
    } else {
      ctx.hooks[hook] = [cb]
    }
  }
}
/**
 * 组件初始化钩子函数
 *
 * 在组件实例创建后立即调用，此时组件响应式数据已初始化但尚未挂载到DOM
 *
 * @param {HookCallback<Lifecycle.init>} cb - 回调函数，在组件初始化时执行
 */
export const onInit = createHookRegistrar(Lifecycle.init)

/**
 * 组件挂载前钩子函数
 *
 * 在组件即将被挂载到DOM之前调用，此时组件即将开始首次渲染。
 *
 * @param {HookCallback<Lifecycle.beforeMount>} cb - 回调函数，在组件挂载前执行
 */
export const onBeforeMount = createHookRegistrar(Lifecycle.beforeMount)

/**
 * 组件显示钩子函数
 *
 * 在组件显示时调用，通常用于处理组件可见性变化的逻辑。
 *
 * @param {HookCallback<Lifecycle.show>} cb - 回调函数，在组件显示时执行
 */
export const onShow = createHookRegistrar(Lifecycle.show)

/**
 * 组件隐藏钩子函数
 *
 * 在组件隐藏时调用，通常用于清理组件显示期间的资源。
 *
 * @param {HookCallback<Lifecycle.hide>} cb - 回调函数，在组件隐藏时执行
 */
export const onHide = createHookRegistrar(Lifecycle.hide)

/**
 * 组件已挂载钩子函数
 *
 * 在组件挂载到DOM后调用，此时可以访问DOM元素。
 *
 * @param {HookCallback<Lifecycle.mounted>} cb - 回调函数，在组件挂载完成后执行
 */
export const onMounted = createHookRegistrar(Lifecycle.mounted)

/**
 * 组件销毁钩子函数
 *
 * 在组件即将被销毁时调用，用于清理资源和取消订阅。
 *
 * @param {HookCallback<Lifecycle.dispose>} cb - 回调函数，在组件销毁时执行
 */
export const onDispose = createHookRegistrar(Lifecycle.dispose)

/**
 * 组件异常处理钩子函数
 *
 * 用于捕获和处理组件内部发生的异常，提供统一的错误处理机制。
 *
 * @param handler - 异常处理函数
 *
 * @example
 * ```ts
 * // 基本用法
 * function MyComponent() {
 *   onError((error) => {
 *     console.error('组件发生错误:', error);
 *     return false // 返回false表示错误已被处理，不需要向上抛出
 *   });
 *
 *   // 可能引发错误的操作
 *   const riskyOperation = () => {
 *     throw new Error('模拟错误');
 *   };
 *
 *   return <button onClick={riskyOperation}>触发错误</button>;
 * }
 *
 * // Vue类比：类似于Vue 3中的onErrorCaptured
 * // Vue 3: onErrorCaptured((error, instance, info) => { ... })
 *
 * // 高级用法：发送错误报告
 * function ErrorBoundary(props) {
 *   const showView = shallowRef<View>()
 *   onError((error,info) => {
 *     // 发送错误报告到服务器
 *     fetch('/api/error-report', {
 *       method: 'POST',
 *       body: JSON.stringify({
 *         message: error.message,
 *         stack: error.stack,
 *         source: info.source,
 *         component: info.instance.name,
 *       })
 *     }).catch(console.error)
 *
 *     showView.value = <div>组件出现异常，工程师正在紧急修复中...</div>
 *     return false // 返回false表示错误已被处理，不需要向上抛出
 *   });
 *
 *   return (<>
 *     {showView.value ? showView : props.children }
 *   </>)
 * }
 * ```
 */
export const onError = (handler: ErrorHandler): void => {
  if (__VITARX_DEV__ && !isFunction(handler)) {
    throw new TypeError('[Hook] onError handler must be a function')
  }
  const ctx = getInstance(true)
  if (ctx) {
    ctx.errorHandler = handler
  } else {
    logger.warn('[Hook] onError must be called in a component context')
  }
}

/**
 * 注册视图切换事务处理器
 *
 * 当组件的根视图（直接或间接）是 `DynamicView` 时，视图切换会触发此钩子。
 * 支持冒泡机制：从内层 DynamicView 向外层组件传播。
 *
 * 事务会在冒泡完成后自动提交，如需自定义切换时机，可调用 `tx.stopPropagation()` 后手动提交。
 *
 * @param handler - 视图切换事务处理器函数
 *
 * @example
 * ```tsx
 * // 基本用法：监听视图切换
 * function MyComponent(props) {
 *   onViewSwitch((tx) => {
 *     console.log('视图切换:', tx.prev, '->', tx.next);
 *   });
 *
 *   return <Dynamic is={props.component} />
 * }
 * ```
 *
 * @example
 * ```tsx
 * // 缓存视图：配置 cachePrev 属性
 * function CacheView(props) {
 *   const cache = new Map()
 *
 *   onViewSwitch((tx) => {
 *     // 配置 prev 视图缓存
 *     tx.cachePrev = true
 *     cache.set(tx.prev.component, tx.prev)
 *   });
 *
 *   return <Dynamic is={props.component} memo={true}/>
 * }
 * ```
 *
 * @example
 * ```tsx
 * // 自定义切换：停止冒泡并手动控制
 * function Transition(props) {
 *   onViewSwitch((tx) => {
 *     // 停止冒泡，阻止自动提交
 *     tx.stopPropagation()
 *
 *     // 先挂载新视图
 *     tx.commitNext()
 *
 *     // 执行过渡动画后提交旧视图
 *     runAnimation(tx.prev.node, () => {
 *       tx.commitPrev()
 *     })
 *   });
 *
 *   return <Dynamic is={props.component} memo={true}/>
 * }
 * ```
 */
export const onViewSwitch = (handler: ViewSwitchHandler): void => {
  if (__VITARX_DEV__ && !isFunction(handler)) {
    throw new TypeError('[Hook] onViewSwitch handler must be a function')
  }
  const ctx = getInstance(true)
  if (ctx) {
    if (__VITARX_DEV__ && ctx.onViewSwitch) {
      logger.warn(
        '[Hook] onViewSwitch handler has already been registered in this component, the previous handler will be overwritten'
      )
    }
    ctx.onViewSwitch = handler
  } else {
    logger.warn('[Hook] onViewSwitch must be called within a component setup function')
  }
}

/**
 * 暴露函数组件的内部成员，供外部ref使用。
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
 *  return <div onClick={add}>{count}</div>;
 * }
 * ```
 *
 * @param {Record<string, any>} exposed - 键值对对象。
 */
export function defineExpose<T extends { [key: string]: any }>(exposed: T): void {
  const ctx = getInstance(true)
  if (!ctx) {
    logger.error('[defineExpose] must be called in a component context')
    return void 0
  }
  const publicInstance = ctx.publicInstance
  for (const exposedKey in exposed) {
    Object.defineProperty(publicInstance, exposedKey, {
      get(): any {
        return exposed[exposedKey]
      },
      enumerable: true
    })
  }
}

/**
 * 定义组件属性验证函数
 *
 * @param component - 要验证的组件
 * @param validator - 验证函数，接收组件属性作为参数，返回值说明：false表示验证失败，字符串表示验证失败的提示信息，返回值视为验证成功
 * @returns {void} 无返回值
 */
export function defineValidate<P extends AnyProps>(
  component: Component<P>,
  validator: ValidateProps
): void {
  if (__VITARX_DEV__ && !isFunction(validator)) {
    throw new TypeError('[defineValidate] validator must be a function')
  }
  // 函数无返回值
  component.validateProps = validator
}
