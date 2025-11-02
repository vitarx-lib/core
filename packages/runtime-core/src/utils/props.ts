import type { WatchOptions } from '@vitarx/responsive'
import { Subscriber, watchProperty } from '@vitarx/responsive'

/**
 * 监听props属性变化的函数
 *
 * @template T - props类型
 * @template K - props的键类型，必须是T的键之一
 * @param {T} props - 需要监听的props对象
 * @param {K} propName - 需要监听的属性名
 * @param {Function} callback - 属性变化时的回调函数
 * @param {boolean | Omit<WatchOptions, 'scope'>} [immediateOrWatchOptions=false] - 监听选项，可以是布尔值或WatchOptions对象
 * @returns {Subscriber} 返回订阅者对象，可用于取消订阅
 */
export function onPropChange<T extends {}, K extends keyof T>(
  props: T,
  propName: K,
  callback: (newValue: T[K], oldValue: T[K]) => void,
  immediateOrWatchOptions: boolean | Omit<WatchOptions, 'scope'> = false
): Subscriber {
  // 当前记录的“原始”旧值（用于回调）
  let oldValue = props[propName]
  const options: WatchOptions =
    typeof immediateOrWatchOptions === 'boolean'
      ? {
          immediate: immediateOrWatchOptions
        }
      : { ...immediateOrWatchOptions }
  return watchProperty(
    props,
    propName as any,
    () => {
      const newValue = props[propName]
      callback(newValue, oldValue)
      oldValue = newValue
    },
    options
  )
}
