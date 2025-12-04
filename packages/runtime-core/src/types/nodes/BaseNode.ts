import { NON_SIGNAL_SYMBOL } from '@vitarx/responsive'
import { App } from '../../app/index.js'
import { NodeKind, NodeState, VIRTUAL_NODE_SYMBOL } from '../../constants/index.js'
import type {
  ContainerVNodeType,
  Directive,
  ElementVNodeType,
  HostCommentElement,
  HostVNodeType,
  NodeDevInfo,
  NodeElementType,
  NonElementVNodeType,
  StatelessWidgetVNodeType,
  VNodeTypes,
  WidgetVNodeType
} from '../../types/index.js'
import type { RefEl } from '../../utils/index.js'
import type { StatefulWidgetRuntime, StatelessWidgetRuntime } from '../../widget/index.js'

export type VNodeDirectives = Map<
  string,
  [directive: Directive, value: any, arg: string | undefined]
>
/**
 * 虚拟节点元数据接口
 *
 * 包含用于diff优化和渲染控制的元数据属性。
 * 这些属性不直接影响渲染结果，但可以优化渲染性能和控制渲染行为。
 */
export interface VNodeMeta {
  /**
   * diff 优化 key
   *
   * 用于标识节点的唯一性，特别是在列表渲染中。
   * 框架通过key值判断节点是否是同一个节点，从而优化diff算法。
   * 相同key的节点会被认为是同一个节点，即使它们在列表中的位置发生变化。
   */
  key?: any
  /**
   * 引用
   *
   * 用于直接访问节点对应的真实DOM元素或组件实例。
   * - SSR (服务端渲染) 时通常为空，因为服务端没有真实DOM
   * - 客户端渲染时可绑定真实DOM元素或组件实例，便于直接操作
   */
  ref?: RefEl<any>
  /**
   * 静态节点优化标记
   *
   * 用于性能优化，标记为静态的节点在后续更新中会跳过diff过程。
   * - true 表示该节点及其子节点永远不会变化，可直接跳过diff
   * - 通常用于静态内容，如固定文本、静态图片等
   */
  static?: boolean
  /**
   * 记忆比较依赖
   *
   * 用于记忆化优化，只有当依赖数组中的值发生变化时才重新渲染节点。
   * 类似于React.useEffect的依赖数组，用于控制节点更新的时机。
   */
  memo?: any[]
  /**
   * 指令列表
   */
  directives?: VNodeDirectives
}

/**
 * 虚拟节点基础接口
 *
 * 所有虚拟节点类型的基础接口，定义了虚拟节点的核心属性和行为。
 * 虚拟节点是框架中用于描述UI结构的轻量级对象，作为真实DOM的抽象表示。
 *
 * @template T 节点类型，默认为VNodeTypes
 */
