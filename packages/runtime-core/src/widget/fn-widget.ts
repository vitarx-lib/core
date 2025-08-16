import { withAsyncContext } from '@vitarx/responsive'
import { isPromise } from '@vitarx/utils'
import {
  type BuildVNode,
  createVNode,
  type FunctionWidget,
  VNode,
  WidgetType,
  WidgetVNode
} from '../vnode'
import { __WIDGET_INTRINSIC_KEYWORDS__ } from './constant'
import { HookCollector, type HookCollectResult } from './hook'
import { LifecycleHookMethods } from './types'
import { Widget } from './widget'

/**
 * 初始化函数组件的标识符
 */
const __INITIALIZE_FN_WIDGET__ = Symbol('__INITIALIZE_FN_WIDGET__')

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
 * ```typescript
 * const widget = new FnWidget();
 * await widget[__INITIALIZE_FN_WIDGET__](data);
 * ```
 *
 * 构造函数参数：
 * - 无需直接实例化，通过调用 __INITIALIZE_FN_WIDGET__ 方法进行初始化
 *
 * @param data - 初始化数据对象，包含以下属性：
 *   - exposed: 需要暴露到实例的属性和方法
 *   - lifeCycleHooks: 生命周期钩子集合
 *   - build: 构建函数，可以是函数、VNode、Promise或包含default导出的对象
 *
 * 注意事项：
 * - build 属性支持多种类型，但必须是 VNode、返回 VNode 的函数、Promise<{ default: 函数组件/类组件 }> 或 null
 * - 如果 build 是 Promise，会自动处理异步情况
 * - 内部关键字（__WIDGET_INTRINSIC_KEYWORDS__）不会被注入到实例中
 *
 * @template T - 组件属性类型，继承自 Widget 基类
 */
class FnWidget extends Widget<Record<string, any>> {
  /**
   * 初始化函数小部件
   *
   * @param data
   */
  async [__INITIALIZE_FN_WIDGET__](data: HookCollectResult): Promise<FnWidget> {
    // 注入暴露的属性和方法
    this.#injectExposed(data.exposed)
    const exposedCount = Object.keys(data.exposed).length
    // 注入生命周期钩子到实例中
    this.#injectLifeCycleHooks(data.lifeCycleHooks)
    const hookCount = Object.keys(data.lifeCycleHooks).length
    let build: BuildVNode | VNode | null | { default: WidgetType } = data.build as BuildVNode
    if (isPromise(data.build)) {
      try {
        build = await withAsyncContext(data.build as Promise<BuildVNode>)
      } catch (e) {
        // 让build方法抛出异常
        build = () => {
          throw e
        }
      } finally {
        this.#setBuild(build)
        // 如果有新增钩子则重新注入生命周期钩子
        if (hookCount !== Object.keys(data.lifeCycleHooks).length) {
          this.#injectLifeCycleHooks(data.lifeCycleHooks)
        }
        // 如果组件有新增暴露的属性和方法，则重新注入到实例中
        if (exposedCount !== Object.keys(data.exposed).length) {
          this.#injectExposed(data.exposed)
        }
      }
    }
    return this
  }

  /**
   * @inheritDoc
   */
  override build(): VNode | null {
    return null
  }

  /**
   * 初始化函数小部件
   *
   * @param {BuildVNode} build - 构建函数
   * @private
   */
  #setBuild(build: BuildVNode | VNode | null | { default: WidgetType }) {
    // 如果是函数，则直接赋值给build方法
    if (typeof build === 'function') {
      this.build = build
      return
    }
    // 如果是vnode，则让build方法返回节点
    if (VNode.is(build)) {
      this.build = () => build
      return
    }
    if (build === null) return
    // 如果是module对象，则判断是否存在default导出
    if (typeof build === 'object' && 'default' in build! && typeof build.default === 'function') {
      this.build = () => createVNode(build.default, this.props)
      return
    }
    // 如果不符合要求，则在build方法中抛出异常
    this.build = () => {
      throw new Error(
        `[Vitarx.FnWidget]：函数组件的返回值必须是VNode、()=>VNode、Promise<{ default: 函数组件/类组件 }>、null，实际返回的却是${typeof build}`
      )
    }
  }

  /**
   * 注入生命周期钩子到实例中
   *
   * @param lifeCycleHooks
   */
  #injectLifeCycleHooks(lifeCycleHooks: HookCollectResult['lifeCycleHooks']) {
    for (const lifeCycleHook in lifeCycleHooks) {
      const k = lifeCycleHook as LifecycleHookMethods
      this[k] = lifeCycleHooks[k]
    }
  }

  /**
   * 将暴露的属性和方法注入到实例中
   *
   * @param exposed
   */
  #injectExposed(exposed: HookCollectResult['exposed']) {
    for (const exposedKey in exposed || {}) {
      if (__WIDGET_INTRINSIC_KEYWORDS__.includes(exposedKey as any)) continue
      if (!(exposedKey in this)) (this as any)[exposedKey] = exposed[exposedKey]
    }
  }
}

/**
 * ## 创建函数小部件实例
 *
 * 内部函数，仅供框架内部逻辑使用。
 *
 * @internal
 * @param vnode
 */
export function _createFnWidget(vnode: WidgetVNode<FunctionWidget>): {
  instance: FnWidget
  init: Promise<FnWidget>
} {
  const instance = new FnWidget(vnode.props)
  const result = HookCollector.collect(vnode)
  return {
    instance,
    init: instance[__INITIALIZE_FN_WIDGET__](result)
  }
}
