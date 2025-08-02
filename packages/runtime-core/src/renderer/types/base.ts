import type { EventOptions } from './event'
import type { ElementProperties } from './properties'

/**
 * 元素标签映射类型
 */
type ElementTagMap = HTMLElementTagNameMap &
  Pick<SVGElementTagNameMap, Exclude<keyof SVGElementTagNameMap, keyof HTMLElementTagNameMap>>

/**
 * 自闭合的元素
 *
 * 表示没有子节点的元素，如img、area、input等
 *
 * @extends RuntimeChildlessElement
 */
export type SingleNodeElementName =
  | 'img'
  | 'area'
  | 'input'
  | 'br'
  | 'hr'
  | 'link'
  | 'meta'
  | 'base'
  | 'source'
  | 'track'
  | 'col'
  | 'embed'
  | 'param'
  | 'wbr'

/**
 * 无标签元素名称
 */
export type NoTagNodeElementName = 'comment-node' | 'text-node'
/**
 * 片段节点元素名称
 */
export type FragmentNodeElementName = 'fragment-node'
/**
 * 固有的元素标签名
 *
 * 包含了所有HTML元素标签名，如div、span、a等元素
 */
export type IntrinsicNodeElementName = keyof ElementTagMap
/**
 * 容器元素
 */
export type ContainerNodeElementName = Exclude<IntrinsicNodeElementName, SingleNodeElementName>
/**
 * 特殊元素
 */
export type SpecialNodeElementName = NoTagNodeElementName | FragmentNodeElementName
/**
 * 所有元素
 *
 * 包含了所有元素，如div、span、a等元素，以及特殊元素如注释节点、文本节点、片段节点等
 */
export type AllNodeElementName =
  | IntrinsicNodeElementName
  | SpecialNodeElementName
  | FragmentNodeElementName
  | NoTagNodeElementName
/**
 * 特殊元素节点映射
 */
export type SpecialNodeElement = {
  [K in SpecialNodeElementName]: { children: K extends NoTagNodeElementName ? string : any }
}
/**
 * ## 固有元素节点映射，用于 jsx ide 提示
 *
 * Vitarx 在解析元素属性时遵循`W3C`标准语法，元素的属性和在html中编写是一致的，但有以下不同之处。
 *
 * 1. style属性接受对象和字符串，对象会自动转为字符串。
 * 2. class属性接受字符串、数组和对象，对象和数组都会自动转为字符串。
 * 3. 绑定事件支持多种语法，事件名称不区分大小写，示例如下：
 *    - `W3C`标准语法，如onclick。
 *    - 小驼峰式语法，如onClick。
 */
export type IntrinsicNodeElement = {
  [K in IntrinsicNodeElementName]: ElementProperties<ElementTagMap[K]>
}
export type AllNodeElement = IntrinsicNodeElement & SpecialNodeElement
export type NodeElement<T extends AllNodeElementName = AllNodeElementName> = AllNodeElement[T]

/**
 * 运行时元素接口
 *
 * 表示运行时元素的基本接口，包括父元素、文本内容、节点值、移除元素等方法。
 */
interface BaseRuntimeElement {
  /**
   * 当前元素的父元素
   *
   * 表示当前元素所属的父容器元素。如果当前节点是根节点（如document.body），则该值为null
   *
   * @readonly 只读属性，不可直接修改
   */
  readonly parentElement: RuntimeContainerElement | null
  /**
   * 当前元素的下一个兄弟元素
   *
   * 如果当前元素是最后一个子元素，则该值为null
   * @readonly 只读属性，不可直接修改
   */
  readonly nextSibling: RuntimeElement | null
  /**
   * 节点的文本内容
   * @readonly 只读属性，通过setText方法修改
   * @type {string} 文本内容
   * @description 获取或设置节点的文本内容。对于文本节点，返回实际文本；对于元素节点，返回所有子节点的文本内容的连接
   * @example
   * // 获取节点文本
   * const text = node.textContent;
   */
  textContent: string | null
  /**
   * 节点的值
   */
  nodeValue: string | null

  /**
   * 移除当前元素
   *
   * @description 从树中删除当前元素
   */
  remove(): void

  /**
   * 其他属性
   */
  [key: string | symbol]: any
}
/**
 * 常规元素基本功能接口
 */
interface BaseRuntimeConventionElement extends BaseRuntimeElement {
  /**
   * 设置元素的属性值
   *
   * @param {string} name - 属性名
   * @param {any} value - 属性值
   * @returns {void}
   * @description 设置或更新元素的指定属性。如果属性已存在则更新其值，不存在则创建新属性
   * @example
   * // 设置class属性
   * element.setAttribute("class", "my-class");
   */
  setAttribute(name: string, value: any): void

  /**
   * 获取元素的属性值
   *
   * @param {string} name - 属性名
   * @returns {any} 属性值，如果属性不存在则返回null
   * @description 获取元素指定属性的值
   * @example
   * // 获取id属性
   * const id = element.getAttribute("id");
   */
  getAttribute(name: string): any

  /**
   * 移除元素的指定属性
   *
   * @param {string} name - 要移除的属性名
   * @returns {void}
   * @description 移除元素的指定属性。如果属性不存在，则此操作无效
   * @example
   * // 移除style属性
   * element.removeAttribute("style");
   */
  removeAttribute(name: string): void

