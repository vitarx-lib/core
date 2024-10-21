/**
 * 创建虚拟元素
 *
 * @param {Vitarx.VNodeType} type - 节点类型
 * @param {Vitarx.AnyProps} props - 节点属性
 * @param {Vitarx.VNode[]} children - 子节点列表
 */
export function createVNode(
  type: Vitarx.VNodeType,
  props: Vitarx.AnyProps | null,
  ...children: Vitarx.VNode[]
): Vitarx.VNode {
  return {
    type,
    props,
    children
  }
}

// 片段组件标识符
export const Fragment: unique symbol = Symbol('Fragment')
// 导出 Vitarx 对象
export const Vitarx = {
  Fragment,
  createVNode
}
export default Vitarx
