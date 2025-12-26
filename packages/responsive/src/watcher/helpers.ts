import { isArray, isCollection, isFunction, isNumber, isPlainObject, logger } from '@vitarx/utils'
import { trackSignal } from '../core/index.js'
import {
  IS_REACTIVE,
  isReactive,
  isRef,
  isRefSignal,
  type RAW_VALUE,
  type Ref
} from '../signals/index.js'
import type { Reactive, ShallowReactive } from '../signals/reactive/base.js'
import { SignalWatcher } from './SignalWatcher.js'
import type { UnwarpSources, WatchCallback, WatchOptions, WatchSource } from './types.js'
import type { ValueChangeWatcher } from './ValueChangeWatcher.js'
import { ValueWatcher } from './ValueWatcher.js'
import { Watcher } from './Watcher.js'

/**
 * 属性是否可枚举
 */
const isEnumerable = Object.prototype.propertyIsEnumerable
/**
 * 递归遍历响应式代理对象，用于深度观察其内部属性变化
 *
 * 该函数会触发响应式对象的依赖追踪，确保嵌套的响应式属性也能被观察到。
 * 同时处理循环引用问题，避免无限递归。
 *
 * @template T - 遍历值的类型
 * @param {T} value - 要遍历的响应式值
 * @param {number} [depth=Infinity] - 遍历深度限制，默认无限深度
 * @param {Map<Reactive | ShallowReactive, number>} [seen=new Map()] - 用于检测循环引用的映射表
 * @returns {T} 返回原始值（遍历过程仅用于触发依赖追踪，不修改值）
 */
const traverse = <T>(
  value: T,
  depth: number = Infinity,
  seen: Map<Reactive | ShallowReactive, number> = new Map()
): T => {
  // 深度耗尽或非响应式对象，直接返回
  if (depth <= 0 || !isReactive(value)) return value
  const reactiveObject = value as unknown as Reactive | ShallowReactive
  const signal = reactiveObject[IS_REACTIVE]
  // 强制跟踪响应式对象的信号，确保其变化能被监听到
  trackSignal(signal, 'watch-force-track')
  // 集合类型不需要深度遍历
  if (isCollection(reactiveObject)) return value
  // 检查循环引用：如果已处理过该对象且深度不小于当前深度，直接返回
  const prevDepth = seen.get(reactiveObject)
  if (prevDepth !== undefined && prevDepth >= depth) {
    return value
  }
  // 记录当前对象的遍历深度
  seen.set(reactiveObject, depth)

  // 判断是否允许深度遍历子响应式对象（由响应式对象自身的 deep 配置决定）
  const allowDeepReactive = signal.deep
  const nextDepth = allowDeepReactive ? depth - 1 : -1

  // 处理数组类型：遍历数组元素
  if (isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      traverse(value[i], nextDepth, seen)
    }
    return value
  }

  // 处理纯对象类型：遍历所有可枚举属性（包括符号属性）
  if (isPlainObject(value)) {
    // 遍历字符串键属性
    for (const key in value) {
      traverse(value[key as keyof typeof value], nextDepth, seen)
    }

    // 遍历符号键属性
    const symbols = Object.getOwnPropertySymbols(value)
    for (let i = 0; i < symbols.length; i++) {
      const key = symbols[i]
      // 只处理可枚举的符号属性
      if (isEnumerable.call(value, key)) {
        traverse(value[key as keyof typeof value], nextDepth, seen)
      }
    }
  }

  return value
}

/**
 * 输出无效监听源的警告日志
 *
 * @param {any} value - 无效的监听源数据
 * @param {string} [title=''] - 警告标题前缀，用于定位错误源
 */
const logWarn = (value: any, title: string = '') => {
  logger.warn(
    `[watch()] Invalid watch source: ${title}`,
    value,
    `A watch source can only be a getter/effect function, a signal, a reactive object, or an array of these types.`
  )
}

/**
 * 监听 Ref 对象的变化
 *
 * @template T - Ref 对象的类型
 * @param {T} ref - 要监听的 Ref 对象
 * @param {WatchCallback<T['value']>} cb - 变化回调函数
 * @param {WatchOptions} [options] - 监听配置项
 * @returns {Watcher} Watcher 实例，可调用 dispose() 停止监听
 * @example
 * const count = ref(0)
 * watch(count, (newVal, oldVal) => {
 *   console.log(`count changed from ${oldVal} to ${newVal}`)
 * })
 * count.value++ // 触发回调
 */
export function watch<T extends Ref>(
  ref: T,
  cb: WatchCallback<T['value']>,
  options?: WatchOptions
): Watcher

/**
 * 监听响应式对象的变化
 *
 * @template T - 响应式对象的类型
 * @param {T} target - 要监听的响应式对象
 * @param {WatchCallback<T[typeof RAW_VALUE]>} cb - 变化回调函数
 * @param {WatchOptions} [options] - 监听配置项
 * @param {boolean} [options.deep=false] - 是否深度监听嵌套属性
 * @returns {Watcher} Watcher 实例，可调用 dispose() 停止监听
 * @example
 * const state = reactive({ count: 0 })
 * watch(state, (newVal, oldVal) => {
 *   console.log('state changed', newVal, oldVal)
 * }, { deep: true })
 * state.count++ // 触发回调
 */
export function watch<T extends Reactive | ShallowReactive>(
  target: T,
  cb: WatchCallback<T[typeof RAW_VALUE]>,
  options?: WatchOptions
): Watcher

