import type {
  AnyProps,
  ElementNode,
  ElementNodeType,
  ElementOf,
  HostElements,
  HostNodeElements,
  OpsType
} from '@vitarx/runtime-core'
import { invokeDirHook } from '@vitarx/runtime-core'
import { BaseHostNodeDriver } from './BaseHostNodeDriver.js'

/**
 * 元素驱动器抽象基类
 *
 * 负责管理元素节点的属性更新和指令钩子调用。
 * 提供统一的元素属性更新逻辑，包括属性添加、修改和删除。
 *
 * 核心功能：
 * - 元素属性的 diff 和更新
 * - 在适当的生命周期阶段调用指令钩子
 * - 与 HostRenderer 交互处理属性操作
 *
 * @template T - 元素节点类型，继承自 ElementNodeType
 */
export abstract class BaseElementDriver<T extends ElementNodeType> extends BaseHostNodeDriver<T> {
  /**
   * @inheritDoc
   */
  protected override afterRender(node: ElementNode<T>): void {
    invokeDirHook(node, 'created')
  }

  /**
   * @inheritDoc
   */
  protected override beforeMount(
    node: ElementNode<T>,
    _target?: HostNodeElements,
    _opsType?: OpsType
  ): void {
    invokeDirHook(node, 'beforeMount')
  }

  /**
   * @inheritDoc
   */
  protected override afterMount(
    node: ElementNode<T>,
    _target?: HostNodeElements,
    _opsType?: OpsType
  ): void {
    invokeDirHook(node, 'mounted')
  }

  /**
   * @inheritDoc
   */
  protected override beforeUnmount(node: ElementNode<T>): void {
    invokeDirHook(node, 'beforeUnmount')
  }

  /**
   * @inheritDoc
   */
  protected override afterUnmount(node: ElementNode<T>): void {
    const el = node.el! as HostElements
    invokeDirHook(node, 'unmounted', el)
  }

  /**
   * @inheritDoc
   */
  protected override doUpdateProps(node: ElementNode<T>, newProps: AnyProps): void {
    const oldProps = node.props
    const el = node.el! as HostElements
    const dom = this.dom

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
  protected override createElement(node: ElementNode<T>): ElementOf<T> {
    return this.dom.createElement(node) as ElementOf<T>
  }
}
