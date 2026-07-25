// ======================== 公共 API（需要文档） ========================

// 信号创建
export {
  ref,
  shallowRef,
  reactive,
  shallowReactive,
  computed,
  readonly,
  shallowReadonly
} from '@vitarx/responsive'

// 信号转换
export { toRef, toRefs, toValue, unref, toRaw, markRaw } from '@vitarx/responsive'

// 类型判断
export { isRef, isReactive, isReadonly, isComputed } from '@vitarx/responsive'

// 观察器
export { watch, watchEffect, watchPostEffect, watchSyncEffect } from '@vitarx/responsive'

// 作用域
export { EffectScope, onScopeDispose, onScopePause, onScopeResume } from '@vitarx/responsive'

// 调度
export { nextTick } from '@vitarx/responsive'

// 工具
export { untrack, untracked } from '@vitarx/responsive'

// 公共类型
export type {
  Ref,
  Reactive,
  ShallowReactive,
  ReadonlyObject,
  ComputedGetter,
  ComputedSetter,
  CompareFunction,
  DebuggerEvent,
  DebuggerHandler,
  FlushMode,
  WatchCallback,
  WatcherOnCleanup,
  WatchOptions,
  WatchSource,
  EffectScopeOptions,
  DebuggerOptions,
  ToRef,
  UnwrapRef,
  UnwrapRefs,
  DeepUnwrapRefs
} from '@vitarx/responsive'

// 公共类
export { Computed, Watcher, Effect } from '@vitarx/responsive'

// ======================== 进阶 API（不需要文档） ========================

// 进阶常量
export { IS_RAW, IS_REACTIVE, IS_READONLY, IS_REF, IS_SIGNAL, RAW_VALUE } from '@vitarx/responsive'

// 进阶 API
export {
  flushSync,
  addToActiveScope,
  bindDebuggerOptions,
  clearAllJobs,
  clearEffectLinks,
  clearSignalLinks,
  createDepLink,
  createScope,
  destroyDepLink,
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
  Scheduler,
  Signal,
  SignalOpType,
  RawObject,
  RawValue,
  RefSignal,
  ToRefValue,
  UnwarpSources
} from '@vitarx/responsive'

// 进阶类
export { GetterRef, PropertyRef, ShallowRef, ValueRef } from '@vitarx/responsive'
