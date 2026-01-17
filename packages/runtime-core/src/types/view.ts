import type { IS_RAW, Ref } from '@vitarx/responsive'
import type { AnyPrimitive, MakeRequired } from '@vitarx/utils'
import type { IS_VIEW } from '../shared/constants/symbol.js'
import type { ViewFlag } from '../shared/constants/viewFlag.js'
import type {
  DynamicInstance,
  HostViewInstance,
  ViewBuilder,
  WidgetInstance
} from '../view/index.js'
import type { DirectiveMap } from './directive.js'
import type {
  ElementProps,
  HostComment,
  HostContainer,
  HostElement,
  HostElementTag,
  HostFragment,
  HostNode,
  HostText,
  JSXElementNames
} from './element.js'
import type { Widget, WidgetPropsType } from './widget.js'

/**
 * 代码位置
 *
 * 用于记录视图的生成位置
 */
export interface CodeLocation {
  /** 源文件名 */
  fileName: string
  /** 源代码行号 */
  lineNumber: number
  /** 源代码列号 */
  columnNumber: number
}

/**
 * 视图基础接口
 *
 * 所有视图类型的基类，定义了视图的公共属性和方法
 *
 * @template Flag - 视图标志类型，默认为 ViewFlag
 */
interface BaseView<Flag extends ViewFlag = ViewFlag> {
  /** 标记为原始对象，避免成为响应式代理！ */
  readonly [IS_RAW]: true
  /** 视图标志 */
  readonly [IS_VIEW]: true
  /** 结构类型 */
  readonly flag: Flag
  /** 稳定 key，用于结构定位（非 diff） */
  readonly key?: unknown
  /** 源码位置信息（调试 / devtools / HMR） */
  readonly location?: CodeLocation
}

/**
 * 纯文本视图
 *
 * 通常用于渲染文本内容。
 */
export interface TextView extends BaseView<ViewFlag.TEXT> {
  /** 文本内容 */
  text: string
  /** 宿主文本实例 */
  instance?: HostViewInstance<HostText>
}

/**
 * 锚点视图
 *
 * 通常在组件未渲染任何内容时存在，
 * 用于定位在DOM中的位置，通常以注释形态展示，纯静态视图。
 */
export interface AnchorView extends BaseView<ViewFlag.ANCHOR> {
  /** 锚点文本内容 */
  text: string
  /** 宿主注释实例 */
  instance?: HostViewInstance<HostComment>
}

/**
 * 元素视图
 *
 * 通常用于渲染 HTML 元素。
 */
export interface ElementView<T extends HostElementTag = HostElementTag>
  extends BaseView<ViewFlag.ELEMENT> {
  /** 元素标签类型 */
  readonly type: T
  /** 元素引用 */
  readonly ref?: Ref
  /** 子视图列表 */
  readonly children: readonly View[]
  /** 元素属性 */
  readonly props: ElementProps<T> | null
  /** 指令映射表 */
  directives?: DirectiveMap
  /** 宿主元素实例 */
  instance?: HostViewInstance<HostElement<T>>
}

/**
 * 片段视图
 *
 * 用于渲染多个子节点而不需要额外的 DOM 容器包裹
 * 常用于需要返回多个子元素的场景
 */
export interface FragmentView extends BaseView<ViewFlag.FRAGMENT> {
  /** 子视图列表 */
  readonly children: readonly View[]
  /** 宿主片段实例 */
  instance?: HostViewInstance<HostFragment>
}

/**
 * 动态视图
 *
 * 用于渲染动态内容，可以根据响应式数据的变化自动更新
 *
 * @template T - 动态内容的类型，默认为 any
 */
export interface DynamicView<T = any> extends BaseView<ViewFlag.DYNAMIC> {
  /** 子视图的响应式引用 */
  readonly child: Ref<T>
  /** 指令映射表 */
  directives?: DirectiveMap
  /** 动态视图实例 */
  instance?: DynamicInstance
}

/**
 * 组件视图
 *
 * 用于渲染自定义组件，是构建可复用 UI 组件的基础
 *
 * @template T - 组件类型，必须继承自 Widget
 */
