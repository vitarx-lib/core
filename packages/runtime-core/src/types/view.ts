import type { Ref } from '@vitarx/responsive'
import type { AnyPrimitive, CodeSource } from '@vitarx/utils'
import type { App } from '../app/index.js'
import {
  CommentView,
  ComponentInstance,
  ComponentView,
  DynamicView,
  ElementView,
  FragmentView,
  ListView,
  TextView
} from '../view/implements/index.js'
import type { ViewBuilder } from '../view/index.js'
import type { Component } from './component.js'
import type { HostElementTag } from './element.js'

/**
 * 代码位置
 *
 * 用于记录视图的生成位置
 */
export interface CodeLocation extends CodeSource {}

/**
 * 宿主节点视图
 *
 * 包括 Element、Fragment、Text、Comment 四种UI可见视图
 */
export type HostView = ElementView | FragmentView | TextView | CommentView

/**
 * 统一视图类型
 */
export type View = HostView | ListView | DynamicView | ComponentView

/**
 * 视图运行时上下文关系
 */
export interface ViewContext {
  owner?: ComponentInstance | null
  app?: App | null
}
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
export type ResolvedChildren = readonly View[]

/**
 * 可创建类型
 *
 * 可以被创建为视图的类型，包括：
 * - JSX 元素名称（如 'div'、'span' 等）
 * - 组件
 * - 视图构建器
 */
export type ViewTag = HostElementTag | Component | ViewBuilder

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
 * ViewTag 转 View 类型
 */
export type ViewOf<T extends ViewTag> = T extends HostElementTag
  ? ElementView<T>
  : T extends ViewBuilder<any, infer V>
    ? V
    : T extends Component
      ? ComponentView<T>
      : never
