import { getContext, runInContext } from '@vitarx/responsive'
import { type WidgetVNode } from '../../vnode/index'
import { LifecycleHooks } from '../core/constant'
import type { FunctionWidget, ValidFunctionWidgetReturnValue } from '../types/index'

interface CollectContext {
  exposed: Record<string, any>
  lifeCycleHooks: Record<LifecycleHooks, AnyCallback>
}

/**
 * 收集结果
 */
export interface HookCollectResult extends CollectContext {
  build: ValidFunctionWidgetReturnValue
}

/**
 * 钩子收集器
 */
export class HookCollector {
  static #hookCollectorContext = Symbol('HookCollectorContext')

  static get context() {
    return getContext<CollectContext>(HookCollector.#hookCollectorContext)
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
   * @param vnode - 节点
   * @returns {HookCollectResult} - 同步收集结果
   */
  static collect(vnode: MakeRequired<WidgetVNode<FunctionWidget>, 'instance'>): HookCollectResult {
    // 创建新的上下文
    const context: HookCollectResult = {
      exposed: {},
      lifeCycleHooks: {}
    } as HookCollectResult
    // 为组件注入`instance`
    const callFnWidget = () => vnode.type.call(vnode.instance, vnode.props)
    // 运行函数式组件
    context.build = runInContext(this.#hookCollectorContext, context, callFnWidget)
    return context
  }
}
