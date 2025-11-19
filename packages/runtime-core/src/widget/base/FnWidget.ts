import { isPromise } from '@vitarx/utils'
import { __WIDGET_INTRINSIC_KEYWORDS__, LifecycleHooks, NodeState } from '../../constants/index.js'
import { useRenderer } from '../../renderer/index.js'
import { HookCollector, type HookCollectResult } from '../../runtime/hook.js'
import { useSuspense } from '../../runtime/index.js'
import type {
  FunctionWidget,
  LazyLoadModule,
  LifecycleHookMethods,
  StatefulWidgetVNode,
  VNode,
  VNodeBuilder,
  VNodeChild
} from '../../types/index.js'
import { isWidget } from '../../utils/widget.js'
import {
  createCommentNode,
  createWidgetNode,
  mountNode,
  renderNode,
  unmountNode
} from '../../vnode/index.js'
import { StatefulWidgetRuntime } from '../runtime/index.js'
import { Widget } from './Widget.js'

/**
 * FnWidget 是一个函数式组件小部件类，继承自 Widget 基类，用于支持函数式组件的渲染和生命周期管理。
 *
 * 该类提供了以下核心功能：
 * - 支持异步初始化函数小部件
 * - 支持生命周期钩子的注入和管理
 * - 支持暴露属性和方法的注入
 * - 支持多种构建函数类型（函数、VNode、Promise等）
 *
 * 注意事项：
 * - build 属性支持多种类型，但必须是 VNode、返回 VNode 的函数、Promise<{ default: 函数组件/类组件 }> 或 null
 * - 如果 build 是 Promise，会自动处理异步情况
 * - 内部关键字（__WIDGET_INTRINSIC_KEYWORDS__）不会被注入到实例中
 *
 * @template T - 组件属性类型，继承自 Widget 基类
 */
export class FnWidget extends Widget<Record<string, any>> {
  override build(): VNodeChild {
    return undefined
  }
}

/**
 * 执行子节点替换流程
 */
const performChildReplacement = (
  runtime: StatefulWidgetRuntime,
  oldChild: VNode,
  newChild: VNode
) => {
  runtime.callHook(LifecycleHooks.beforeMount)
  const renderer = useRenderer()
  const anchor = renderer.createText('')
  renderer.insertBefore(anchor, oldChild.el!)
  unmountNode(oldChild)
  mountNode(newChild, anchor, 'replace')
  runtime.callHook(LifecycleHooks.mounted)
}

/**
 * 检查节点状态是否有效
 */
const isValidNodeState = (state: NodeState | 'created'): boolean => {
  return state !== NodeState.Unmounted && state !== 'created'
}

/**
 * 处理激活状态的异步渲染完成
 */
const handleActivatedState = (runtime: StatefulWidgetRuntime, oldChild: VNode, newChild: VNode) => {
  try {
    performChildReplacement(runtime, oldChild, newChild)
    runtime.callHook(LifecycleHooks.activated)
  } catch (error) {
    runtime.reportError(error, 'build')
  }
}

/**
 * 处理失活状态的异步渲染完成
 */
const handleDeactivatedState = (
  instance: FnWidget,
  runtime: StatefulWidgetRuntime,
  oldChild: VNode,
  newChild: VNode
) => {
  const originalOnActivated = instance.onActivated

  instance.onActivated = () => {
    performChildReplacement(runtime, oldChild, newChild)

    if (originalOnActivated) {
      try {
        originalOnActivated.call(instance)
      } finally {
        instance.onActivated = originalOnActivated
      }
    } else {
      instance.onActivated = undefined
    }
  }
}

/**
 * 完成异步渲染
 */
const completeAsyncRender = (instance: FnWidget) => {
  const vnode = instance.$vnode

  if (!isValidNodeState(vnode.state)) return

  const runtime = vnode.runtimeInstance!
  const oldChild = runtime.child
  const newChild = runtime.build()

  runtime.cachedChildVNode = newChild
  renderNode(newChild)

  if (vnode.state === NodeState.Activated) {
    handleActivatedState(runtime, oldChild, newChild)
  } else if (vnode.state === NodeState.Deactivated) {
    handleDeactivatedState(instance, runtime, oldChild, newChild)
  }
}
/**
 * 注入生命周期钩子到实例
 */
