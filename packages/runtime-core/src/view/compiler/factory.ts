import { type Ref } from '@vitarx/responsive'
import { getCallSource, isPlainObject } from '@vitarx/utils'
import { isViewBuilder } from '../../shared/index.js'
import type {
  AnyProps,
  CodeLocation,
  Component,
  HostElementTag,
  ValidChildren,
  ValidProps,
  View,
  ViewOf,
  ViewTag
} from '../../types/index.js'
import type { ViewBuilder } from '../builder/index.js'
import { CommentView, TextView } from '../implements/atomic.js'
import { DynamicView } from '../implements/dynamic.js'
import { ElementView } from '../implements/element.js'
import { FragmentView } from '../implements/fragment.js'
import { ComponentView, ListView } from '../implements/index.js'
import { isValidChild } from './resolve.js'

/**
 * 创建视图的工厂函数
 *
 * @template P - 视图属性的类型，必须扩展自 AnyProps
 * @template V - 视图实例的类型，必须扩展自 View
 * @param type - 视图构建器函数，用于创建指定类型的视图实例
 * @param [props] - 可选的视图属性对象，默认为 null
 * @param location - 可选的代码位置信息，用于调试和错误追踪
 * @returns 返回创建的视图实例，类型为 B
 */
export function createView<P extends AnyProps, V extends View>(
  type: ViewBuilder<P, V>,
  props?: P | null,
  location?: CodeLocation
): V

/**
 * 创建组件视图实例
 * 当传入类型参数为组件时，创建对应的组件视图
 *
 * @template T 组件类型
 * @param type 组件类型
 * @param props 组件属性，默认为null
 * @param location 代码位置信息，用于调试
 * @returns {ComponentView} 组件视图实例
 */
export function createView<T extends Component>(
  type: T,
  props?: ValidProps<T> | null,
  location?: CodeLocation
): ComponentView<T>

/**
 * 创建元素视图实例
 * 当传入类型参数为HTML标签时，创建对应的元素视图
 *
 * @template T HTML标签类型
 * @param type HTML标签名称
 * @param props 元素属性，默认为null
 * @param location 代码位置信息，用于调试
 * @returns {ElementView} 元素视图实例
 */
export function createView<T extends HostElementTag>(
  type: T,
  props?: ValidProps<T> | null,
  location?: CodeLocation
): ElementView<T>

/**
 * 创建通用视图实例
 * 当传入类型参数为视图标签时，创建对应的视图实例
 *
 * @template T 视图标签类型
 * @param type 视图标签
 * @param props 视图属性，默认为null
 * @param location 代码位置信息，用于调试
 * @returns {View} 视图实例
 */
export function createView<T extends ViewTag>(
  type: T,
  props?: ValidProps<T> | null,
  location?: CodeLocation
): View
/**
 * 创建视图实例
 * 根据传入的类型参数创建不同类型的视图（元素视图、组件视图、片段视图等）
 *
 * @param type 视图类型，可以是字符串标签、组件函数或视图构建器
 * @param props 视图属性，默认为null
 * @param location 代码位置信息，用于调试
 * @returns {View} 创建的视图实例
 */
export function createView<T extends ViewTag>(
  type: T,
  props: ValidProps<T> | null = null,
  location?: CodeLocation
): View {
  let view: View

  if (typeof type === 'string') {
    view = new ElementView(type, props, location)
  } else if (typeof type === 'function') {
    view = isViewBuilder(type) ? type(props, location) : new ComponentView(type, props, location)
  } else {
    throw new TypeError(
      `createView(): invalid type - expected string (for DOM elements) or function (for components and view builders), but received ${typeof type}: ${String(type)}`
    )
  }
  return view
}

/**
 * 创建文本视图
 *
 * @param text 要显示的文本内容
 * @param location 代码位置信息，用于调试
 * @returns {TextView} 文本视图实例
 */
export function createTextView(text: string, location?: CodeLocation): TextView {
  return new TextView(text, location)
}

/**
 * 创建注释视图
 *
 * @param text 注释内容
 * @param location 代码位置信息，用于调试
 * @returns {CommentView} 注释视图实例
 */
export function createCommentView(text: string, location?: CodeLocation): CommentView {
  return new CommentView(text, location)
}

/**
 * 创建组件视图
 *
 * @param component 组件类型
 * @param props 组件属性，默认为null
 * @param location 代码位置信息，用于调试
 * @returns {ComponentView} 组件视图实例
 */
export function createComponentView<T extends Component>(
  component: T,
  props: ValidProps<T> | null = null,
  location?: CodeLocation
): ComponentView<T> {
  return new ComponentView(component, props, location)
}

/**
 * 创建片段视图
 * 片段视图用于包装多个子视图而不创建额外的DOM节点
 *
 * @param children 子视图或子元素
 * @param location 代码位置信息，用于调试
 * @returns {FragmentView} 片段视图实例
 */
export function createFragmentView(children: ValidChildren, location?: CodeLocation): FragmentView {
  return new FragmentView(children, location)
}

/**
 * 创建动态视图
 *
 * 动态视图根据响应式引用的值动态渲染不同的子视图
 *
 * @param source 响应式引用，用于决定显示哪个子视图
 * @param location 代码位置信息，用于调试
 * @returns {DynamicView} 切换视图实例
 */
export function createDynamicView<T = any>(
  source: Ref<T>,
  location?: CodeLocation
): DynamicView<T> {
  return new DynamicView(source, location)
}

/**
 * 创建元素视图
 *
 * 元素视图代表一个DOM元素，如div、span等
 *
 * @param tag HTML标签名
 * @param props 元素属性，可以为null
 * @param location 代码位置信息，用于调试
 * @returns {ElementView} 元素视图实例
 */
export function createElementView<T extends HostElementTag>(
  tag: T,
  props: ValidProps<T> | null,
  location?: CodeLocation
): ElementView<T> {
  return new ElementView(tag, props, location)
}

/**
 * 创建并返回一个ListView实例的工厂函数
 *
 * @param items - 可选参数，用于初始化ListView的视图项数组
 * @param location - 可选参数，用于指定代码位置信息
 * @returns - 返回一个新的ListView实例
 */
export function createListView(items?: View[], location?: CodeLocation): ListView {
  return new ListView(items, location) // 实例化并返回ListView对象
}

/**
 * 创建View对象的JS编码友好助手函数
 *
 * 此函数是对 `createView` 进行了二次封装，方便在直接使用js代码创建视图。
 *
 * @param type - 元素的类型，必须是ViewTag的子类型
 * @param propsOrChildren - 元素的属性对象或子元素
 * @param children - 元素的子元素
 * @returns {View} 返回对应类型的视图对象
 */
export function h<T extends ViewTag>(
  type: T,
  propsOrChildren?: AnyProps | ValidChildren,
  children?: ValidChildren
): ViewOf<T> {
  let resolvedProps: AnyProps | null = null // 解析后的属性对象
  let resolvedChildren: ValidChildren | undefined // 解析后的子元素

  // props is actually children
  if (propsOrChildren != null) {
    if (isValidChild(propsOrChildren)) {
      resolvedChildren = propsOrChildren as ValidChildren
    } else if (isPlainObject(propsOrChildren)) {
      resolvedProps = propsOrChildren as AnyProps
    }
  }
  if (children !== undefined) {
    resolvedChildren = children
  }
  // attach children to props if exists
  if (resolvedChildren !== undefined) {
    resolvedProps ??= {}
    resolvedProps.children = resolvedChildren
  }

  const source = __DEV__ ? getCallSource() : undefined

  return createView(type, resolvedProps as ValidProps<T>, source) as ViewOf<T>
}
