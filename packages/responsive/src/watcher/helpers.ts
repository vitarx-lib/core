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
import { EffectWatcher } from './effect.js'
import { GetterWatcher } from './getter.js'
import { RefSignalWatcher } from './ref.js'
import type {
  UnwarpSources,
  WatchCallback,
  WatcherOnCleanup,
  WatchOptions,
  WatchSource
} from './types.js'
import type { ValueWatcher } from './value.js'
import { Watcher, type WatcherOptions } from './watcher.js'

/**
 * 属性是否可枚举
 */
const isEnumerable = Object.prototype.propertyIsEnumerable
/**
 * 递归遍历响应式代理对象，用于深度追踪内部属性变化
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
    // 记录数组长度，避免迭代时条件判断重复跟踪长度，优化性能
    const length = value.length
    for (let i = 0; i < length; i++) {
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
 *
 * @example
 * ```ts
 * // 基本用法 - 监听ref
 * const count = ref(0);
 * watch(count, (newVal, oldVal) => {
 *   console.log(`count changed from ${oldVal} to ${newVal}`);
 * });
 * count.value++; // 触发回调
 *
 * // Vue类比：类似于Vue 3中的watch
 * // Vue 3: watch(() => state.count, (newVal, oldVal) => {...})
 * watch(() => state.count, (newVal, oldVal) => {
 *   console.log(`count changed from ${oldVal} to ${newVal}`);
 * });
 *
 * // 监听getter函数
 * const state = reactive({ count: 1 });
 * watch(() => state.count, (newVal, oldVal) => {
 *   console.log(`count changed: ${oldVal} -> ${newVal}`);
 * }, { immediate: true });
 *
 * // 监听多个数据源
 * const firstName = ref('John');
 * const lastName = ref('Doe');
 * watch([firstName, lastName], ([newFirst, newLast], [oldFirst, oldLast]) => {
 *   console.log(`${oldFirst} ${oldLast} -> ${newFirst} ${newLast}`);
 * });
 *
 * // 深度监听
 * const obj = reactive({ nested: { value: 1 } });
 * watch(obj, (newObj, oldObj) => {
 *   console.log('obj changed', newObj);
 * }, { deep: true });
 *
 * // 监听选项
 * watch(count, (newVal, oldVal) => {
 *   console.log('count changed');
 * }, { once: true }); // 只执行一次
 *
 * // 使用清理函数
 * watch(
 *   () => props.id,
 *   (newId, oldId, onCleanup) => {
 *     let timer = setTimeout(() => {
 *       console.log('timer executed');
 *     }, 1000);
 *
 *     onCleanup(() => {
 *       clearTimeout(timer); // 在下次回调前清理
 *     });
 *   }
 * );
 * ```
 */
export function watch<T>(
  source: WatchSource<T>,
  cb: WatchCallback<T>,
  options: WatchOptions = {}
): Watcher {
  // 解构配置项，设置默认值
  const { immediate = false, deep = false, once = false, ...watcherOptions } = options

  let watcher: ValueWatcher<T>

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
    watcher = new RefSignalWatcher(source, cb as any, watcherOptions)
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
  watcher = new GetterWatcher(getter, cb, watcherOptions)

  // 响应式对象强制更新（跳过值比较）
  if (forceUpdate) watcher.compare = () => false

  // 立即执行回调
  if (immediate) watcher.runCallback(watcher.value)

  return watcher
}

/**
 * 创建一个副作用效果观察器
 *
 * 当依赖的响应式数据变化时自动执行副作用
 *
 * @param effect - 一个回调函数，接收一个 onCleanup 函数作为参数，用于清理副作用
 * @param [options] - 可选配置项，用于控制观察器的行为
 * @param [options.flush = 'pre'] - 调度模式
 * @param [options.onTrigger] - 调试钩子，在依赖发生变化时触发
 * @param [options.onTrack] - 调试钩子，在跟踪依赖时触发
 *
 * @returns {EffectWatcher} 返回一个 EffectWatcher 实例，可以用于手动停止观察
 *
 * @example
 * ```ts
 * // 基本用法
 * const count = ref(0);
 *
 * watchEffect(() => {
 *   console.log('count changed:', count.value);
 * });
 *
 * // Vue类比：类似于Vue 3中的watchEffect
 * // Vue 3: watchEffect(() => { console.log('count changed:', count.value); })
 *
 * count.value++; // 输出: count changed: 1
 *
 * // 使用清理函数
 * watchEffect((onCleanup) => {
 *   const timer = setTimeout(() => {
 *     console.log('timeout executed');
 *   }, 1000);
 *
 *   onCleanup(() => {
 *     clearTimeout(timer); // 在下次执行前清理之前的定时器
 *     console.log('cleanup executed');
 *   });
 * });
 *
 * // 与watch的区别示例
 * const state = reactive({
 *   firstName: 'John',
 *   lastName: 'Doe'
 * });
 *
 * // watchEffect - 立即执行并自动追踪依赖
 * watchEffect(() => {
 *   console.log(`Full name: ${state.firstName} ${state.lastName}`);
 * });
 *
 * // watch - 需要显式指定监听源
 * watch(
 *   () => state.firstName,
 *   (newVal, oldVal) => {
 *     console.log(`First name changed: ${oldVal} -> ${newVal}`);
 *   }
 * );
 *
 * // 传递选项
 * watchEffect(
 *   () => {
 *     console.log('executed');
 *   },
 *   {
 *     flush: 'post', // DOM更新后执行
 *     onTrigger: (event) => console.log('triggered', event),
 *     onTrack: (event) => console.log('tracked', event)
 *   }
 * );
 * ```
 */
export function watchEffect(
  effect: (onCleanup: WatcherOnCleanup) => void,
  options?: WatcherOptions
): EffectWatcher {
  // 返回一个观察器实例
  return new EffectWatcher(effect, options)
}
