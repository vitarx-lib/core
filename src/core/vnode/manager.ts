import { type ChildVNode, isRefEl, type VNode, type WidgetVNode } from './types.js'
import {
  _createFnWidget,
  type FnWidgetConstructor,
  isClassWidget,
  Widget
} from '../widget/index.js'
import { createScope } from '../scope/index.js'
import { getContext, runContext } from '../context/index.js'
import { _proxyWidgetInstanceProps } from './internal.js'

type InstanceCreatedCallback = (instance: Widget) => void

/**
 * vnode节点关系管理器
 *
 * @internal
 */
export class VNodeManager {
  static #contextSymbol = Symbol('VNodeRelationalManagerContextSymbol')
  // 父vnode映射
  static #parentVNodeMapping = new WeakMap<ChildVNode, VNode>()
  // 卸载回调集合
  static #unmountListens = new WeakMap<ChildVNode, Set<AnyCallback>>()

  /**
   * 当前正在实例的Widget节点
   */
  static get currentVNode(): WidgetVNode | undefined {
    return getContext<WidgetVNode>(VNodeManager.#contextSymbol)
  }

  /**
   * 创建widget节点实例
   *
   * @param {WidgetVNode} vnode - widget节点
   * @param {InstanceCreatedCallback} [callback] - 需要在实例创建完成后执行的回调(可选)
   * @return {Required<WidgetVNode>} - 已创建instance的节点
   * @returns {Widget} - 实例
   * @internal 框架核心方法，请勿外部调用！
   */
  static createWidgetVNodeInstance<T extends WidgetVNode>(
    vnode: T,
    callback?: InstanceCreatedCallback
  ): Widget {
    if (import.meta.env?.MODE === 'development' && typeof window !== 'undefined') {
      // 获取最新模块，避免未渲染的节点引用到旧模块，已渲染的节点会由 hmr 替换为最新模块
      const newModule = (window as any).__$VITARX_HMR$__?.replaceNewModule?.(vnode.type)
      if (newModule) vnode.type = newModule
    }
    // 创建作用域
    const scope = createScope({
      name: vnode.type.name,
      errorHandler: (e: unknown) => {
        vnode.instance?.['reportError'](e, {
          source: 'listener',
          instance: vnode.instance
        })
      }
    })
    scope.run(() => {
      // 将当前节点提供到上下文
      runContext(VNodeManager.#contextSymbol, vnode, () => {
        // 包装props为响应式对象
        vnode.props = _proxyWidgetInstanceProps(vnode.props)
        // 异步实例
        if (isClassWidget(vnode.type)) {
          vnode.instance = new vnode.type(vnode.props)
        } else {
          vnode.instance = _createFnWidget(vnode as WidgetVNode<FnWidgetConstructor>)
        }
        if (isRefEl(vnode.ref)) vnode.ref.value = vnode.instance!
        // 如果存在回调则调用
        callback?.call(null, vnode.instance!)
      })
    })
    return vnode.instance!
  }

  /**
   * 更新父节点映射
   *
   * @param vnode
   * @param parent
   */
  static updateParentVNodeMapping(vnode: ChildVNode, parent: VNode): void {
    this.#parentVNodeMapping.set(vnode, parent)
  }

  /**
   * 查找父节点
   *
   * @param {vnode} vnode - 自身虚拟节点对象
   * @return {VNode|undefined} - 如果存在父节点则返回父节点的VNode对象
   */
  static findParentVNode(vnode: ChildVNode): VNode | undefined {
    return this.#parentVNodeMapping.get(vnode)
  }

  /**
   * 监听任意节点销毁
   *
   * @param vnode - vnode
   * @param cb - 回调
   */
  static onDestroyed(vnode: ChildVNode, cb: VoidCallback) {
    if (!this.#unmountListens.has(vnode)) {
      this.#unmountListens.set(vnode, new Set())
    }
    this.#unmountListens.get(vnode)!.add(cb)
  }

  /**
   * 销毁节点
   *
   * 框架内部核心方法，请勿外部调用！
   *
   * @param vnode - vnode
   * @internal
   */
  static destroyVNode(vnode: ChildVNode) {
    const listens = this.#unmountListens.get(vnode)
    if (listens) {
      listens.forEach(cb => cb())
      listens.clear()
      this.#unmountListens.delete(vnode)
    }
  }
}

/**
 * 获取当前小部件实例所关联的虚拟节点
 *
 * 此函数存在的意义是提供给框架核心使用，不建议开发者对虚拟节点进行任何操作。
 *
 * > 注意：如果是类小部件内部获取当前虚拟节点，使用`this.vnode`即可访问，
 * Widget基类已在构造函数中将vnode进行保存，所以你可以在类中通过this.vnode得到当前实例所关联的节点。
 *
 * @example
 * ```tsx
 * import { getCurrentVNode } from 'vitarx'
 *
 * // 函数式小部件中获取节点
 * export function Foo() {
 *  const vnode = getCurrentVNode()!;
 *  console.log(vnode.type === Foo); // true
 *  return <div>foo</div>;
 * }
 *
 * // 类小部件中获取当前节点示例
 * export class Bar extends Widget {
 *    build(){
 *      // 在build方法中不能使用getCurrentVNode获取，因为只有在构建实例阶段才能获取到vnode，此时已进入构建视图阶段
 *      const vnode = getCurrentVNode();  // ❌
 *      // 可以直接通过this.vnode拿到节点
 *      const vnode = this.vnode; // ✅
 *      return <div>bar</div>
 *    }
 * }
 * ```
 * @returns {WidgetVNode|undefined} 当前小部件的虚拟节点，返回`undefined`代表着你未按规范使用！
 * @alias useCurrentVNode
 * @see {@linkcode VNodeManager.currentVNode}
 */
export function getCurrentVNode(): WidgetVNode | undefined {
  return VNodeManager.currentVNode
}

export { getCurrentVNode as useCurrentVNode }

/**
 * 查找父节点
 *
 * @internal 内部核心函数
 * @param {vnode} vnode - 自身虚拟节点对象
 * @return {VNode|undefined} - 如果存在父节点则返回父节点的VNode对象
 */
export function findParentVNode(vnode: ChildVNode): VNode | undefined {
  return VNodeManager.findParentVNode(vnode)
}

/**
 * 更新父节点映射
 *
 * @internal 内部核心函数
 * @param {ChildVNode} vnode - 虚拟节点对象
 * @param {VNode} parent - 父节点对象
 */
export function updateParentVNodeMapping(vnode: ChildVNode, parent: VNode): void {
  VNodeManager.updateParentVNodeMapping(vnode, parent)
}

/**
 * 创建widget节点实例
 *
 * @internal 内部核心函数
 * @param {WidgetVNode} vnode - widget节点
 * @param {InstanceCreatedCallback} [callback] - 需要在实例创建完成后执行的回调(可选)
 * @return {Required<WidgetVNode>} - 已创建instance的节点
 * @returns {Widget} - 实例
 */
export function createWidgetVNodeInstance<T extends WidgetVNode>(
  vnode: T,
  callback?: InstanceCreatedCallback
): Widget {
  return VNodeManager.createWidgetVNodeInstance(vnode, callback)
}

/**
 * 监听任意节点销毁
 *
 * @param {ChildVNode} vnode - vnode
 * @param {VoidCallback} cb - 回调
 */
export function onVNodeDestroyed(vnode: ChildVNode, cb: VoidCallback) {
  VNodeManager.onDestroyed(vnode, cb)
}
