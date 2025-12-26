import {
  collectSignal,
  type DepEffectLike,
  Effect,
  EffectScope,
  IS_REF,
  queueJob,
  trackSignal
} from '@vitarx/responsive'
import { logger } from '@vitarx/utils'
import { LifecycleHook, NodeState } from '../../constants/index.js'
import { findParentNode, linkParentNode, proxyProps } from '../../runtime/index.js'
import type {
  ErrorSource,
  LifecycleHookParameter,
  LifecycleHookReturnType,
  StatefulWidgetNode,
  StatefulWidgetNodeType,
  VNode,
  WidgetInstanceType
} from '../../types/index.js'
import { isClassWidget, isStatefulWidgetNode, isVNode } from '../../utils/index.js'
import { createCommentVNode, createTextVNode, patchUpdate } from '../../vnode/index.js'
import { FnWidget } from '../base/FnWidget.js'
import { Widget } from '../base/index.js'
import { WidgetRuntime } from './WidgetRuntime.js'

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
  /** 是否在非活跃期间被更新 */
  public dirty: boolean = false
  /** 组件实例 */
  public readonly instance: WidgetInstanceType<T>
  /** 是否有待处理的更新任务 */
  private hasPendingUpdate: boolean = false
  private renderEffect: RenderEffect
  constructor(node: StatefulWidgetNode<T>) {
    super(node)
    this.scope = new EffectScope({
      name: this.name,
      errorHandler: (error: unknown, source) => {
        this.reportError(error, `effect.${source}`)
      }
    })
    // @ts-ignore
    this.props = proxyProps(this.vnode.props, this.type['defaultProps'])
    this.instance = this.createWidgetInstance()
    this.renderEffect = new RenderEffect(
      (): VNode => {
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
      },
      this.update,
      this.scope
    )
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

      const errorInfo = {
        source,
        instance
      }
      // 4. 如果没有父组件，尝试使用应用级错误处理器
      if (this.vnode.appContext?.config?.errorHandler) {
        return this.vnode.appContext.config.errorHandler.apply(this.instance, [error, errorInfo])
      }

      // 5. 最后，输出未处理的异常到控制台
      logger.error('Unhandled exception in component - ', error, errorInfo)
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
  public invokeHook<T extends LifecycleHook>(
    hookName: T,
    ...args: LifecycleHookParameter<T>
  ): LifecycleHookReturnType<T> | void {
    try {
      // 错误钩子需要特殊处理，直接调用 reportError
      if (hookName === LifecycleHook.error) {
        return this.reportError(
          ...(args as unknown as [unknown, ErrorSource, Widget])
        ) as LifecycleHookReturnType<T>
      }
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
  public override update = (force?: boolean): void => {
    if (this.state === NodeState.Unmounted) {
      throw new Error('Cannot update unmounted widget')
    }
    if (force) this.renderEffect.dirty = true
    if (this.state === NodeState.Created) {
      if (this.cachedChildVNode) this.cachedChildVNode = this.build()
      return
    }
    if (this.state === NodeState.Deactivated) {
      this.dirty = true
      return
    }
    if (this.hasPendingUpdate) return
    this.hasPendingUpdate = true
    this.invokeHook(LifecycleHook.beforeUpdate)
    queueJob(this.finishUpdate)
  }
  /**
   * 销毁实例资源
   * 执行清理操作，释放内存
   */
  public override destroy(): void {
    // 释放作用域资源
    this.scope.dispose()
    super.destroy()
  }
  /**
   * 重新构建子虚拟节点并建立依赖追踪
   *
   * 如果启用了自动更新，会建立响应式依赖订阅，当依赖变化时自动触发更新
   *
   * @returns 构建的虚拟节点
   */
  public override build(): VNode {
    return this.renderEffect.rebuild()
  }
  /**
   * 在 update 内部调用的渲染执行函数
   */
  private finishUpdate = (): void => {
    try {
      this.hasPendingUpdate = false
      if (this.state === NodeState.Unmounted) return
      if (this.state === NodeState.Created) {
        if (this.cachedChildVNode) this.cachedChildVNode = this.build()
        return
      }
      if (this.state === NodeState.Deactivated) {
        this.dirty = true
        return
      }
      this.dirty = false
      const newChild = this.build()
      if (typeof this.instance.$patchUpdate === 'function') {
        // 如果实例存在自定义的更新方法，则调用该方法进行更新
        this.cachedChildVNode = this.instance.$patchUpdate(this.child, newChild)
      } else {
        // 默认情况下，使用patchUpdate方法进行节点更新
        this.cachedChildVNode = patchUpdate(this.child, newChild)
      }
      this.invokeHook(LifecycleHook.updated)
    } catch (err) {
      this.reportError(err, 'update')
    }
  }
  /**
   * 创建组件实例
   *
   * 根据组件类型（类组件或函数组件）创建相应的实例
   * 异步组件的解析逻辑已移至 onRender 钩子中，SSR 通过 invokeHook(render) 统一收集异步任务
   *
   * @returns {Widget} 创建的组件实例
   */
  private createWidgetInstance(): WidgetInstanceType<T> {
    return this.scope.run(() =>
      this.runInContext(() => {
        let instance: Widget
        if (isClassWidget(this.type)) {
          // 创建类组件实例
          instance = new this.type(this.props)
          instance.$vnode.isAsyncWidget = false
          if (!import.meta.env?.DEV || !(this.vnode as any).__$HMR_STATE$__) {
            // 调用组件的onCreate生命周期钩子
            instance.onCreate?.()
          }
        } else {
          // 创建函数组件实例
          instance = new FnWidget(this.props)
        }
        return instance as WidgetInstanceType<T>
      })
    )
  }
}

/**
 * RenderEffect 类，用于处理渲染效果，实现了 DepEffectLike 接口
 * 它是一个响应式系统中的核心组件，用于管理视图的渲染和更新
 */
class RenderEffect extends Effect implements DepEffectLike {
  // 标记为引用类型，用于在响应式系统中识别
  readonly [IS_REF]: true = true
  // 脏标记，表示是否需要重新计算
  public dirty: boolean = true
  /**
   * 计算结果缓存
   * @private 私有属性，用于存储计算后的虚拟节点
   */
  private _node!: VNode

  // 构造函数，接收构建函数、更新函数和作用域
  constructor(
    // 用于构建虚拟节点的函数
    private readonly build: () => VNode,
    // 用于更新效果的函数
    private readonly update: () => void,
    // 效果的作用域
    scope: EffectScope
  ) {
    // 处理作用域，调用父类构造函数
    super({ scope })
  }

  /**
   * 强制更新
   */
  rebuild(): VNode {
    // 首次访问或手动调用后，设置副作用
    if (this.dirty) this.recomputed()
    // 追踪对value属性的访问
    trackSignal(this, 'get')
    return this._node
  }
  run() {
    if (!this.dirty) {
      this.dirty = true
      this.update()
    }
  }
  private recomputed(): void {
    collectSignal(() => {
      try {
        this._node = this.build()
      } catch (e) {
        this.reportError(e, 'render')
      } finally {
        this.dirty = false
      }
    }, this)
  }
}
