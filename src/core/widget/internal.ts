import type { Widget } from './widget.js'
import {
  type ErrorSource,
  type HookParameter,
  type HookReturnType,
  LifeCycleHooks
} from './life-cycle.js'
import { findParentVNode, type VNode } from '../vnode/index.js'

/**
 * 向上传播未处理的错误
 */
export function _propagateError(instance: Widget, args: HookParameter<LifeCycleHooks.error>) {
  let parentNode = findParentVNode(instance['vnode'])
  // 处理根节点错误
  if (!parentNode) {
    return _handleRootError(instance['vnode'], args)
  }

  // 父节点存在instance，让父节点处理错误
  if (parentNode.instance) {
    return _callLifeCycleHook(parentNode.instance, LifeCycleHooks.error, ...args)
  }

  // 向上查找有实例的父节点
  while (parentNode && !parentNode.instance) {
    const parent = findParentVNode(parentNode)
    if (!parent) {
      return _handleRootError(parentNode, args)
    }
    parentNode = parent
  }
}

/**
 * 处理根节点错误
 */
export function _handleRootError(node: VNode, args: any[]): void {
  const app = node.provide?.App
  if (app?.config.errorHandler) {
    app.config.errorHandler(...args)
  } else {
    console.error('[Vitarx]：存在未被处理的异常', ...args)
  }
}

/**
 * 调用组件生命周期钩子
 *
 * @param instance
 * @param hook
 * @param args
 */
export function _callLifeCycleHook<T extends LifeCycleHooks>(
  instance: Widget,
  hook: T,
  ...args: HookParameter<T>
): HookReturnType<T> {
  const isCallOnError = hook === LifeCycleHooks.error
  try {
    const method = instance[hook] as unknown as (...args: HookParameter<T>) => any
    const result = typeof method === 'function' ? method.apply(instance, args) : undefined
    // 处理错误钩子的未处理情况
    if (isCallOnError && result === undefined) {
      return _propagateError(instance, args as HookParameter<LifeCycleHooks.error>)
    }
    return result
  } catch (e) {
    if (isCallOnError) {
      console.error('[Vitarx.Widget.onError]：不能在onError钩子中继续抛出异常，这会导致无限循环！')
    } else {
      _callLifeCycleHook(instance, LifeCycleHooks.error, e, {
        source: `hook:${hook.replace('on', '').toLowerCase()}` as ErrorSource,
        instance: instance
      })
    }
    return undefined as any
  }
}
