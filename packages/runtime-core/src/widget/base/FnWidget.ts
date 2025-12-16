import type { AnyCallback } from '@vitarx/utils'
import { isPromise } from '@vitarx/utils'
import { __WIDGET_INTRINSIC_KEYWORDS__, LifecycleHook, NodeState } from '../../constants/index.js'
import { HookCollector, type HookCollectResult } from '../../runtime/hook.js'
import { useSuspense } from '../../runtime/index.js'
import type {
  ChildBuilder,
  ErrorHandler,
  ErrorInfo,
  FunctionWidget,
  LazyLoadModule,
  LifecycleHandler,
  LifecycleHookMap,
  Renderable,
  StatefulWidgetNode,
  VNode
} from '../../types/index.js'
import { getDomTarget, isVNode } from '../../utils/index.js'
import { isWidget } from '../../utils/widget.js'
import {
  cloneVNode,
  createCommentVNode,
  createWidgetVNode,
  mountNode,
  renderNode,
  unmountNode
} from '../../vnode/index.js'
import { StatefulWidgetRuntime } from '../runtime/index.js'
import { Widget } from './Widget.js'

/**
 * FnWidget 是函数式组件运行时的代理类，
 * 继承自 Widget 基类，用于支持函数式组件的渲染和生命周期管理。
 *
 * 该类提供了以下核心功能：
 * - 支持异步初始化函数小部件
 * - 支持生命周期钩子的注入和管理
 * - 支持暴露属性和方法的注入
 * - 支持多种构建函数类型（函数、VNode、Promise等）
 *
 * 注意事项：
 * - 如果函数组件返回的是 Promise，会自动处理异步情况
 * - 内部关键字（__WIDGET_INTRINSIC_KEYWORDS__）不会被注入到实例中
 *
 * @template T - 组件属性类型，继承自 Widget 基类
 */
