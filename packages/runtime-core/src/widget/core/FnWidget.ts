import { toRaw, withAsyncContext } from '@vitarx/responsive'
import { isPromise } from '@vitarx/utils'
import { __WIDGET_INTRINSIC_KEYWORDS__, LifecycleHooks, NodeState } from '../../constants/index.js'
import { HookCollector, type HookCollectResult } from '../../runtime/hook.js'
import { useSuspense } from '../../runtime/index.js'
import type {
  FunctionWidget,
  LazyWidgetModule,
  LifecycleHookMethods,
  VNodeBuilder,
  VNodeChild
} from '../../types/index.js'
import { isWidget } from '../../utils/widget.js'
import type { StatefulWidgetNode } from '../../vnode/index.js'
import { Widget } from './Widget.js'

const __INITIALIZE_FN_WIDGET_METHOD__ = Symbol('initializeFnWidget')

/**
 * FnWidget 是一个函数式组件小部件类，继承自 Widget 基类，用于支持函数式组件的渲染和生命周期管理。
 *
 * 该类提供了以下核心功能：
 * - 支持异步初始化函数小部件
 * - 支持生命周期钩子的注入和管理
 * - 支持暴露属性和方法的注入
 * - 支持多种构建函数类型（函数、VNode、Promise等）
 *
 * 使用示例：
 * ```ts
 * const widget = new FnWidget();
 * await initializeFnWidget(widget);
 * ```
 *
 * 注意事项：
 * - build 属性支持多种类型，但必须是 VNode、返回 VNode 的函数、Promise<{ default: 函数组件/类组件 }> 或 null
 * - 如果 build 是 Promise，会自动处理异步情况
 * - 内部关键字（__WIDGET_INTRINSIC_KEYWORDS__）不会被注入到实例中
 *
 * @template T - 组件属性类型，继承自 Widget 基类
 */
export class FnWidget extends Widget<Record<string, any>> {
  /**
   * 初始化函数小部件
   *
   * @param nodeConstructor - 节点构造函数，为了避免循环依赖
   */
  async [__INITIALIZE_FN_WIDGET_METHOD__](
    nodeConstructor: typeof StatefulWidgetNode
  ): Promise<FnWidget> {
    const counter = useSuspense()
    // 收集函数组件钩子
    const { exposed, hooks, buildResult } = HookCollector.collect(
      this.$vnode as StatefulWidgetNode<FunctionWidget>,
      this
    )
    // 暴露的属性和方法数量
    const exposedCount = Object.keys(exposed).length
    // 注入暴露的属性和方法
    if (exposedCount) injectExposed(exposed, this)
    // 非异步初始化，则直接设置build方法
    if (!isPromise(buildResult)) {
      if (Object.keys(hooks).length) injectHooks(hooks, this)
      this.build = typeof buildResult === 'function' ? buildResult : () => buildResult
      return this
    }
    // 标记为异步组件
    this.$vnode.isAsyncWidget = true
    // 如果有上级暂停计数器则让计数器+1
    if (counter) counter.value++
    try {
      // 异步完成前仅注册错误钩子 和 render 钩子
      if (LifecycleHooks.error in hooks) {
        this.onError = hooks.onError
      }
      if (LifecycleHooks.render in hooks) {
        this.onRender = hooks.onRender
      }
      const result = await withAsyncContext(buildResult)
      // 如果是module对象，则判断是否存在default导出
      this.build = await parseAsyncBuildResult(result, this, nodeConstructor)
    } catch (e) {
      // 让build方法抛出异常
      this.build = () => {
        throw e
      }
    } finally {
      // 注入钩子
      injectHooks(hooks, this)
      // 暴露的属性和方法和数量发生变化，则重新注入
      if (exposedCount !== Object.keys(exposed).length) injectExposed(exposed, this)
      doneAsyncRender(this)
      if (counter) counter.value--
    }
    return this
  }
  override build(): VNodeChild {
    return undefined
  }
}
/**
 * 完成异步渲染
 */
const doneAsyncRender = (instance: FnWidget) => {
  const vnode = instance.$vnode
  if (vnode.state === NodeState.Unmounted) return
  vnode.callHook(LifecycleHooks.beforeUpdate)
  if (vnode.state === NodeState.Rendered) {
    // 还未挂载，触发静默更新
    vnode.syncSilentUpdate()
  } else if (vnode.state === NodeState.Activated) {
    // 已被挂载
    try {
      vnode.syncSilentUpdate() // 静默更新
      vnode.callHook(LifecycleHooks.mounted) // 补发挂载钩子
      vnode.callHook(LifecycleHooks.activated) // 补发激活钩子
    } catch (e) {
      vnode.reportError(e, { source: 'build', instance: instance })
    }
  } else if (vnode.state === NodeState.Deactivated) {
    const userOnActivated = instance.onActivated
    // 在下一次激活时补发
    instance.onActivated = () => {
      vnode.callHook(LifecycleHooks.mounted)
      if (userOnActivated) {
        try {
          userOnActivated.call(instance)
        } finally {
          instance.onActivated = userOnActivated
        }
      } else {
        instance.onActivated = undefined
      }
    }
  }
}
/**
 * 注入钩子
 * @param hooks
 * @param instance
 */
const injectHooks = (hooks: HookCollectResult['hooks'], instance: FnWidget) => {
  for (const lifeCycleHook in hooks) {
    const k = lifeCycleHook as LifecycleHookMethods
    instance[k] = hooks[k]
  }
}
/**
 * 注入暴露的属性和方法
 * @param exposed
 * @param instance
 */
const injectExposed = (exposed: HookCollectResult['exposed'], instance: FnWidget) => {
  for (const exposedKey in exposed) {
    if (__WIDGET_INTRINSIC_KEYWORDS__.has(exposedKey) || exposedKey in instance) continue
    ;(instance as Record<any, any>)[exposedKey] = exposed[exposedKey]
  }
}
/**
 * 解析异步构建结果
 * @param buildResult
 * @param instance
 * @param nodeConstructor
 * @returns
 */
const parseAsyncBuildResult = async (
  buildResult: VNodeChild | LazyWidgetModule | VNodeBuilder,
  instance: FnWidget,
  nodeConstructor: typeof StatefulWidgetNode
): Promise<VNodeBuilder> => {
  if (typeof buildResult === 'function') return buildResult
  if (
    buildResult &&
    typeof buildResult === 'object' &&
    'default' in buildResult &&
    isWidget(buildResult.default)
  ) {
    // 如果是module对象，则判断是否存在default导出
    return () => new nodeConstructor(buildResult.default, { ...toRaw(instance.props) })
  }
  return () => buildResult as VNodeChild
}
/**
 * 初始化函数小部件
 *
 * @param instance - 函数小部件实例
 * @param nodeConstructor - StatefulWidgetNode构造函数，为了避免循环依赖
 */
export const initializeFnWidget = async (
  instance: FnWidget,
  nodeConstructor: typeof StatefulWidgetNode
): Promise<FnWidget> => {
  return await instance[__INITIALIZE_FN_WIDGET_METHOD__](nodeConstructor)
}