export interface WidgetView<T extends Widget = Widget> extends BaseView<ViewFlag.WIDGET> {
  /** 组件类型/构造函数 */
  readonly type: T
  /** 组件引用，用于获取组件实例 */
  readonly ref?: Ref
  /** 组件属性 */
  readonly props: WidgetPropsType<T> | null
  /** 组件实例 */
  instance?: WidgetInstance
  /** 指令映射表 */
  directives?: DirectiveMap
}

/**
 * 视图联合类型
 *
 * 根据传入的视图标志返回对应的视图接口类型
 *
 * 如果不传入泛型 T 参数，则返回所有视图接口类型的联合类型
 *
 * @template T - 视图标志类型，用于指定返回的具体视图类型
 *
 * @example
 * // 获取所有视图类型的联合
 * type AllViews = View;
 *
 * @example
 * // 获取特定类型的视图
 * type TextViewType = View<ViewFlag.TEXT>;
 */
export type View<T extends ViewFlag = ViewFlag> = T extends ViewFlag.TEXT
  ? TextView
  : T extends ViewFlag.ANCHOR
    ? AnchorView
    : T extends ViewFlag.ELEMENT
      ? ElementView
      : T extends ViewFlag.FRAGMENT
        ? FragmentView
        : T extends ViewFlag.DYNAMIC
          ? DynamicView
          : T extends ViewFlag.WIDGET
            ? WidgetView
            : never

/**
 * 渲染单元类型
 *
 * 可以是任意视图类型或原始类型（如 string、number 等）
 */
export type RenderUnit = View | AnyPrimitive

/**
 * 有效子节点类型
 *
 * 可以是渲染单元或渲染单元的响应式引用
 */
export type ValidChild = RenderUnit | Ref<RenderUnit>

/**
 * 有效子节点集合类型
 *
 * 可以是单个有效子节点或可迭代的子节点集合
 */
export type ValidChildren = ValidChild | Iterable<ValidChildren>

/**
 * 解析后的子节点类型
 *
 * 子节点被解析后最终得到的视图数组
 */
export type ResolvedChildren = View[]

/**
 * 可创建类型
 *
 * 可以被创建为视图的类型，包括：
 * - JSX 元素名称（如 'div'、'span' 等）
 * - 组件类型
 * - 视图构建器
 */
export type CreatableType = JSXElementNames | Widget | ViewBuilder

/**
 * 父视图类型
 *
 * 可以作为其他视图的父容器的视图类型
 */
export type ParentView =
  | View<ViewFlag.FRAGMENT>
  | View<ViewFlag.ELEMENT>
  | View<ViewFlag.WIDGET>
  | View<ViewFlag.DYNAMIC>

/**
 * 视图运行时类型
 *
 * 包含实例的视图类型，用于视图的运行时操作
 *
 * @template Flag - 视图标志类型
 */
export type ViewRuntime<Flag extends ViewFlag = ViewFlag> = MakeRequired<View<Flag>, 'instance'>
/**
 * 挂载类型
 *
 * 视图挂载到 DOM 的方式：
 * - 'append': 追加到容器末尾
 * - 'insert': 插入到指定位置
 * - 'replace': 替换已有节点
 */
export type MountType = 'append' | 'insert' | 'replace'

/**
 * 视图驱动器接口
 *
 * 定义视图的生命周期操作方法，包括渲染、挂载和销毁
 *
 * @template Flag - 视图标志类型
 */
export interface ViewDriver<Flag extends ViewFlag = ViewFlag> {
  /**
   * 渲染视图
   * @param view - 要渲染的视图运行时实例
   */
  render(view: ViewRuntime<Flag>): void

  /**
   * 挂载视图到 DOM
   * @param view - 要挂载的视图运行时实例
   * @param containerOrAnchor - 挂载的容器或锚点节点
   * @param type - 挂载类型（追加/插入/替换）
   */
  mount(view: ViewRuntime<Flag>, containerOrAnchor: HostContainer | HostNode, type: MountType): void

  /**
   * 销毁视图
   * @param view - 要销毁的视图运行时实例
   */
  dispose(view: ViewRuntime<Flag>): void
}
