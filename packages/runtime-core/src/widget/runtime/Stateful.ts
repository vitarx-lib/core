import {
  type DependencyMap,
  depSubscribe,
  EffectScope,
  Scheduler,
  Subscriber
} from '@vitarx/responsive'
import { logger } from '@vitarx/utils'
import { LifecycleHooks, NodeState } from '../../constants/index.js'
import { findParentNode, linkParentNode, proxyWidgetProps } from '../../runtime/index.js'
import type {
  ErrorSource,
  LifecycleHookParameter,
  LifecycleHookReturnType,
  StatefulWidgetNode,
  StatefulWidgetNodeType,
  VNode,
  WidgetInstanceType
} from '../../types/index.js'
import { __DEV__, isClassWidget, isStatefulWidgetNode, isVNode } from '../../utils/index.js'
import { patchUpdate } from '../../vnode/core/update.js'
import { createCommentVNode, createTextVNode } from '../../vnode/index.js'
import { FnWidget, initializeFnWidget } from '../base/FnWidget.js'
import { Widget } from '../base/index.js'
import { WidgetRuntime } from './WidgetRuntime.js'

/**
 * 有状态组件运行时管理器配置选项
 */
export interface StatefulManagerOptions {
  /**
   * 异步组件解析回调
   *
   * 当异步组件开始解析时触发，接收一个 Promise 对象用于监听解析完成事件
   *
   * @param promise - 异步组件解析的 Promise 对象
   */
  onResolve?: (promise: Promise<Widget>) => void
  /**
   * 是否启用自动更新
   *
   * @default true
   * - true: 自动监听依赖变化并更新视图
   * - false: 需手动调用 update 方法更新视图
   */
  enableAutoUpdate?: boolean
  /**
   * 是否启用调度更新
   *
   * @default true
   * - true: 使用 Scheduler.queueJob 进行调度，避免重复渲染
   * - false: 立即同步更新，可能导致性能问题
   */
  enableScheduler?: boolean
  /**
   * 是否启用生命周期钩子
   *
   * @default true
   * - true: 启用生命周期钩子，如 onMounted、onUpdated 等
   * - false: 禁用生命周期钩子
   */
  enableLifecycle?: boolean
}
/**
 * 有状态组件运行时管理器
 *
 * 负责管理有状态组件的生命周期、依赖追踪、视图更新等功能
 */
export class StatefulWidgetRuntime<
  T extends StatefulWidgetNodeType = StatefulWidgetNodeType
