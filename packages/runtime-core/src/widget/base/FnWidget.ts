import { toRaw, withAsyncContext } from '@vitarx/responsive'
import { isPromise } from '@vitarx/utils'
import type {
  FunctionWidget,
  LazyWidgetModule,
  LifecycleHookMethods,
  VNodeBuilder,
  VNodeChild
} from '../../types/index.js'
import { NodeState, StatefulWidgetNode } from '../../vnode/index.js'
import { __WIDGET_INTRINSIC_KEYWORDS__, LifecycleHooks } from '../constants/index.js'
import {
  getSuspenseCounter,
  HookCollector,
  type HookCollectResult,
  isWidget
} from '../utils/index.js'
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
   */
  async [__INITIALIZE_FN_WIDGET_METHOD__](): Promise<FnWidget> {
    const counter = getSuspenseCounter()
    // 收集函数组件钩子
    const { exposed, hooks, buildResult } = HookCollector.collect(
      this.$vnode as StatefulWidgetNode<FunctionWidget>,
      this
    )
    // 暴露的属性和方法数量
    const exposedCount = Object.keys(exposed).length
    // 钩子数量
    const hookCount = Object.keys(hooks).length
    // 注入暴露的属性和方法
    if (exposedCount) injectExposed(exposed, this)
    // 异步完成前仅注册错误钩子
    if (hookCount) injectHooks(hooks, this)
    // 非异步初始化，则直接设置build方法
    if (!isPromise(buildResult)) {
      this.build = typeof buildResult === 'function' ? buildResult : () => buildResult
      return this
    }
    // 标记为异步组件
    this.$vnode.isAsyncWidget = true
    // 如果有上级暂停计数器则让计数器+1
    if (counter) counter.value++
    try {
      const result = await withAsyncContext(buildResult)
      // 如果是module对象，则判断是否存在default导出
      this.build = await parseAsyncBuildResult(result, this)
    } catch (e) {
      // 让build方法抛出异常
      this.build = () => {
        throw e
      }
    } finally {
      // 如果钩子数量变化，则重新注入钩子
      if (hookCount !== Object.keys(hooks).length) injectHooks(hooks, this)
      // 暴露的属性和方法和数量发生变化，则重新注入
      if (exposedCount !== Object.keys(exposed).length) injectExposed(exposed, this)
      if (counter) counter.value--
      this.#updateView()
    }
    return this
  }
  override build(): VNodeChild {
    return undefined
  }

  /**
   * 更新视图的方法
   * 根据组件的状态决定是否执行更新操作
   */
  #updateView() {
    const vnode = this.$vnode
    if (vnode.state !== NodeState.Unmounted) {
      this.$vnode.triggerLifecycleHook(LifecycleHooks.beforeUpdate)
    }
    if (vnode.state === NodeState.Rendered || vnode.state === NodeState.Activated) {
      try {
        this.$patchUpdate(this.$vnode.rootNode, this.$vnode.rebuild())
        this.$vnode.triggerLifecycleHook(LifecycleHooks.mounted)
        this.$vnode.triggerLifecycleHook(LifecycleHooks.activated)
      } catch (e) {
        this.$vnode.reportError(e, { source: 'build', instance: this })
      }
    } else if (vnode.state === NodeState.Deactivated) {
      const userOnActivated = this.onActivated
      this.onActivated = () => {
        this.$vnode.triggerLifecycleHook(LifecycleHooks.mounted)
        if (userOnActivated) {
          try {
            userOnActivated()
          } finally {
            this.onActivated = userOnActivated
          }
        } else {
          this.onActivated = undefined
        }
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
 * @returns
 */
const parseAsyncBuildResult = async (
  buildResult: VNodeChild | LazyWidgetModule | VNodeBuilder,
  instance: FnWidget
): Promise<VNodeBuilder> => {
  if (typeof buildResult === 'function') return buildResult
  if (
    buildResult &&
    typeof buildResult === 'object' &&
    'default' in buildResult &&
    isWidget(buildResult.default)
  ) {
    // 如果是module对象，则判断是否存在default导出
    const statefulWidgetNode = (await import('../../vnode/nodes/StatefulWidgetNode.js'))
      .StatefulWidgetNode
    return () => new statefulWidgetNode(buildResult.default, { ...toRaw(instance.props) })
  }
  return () => buildResult as VNodeChild
}

/**
 * 初始化函数小部件
 * @param widget
 */
export const initializeFnWidget = async (widget: FnWidget): Promise<FnWidget> => {
  return await widget[__INITIALIZE_FN_WIDGET_METHOD__]()
}
