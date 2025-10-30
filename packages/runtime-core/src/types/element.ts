import {
  COMMENT_NODE_TYPE,
  type DynamicRenderType,
  type Fragment,
  FRAGMENT_NODE_TYPE,
  TEXT_NODE_TYPE
} from '../vnode/constants/index.js'
import type { MaybeRef } from './props.js'
import type { CommentNodeType, NodeTypes } from './vnode.js'
import type { WidgetPropsType } from './widget.js'

export interface IntrinsicSpecialElements {
  /**
   * 片段元素
   */
  [FRAGMENT_NODE_TYPE]: WidgetPropsType<Fragment>
  /**
   * 纯文本
   *
   * 用于处理纯文本节点，如 <div>Hello</div> 中的 "Hello"。
   *
   * @remarks 开发者无需在视图中使用它，在内部逻辑中会自动转换。
   */
  [TEXT_NODE_TYPE]: { value: MaybeRef<string> }
  /**
   * 注释
   *
   * 用于处理注释节点，如 <div><!--This is a comment--></div> 中的 "This is a comment"。
   *
   * 开发时内部会使用注释来提示一些重要信息，如 `v-if = false` 在开发阶段可以通过开发者控制台查看到 `<!--v-if-->` 便于调试。
   *
   * @remarks 不建议在视图中使用它，除非你真的需要在生产环境中显示一段注释。
   */
  [COMMENT_NODE_TYPE]: { value: MaybeRef<string> }
}
/**
 * createVNode 支持的字符串类型元素名称
 *
 * 此类型包含所有可用的元素名称，包括标准元素（如div、span等）
 * 和特殊元素（如fragment、text、comment等。）
 */
export type ValidElementNames = keyof JSX.IntrinsicElements
/**
 * 运行时特殊元素名称
 */
export type SpecialElementNames = keyof IntrinsicSpecialElements
/**
 * 所有宿主节点（包括 void）
 *
 * 此类型定义了运行时支持的元素类型与其实例的映射关系。
 * 在 core 包中初始为空对象，各平台渲染包会通过 TypeScript 的声明合并
 * 机制扩展此类型，添加平台特定的元素类型映射。
 */
export type AllHostElementInstanceMap = Vitarx.HostElementInstanceMap
/**
 * 全部宿主平台元素名称（特殊 plain-text、comment 、fragment 除外）
 *
 * 表示除了render之外的所有普通元素/特殊元素名称。
 */
export type AllHostElementNames = Exclude<ValidElementNames, DynamicRenderType>
/**
 * 叶子节点（无子元素）映射
 *
 * 此类型定义了运行时无内容元素名称与对应的元素实例类型的映射关系。
 * 在 core 包中初始为空对象，各平台渲染包会通过 TypeScript 的声明合并
 * 机制扩展此类型，添加平台特定的无内容元素名称映射。
 */
export type HostVoidElementNamesMap = Vitarx.HostVoidElementNamesMap
/**
 * 叶子节点（无子元素）名称
 */
export type HostVoidElementNames = keyof HostVoidElementNamesMap
/**
 * 普通宿主节点（非特殊、非 void）
 *
 * plain-text、comment 、fragment 不被视为普通元素，因此排除
 */
export type HostElementNames = Exclude<
  AllHostElementNames,
  SpecialElementNames | HostVoidElementNames
>
/**
 * 运行时父元素实例接口
 */
export type HostParentElement = Vitarx.HostParentElement
/**
 * 运行时锚元素
 *
 * 注释节点 作为锚元素，因为注释节点在开发者工具中是可见的，
 */
export type HostAnchorElement = HostElementInstance<CommentNodeType>
/**
 * 运行时元素实例类型推导
 *
 * 根据虚拟节点类型 T 推导出对应的运行时元素实例类型。
 * 如果 T 是 RuntimeDomInstanceMap 中的键，则返回对应的元素类型；
 * 否则返回 RuntimeDomInstanceMap 中所有值的联合类型。
 *
 * @template T 虚拟节点类型
 */
export type HostElementInstance<T extends NodeTypes = NodeTypes> = T extends AllHostElementNames
  ? AllHostElementInstanceMap[T]
  : AllHostElementInstanceMap[keyof AllHostElementInstanceMap] | HostParentElement
