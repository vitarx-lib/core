import type {
  HostComment,
  HostContainer,
  HostElement,
  HostElementTag,
  HostFragment,
  HostNode,
  HostText
} from './element.js'
import type { FragmentView } from './view.js'

/**
 * 平台适配渲染器接口，定义了操作DOM元素基本的方法
 * 提供创建、修改、删除DOM元素以及处理事件和样式的能力
 */
export interface ViewRenderer {
  /* ---------- 创建 ---------- */
  /**
   * 创建元素
   *
   * @param tag - 元素名称
   * @param useSVGNamespace - 使用SVG命名空间
   */
  createElement<T extends HostElementTag>(tag: T, useSVGNamespace: boolean): HostElement<T>
  /**
   * 创建文本节点
   *
   * @param text - 文本内容
   */
  createText(text: string): HostText
  /**
   * 创建注释节点
   *
   * 通常用于锚点占位符
   *
   * @param text - 注释内容
   */
  createComment(text: string): HostComment
  /**
   * 创建片段
   *
   * @param view - 片段的运行时块
   */
  createFragment(view: FragmentView): HostFragment
  /* ---------- 类型判断 ---------- */
  /**
   * 判断是否为元素
   *
   * @param node - 节点
   */
  isElement(node: HostNode): node is HostElement
  /**
   * 判断是否为文本节点
   *
   * @param node - 节点
   */
  isFragment(node: HostNode): node is HostFragment
  /* ---------- 节点操作（结构） ---------- */
  /**
   * 添加子节点
   *
   * @param child - 子节点
   * @param parent - 父节点
   */
  append(child: HostNode, parent: HostContainer): void
  /**
   * 插入节点
   *
   * @param child - 节点
   * @param anchor - 锚点
   */
  insert(child: HostNode, anchor: HostNode): void
  /**
   * 替换节点
   *
   * @param newNode - 新节点
   * @param oldNode - 旧节点
   */
  replace(newNode: HostNode, oldNode: HostNode): void
  /**
   * 删除节点
   *
   * @param node - 要被删除的节点
   */
  remove(node: HostNode): void
  /* ---------- 内容 ---------- */
  /**
   * 设置文本内容
   *
   * @param node - 节点
   * @param text - 文本内容
   */
  setText(node: HostNode, text: string): void
  /* ---------- Attribute ---------- */
  /**
   * 设置属性
   *
   * @param el - 元素
   * @param key - 属性名称
   * @param nextValue - 属性值
   * @param prevValue - 上一次的属性值，兼容卸载旧的事件处理器
   */
  setAttribute(el: HostElement, key: string, nextValue: any, prevValue: any): void
}

export type RenderContext = Vitarx.RenderContext