export class FnWidget extends Widget<Record<string, any>> {
  readonly #hooks: LifecycleHookMap
  #isReady: boolean = false
  readonly #asyncRender: (() => Promise<void>) | null = null
  constructor(props: Record<string, any>) {
    super(props)
    const { exposed, hooks, buildResult } = HookCollector.collect(
      this.$vnode as StatefulWidgetNode<FunctionWidget>,
      this
    )
    this.#hooks = hooks
    injectExposedMembers(exposed, this)
    mixinHooks(this, hooks, () => this.#isReady)
    if (isPromise(buildResult)) {
      // 标记节点为异步组件
      this.$vnode.isAsyncWidget = true
      this.#asyncRender = initializeAsyncWidget(
        this,
        exposed,
        buildResult,
        () => (this.#isReady = true)
      )
    } else {
      this.#isReady = true
      this.build = typeof buildResult === 'function' ? buildResult : () => buildResult
    }
  }
  override async onRender(): Promise<void> {
    const userOnRenders = this.#hooks[LifecycleHook.render]
    if (userOnRenders) {
      const asyncErrors: unknown[] = []
      await Promise.allSettled(
        Array.from(userOnRenders).map(
          async (userOnRender: LifecycleHandler<LifecycleHook.render>) => {
            try {
              await userOnRender.call(this)
            } catch (e) {
              asyncErrors.push(e)
            }
          }
        )
      )
      if (asyncErrors.length) {
        throw new AggregateError(asyncErrors, 'Lifecycle hook "onRender" execution failed')
      }
    }
    if (this.#asyncRender) {
      await this.#asyncRender()
    }
  }
  override onError(error: unknown, info: ErrorInfo): any {
    const userOnErrors = this.#hooks[LifecycleHook.error] as unknown as ErrorHandler[]
    if (userOnErrors) {
      for (const userOnError of userOnErrors) {
        const result = userOnError.call(this, error, info)
        if (result === false) return void 0
        if (isVNode(result)) return result
      }
    }
  }
  override build(): Renderable {
    return undefined
  }
}

/**
 * 调用无参的钩子
 *
 * @param instance
 * @param type
 * @param hooks
 */
function invokeVoidHook(
  instance: FnWidget,
  hooks: LifecycleHookMap,
  type: Exclude<LifecycleHook, LifecycleHook.error | LifecycleHook.render>
) {
  const useHook = hooks[type]
  const errors: unknown[] = []
  if (useHook) {
    for (const useHookItem of useHook) {
      try {
        ;(useHookItem as AnyCallback).call(instance)
      } catch (e) {
        errors.push(e)
      }
    }
  }
  if (errors.length) {
    throw new AggregateError(errors, `Lifecycle hook "${type}" execution failed`)
  }
}
/**
 * 为实例混入生命周期钩子函数
 *
 * @param instance - 需要混入钩子的函数组件实例
 * @param hooks - 生命周期钩子映射表，包含各个钩子的具体实现
 * @param isReady - 函数组件实例的 ready 状态函数
 */
function mixinHooks(instance: FnWidget, hooks: LifecycleHookMap, isReady: () => boolean) {
  // 遍历所有生命周期钩子
  for (const hook of Object.values(LifecycleHook)) {
    // 跳过错误处理和渲染钩子，这些钩子可能有特殊处理
    if (hook === 'onError' || hook === 'onRender' || hook === 'onCreate') continue
    // 为实例的每个钩子属性赋值，调用通用的钩子触发函数
    instance[hook] = () => (isReady() ? invokeVoidHook(instance, hooks, hook) : undefined)
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
  const anchor = getDomTarget(oldChild)
  runtime.invokeHook(LifecycleHook.beforeMount)
  mountNode(newChild, anchor, 'insertBefore')
  unmountNode(oldChild)
  runtime.invokeHook(LifecycleHook.mounted)
}

/**
 * 处理激活状态的异步渲染完成
 */
function handleActivatedState(
  runtime: StatefulWidgetRuntime,
  oldChild: VNode,
  newChild: VNode
): void {
  performChildReplacement(runtime, oldChild, newChild)
  runtime.invokeHook(LifecycleHook.activated)
}
/**
 * 处理失活状态的异步渲染完成
 */
function handleDeactivatedState(
  instance: FnWidget,
  runtime: StatefulWidgetRuntime,
  oldChild: VNode,
  newChild: VNode
): void {
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
  const state = vnode.state
  if (state === NodeState.Unmounted || state === NodeState.Created) return

  const runtime = vnode.instance!
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
 * 注入暴露的属性和方法到实例
 */
const injectExposedMembers = (exposed: HookCollectResult['exposed'], instance: FnWidget) => {
  Object.entries(exposed).forEach(([key, value]) => {
    const isReservedKey = __WIDGET_INTRINSIC_KEYWORDS__.has(key)
    if (!isReservedKey && !(key in instance)) {
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
  buildResult: Renderable | LazyLoadModule | ChildBuilder,
  instance: FnWidget
): ChildBuilder => {
  if (typeof buildResult === 'function') {
    return buildResult
  }

  if (isLazyLoadModule(buildResult)) {
    return () => createWidgetVNode(buildResult.default, instance.props)
  }

  return () => buildResult as Renderable
}

/**
 * 初始化异步组件
 *
 * @param instance - 函数组件实例
 * @param exposed - 暴露的属性
 * @param buildResult - 构建结果
 * @param buildComplete - 构建完成回调
 */
function initializeAsyncWidget(
  instance: FnWidget,
  exposed: HookCollectResult['exposed'],
  buildResult: Promise<any>,
  buildComplete: () => void
): () => Promise<void> {
  let loadingNode = instance.$vnode.type.loading
  let isCustomLoading = false
  if (isVNode(loadingNode)) {
    isCustomLoading = true
    loadingNode = cloneVNode(loadingNode)
  } else {
    loadingNode = createCommentVNode({
      text: `AsyncWidget<${instance.$vnode.instance!.name}> loading ...`
    })
  }
  // 默认使用 loading 节点
  instance.build = () => loadingNode
  const initialExposedCount = Object.keys(exposed).length
  const suspenseCounter = !isCustomLoading ? useSuspense() : null
  if (suspenseCounter) suspenseCounter.value++
  return async () => {
    try {
      const result = await buildResult
      instance.build = parseAsyncBuildResult(result, instance)
    } catch (error) {
      instance.build = () => {
        throw error
      }
    } finally {
      buildComplete()
      if (initialExposedCount !== Object.keys(exposed).length) {
        injectExposedMembers(exposed, instance)
      }
      completeAsyncRender(instance)
      if (suspenseCounter) suspenseCounter.value--
    }
  }
}