const injectLifecycleHooks = (hooks: HookCollectResult['hooks'], instance: FnWidget) => {
  Object.entries(hooks).forEach(([hookName, hookFn]) => {
    instance[hookName as LifecycleHookMethods] = hookFn
  })
}
/**
 * 注入暴露的属性和方法到实例
 */
const injectExposedMembers = (exposed: HookCollectResult['exposed'], instance: FnWidget) => {
  Object.entries(exposed).forEach(([key, value]) => {
    const isReservedKey = __WIDGET_INTRINSIC_KEYWORDS__.has(key)
    const isExistingKey = key in instance

    if (!isReservedKey && !isExistingKey) {
      ;(instance as Record<string, any>)[key] = value
    }
  })
}
/**
 * 检查是否为懒加载模块
 */
const isLazyLoadModule = (result: any): result is LazyLoadModule => {
  return result && typeof result === 'object' && 'default' in result && isWidget(result.default)
}

/**
 * 解析异步构建结果为构建器函数
 */
const parseAsyncBuildResult = (
  buildResult: VNodeChild | LazyLoadModule | VNodeBuilder,
  instance: FnWidget
): VNodeBuilder => {
  if (typeof buildResult === 'function') {
    return buildResult
  }

  if (isLazyLoadModule(buildResult)) {
    return () => createWidgetNode(buildResult.default, instance.props)
  }

  return () => buildResult as VNodeChild
}
/**
 * 初始化同步函数组件
 */
const initializeSyncWidget = (
  instance: FnWidget,
  hooks: HookCollectResult['hooks'],
  buildResult: VNodeChild | VNodeBuilder
) => {
  const hasHooks = Object.keys(hooks).length > 0

  if (hasHooks) {
    injectLifecycleHooks(hooks, instance)
  }

  instance.build = typeof buildResult === 'function' ? buildResult : () => buildResult
}

/**
 * 注册关键生命周期钩子
 */
const registerCriticalHooks = (instance: FnWidget, hooks: HookCollectResult['hooks']) => {
  if (LifecycleHooks.error in hooks) {
    instance.onError = hooks.onError
  }
  if (LifecycleHooks.render in hooks) {
    instance.onRender = hooks.onRender
  }
}

/**
 * 处理异步构建失败
 */
const createErrorBuilder = (error: unknown): VNodeBuilder => {
  return () => {
    throw error
  }
}

/**
 * 初始化异步函数组件
 */
const initializeAsyncWidget = async (
  instance: FnWidget,
  hooks: HookCollectResult['hooks'],
  exposed: HookCollectResult['exposed'],
  buildResult: Promise<any>
) => {
  // 创建一个占位符构建器
  instance.build = () => {
    return createCommentNode({
      value: `AsyncWidget<${instance.$vnode.runtimeInstance!.name}> loading ...`
    })
  }
  const suspenseCounter = useSuspense()
  const initialExposedCount = Object.keys(exposed).length

  instance.$vnode.isAsyncWidget = true

  if (suspenseCounter) {
    suspenseCounter.value++
  }

  try {
    registerCriticalHooks(instance, hooks)

    const result = await buildResult
    instance.build = parseAsyncBuildResult(result, instance)
  } catch (error) {
    instance.build = createErrorBuilder(error)
  } finally {
    injectLifecycleHooks(hooks, instance)
    const hasExposedChanged = initialExposedCount !== Object.keys(exposed).length
    if (hasExposedChanged) {
      injectExposedMembers(exposed, instance)
    }
    completeAsyncRender(instance)
    if (suspenseCounter) {
      suspenseCounter.value--
    }
  }
}

/**
 * 初始化函数组件
 *
 * @internal 内部关键逻辑
 * @param instance - 函数组件实例
 */
export const initializeFnWidget = async (instance: FnWidget): Promise<FnWidget> => {
  const vnode = instance.$vnode as StatefulWidgetVNode<FunctionWidget>
  const { exposed, hooks, buildResult } = HookCollector.collect(vnode, instance)

  const hasExposed = Object.keys(exposed).length > 0
  if (hasExposed) {
    injectExposedMembers(exposed, instance)
  }

  if (!isPromise(buildResult)) {
    initializeSyncWidget(instance, hooks, buildResult)
    return instance
  }

  await initializeAsyncWidget(instance, hooks, exposed, buildResult)
  return instance
}
