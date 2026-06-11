// ======================== 公共 API（需要文档） ========================

// 应用
export { App } from '@vitarx/runtime-core'

// 视图构建
export { h, dynamic, mergeProps } from '@vitarx/runtime-core'

// 组件
export { Lazy, For, Freeze, Suspense } from '@vitarx/runtime-core'

// 视图构建器

export { Comment, Dynamic, Fragment, PlainText } from '@vitarx/runtime-core'

// 指令
export { withDirectives, defineDirective } from '@vitarx/runtime-core'

// 生命周期
export {
  onInit,
  onBeforeMount,
  onMounted,
  onShow,
  onHide,
  onDispose,
  onError,
  onViewSwitch
} from '@vitarx/runtime-core'

// 依赖注入
export { provide, inject } from '@vitarx/runtime-core'

// Hooks
export {
  useId,
  useModel,
  useRef,
  useChildren,
  useFastChild,
  useApp,
  useInstance,
  useView,
  useSuspense
} from '@vitarx/runtime-core'

// 组件定义
export { defineExpose, defineValidate } from '@vitarx/runtime-core'

// 公共类型
export type {
  Component,
  ComponentProps,
  InferProps,
  AnyProps,
  AppConfig,
  AppPlugin,
  AppPluginInstall,
  LazyProps,
  LazyLoader,
  ForProps,
  FreezeProps,
  SuspenseProps,
  CommentProps,
  PlainTextProps,
  FragmentProps,
  DynamicProps,
  WithModelEvent,
  Directive,
  DirectiveBinding,
  DirectiveHook,
  IntrinsicElements,
  VitarxIntrinsicAttributes,
  MaybeRef,
  WithProps,
  ComponentPublicInstance,
  ViewBuilder,
  ViewEffect,
  ValidateProps
} from '@vitarx/runtime-core'

// 公共类
export { ModelRef } from '@vitarx/runtime-core'

// ======================== 进阶 API（不需要文档） ========================

// 进阶常量
export {
  IS_VIEW,
  IS_VIEW_BUILDER,
  SUSPENSE_COUNTER,
  ViewKind,
  ViewState
} from '@vitarx/runtime-core'

// 进阶 API
export {
  accessor,
  branch,
  expr,
  builder,
  clearComponentCache,
  createCommentView,
  createComponentView,
  createDynamicView,
  createElementView,
  createFragmentView,
  createListView,
  createTextView,
  createView,
  getApp,
  getCachedComponent,
  getComponentView,
  getInstance,
  getLazyLoader,
  getLoadingComponent,
  getRenderer,
  isCommentView,
  isComponent,
  isComponentView,
  isDynamicView,
  isElementView,
  isFragmentView,
  isListView,
  isTextView,
  isView,
  isViewBuilder,
  lazy,
  preloadComponent,
  render,
  resolveDirective,
  runComponent,
  setRenderer,
  viewEffect
} from '@vitarx/runtime-core'

// 进阶类型
export type {
  BindAttributes,
  CodeLocation,
  DirectiveMap,
  ErrorHandler,
  ErrorInfo,
  ErrorSource,
  HookCallback,
  HookStore,
  HostComment,
  HostContainer,
  HostElement,
  HostElementTag,
  HostFragment,
  HostNode,
  HostText,
  HostView,
  InferView,
  InstanceRef,
  MountMode,
  Renderable,
  RenderChild,
  RenderChildren,
  ResolvedChildren,
  StyleProperties,
  StyleRules,
  ClassProperties,
  View,
  ViewContext,
  ViewDescriptor,
  ViewRenderer,
  ViewSwitchHandler,
  ViewSwitchTransaction,
  VitarxManagedAttributes,
  WithDefaultProps,
  WithRefProps,
  AppObjectPlugin,
  LazyWrapper,
  LazyLoadOptions
} from '@vitarx/runtime-core'

// 进阶类
export {
  CommentView,
  ComponentInstance,
  ComponentView,
  DynamicView,
  ElementView,
  FragmentView,
  ListView,
  TextView,
  StyleUtils
} from '@vitarx/runtime-core'
