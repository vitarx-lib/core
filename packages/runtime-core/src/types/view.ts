import type { Ref } from '@vitarx/responsive'
import type { AnyPrimitive } from '@vitarx/utils'
import type { App } from '../app/index.js'
import { ViewKind } from '../constants/index.js'
import type {
  CommentView,
  ComponentInstance,
  ComponentView,
  ElementView,
  FragmentView,
  SwitchView,
  TextView,
  ViewBuilder
} from '../core/index.js'
import type { Component } from './component.js'
import type { JSXElementNames } from './element.js'

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
export type View<T extends ViewKind = ViewKind> = T extends ViewKind.TEXT
  ? TextView
  : T extends ViewKind.COMMENT
    ? CommentView
    : T extends ViewKind.ELEMENT
      ? ElementView
      : T extends ViewKind.FRAGMENT
        ? FragmentView
        : T extends ViewKind.SWITCH
          ? SwitchView
          : T extends ViewKind.COMPONENT
            ? ComponentView
            : never
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
export type ResolvedChildren = View[]

/**
 * 可创建类型
 *
 * 可以被创建为视图的类型，包括：
 * - JSX 元素名称（如 'div'、'span' 等）
 * - 组件类型
 * - 视图构建器
 */
export type CreatableType = JSXElementNames | Component | ViewBuilder

/**
 * 挂载类型
 *
 * 视图挂载到 DOM 的方式：
 * - 'append': 追加到容器末尾
 * - 'insert': 插入到指定位置
 * - 'replace': 替换已有节点
 */
export type MountType = 'append' | 'insert' | 'replace'