export interface VNode<T extends VNodeTypes = VNodeTypes> extends VNodeMeta {
  /**
   * 标记为非信号状态的getter
   *
   * 用于响应式系统优化，标记该对象不会被响应式系统追踪。
   * 这可以提高性能，因为虚拟节点本身不需要响应式追踪，
   * 只有节点中的特定值（如props中的某些属性）需要响应式处理。
   */
  readonly [NON_SIGNAL_SYMBOL]: true
  /**
   * 标记为虚拟节点的 getter 方法
   *
   * 用于类型检查和识别，确保对象是虚拟节点而非普通对象。
   * 这个符号属性使得框架能够区分虚拟节点和其他对象，
   * 即使它们有相似的结构。
   */
  readonly [VIRTUAL_NODE_SYMBOL]: true
  /**
   * 节点类型
   *
   * 表示节点的具体类型，如文本节点、元素节点、组件节点等。
   * 这个属性决定了节点如何被渲染和处理。
   */
  type: T
  /**
   * 节点种类
   *
   * 表示节点的分类，如元素、文本、注释、片段等。
   * 与type不同，kind是更宽泛的分类，用于快速判断节点的基本类型。
   */
  kind: NodeKind
  /**
   * 节点状态
   *
   * 表示节点的当前状态，如挂载、更新、卸载等。
   * 这个属性用于框架内部管理节点的生命周期和状态。
   */
  state: NodeState
  /**
   * 节点属性
   *
   * 包含节点的所有属性，如class、style、事件处理器等。
   * 这些属性决定了节点的外观和行为。
   */
  props: Record<string, any>
  /**
   * 节点对应的真实 DOM 元素
   *
   * 在渲染过程中，虚拟节点会被转换为真实的DOM元素。
   * 这个属性引用了对应的真实DOM元素，用于直接操作DOM。
   * 在服务端渲染(SSR)时，此属性通常为空。
   */
  el?: NodeElementType<T>
  /**
   * 锚点元素
   *
   * 用于片段节点(Fragment)的渲染，片段节点本身不对应任何真实DOM元素，
   * 但需要标记其在DOM中的位置。锚点元素是一个注释节点，
   * 用于标识片段的开始和结束位置，便于后续的DOM操作。
   */
  anchor?: HostCommentElement
  /**
   * 应用上下文
   */
  appContext?: App
  /**
   * 开发模式调试信息
   *
   * 包含用于调试的元数据，如节点在源码中的位置、创建堆栈等。
   * 这些信息仅在开发环境(__DEV__)下可用，用于错误报告和调试工具。
   */
  devInfo?: NodeDevInfo
}

/**
 * HostVnode 代表的是所有非组件节点
 */
export interface HostVNode<T extends HostVNodeType = HostVNodeType> extends VNode<T> {}
/**
 * 非元素节点接口
 *
 * 表示不能包含子节点的节点类型，如文本节点、注释节点等。
 * 这些节点通常是叶子节点，在DOM树中位于末端。
 *
 * @template T 非元素节点类型，默认为NonElementVNodeType
 */
export interface NonElementVNode<T extends NonElementVNodeType = NonElementVNodeType>
  extends HostVNode<T> {
  props: { text: string }
}

/**
 * 容器节点接口
 *
 * 表示可以包含子节点的节点类型，如元素节点、片段节点等。
 * 这些节点在DOM树中可以包含其他节点，形成树形结构。
 *
 * @template T 容器节点类型，默认为ContainerVNodeType
 */
export interface ContainerVNode<T extends ContainerVNodeType = ContainerVNodeType>
  extends HostVNode<T> {
  /**
   * 子节点列表
   *
   * 包含该容器的所有直接子节点，形成DOM树的层级结构。
   * 子节点可以是任意类型的虚拟节点，包括元素、文本、组件等。
   */
  children: VNode[]
}

/**
 * 元素节点接口
 *
 * 表示HTML元素的节点，如div、span、p等。
 * 这些节点直接对应DOM中的元素，可以包含属性和子节点。
 *
 * @template T 元素节点类型，默认为ElementVNodeType
 */
export interface ElementVNode<T extends ElementVNodeType = ElementVNodeType> extends HostVNode<T> {
  /**
   * 是否是SVG元素
   *
   * true 表示是SVG元素，false 表示不是SVG元素
   */
  isSVGElement?: boolean
}

/**
 * 组件节点接口
 *
 * 表示自定义组件的节点，这些节点在渲染时会被替换为组件的模板内容。
 * 组件节点是框架中实现组件化开发的基础，允许开发者创建可复用的UI组件。
 *
 * @template T 组件节点类型，默认为WidgetVNodeType
 */
export interface WidgetVNode<T extends WidgetVNodeType = WidgetVNodeType> extends VNode<T> {
  /**
   * 缓存组件的记忆数组
   */
  memoCache?: Map<number, VNode>
  /**
   * 运行时组件实例
   */
  runtimeInstance?: T extends StatelessWidgetVNodeType
    ? StatelessWidgetRuntime
    : StatefulWidgetRuntime<T>
}
