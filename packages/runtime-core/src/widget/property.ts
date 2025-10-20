import {
  type BaseSignal,
  type CanWatchProperty,
  isRefSignal,
  isSignal,
  Ref,
  shallowRef,
  type SignalToRaw,
  Subscriber,
  toRaw,
  useCurrentScope,
  watch,
  type WatchCallback,
  type WatchOptions,
  watchProperty
} from '@vitarx/responsive'

/**
 * 属性变化监听函数
 *
 * 使用 `onPropChange` 来对支持RefSinal的属性进行监听，它内部自动处理了信号/非信号属性的监听逻辑。
 *
 * 如果你无需在逻辑层依赖属性值进行特殊处理，请使用 `watchProperty` 来监听属性变化，它更加轻量高效。
 *
 * @example
 * ```tsx
 * interface Props {
 *   title: RefSignal<string> | string
 * }
 * function MyComponent(props: Props) {
 *   // ❌ 假设在父组件中修改了title.value的值，这里的回调函数是不会被执行的
 *   watchProperty(props,'title', () => {})
 *   // ✅ 支持 title 从 ref <-> 非 ref 之间的转换，确保能够监听到变化
 *   onPropChange(props,'title', (newValue, oldValue) => {
 *     console.log('title changed:', newValue, oldValue)
 *   })
 *   return (
 *     <div>{props.title}</div>
 *   )
 * }
 * ```
 *
 * @param props - 属性对象
 * @param propName - 属性名称
 * @param callback - 属性变化回调函数
 * @param immediateOrWatchOptions - immediate选项或监听选项对象
 * @returns {()=>void} - 销毁监听器，在组件销毁时会自动销毁，通常无需手动调用。
 */
export function onPropChange<T extends {}, K extends keyof T>(
  props: T, // 泛型T表示传入的对象类型，K表示对象中的属性键类型
  propName: K, // 需要监听的属性名称，必须是T的键之一
  callback: (newValue: SignalToRaw<T[K]>, oldValue: SignalToRaw<T[K]>) => void, // 回调函数，接收新值和旧值作为参数
  immediateOrWatchOptions: boolean | Omit<WatchOptions, 'scope'> = false // 监听选项，用于配置监听行为
): () => void {
  const scope = useCurrentScope()
  if (!scope) throw new Error('scope is not defined')
  // 当前记录的“原始”旧值（用于回调）
  let oldValue = toRaw(props[propName]) as SignalToRaw<T[K]>
  // 可能存在的两个订阅：监听属性引用变化的订阅（始终有，用于检测 signal <-> 非 signal）
  // 和当属性是 signal 时额外建立的对 signal 内部值的订阅
  let propSubscriber: Subscriber | null = null
  let signalSubscriber: Subscriber | null = null
  let disposed = false
  const options: WatchOptions =
    typeof immediateOrWatchOptions === 'boolean'
      ? {
          immediate: immediateOrWatchOptions,
          scope: false
        }
      : { ...immediateOrWatchOptions, scope: false }
  const tryDispose = (type: 'prop' | 'signal') => {
    const sub = type === 'prop' ? propSubscriber : signalSubscriber
    if (sub) {
      sub.dispose()
      if (type === 'prop') {
        propSubscriber = null
      } else {
        signalSubscriber = null
      }
    }
  }

  // 当 props[propName] 是 signal 时，建立对 signal 内部值的监听
  const attachSignalWatcher = (signal: BaseSignal) => {
    // 先销毁已有的 signal 订阅（防止重复）
    tryDispose('signal')
    // watch(signal, ...) —— 回调中读取最新的原始值并触发用户回调
    signalSubscriber = watch(
      signal,
      () => {
        const newValue = toRaw(signal) as SignalToRaw<T[K]>
        callback(newValue, oldValue)
        oldValue = newValue
      },
      options
    )
  }

  // 当属性引用发生变化（signal 对象被替换或被赋非 signal）时触发
  propSubscriber = watchProperty(
    props,
    propName as unknown as CanWatchProperty<T>,
    () => {
      const current = props[propName]
      // 切换 refSignal 订阅（如果需要）
      if (isRefSignal(current)) {
        attachSignalWatcher(current)
      } else {
        tryDispose('signal')
      }
      // 属性引用本身变化也应当触发回调（新值 vs 旧值）
      const newValue = toRaw(current) as SignalToRaw<T[K]>
      callback(newValue, oldValue)
      oldValue = newValue
    },
    options
  )

  // 根据初始值决定是否需要建立 signal watcher
  if (isSignal(props[propName])) {
    attachSignalWatcher(props[propName])
  }
  const dispose = () => {
    if (disposed) return
    disposed = true
    tryDispose('prop')
    tryDispose('signal')
  }
  // 作用域自动管理
  scope.onPause(() => {
    propSubscriber?.pause()
    signalSubscriber?.pause()
  })
  scope.onResume(() => {
    propSubscriber?.resume()
    signalSubscriber?.resume()
  })
  scope.onDispose(dispose)
  // 返回 dispose 销毁函数
  return dispose
}

/**
 * 使用属性&双向绑定
 *
 * 此工具函数会创建一个新的ref来引用属性，并与属性进行双向绑定。
 *
 * 只有在外部传入的属性值是一个`RefSignal`(ref创建的变量)时，才会将变化更新到外部传入的信号中。
 *
 * @example
 * ```tsx
 * interface Props {
 *   value: RefSignal<number>,
 *   onChange?: (newValue: number) => void
 * }
 * function Counter(props: Props) {
 *   const count = useTwoWayBind(props, 'value',(newValue)=>{
 *      // 如果计数变化，则触发 onChange 回调
 *      if (props.onChange) props.onChange(newValue)
 *   })
 *   return (
 *     <div onClick={()=>count.value++}>{count}</div>
 *   )
 * }
 * ```
 *
 * @param props - 属性对象
 * @param propName - 属性名称
 * @param [onChange] - 属性变化回调函数
 *
 */
export function useProperty<T extends {}, K extends keyof T>(
  props: T,
  propName: K,
  onChange?: WatchCallback<T[K]>
): Ref<SignalToRaw<T[K]>, false> {
  const value = shallowRef<SignalToRaw<T[K]>>(toRaw(props[propName]))
  onPropChange(
    props,
    propName,
    newValue => {
      value.value = newValue
    },
    true
  )
  watch(value, (newValue, oldValue, onCleanup) => {
    if (isRefSignal(props[propName]) && props[propName].value !== newValue) {
      // 双向同步
      props[propName].value = newValue
    }
    if (typeof onChange === 'function') onChange(newValue, oldValue, onCleanup)
  })
  return value
}
