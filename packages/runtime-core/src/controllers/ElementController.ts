import { callDirHook } from '../directive/index.js'
import { useRenderer } from '../renderer/index.js'
import type {
  AnyProps,
  ElementVNode,
  ElementVNodeType,
  HostElements,
  HostNodeElements,
  HostVNode,
  NodeElementType,
  OpsType
} from '../types/index.js'
import { HostNodeController } from './HostNodeController.js'

/**
 * ElementController 是一个抽象控制器类，用于管理 DOM 元素的生命周期和属性更新。
 * 它继承自 HostNodeController，专门处理元素节点的渲染、挂载、卸载等操作。
 *
 * 核心功能：
 * - 属性更新：处理元素属性的添加、修改和删除
 * - 生命周期管理：管理元素的创建、挂载和卸载过程
 * - 指令钩子调用：在适当的时机调用指令的生命周期钩子
 *
 * @template T - 元素虚拟节点类型，继承自 ElementVNodeType
 *
 * @example
 * ```typescript
 * // 创建自定义元素控制器
 * class MyElementController extends ElementController<MyElementVNode> {
 *   // 实现具体的渲染逻辑
 * }
 *
 * // 使用控制器
 * const controller = new MyElementController();
 * const vnode = createVNode('div', { id: 'app' });
 * const element = controller.render(vnode);
 * ```
 *
 * @extends HostNodeController<T>
 *
 * @remarks
 * - 这是一个抽象类，需要通过继承来使用
 * - 控制器会自动处理指令的生命周期钩子
 * - 属性更新时会自动处理新旧值的比较
 */
export abstract class ElementController<T extends ElementVNodeType> extends HostNodeController<T> {
  /**
   * @inheritDoc
   */
  override updateProps(node: ElementVNode<T>, newProps: AnyProps): void {
    const oldProps = node.props
    const el = node.el! as HostElements
    const dom = useRenderer()
    // 删除不存在于 newProps 中的属性
    for (const key in oldProps) {
      if (!(key in newProps)) {
        const oldValue = oldProps[key]
        delete oldProps[key]
        dom.removeAttribute(el, key, oldValue)
      }
    }
    // 新增或更新存在于 newProps 中的属性
    for (const key in newProps) {
      const newValue = newProps[key]
      const oldValue = oldProps[key]
      if (newValue !== oldValue) {
        oldProps[key] = newValue
        dom.setAttribute(el, key, newValue, oldValue)
      }
    }
  }
  /**
   * @inheritDoc
   */
  override render(node: HostVNode<T>): NodeElementType<T> {
    if (node.el) {
      this.dom.setAttributes(node.el! as HostElements, node.props)
    }
    const el = super.render(node)
    callDirHook(node, 'created')
    return el
  }
  /**
   * @inheritDoc
   */
  override mount(node: HostVNode<T>, target?: HostNodeElements, opsType?: OpsType) {
    callDirHook(node, 'beforeMount')
    super.mount(node, target, opsType)
    callDirHook(node, 'mounted')
  }
  /**
   * @inheritDoc
   */
  override unmount(node: ElementVNode<T>) {
    callDirHook(node, 'beforeUnmount')
    const el = node.el! as HostElements
    super.unmount(node)
    callDirHook(node, 'unmounted', el)
  }
  /**
   * @inheritDoc
   */
  protected createElement(node: HostVNode<T>): NodeElementType<T> {
    return this.dom.createElement(node) as NodeElementType<T>
  }
}
