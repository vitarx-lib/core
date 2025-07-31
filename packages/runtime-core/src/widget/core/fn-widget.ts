import { withAsyncContext } from '@vitarx/responsive'
import { isPromise } from '@vitarx/utils'
import { createVNode } from '../../vnode/core/creation'
import { isVNode, type VNode, type WidgetVNode } from '../../vnode/index'
import type {
  AnyProps,
  BuildVNode,
  FunctionWidget,
  LifecycleHookMethods,
  WidgetType
} from '../types/index'
import {
  __INITIALIZE_FN_WIDGET__,
  __WIDGET_INTRINSIC_KEYWORDS__,
  __WIDGET_INTRINSIC_PROPERTY_KEYWORDS__
} from './constant'
import { HookCollector, type HookCollectResult } from './manager/hooks'
import { Widget } from './widget'

/**
 * 函数小部件实例
 *
 * 不要单独使用该小部件，内部会自动会为函数式小部件创建`FnWidget`实例
 *
 * @internal
 */
class FnWidget extends Widget<AnyProps> {
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
  protected build(): VNode | null {
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
    if (isVNode(build)) {
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
      if (__WIDGET_INTRINSIC_PROPERTY_KEYWORDS__.includes(exposedKey as any)) continue
      if (!(exposedKey in this)) (this as any)[exposedKey] = exposed[exposedKey]
    }
  }
}

/**
 * 暴露函数组件的内部方法或变量，供外部使用。
 *
 * 它们会被注入到`FnWidget`实例中，注意`this`指向！
 *
 * @example
 * ```ts
 * import { defineExpose,ref } from 'vitarx'
 *
 * function Foo() {
 *  const count = ref(0);
 *  const add = () => count.value++;
 *  // 暴露 count 和 add
 *  defineExpose({ count, add });
 *  return <div onClick={add}>{count.value}</div>;
 * }
 * ```
 *
 * 注意：键不能和{@link Widget}类中固有属性或方法重名，包括但不限于`props`，`build`...
 * (所有保留关键词：{@linkcode __WIDGET_INTRINSIC_KEYWORDS__})
 *
 * @param {Record<string, any>} exposed 键值对形式的对象，其中键为暴露的名称，值为要暴露的值。
 */
export function defineExpose(exposed: Record<string, any>): void {
  for (const exposedKey in exposed) {
    if (__WIDGET_INTRINSIC_KEYWORDS__.includes(exposedKey as any)) {
      console.warn(
        `[Vitarx.defineExpose]：${exposedKey} is an internal reserved keyword in the Widget class, please modify.`
      )
    }
  }
  HookCollector.addExposed(exposed)
}

/**
 * ## 创建函数小部件实例
 *
 * 内部函数，仅供框架内部逻辑使用。
 *
 * @internal
 * @param vnode
 */
export function _createFnWidget(vnode: WidgetVNode<FunctionWidget>): Promise<FnWidget> {
  const instance = new FnWidget(vnode.props)
  vnode.instance = instance
  const result = HookCollector.collect(
    vnode as MakeRequired<WidgetVNode<FunctionWidget>, 'instance'>
  )
  return instance[__INITIALIZE_FN_WIDGET__](result)
}
