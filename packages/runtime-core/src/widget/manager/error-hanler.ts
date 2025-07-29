import { findParentVNode } from '../../vnode/index'
import { LifecycleHooks } from '../core/constant'
import { Widget } from '../core/index'
import type { ErrorInfo, LifecycleHookParameter } from '../types/index'
import { triggerLifecycleHook } from './lifecycle'

/**
 * 处理根节点错误
 */
function handleRootError(node: any, args: any[]): void {
  const app = node.provide?.App
  if (app?.config.errorHandler) {
    app.config.errorHandler(...args)
  } else {
    console.error('[Vitarx]：there are unhandled exceptions', ...args)
  }
}

/**
 * 向上传播未处理的错误
 */
export function errorHandler(instance: Widget, args: LifecycleHookParameter<LifecycleHooks.error>) {
  let parentNode = findParentVNode(instance.vnode)
  // 处理根节点错误
  if (!parentNode) {
    return handleRootError(instance.vnode, args)
  }

  // 父节点存在instance，让父节点处理错误
  if ('instance' in parentNode) {
    return triggerLifecycleHook(parentNode.instance!, LifecycleHooks.error, ...args)
  }

  // 向上查找有实例的父节点
  while (parentNode && !('instance' in parentNode)) {
    const parent = findParentVNode(parentNode)
    if (!parent) {
      return handleRootError(parentNode, args)
    }
    parentNode = parent
  }
}

/**
 * 报告组件异常
 *
 * 用于报告组件异常，如果发生异常组件自身没有定义`onError`钩子，
 * 则它会沿着节点树向上查找有实例的父节点，并调用父节点的 `onError` 回调。
 *
 * @param {unknown} error - 错误
 * @param {ErrorInfo} info - 详细的错误信息
 * @returns {void}
 */
export function reportWidgetError(error: unknown, info: ErrorInfo): void {
  triggerLifecycleHook(info.instance, LifecycleHooks.error, error, info)
}