  /**
   * 为元素添加事件监听器
   *
   * @param {string} name - 事件名称
   * @param {Function} handler - 事件处理函数
   * @param {object} [options] - 事件监听器的配置选项
   * @property {boolean} [options.capture=false] - 是否在捕获阶段触发事件监听器
   * @property {boolean} [options.once=false] - 是否只触发一次事件监听器
   * @property {boolean} [options.passive=false] - 是否使用passive模式注册事件监听器
   * @returns {void}
   * @description 为元素添加指定类型的事件监听器
   * @example
   * // 添加点击事件监听器
   * element.addEventListener("click", (e) => console.log("clicked"), { capture: true });
   */
  addEventListener(name: string, handler: AnyFunction, options?: EventOptions): void

  /**
   * 移除元素的事件监听器
   *
   * @param {string} name - 事件名称
   * @param {Function} handler - 要移除的事件处理函数
   * @param {boolean} useCapture - 是否使用捕获阶段移除事件监听器
   * @returns {void}
   * @description 移除元素上指定的事件监听器
   * @example
   * // 移除点击事件监听器
   * element.removeEventListener("click", clickHandler);
   */
  removeEventListener(name: string, handler: AnyFunction, useCapture?: boolean): void
}

/**
 * 容器元素基本功能接口
 */
interface BaseRuntimeContainerElement extends BaseRuntimeConventionElement {
  /**
   * 当前元素包含的所有子节点列表
   *
   * @readonly 只读属性，不可直接修改
   * @description 包含当前元素的所有直接子节点。子节点可以是元素节点、文本节点或注释节点
   * @example
   * // 遍历所有子节点
   * element.children.forEach(child => console.log(child.tagName));
   */
  readonly children: RuntimeElement[]
  /**
   * Returns the last child.
   */
  readonly lastChild: RuntimeElement | null
  /**
   * Returns the first child.
   */
  readonly firstChild: RuntimeElement | null

  /**
   * 在指定的锚点节点之前插入新的子节点
   *
   * @param child - 要插入的子节点
   * @param anchor - 锚点节点
   * @returns {void}
   * @description 在当前元素的指定子节点之前插入新节点。如果锚点节点不是当前元素的子节点，则此操作无效
   * @example
   * // 在锚点节点前插入新节点
   * parent.insertBefore(newNode, anchorNode);
   */
  insertBefore(child: BaseRuntimeElement, anchor: BaseRuntimeElement): void

  /**
   * 使用新节点替换现有的子节点
   *
   * @param newChild - 用于替换的新节点
   * @param oldChild - 要被替换的现有子节点
   * @returns {void}
   * @description 用新节点替换当前元素中的现有子节点。如果要替换的节点不是当前元素的子节点，则此操作无效
   * @example
   * // 替换子节点
   * parent.replaceChild(newChild, oldChild);
   */
  replaceChild(newChild: BaseRuntimeElement, oldChild: BaseRuntimeElement): void

  /**
   * 在当前元素的末尾添加一个子节点
   *
   * @param child - 要添加的子节点
   * @returns {void}
   * @description 将指定的节点添加为当前元素的最后一个子节点
   * @example
   * // 添加一个子节点
   * parent.appendChild(newChild);
   */
  appendChild(child: BaseRuntimeElement): void

  /**
   * 移除指定的子节点
   *
   * @param child - 要移除的子节点
   * @returns {void}
   * @description 从当前元素中移除指定的子节点。如果要移除的节点不是当前元素的子节点，则此操作无效
   * @example
   * // 移除子节点
   * parent.removeChild(childToRemove);
   */
  removeChild(child: BaseRuntimeElement): void
}

/**
 * 运行时无标签元素
 *
 * 表示没有标签的元素
 * 例如：文本节点、注释节点等
 *
 * @extends BaseRuntimeElement
 */
export interface RuntimeNoTagElement extends BaseRuntimeElement {}

/**
 * 运行时无子节点元素
 *
 * 表示没有子节点的元素
 * 例如：input、img 等 HTML 元素
 *
 * @extends BaseRuntimeElement
 */
export interface RuntimeChildlessElement extends BaseRuntimeConventionElement {
  /**
   * 当前元素的标签名
   */
  readonly tagName: SingleNodeElementName
}
/**
 * 运行时容器元素接口
 *
 * 表示具有子节点的元素
 *
 * @extends RuntimeChildlessElement
 */
export interface RuntimeContainerElement extends BaseRuntimeContainerElement {
  /**
   * 当前元素的标签名
   */
  readonly tagName: ContainerNodeElementName
  /**
   * 节点的HTML内容
   *
   * @readonly 只读属性，通过setInnerHTML方法修改
   * @type {string} HTML内容
   * @description 获取或设置节点的HTML内容。对于元素节点，返回所有子节点的HTML内容；对于文本节点为空字符串
   * @example
   * // 获取节点HTML内容
   * const html = node.innerHTML;
   */
  innerHTML: string
}

/**
 * 运行时片段元素接口
 *
 * 片段元素是运行时容器元素的一种特殊形式，用于表示多个子节点的片段。
 *
 * @extends RuntimeContainerElement
 */
export interface RuntimeFragmentElement extends BaseRuntimeContainerElement {
  placeholderElement: RuntimeNoTagElement
}

/**
 * 运行时元素接口
 *
 * 根据元素标签推导出元素类型
 *
 * @template T - 元素标签
 */
export type RuntimeElement<T extends AllNodeElementName = AllNodeElementName> =
  T extends SingleNodeElementName
    ? RuntimeChildlessElement
    : T extends NoTagNodeElementName
      ? RuntimeNoTagElement
      : T extends FragmentNodeElementName
        ? RuntimeFragmentElement
        : RuntimeContainerElement
