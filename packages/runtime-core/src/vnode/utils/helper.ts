// import { unref } from '@vitarx/responsive'
// import { isEmpty, isRecordObject, popProperty } from '@vitarx/utils'
// import { _handleBindAllProps, _handleBindProps } from './props.js'
// import types { Child, VNodeInstance, VNodeProps, VNodeType } from './types/vnode.js'
//
// /**
//  * 创建虚拟节点（VNode）
//  * @param types 节点类型（字符串或组件对象）
//  * @param props 节点属性
//  * @param children 子节点（JSX兼容）
//  */
// export function createVNode<T extends VNodeType>(
//   types: T,
//   props: VNodeProps<T> | null = null,
//   ...children: Child[]
// ): VNodeInstance<T> {
//   const isValidProps = isRecordObject(props)
//   const resolvedProps: VNodeProps<T> = isValidProps ? { ...props } : ({} as VNodeProps<T>)
//
//   // ---------- v-if / v-bind-all / v-memo ----------
//   if (isValidProps) {
//     if ('v-if' in resolvedProps && !unref(popProperty(resolvedProps, 'v-if'))) {
//       return new CommentNode('v-if') as unknown as VNodeInstance<T>
//     }
//
//     _handleBindAllProps(resolvedProps)
//     const vMemoValue = resolvedProps['v-memo']
//     if (Array.isArray(vMemoValue)) {
//       const cached = VNode.getMemoNode(vMemoValue)
//       if (cached) return cached as VNodeInstance<T>
//     }
//   }
//
//   // ---------- children ----------
//   if (children.length) {
//     const existing = resolvedProps.children
//     resolvedProps.children = Array.isArray(existing)
//       ? [...existing, ...children]
//       : existing
//         ? [existing, ...children]
//         : children
//   }
//
//   // ---------- 字符串类型节点 ----------
//   if (typeof types === 'string') {
//     switch (types) {
//       case TEXT_NODE_TYPE:
//       case COMMENT_NODE_TYPE: {
//         const c = resolvedProps.children
//         const value = Array.isArray(c) ? c.join('') : ((c ?? '') as string)
//         return new (types === TEXT_NODE_TYPE ? TextNode : CommentNode)(
//           value
//         ) as unknown as VNodeInstance<T>
//       }
//
//       case FRAGMENT_NODE_TYPE:
//         return new FragmentNode(resolvedProps) as unknown as VNodeInstance<T>
//
//       case DYNAMIC_WIDGET_TYPE: {
//         const { is: dynamicWidget, ...dynamicProps } = resolvedProps
//         const resolved = unref(dynamicWidget)
//         if (!resolved) {
//           if (import.meta.env.DEV) {
//             console.warn('[Vitarx.DynamicWidget][WARN]: "is" prop 为必填且不能为空。')
//           }
//           return new CommentNode(
//             'DynamicWidget 构建失败，"is" prop 为必填且不能为空'
//           ) as unknown as VNodeInstance<T>
//         }
//         if (!isEmpty(dynamicProps)) _handleBindProps(dynamicProps, false)
//         return createVNode(resolved, dynamicProps) as unknown as VNodeInstance<T>
//       }
//
//       default:
//         return new ElementNode(types, resolvedProps) as unknown as VNodeInstance<T>
//     }
//   }
//
//   // ---------- Widget 组件 ----------
//   if (isSimpleWidget(types)) {
//     if (isValidProps) _handleBindProps(resolvedProps, false)
//     const vnode = types(resolvedProps)
//     if (vnode === null) {
//       return new CommentNode('simple widget return null') as unknown as VNodeInstance<T>
//     }
//     if (!VNode.is(vnode)) {
//       throw new Error('simple widget must return a VNode')
//     }
//     return vnode as unknown as VNodeInstance<T>
//   }
//
//   return new WidgetNode(types, props) as unknown as VNodeInstance<T>
// }
//
// export { createVNode as createElement }