/**
 * 监听多个数据源的变化
 *
 * @template T - 数据源数组的类型
 * @param {T} sources - 数据源数组（可包含 Ref、响应式对象、getter 函数）
 * @param {WatchCallback<UnwarpSources<T>>} cb - 变化回调函数，参数为新值数组和旧值数组
 * @param {WatchOptions} [options] - 监听配置项
 * @returns {Watcher} Watcher 实例，可调用 dispose() 停止监听
 * @example
 * const firstName = ref('John')
 * const lastName = ref('Doe')
 * watch([firstName, lastName], ([newFirst, newLast], [oldFirst, oldLast]) => {
 *   console.log(`${oldFirst} ${oldLast} -> ${newFirst} ${newLast}`)
 * })
 * firstName.value = 'Jane' // 触发回调
 */
export function watch<T extends any[]>(
  sources: T,
  cb: WatchCallback<UnwarpSources<T>>,
  options?: WatchOptions
): Watcher

/**
 * 监听 getter 函数返回值的变化
 *
 * @template T - getter 函数返回值的类型
 * @param {() => T} getter - 返回监听值的函数，函数内部会追踪响应式依赖
 * @param {WatchCallback<T>} cb - 变化回调函数
 * @param {WatchOptions} [options] - 监听配置项
 * @returns {Watcher} Watcher 实例，可调用 dispose() 停止监听
 * @example
 * const state = reactive({ count: 1 })
 * watch(() => state.count, (newVal, oldVal) => {
 *   console.log(`count changed: ${oldVal} -> ${newVal}`)
 * }, { immediate: true })
 */
export function watch<T>(getter: () => T, cb: WatchCallback<T>, options?: WatchOptions): Watcher

/**
 * 通用监听函数，支持多种数据源类型
 *
 * 核心功能：监听响应式数据变化并执行回调。支持的数据源类型包括：
 * - Ref 对象
 * - 响应式对象 (Reactive/ShallowReactive)
 * - Getter 函数
 * - 上述类型的数组
 *
 * @template T - 监听值的类型
 * @param {WatchSource<T>} source - 监听源
 * @param {WatchCallback<T>} cb - 变化回调函数，接收新值、旧值和清理函数
 * @param {WatchOptions} [options={}] - 监听配置项
 * @param {'pre' | 'post' | 'sync'} [options.flush='pre'] - 回调执行时机：
 *   - 'pre': DOM 更新前执行
 *   - 'post': DOM 更新后执行
 *   - 'sync': 同步执行
 * @param {Function} [options.onTrigger] - 调试钩子，依赖变化触发回调时调用
 * @param {Function} [options.onTrack] - 调试钩子，追踪依赖时调用
 * @param {boolean} [options.once=false] - 是否只执行一次回调
 * @param {boolean} [options.immediate=false] - 是否立即执行一次回调（初始监听时）
 * @param {boolean} [options.scope=true] - 是否绑定到组件作用域
 * @param {boolean | number} [options.deep=false] - 是否深度监听，可指定深度数值
 * @returns {Watcher} Watcher 实例，调用 dispose() 可停止监听
 */
export function watch<T>(
  source: WatchSource<T>,
  cb: WatchCallback<T>,
  options: WatchOptions = {}
): Watcher {
  // 解构配置项，设置默认值
  const { immediate = false, deep = false, once = false, ...watcherOptions } = options

  let watcher: ValueChangeWatcher<T>

  // 处理 once 配置：执行一次后自动停止监听
  if (once) {
    const originalCb = cb
    cb = (newValue, oldValue, onCleanup) => {
      try {
        originalCb(newValue, oldValue, onCleanup)
      } finally {
        // 执行完成后销毁监听
        watcher.dispose()
      }
    }
  }

  // 处理 RefSignal 类型数据源
  if (isRefSignal(source)) {
    watcher = new SignalWatcher(source, cb as any, watcherOptions)
    // 立即执行回调
    if (immediate) watcher.runCallback(watcher.value)
    return watcher
  }

  // 构建 getter 函数，统一不同数据源的访问方式
  let getter: () => any
  let forceUpdate: boolean = false

  // 1. Getter 函数类型
  if (typeof source === 'function') {
    getter = source
  }
  // 2. Ref 对象类型
  else if (isRef(source)) {
    getter = () => source.value
  }
  // 3. 响应式对象类型
  else if (isReactive(source)) {
    // 确定遍历深度：数字类型直接使用，布尔类型转换为无限深度/1层
    const depth = isNumber(deep) ? deep : deep ? Infinity : 1
    getter = () => traverse(source, depth)
    // 响应式对象强制触发更新（不进行值比较）
    forceUpdate = true
  }
  // 4. 数组类型（多数据源）
  else if (isArray(source)) {
    const depth = isNumber(deep) ? deep : deep ? Infinity : 1
    getter = () =>
      (source as any[]).map((s: any, index) => {
        if (isRef(s)) {
          return s.value
        } else if (isReactive(s)) {
          // 遍历响应式对象以触发依赖追踪
          traverse(s, depth)
          // 返回原始值而非代理对象
          return s[IS_REACTIVE].target
        } else if (isFunction(s)) {
          // 执行 getter 函数
          return (s as any)()
        }
        // 无效的数据源类型，输出警告
        logWarn(s, `[...${index}]`)
        return s
      })
  }
  // 5. 无效的数据源类型
  else {
    logWarn(source)
    getter = () => source
  }

  // 创建值监听器
  watcher = new ValueWatcher(getter, cb, watcherOptions)

  // 响应式对象强制更新（跳过值比较）
  if (forceUpdate) watcher.compare = () => false

  // 立即执行回调
  if (immediate) watcher.runCallback(watcher.value)

  return watcher
}