> extends WidgetRuntime<T> {
  /** 响应式作用域，管理所有副作用 */
  public readonly scope: EffectScope
  /** 依赖映射表，仅在开发模式下使用 */
  public deps: DependencyMap | null = null
  /** 是否在非活跃期间被更新 */
  public dirty: boolean = false
  /** 管理器配置选项 */
  public options: StatefulManagerOptions = {
    enableAutoUpdate: true,
    enableScheduler: true,
    enableLifecycle: true
  }
  /** 组件实例 */
  public readonly instance: WidgetInstanceType<T>
  /** 是否有待处理的更新任务 */
  private hasPendingUpdate: boolean = false
  /** 视图依赖订阅器，用于追踪渲染依赖 */
  private renderDepsSubscriber: Subscriber | null = null
  constructor(node: StatefulWidgetNode<T>, options?: StatefulManagerOptions) {
    super(node)
    this.scope = new EffectScope({
      name: this.name,
      errorHandler: (error: unknown, source) => {
        this.reportError(error, `effect.${source}`)
      }
    })
    this.options = Object.assign(this.options, options)
    // @ts-ignore
    this.props = proxyWidgetProps(this.vnode.props, this.type['defaultProps'])
    this.instance = this.createWidgetInstance()
  }

  /**
   * 报告并处理错误
   *
   * 按以下顺序处理错误：
   * 1. 调用组件实例的 onError 钩子
   * 2. 向上冒泡到父组件的 onError 钩子
   * 3. 调用应用级的全局错误处理器
   * 4. 如果都没有，则输出到控制台
   *
   * @returns 错误状态的虚拟节点或 undefined
   * @param error - 错误对象
   * @param source - 错误源
   * @param [instance] - 组件实例
   */
  public reportError(error: unknown, source: ErrorSource, instance?: Widget): VNode | void {
    instance ??= this.instance
    try {
      // 1. 尝试调用组件实例的错误处理器
      if (typeof this.instance.onError === 'function') {
        const result = this.instance.onError.apply(this.instance, [
          error,
          { source, instance: instance ?? this.instance }
        ])
        if (result === false) return void 0
        if (isVNode(result)) return result
      }

      // 2. 向上查找最近的有状态父组件
      let parentNode = findParentNode(this.vnode)
      while (parentNode && !isStatefulWidgetNode(parentNode)) {
        parentNode = findParentNode(parentNode)
      }

      // 3. 如果找到父组件，递归向上冒泡错误
      if (isStatefulWidgetNode(parentNode)) {
        return parentNode.instance!.reportError(error, source, instance)
      }

      // 4. 如果没有父组件，尝试使用应用级错误处理器
      if (this.vnode.appContext?.config?.errorHandler) {
        return this.vnode.appContext.config.errorHandler.apply(this.instance, [
          error,
          {
            source,
            instance
          }
        ])
      }

      // 5. 最后，输出未处理的异常到控制台
      logger.error('Unhandled exception in component - ', error, { source, instance })
      return void 0
    } catch (error) {
      logger.error(
        `StatefulWidget<${this.name}> Infinite loop detected: error thrown in onError hook`,
        error
      )
    }
  }
  /**
   * 调用生命周期钩子
   *
   * 如果钩子执行过程中抛出错误，会自动调用错误处理流程
   *
   * @param hookName - 生命周期钩子名称
   * @param args - 钩子函数参数
   * @returns 钩子函数的返回值
   */
  public invokeHook<T extends LifecycleHooks>(
    hookName: T,
    ...args: LifecycleHookParameter<T>
  ): LifecycleHookReturnType<T> | void {
    try {
      // 错误钩子需要特殊处理，直接调用 reportError
      if (hookName === LifecycleHooks.error) {
        return this.reportError(
          ...(args as unknown as [unknown, ErrorSource, Widget])
        ) as LifecycleHookReturnType<T>
      }
      if (!this.options.enableLifecycle && hookName !== LifecycleHooks.render) return void 0
      const hookMethod = this.instance[hookName] as unknown as (
        ...args: LifecycleHookParameter<T>
      ) => any
      return typeof hookMethod === 'function' ? hookMethod.apply(this.instance, args) : undefined
    } catch (error) {
      return this.reportError(
        error,
        `hook:${hookName.replace('on', '').toLowerCase()}` as ErrorSource
      ) as LifecycleHookReturnType<T>
    }
  }
  /**
   * 更新组件视图
   *
   * 默认为异步批量更新，多次调用会合并为一次更新，避免重复渲染
   * 仅在组件处于活跃状态时才会执行更新
   *
   * @returns Promise，在更新完成后 resolve
   */
  public override update = (): void => {
    // ---------- 异步更新 ----------
    if (this.hasPendingUpdate) return
    this.hasPendingUpdate = true
    this.invokeHook(LifecycleHooks.beforeUpdate)
    if (this.options.enableScheduler) {
      Scheduler.queueJob(this.finishUpdate)
    } else {
      this.finishUpdate()
    }
  }
  /**
   * 销毁实例资源
   * 执行清理操作，释放内存
   */
  public override destroy(): void {
    if (this.renderDepsSubscriber) {
      this.renderDepsSubscriber.dispose()
      this.renderDepsSubscriber = null
    }
    // 清空依赖数组
    this.deps = null
    // 释放作用域资源
    this.scope.dispose()
    super.destroy()
  }
  /**
   * 在 update 内部调用的渲染执行函数
   */
  private finishUpdate = (): void => {
    this.hasPendingUpdate = false
    if (this.state === NodeState.Unmounted) {
      return
    }
    if (this.state === NodeState.Deactivated) {
      this.dirty = true
      return
    }
    try {
      this.cachedChildVNode = this.patch()
    } catch (err) {
      this.reportError(err, 'update')
    } finally {
      this.invokeHook(LifecycleHooks.updated)
    }
  }
  /**
   * 重新构建子虚拟节点并建立依赖追踪
   *
   * 如果启用了自动更新，会建立响应式依赖订阅，当依赖变化时自动触发更新
   *
   * @returns 构建的虚拟节点
   */
  public override build(): VNode {
    // 禁用自动更新时，直接构建不追踪依赖
    if (!this.options.enableAutoUpdate) {
      return this.buildChildVNode()
    }
    // 清理旧的依赖订阅
    if (this.renderDepsSubscriber) {
      this.renderDepsSubscriber.dispose()
    }
    // 构建虚拟节点并订阅依赖变化
    const { result, subscriber, deps } = depSubscribe(this.buildChildVNode, this.update, {
      flush: 'sync',
      scope: false
    })
    // 开发模式下记录依赖用于调试
    if (__DEV__) {
      this.deps = deps
    }
    this.renderDepsSubscriber = subscriber || null
    return result
  }
  /**
   * 构建子虚拟节点
   *
   * 调用组件实例的 build 方法生成虚拟节点，并处理各种返回值类型：
   * - VNode: 直接使用
   * - string/number: 转换为文本节点
   * - 其他类型: 创建注释节点（开发模式警告）
   *
   * @returns 构建的虚拟节点
   */
  private buildChildVNode = (): VNode => {
    let vnode: VNode

    try {
      const buildResult = this.runInContext(() => this.instance.build())

      if (isVNode(buildResult)) {
        vnode = buildResult
      } else {
        const resultType = typeof buildResult
        if (resultType === 'string' || resultType === 'number') {
          vnode = createTextVNode({ text: String(buildResult) })
        } else {
          vnode = createCommentVNode({
            text: `StatefulWidget<${this.name}> build() returned invalid type: ${resultType}`
          })
        }
      }
    } catch (error) {
      const errorVNode = this.reportError(error, 'build')
      vnode = isVNode(errorVNode)
        ? errorVNode
        : createCommentVNode({ text: `StatefulWidget<${this.name}> build failed` })
    }
    linkParentNode(vnode, this.vnode)
    return vnode
  }
  /**
   * 补丁方法，用于处理节点的更新和重建
   *
   * @private
   * @returns {VNode} 返回处理后的虚拟节点
   */
  private patch(): VNode {
    this.dirty = false
    const newChild = this.build()
    if (this.state === NodeState.Created) {
      return newChild
    }
    if (typeof this.instance.$patchUpdate === 'function') {
      // 如果实例存在自定义的更新方法，则调用该方法进行更新
      return this.instance.$patchUpdate(this.child, newChild)
    } else {
      // 默认情况下，使用patchUpdate方法进行节点更新
      return patchUpdate(this.child, newChild)
    }
  }
  /**
   * 创建组件实例
   *
   * 根据组件类型（类组件或函数组件）创建相应的实例，并处理异步组件的情况
   *
   * @returns 创建的组件实例
   */
  private createWidgetInstance(): WidgetInstanceType<T> {
    const onResolveCallback = this.options.onResolve
    return this.scope.run(() =>
      this.runInContext(() => {
        let instance: Widget
        if (isClassWidget(this.type)) {
          // 创建类组件实例
          instance = new this.type(this.props)
          instance.$vnode.isAsyncWidget = false
          /**
           * 调用组件的onCreate生命周期钩子
           */
          instance.onCreate?.()
        } else {
          // 创建函数组件实例
          instance = new FnWidget(this.props)
          const initPromise = initializeFnWidget(instance)
          // 如果是异步组件，触发解析回调
          if (instance.$vnode.isAsyncWidget) {
            onResolveCallback?.(initPromise)
          }
        }
        return instance as WidgetInstanceType<T>
      })
    )
  }
}
