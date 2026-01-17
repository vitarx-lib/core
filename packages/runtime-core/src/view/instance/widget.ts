import { EffectScope, isRef, markRaw, type Ref } from '@vitarx/responsive'
import { isPromise, logger } from '@vitarx/utils'
import { App } from '../../app/index.js'
import { withWidgetContext } from '../../runtime/context.js'
import type { ErrorSource, HookStore } from '../../runtime/hook.js'
import { withDirectives } from '../../runtime/index.js'
import { LifecycleStage } from '../../shared/constants/lifecycle.js'
import { SUSPENSE_COUNTER } from '../../shared/constants/symbol.js'
import { ViewState } from '../../shared/constants/viewState.js'
import { isView } from '../../shared/utils/is.js'
import type {
  Directive,
  HostNode,
  ParentView,
  View,
  WidgetPublicInstance,
  WidgetView
} from '../../types/index.js'
import { ViewInstance } from './base.js'

const findSuspense = (instance: WidgetInstance): Ref<number> | undefined => {
  let parent = instance.owner
  while (parent) {
    const suspense = parent.provide?.get(SUSPENSE_COUNTER)
    if (isRef(suspense)) return suspense
    parent = parent.owner
  }
  return undefined
}

/**
 * 组件运行时上下文
 *
 * @internal - 内部核心类
 */
export class WidgetInstance extends ViewInstance {
  /** @internal - 组件展示的名称 */
  public readonly name: string
  /** @internal - 组件注册的钩子 */
  public readonly hooks: HookStore = {}
  /** @internal - 组件的副作用管理作用域 */
  public readonly scope: EffectScope
  /** @internal - 组件公开实例，只读！*/
  public readonly publicInstance: WidgetPublicInstance
  /** @internal - 组件的提供数据 */
  public provide: Map<string | symbol, any> | null = null
  /** @internal - 组件的指令存储 */
  public directiveStore: Map<string, Directive> | null = null
  /** @internal - 组件的子视图 */
  public readonly child: View
  constructor(
    view: WidgetView,
    parent: ParentView | null,
    owner: WidgetInstance | null,
    app: App | null
  ) {
    super(parent, owner, app)
    const widget = view.type
    this.name = widget.displayName ?? widget.name ?? 'anonymous'
    this.scope = new EffectScope({ name: this.name })
    this.publicInstance = markRaw({})
    this.child = withWidgetContext(this, () => widget(view.props ?? {}))
    if (__DEV__ && !isView(this.child)) {
      throw new Error(
        `[Widget<${this.name}>]: function widget return value can only be a view object`
      )
    }
    if (!isView(this.child)) {
      throw new Error(
        `[Widget<${this.name}>]: function widget return value can only be a view object`
      )
    }
    // 透传指令
    if (view.directives) withDirectives(this.child, Array.from(view.directives))
  }
  override get hostNode(): HostNode {
    if (this.state < ViewState.READY) {
      throw new Error('hostNode is not allocated')
    }
    return this.child.instance?.hostNode!
  }
  public reportError(error: unknown, source: ErrorSource, instance?: WidgetPublicInstance): void {
    instance ??= this.publicInstance
    const errorInfo = { source, instance }
    const hooks = this.hooks['error']
    if (hooks) {
      for (const hook of hooks) {
        try {
          const result = hook.call(this.publicInstance, error, errorInfo)
          if (result === false) return
        } catch (e) {
          logger.error(`[${this.name}] Infinite loop detected: error thrown in onError hook`, error)
        }
      }
    }
    if (this.owner) {
      this.owner?.reportError(error, errorInfo.source, instance)
    } else if (this.app?.config.errorHandler) {
      this.app.config.errorHandler.call(this.publicInstance, error, errorInfo)
    } else {
      logger.error(`Unhandled exception in ${this.name}: `, error, errorInfo)
    }
  }
  public invokeVoidHook(stage: Exclude<LifecycleStage, LifecycleStage.prepare>): void {
    const hooks = this.hooks[stage]
    if (!hooks) return void 0
    const errors: unknown[] = []
    for (const hook of hooks) {
      try {
        hook.call(this.publicInstance)
      } catch (e) {
        errors.push(e)
      }
    }
    if (!__DEV__) {
      // 如果钩子只会被应用一次，执行完成后删除钩子
      if (!(stage === LifecycleStage.activated || stage === LifecycleStage.deactivated)) {
        delete this.hooks[stage]
      }
    }
    if (errors.length) {
      this.reportError(
        new AggregateError(errors, 'Lifecycle hook "' + stage + '" execution failed'),
        `hook:${stage}`
      )
    }
  }
  public async prepare(): Promise<void> {
    const hooks = this.hooks[LifecycleStage.prepare]
    if (!hooks) return void 0
    const errors: unknown[] = []
    const promises: Promise<unknown>[] = []
    for (const hook of hooks) {
      try {
        const result = hook.call(this.publicInstance)
        if (isPromise(result)) promises.push(result)
      } catch (e) {
        errors.push(e)
      }
    }
    if (!__DEV__) {
      delete this.hooks[LifecycleStage.prepare]
    }
    // 处理错误
    if (errors.length) {
      this.reportError(
        new AggregateError(errors, 'Lifecycle hook "prepare" execution failed'),
        'hook:prepare'
      )
    }
    if (promises.length) {
      const suspense = findSuspense(this)
      try {
        if (suspense) suspense.value++
        await Promise.all(promises)
      } catch (e) {
        this.reportError(e, 'hook:prepare')
      } finally {
        if (suspense) suspense.value--
      }
    }
  }
}
