import { isArray, isMap, isNumber, isPlainObject, isSet } from '@vitarx/utils'
import { isFunction, logger } from '@vitarx/utils/src/index.js'
import { trackSignal } from '../depend/index.js'
import { IS_REACTIVE, isReactive, toRaw } from '../signal/implement/reactive/index.js'
import { ReactiveSignal } from '../signal/implement/reactive/proxy/base.js'
import { isRef } from '../signal/implement/ref/helpers.js'
import { isSignal, readSignal } from '../signal/index.js'
import type { Reactive, WatchCallback, WatchOptions, WatchSource } from '../types/index.js'
import { SignalWatcher } from './SignalWatcher.js'
import { ValueWatcher } from './ValueWatcher.js'
import { Watcher } from './Watcher.js'

/**
 * 遍历响应式代理对象
 *
 * @param value
 * @param depth
 * @param seen
 */
function traverse<T>(
  value: T,
  depth: number = Infinity,
  seen: Map<Reactive, number> = new Map()
): T {
  if (depth <= 0 || !isReactive(value)) return value

  const reactive = value as unknown as Reactive
  const signal = reactive[IS_REACTIVE] as ReactiveSignal<any>

  // 强制跟踪结构信号
  trackSignal(signal, 'watch-force-track')

  const prevDepth = seen.get(reactive)
  if (prevDepth !== undefined && prevDepth >= depth) {
    return value
  }
  seen.set(reactive, depth)

  // ⚠️ 是否允许继续进入「子 reactive」
  const allowDeepReactive = signal.deep
  const nextDepth = depth - 1

  if (isRef(value)) {
    const v = value.value
    // ref.value 本身不是 reactive proxy，直接递归
    traverse(v, nextDepth, seen)
    return value
  }

  if (isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      const item = value[i]
      // 如果是 reactive，是否继续取决于 deep
      if (!allowDeepReactive && isReactive(item)) continue
      traverse(item, nextDepth, seen)
    }
    return value
  }

  if (isSet(value) || isMap(value)) {
    value.forEach(v => {
      if (!allowDeepReactive && isReactive(v)) return
      traverse(v, nextDepth, seen)
    })
    return value
  }

  if (isPlainObject(value)) {
    for (const key in value) {
      const v = value[key]
      if (!allowDeepReactive && isReactive(v)) continue
      traverse(v, nextDepth, seen)
    }

    const symbols = Object.getOwnPropertySymbols(value)
    for (let i = 0; i < symbols.length; i++) {
      const key = symbols[i]
      if (Object.prototype.propertyIsEnumerable.call(value, key)) {
        const v = value[key]
        if (!allowDeepReactive && isReactive(v)) continue
        traverse(v, nextDepth, seen)
      }
    }
  }

  return value
}
const logWarn = (value: any, title: string = '') => {
  logger.warn(
    `[watch()] Invalid watch source: ${title}`,
    value,
    `A watch source can only be a getter/effect function, a signal, a reactive object, or an array of these types.`
  )
}
/**
 * 创建一个观察器，用于监听源数据变化并执行回调函数
 *
 * @param source - 源数据，可以是一个信号、一个 getter 函数、一个 reactive 对象、包含多个有效源的数组。
 * @param cb - 回调函数，接收三个参数：新值、旧值和清理函数
 * @param options - 可选的配置项，用于控制观察器的行为
 * @param [options.flush = 'pre'] - 调度模式
 * @param [options.onTrigger] - 调试钩子，在依赖发生变化时触发
 * @param [options.onTrack] - 调试钩子，在跟踪依赖时触发
 * @param [options.once] - 是否只执行一次
 * @param [options.immediate = false] - 是否执行回调函数
 * @param [options.scope = true] - 是否在组件作用域内执行回调函数
 *
 * @returns {Watcher} 返回一个 Watcher 实例，可以用于手动停止观察
 */
export function watch<T>(
  source: WatchSource<T>,
  cb: WatchCallback<T, true>,
  options: WatchOptions = {}
): Watcher {
  const { immediate = false, deep = false, once = false, ...watcherOptions } = options
  if (once) {
    cb = (newValue, oldValue, onCleanup) => {
      cb(newValue, oldValue, onCleanup)
      watcher.dispose()
    }
  }
  let watcher: Watcher
  if (isSignal(source)) {
    watcher = new SignalWatcher(source, cb as any, watcherOptions)
  } else if (typeof source === 'function') {
    watcher = new ValueWatcher(source, cb as any, watcherOptions)
  } else if (isReactive(source)) {
    const depth = isNumber(deep) ? deep : deep ? Infinity : 1
    watcher = new ValueWatcher(() => traverse(source, depth), cb as any, watcherOptions)
    // 强制触发回调
    ;(watcher as ValueWatcher<any>).compare = () => false
  } else if (isArray(source)) {
    const getter = () =>
      (source as any[]).map((s: any, index) => {
        if (isSignal(s)) {
          return readSignal(s)
        } else if (isReactive(s)) {
          traverse(s)
          return toRaw(s)
        } else if (isFunction(s)) {
          return (s as any)()
        }
        console.log(s, `[...${index}]`)
        return s
      }) as T
    watcher = new ValueWatcher(getter, cb as any, watcherOptions)
    ;(watcher as ValueWatcher<any>).compare = () => false
  } else {
    console.log(source)
    return new ValueWatcher(() => source as T, cb as any, watcherOptions)
  }
  if (immediate) watcher.execute()
  return watcher
}
