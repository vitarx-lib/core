import { isRefSignal, markRaw } from '@vitarx/responsive'
import { DomHelper } from '../../dom/index.js'
import { isElementVNode } from '../guards.js'
import { isRefEl } from '../ref.js'
import { type ClassProperties, HTMLNodeElementName, RuntimeElement } from '../types/index.js'
import { ContainerVNode } from './container.js'

const NAMESPACE_URI = {
  svg: 'http://www.w3.org/2000/svg',
  html: 'http://www.w3.org/1999/xhtml'
}
/**
 * ElementVNode 类表示一个元素类型的虚拟节点（Virtual Node），用于在虚拟DOM中表示HTML或SVG元素。
 * 它继承自VNode类，并扩展了元素特有的功能，如DOM元素的创建、属性设置和子节点渲染。
 *
 * 核心功能：
 * - 提供DOM元素的延迟创建和访问机制
 * - 支持HTML和SVG元素的创建和渲染
 * - 自动处理元素属性设置
 * - 支持子节点的渲染和管理
 *
 * 使用示例：
 * ```typescript
 * // 创建一个div元素虚拟节点
 * const divVNode = new ElementVNode('div', { id: 'example' }, [
 *   new TextVNode('Hello, World!')
 * ]);
 *
 * // 访问DOM元素（此时会自动创建）
 * const element = divVNode.element;
 * ```
 *
 * 构造函数参数：
 * - T: 泛型参数，限制元素名称必须是有效的HTML或SVG元素名
 * - type: 元素类型（如'div', 'span', 'svg'等）
 * - props: 元素属性对象
 *
 * 使用限制：
 * - 在非浏览器环境中使用可能会出错，因为依赖DOM API
 * - SVG元素的创建会自动处理命名空间，无需手动指定
 *
 * @template T - 元素名称类型，必须是有效的HTML或SVG元素名
 */
export class ElementVNode<
  T extends HTMLNodeElementName = HTMLNodeElementName
> extends ContainerVNode<T> {
  /**
   * 运行时元素实例
   * 这是一个私有属性，用于存储DOM元素的引用
   */
  #element: RuntimeElement<T> | null = null

  override render(): RuntimeElement<T> {
    // 检查元素是否已创建，若未创建则进行创建
    if (!this.#element) {
      // 根据是否为SVG元素创建对应的DOM元素
      const element = // 判断是否为SVG虚拟节点，如果是则使用SVG命名空间创建元素
        document.createElementNS(
          ElementVNode.isSvgVNode(this) ? NAMESPACE_URI.svg : NAMESPACE_URI.html,
          this.type
        ) as RuntimeElement<T>
      // 将元素标记为不可代理
      this.#element = markRaw(element)
      // 如果元素能够设置属性，则设置属性
      if (Object.keys(this.props).length) {
        DomHelper.setAttributes(this.#element, this.props)
      }
      // 绑定ref
      if (isRefEl(this.ref)) this.ref.value = this.#element
      this.renderChildren()
    }
    return this.#element
  }

  /**
   * @inheritDoc
   */
  override unmount(root: boolean = true): void {
    for (const child of this.children) {
      child.unmount(false)
    }
    if (root) {
      DomHelper.remove(this.element)
      this.removeShadowElement()
    } else if (this.teleport) {
      DomHelper.remove(this.element)
    }
  }

  /**
   * 判断是否为svg节点
   * 该方法用于判断给定的虚拟节点是否属于SVG元素，通过检查节点类型和命名空间

   *
   * @param vnode - ElementVNode 需要检查的虚拟节点
   * @returns {boolean} - 如果是svg节点则返回true，否则返回false
   */
  static isSvgVNode(vnode: ElementVNode): boolean {
    // 检查当前节点是否直接声明为SVG命名空间或是svg标签
    if (vnode.props.xmlns === NAMESPACE_URI.svg || vnode.type === 'svg') return true

    // 如果当前节点不是SVG，则检查其父节点
    let parent = this.findParentVNode(vnode)
    while (parent) {
      // 检查父节点是否为SVG命名空间或svg标签
      if (parent.props.xmlns === NAMESPACE_URI.svg || parent.type === 'svg') return true
      // 继续向上查找父节点
      parent = this.findParentVNode(parent)
    }

    // 如果没有找到任何SVG命名空间或svg标签，返回false
    return false
  }
  /**
   * 判断给定的值是否为元素类型的虚拟节点
   *
   * @param val - 要检测的变量
   * @returns {boolean} 如果是元素类型的虚拟节点则返回true，否则返回false
   */
  static override is(val: any): val is ElementVNode {
    return isElementVNode(val)
  }
  /**
   * @inheritDoc
   */
  protected override propsHandler() {
    super.propsHandler()
    // 如果是字符串标签，格式化一次value，使值Ref对象能够被依赖跟踪
    // 解包ref
    for (const prop in this.props) {
      let value = this.props[prop]
      while (isRefSignal(value)) value = value.value
      // 将格式化过后的值赋值回去
      this.props[prop] = value
    }
    // 处理 class 属性
    let cssClass: ClassProperties =
      'class' in this.props
        ? DomHelper.cssClassValueToArray(this.props.class as ClassProperties)
        : []
    if ('className' in this.props) {
      cssClass = DomHelper.mergeCssClass(cssClass, this.props.className as ClassProperties)
      // @ts-ignore
      delete this.props.className
    }
    if ('classname' in this.props) {
      cssClass = DomHelper.mergeCssClass(cssClass, this.props.classname)
      delete this.props.classname
    }
    // 如果合并后的 class 存在，赋值给 newProps.class
    if (cssClass.length > 0) this.props.class = cssClass
  }
}
