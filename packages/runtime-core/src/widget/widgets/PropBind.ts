import type { AnyProps, VNodeChildren } from '../../types/index.js'
import { createVNode, Fragment, FragmentNode, isVNode } from '../../vnode/index.js'
import { handleBindProps } from '../../vnode/runtime/internal/normalize.js'
import { defineStatelessWidget } from '../utils/index.js'

interface PropBindProps {
  children: VNodeChildren
  [key: string]: any
}

/**
 * 属性绑定绑定组件 - 内置组件（具有Stateless标记，不支持ref引用）
 *
 * 通常在开发调试/演示时使用，可以快速给多个子组件/元素设置共同的属性。
 *
 * @example
 * ```tsx
 * // 通过插槽传入的三个Button组件都会设有颜色属性
 * <PropBind color="primary">
 *   <Button>按钮1</Button>
 *   <Button>按钮2</Button>
 *   <Button>按钮3</Button>
 * </PropBind>
 * ```
 *
 * @param props - 组件的属性对象
 * @returns {FragmentNode} 返回一个 Fragment 元素，包含处理后的子组件
 */
const PropBind = defineStatelessWidget(
  ({ children, ...bindProps }: PropBindProps): FragmentNode => {
    // 将 children 转换为数组格式，确保可以统一处理
    const childrenList = Array.isArray(children) ? children : [children]
    // 遍历子组件列表，为每个子组件绑定属性
    childrenList.forEach(child => {
      // 检查子组件是否为虚拟节点，如果是则处理其属性
      if (isVNode(child)) {
        const props = child.props as AnyProps
        props['v-bind'] = bindProps
        handleBindProps(props)
      }
    })
    // 创建并返回一个 Fragment 元素，包含处理后的子组件列表
    return createVNode(Fragment, { children: childrenList })
  }
)

export { PropBind }
