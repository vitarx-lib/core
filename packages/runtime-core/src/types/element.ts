import {
  COMMENT_NODE_TYPE,
  type DynamicRenderType,
  type Fragment,
  FRAGMENT_NODE_TYPE,
  TEXT_NODE_TYPE
} from '../vnode/index.js'
import type { MaybeRef } from './props.js'
import type { CommentNodeType, FragmentNodeType, TextNodeType } from './vnode.js'
import type { WidgetPropsType } from './widget.js'

/**
 * 固有的特殊元素
 */
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
 * JSX 元素接口
 *
 * 此接口定义了 JSX 元素的属性类型，
 * 这是让jsx表达式中支持直接传入ref的关键。
 */
export type JSXInternalElements = JSX.IntrinsicElements
/**
 * createVNode 支持的字符串类型元素名称
 *
 * 此类型包含所有可用的元素名称，包括标准元素（如div、span等）
 * 和特殊元素（如fragment、text、comment等。）
 */
export type JSXElementNames = keyof JSXInternalElements
/**
 * 固有元素
 *
 * 和 JSX.IntrinsicElements 存在区别，
 * 此接口中的元素属性还没有支持ref
 */
export type IntrinsicElements = Vitarx.IntrinsicElements
/**
 * 运行时特殊元素名称
 */
export type SpecialNodeNames = keyof IntrinsicSpecialElements
/**
 * 所有宿主节点（包括 void）
 *
 * 此类型定义了运行时支持的元素类型与其实例的映射关系。
 * 在 core 包中初始为空对象，各平台渲染包会通过 TypeScript 的声明合并
 * 机制扩展此类型，添加平台特定的元素类型映射。
 */
export type HostNodeInstanceMap = Vitarx.HostNodeMap
/**
 * 全部宿主平台节点名称
 *
 * 表示除了render之外的所有普通元素/特殊元素名称。
 */
export type HostNodeNames = Exclude<JSXElementNames, DynamicRenderType>
/**
 * 叶子元素（无子元素）映射
 *
 * 此类型定义了运行时无内容元素名称与对应的元素实例类型的映射关系。
 * 在 core 包中初始为空对象，各平台渲染包会通过 TypeScript 的声明合并
 * 机制扩展此类型，添加平台特定的无内容元素名称映射。
 */
export type HostVoidElementMap = Vitarx.HostVoidElementMap
/**
 * 叶子元素（无子元素）名称
 */
export type HostVoidElementNames = keyof HostVoidElementMap
/**
 * 宿主元素（非特殊）名称
 *
 * plain-text、comment 、fragment 不被视为普通元素，因此排除
 */
export type HostElementNames = Exclude<HostNodeNames, SpecialNodeNames>
/**
 * 普通宿主元素（非特殊，非Void）名称
 */
export type HostRegularElementNames = Exclude<HostElementNames, HostVoidElementNames>
/**
 * 运行时父元素实例接口
 */
export type HostParentElement = Vitarx.HostParentNode
/**
 * 运行时注释元素
 *
 * 注释作为锚元素，因为注释在开发者工具中是可见的，
 */
export type HostCommentElement = HostNodeElements<CommentNodeType>
/**
 * 运行时文本元素
 */
export type HostTextElement = HostNodeElements<TextNodeType>
/**
 * 运行时片段元素
 */
export type HostFragmentElement = HostNodeElements<FragmentNodeType>

/**
 * 主机节点元素类型，表示所有可能的宿主节点类型
 * @template T - 节点名称类型，默认为所有可能的宿主节点名称
 */
export type HostNodeElements<T extends HostNodeNames = HostNodeNames> = HostNodeInstanceMap[T]

/**
 * 主机元素类型，表示所有可能的宿主元素
 * @template T - 元素名称类型，默认为所有可能的宿主元素名称
 */
export type HostElements<T extends HostElementNames = HostElementNames> = HostNodeElements<T>

/**
 * 主机空元素类型，表示没有子内容的自闭合元素（如img、br、hr等）
 * @template T - 空元素名称类型，默认为所有可能的宿主空元素名称
 */
export type HostVoidElements<T extends HostVoidElementNames = HostVoidElementNames> =
  HostNodeElements<T>

/**
 * 主机常规元素类型，表示可以包含子内容的元素
 * @template T - 常规元素名称类型，默认为所有可能的宿主常规元素名称
 */
export type HostRegularElements<T extends HostRegularElementNames = HostRegularElementNames> =
  HostNodeElements<T>
