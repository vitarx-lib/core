// ======================== 公共 API（需要文档） ========================

// 信号创建
export {
  computed,
  reactive,
  readonly,
  ref,
  shallowReactive,
  shallowReadonly,
  shallowRef
} from '@vitarx/responsive'

// 信号转换
export { markRaw, toRaw, toRef, toRefs, toValue, unref } from '@vitarx/responsive'

// 类型判断
export { isComputed, isReactive, isReadonly, isRef } from '@vitarx/responsive'

// 观察器
export { watch, watchEffect, watchPostEffect, watchSyncEffect } from '@vitarx/responsive'

// 作用域
export { EffectScope, onScopeDispose, onScopePause, onScopeResume } from '@vitarx/responsive'

// 调度
export { nextTick } from '@vitarx/responsive'

/** @deprecated 已于 4.0.5 废弃，请使用 `untracked`，将于 5.0.0 移除 */
export { untrack } from '@vitarx/responsive'

// 工具
export { untracked } from '@vitarx/responsive'

// 公共类型
export type {
  CompareFunction,
  ComputedGetter,
  ComputedSetter,
  DebuggerEvent,
  DebuggerHandler,
  DebuggerOptions,
  DeepUnwrapRefs,
  EffectScopeOptions,
  FlushMode,
  Reactive,
  ReadonlyObject,
  Ref,
  ShallowReactive,
  ToRef,
  UnwrapRef,
  UnwrapRefs,
  WatchCallback,
  WatcherOnCleanup,
  WatchOptions,
  WatchSource
} from '@vitarx/responsive'

// 公共类
export { Computed, Effect, Watcher } from '@vitarx/responsive'

// ======================== 进阶 API（不需要文档） ========================

// 进阶常量
export { IS_RAW, IS_REACTIVE, IS_READONLY, IS_REF, IS_SIGNAL, RAW_VALUE } from '@vitarx/responsive'

// 进阶 API
export {
  addToActiveScope,
  bindDebuggerOptions,
  clearAllJobs,
  clearEffectLinks,
  clearSignalLinks,
  createDepLink,
  createScope,
  destroyDepLink,
  flushSync,
  getActiveEffect,
  getActiveScope,
  getOwnerScope,
  hasLinkedEffect,
  hasLinkedSignal,
  hasPropTrack,
  hasTrack,
  isMakeRaw,
  isRefSignal,
  iterateLinkedEffects,
  iterateLinkedSignals,
  propertyRef,
  queueJob,
  queuePostFlushJob,
  queuePreFlushJob,
  removeFromOwnerScope,
  removeJob,
  reportEffectError,
  trackEffect,
  trackSignal,
  triggerSignal
} from '@vitarx/responsive'

// 进阶类型
export type {
  DepLink,
  DisposableEffect,
  EffectRunner,
  EffectScopeErrorHandler,
  EffectState,
  ExtraDebugData,
  JobRemovalMode,
  RawObject,
  RawValue,
  RefSignal,
  Scheduler,
  Signal,
  SignalOpType,
  ToRefValue,
  UnwarpSources
} from '@vitarx/responsive'

// 进阶类
export { GetterRef, PropertyRef, ShallowRef, ValueRef } from '@vitarx/responsive'
