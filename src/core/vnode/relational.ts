import { type ChildVNode, isRefEl, type VNode, type WidgetVNode } from './type.js'
import {
  createFnWidget,
  type FnWidgetConstructor,
  isClassWidgetConstructor
} from '../widget/index.js'
import { reactive } from '../responsive/index.js'
import { createScope } from '../scope/index.js'
import { getContext, setContext } from '../context/index.js'

/**
 * vnode节点关系管理器
 *
 * @internal
 */
class RelationalManager {
  static #contextSymbol = Symbol('RelationalManagerContextSymbol')
  // 单例
  static #instance: RelationalManager
  // 父vnode映射
  #parentVNodeMapping = new WeakMap<ChildVNode, VNode>()

  /**
   * 获取单例
   */
  static get instance(): RelationalManager {
    if (!this.#instance) {
      this.#instance = new RelationalManager()
    }
    return this.#instance
  }

  /**
   * 当前正在实例的Widget节点
   */
  get currentVNode(): WidgetVNode | undefined {
    return getContext<WidgetVNode>(RelationalManager.#contextSymbol)
  }

  /**
   * 创建widget节点实例
   *
   * @param {WidgetVNode} vnode - widget节点
   * @return {Required<WidgetVNode>} - 已创建instance的节点
   */
  createWidgetVNodeInstance<T extends WidgetVNode>(
    vnode: T
  ): MakeRequired<WidgetVNode, 'instance' | 'el'> {
    createScope().run(() => {
      const restoreContext = setContext(RelationalManager.#contextSymbol, vnode)
      try {
        // 包装props为响应式对象
        vnode.props = reactive(vnode.props, false)
        vnode.instance = isClassWidgetConstructor(vnode.type)
          ? new vnode.type(vnode.props)
          : createFnWidget(vnode as WidgetVNode<FnWidgetConstructor>)
        if (isRefEl(vnode.ref)) vnode.ref.value = vnode.instance
      } finally {
        restoreContext()
      }
    })
    return vnode as MakeRequired<WidgetVNode, 'instance' | 'el'>
  }

  /**
   * 更新父节点映射
   *
   * @param vnode
   * @param parent
   */
  updateParentVNodeMapping(vnode: ChildVNode, parent: VNode): void {
    this.#parentVNodeMapping.set(vnode, parent)
  }

  /**
   * 查找父节点
   *
   * @param {vnode} vnode - 自身虚拟节点对象
   * @return {VNode|undefined} - 如果存在父节点则返回父节点的VNode对象
   */
  findParentVNode(vnode: ChildVNode): VNode | undefined {
    return this.#parentVNodeMapping.get(vnode)
  }
}

/**
 * 获取当前小部件的虚拟节点
 *
 * > 注意：如果是类小部件内部获取当前虚拟节点，则使用`this.vnode`即可访问，
 * 只有在Widget类构造函数中调用getCurrentVNode()才能获取当前小部件自身的vnode，Widget基类已在构造函数将vnode进行保存，所以你可以在类中通过this.vnode得到当前实例所关联的节点。
 *
 * @example
 * ```tsx
 * import { getCurrentVNode } from 'vitarx'
 *
 * export function Foo() {
 *  const vnode = getCurrentVNode();
 *  console.log(vnode.instance); // 输出 undefined，因为此时正在解析函数小部件，还未映射为FnWidget实例。
 *  onCreated(() => {
 *    // 不要在非顶层作用域中调用 getCurrentVNode() ，它会返回`undefined`，就算返回的是VNode对象，它也不属于当前小部件
 *    console.log(getCurrentVNode()); // 输出 undefined
 *    // 此时可以获取到函数小部件的实例
 *    console.log(vnode.instance); // 输出 FnWidget
 *  });
 *  return <div>foo</div>;
 * }
 *
 * // 类小部件中获取当前节点示例
 * export class Bar extends Widget {
 *    build(){
 *      const vnode = getCurrentVNode();// 这是错误的
 *      const vnode = this.vnode; // 这是正确的
 *      return <div>bar</div>
 *    }
 * }
 * ```
 * @returns {WidgetVNode|undefined} 当前小部件的虚拟节点，返回`undefined`代表着你未按规范使用！
 * @see {@link RelationalManager.currentVNode}
 */
export function getCurrentVNode(): WidgetVNode | undefined {
  return RelationalManager.instance.currentVNode
}

/**
 * 查找父节点
 *
 * @param {vnode} vnode - 自身虚拟节点对象
 * @return {VNode|undefined} - 如果存在父节点则返回父节点的VNode对象
 */
export function findParentVNode(vnode: ChildVNode): VNode | undefined {
  return RelationalManager.instance.findParentVNode(vnode)
}

/**
 * 更新父节点映射
 *
 * @param vnode
 * @param parent
 */
export function updateParentVNodeMapping(vnode: ChildVNode, parent: VNode): void {
  RelationalManager.instance.updateParentVNodeMapping(vnode, parent)
}

/**
 * 创建widget节点实例
 *
 * @param vnode
 * @returns {MakeRequired<WidgetVNode,'instance'|'el'>} - 已创建instance的节点
 */
export function createWidgetVNodeInstance<T extends WidgetVNode>(
  vnode: T
): MakeRequired<WidgetVNode, 'instance' | 'el'> {
  return RelationalManager.instance.createWidgetVNodeInstance(vnode)
}
