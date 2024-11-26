import { Fragment, type VNode, type VNodeProps, type VNodeType } from './../dist/index.js'

type Source = {
  fileName: string
  lineNumber: number
  columnNumber: number
}

interface DevVNode<T extends VNodeType> extends VNode<T> {
  devInfo: {
    source: Source
    isStatic: boolean
    self: any
  }
}

/**
 * JSX构建VNode(开发模式)
 *
 * @param type - 类型
 * @param props - 属性
 * @param key - 唯一标识
 * @param isStatic - 是否静态
 * @param source - 源码位置信息
 * @param self - 绑定的this
 */
declare function jsxDEV<T extends VNodeType>(
  type: T,
  props: VNodeProps<T> | null,
  key: Vitarx.GlobalIntrinsicAttributes['key'] | undefined,
  isStatic: boolean,
  source: Source,
  self: any
): DevVNode<T>

export { Fragment, jsxDEV }
