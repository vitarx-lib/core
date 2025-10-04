import {
  type BaseSignal,
  type CanWatchProperty,
  isSignal,
  type SignalToRaw,
  Subscriber,
  toRaw,
  useCurrentScope,
  watch,
  type WatchOptions,
  watchProperty
} from '@vitarx/responsive'
import { isVNode } from '../vnode/guards.js'
import { type VNode } from '../vnode/index.js'
import { CLASS_WIDGET_BASE_SYMBOL, SIMPLE_FUNCTION_WIDGET_SYMBOL } from './constant.js'
import type {
  AnyProps,
  BuildVNode,
  ClassWidget,
  FunctionWidget,
  SimpleWidget,
  TsFunctionWidget
} from './types/index.js'

/**
 * 标记一个简单的小部件
 *
 * 通常在实际的项目开发中你可能会很少用到它，简单函数通常存在于组件库中，
 * 因为大部分组件可能只是提供了一些ui样式，并不需要生命周期，以及状态管理。
 *
 * 它只能做简单的视图构建工作，没有生命周期，不要在其内部存在任何副作用，包括但不限于：生命周期钩子，定时器，监听器，计算属性。
 *
 * ```tsx
 * interface Props {
 *   title: string,
 *   color?: string
 * }
 * // 构建一个简单的小部件，它内部不包含任何副作用代码，也没有生命周期钩子
 * const Title = markSimpleWidget(({title,color}:Props) => {
 *   // 对属性参数做一些处理
 *   color = color || 'black'
 *   // 返回需要渲染的元素
 *   return <h1 style={{color}}>{title}</div>
 * })
 * export default function App() {
 *   return <Title title="Hello Vitarx" color="red" />
 * }
 * ```
 *
 * @param build - 视图构建器，通过函数返回要渲染的视图虚拟节点
 * @returns {SimpleWidget} - 简单小部件
 */
export function markSimpleWidget<T extends AnyProps, R extends VNode | null>(
  build: (props: T) => R
): SimpleWidget<T, R> {
  Object.defineProperty(build, SIMPLE_FUNCTION_WIDGET_SYMBOL, { value: true })
  return build as SimpleWidget<T, R>
}

export { markSimpleWidget as defineSimpleWidget }

/**
 * 判断是否为简单小部件
 *
 * @param {any} fn - 小部件
 * @returns {boolean} - true 表示为简单小部件
 */
export function isSimpleWidget(fn: any): fn is SimpleWidget {
  return typeof fn === 'function' && SIMPLE_FUNCTION_WIDGET_SYMBOL in fn
}

/**
 * 导出小部件
 *
 * 负责将不被tsx兼容的小部件类型，重载为tsx兼容的小部件。
 *
 * 只是一个语法糖，重载了类型，实际上并不会对小部件进行任何处理，编译时会被编译器自动移除。
 *
 * @template P - 小部件的属性类型
 * @param {FunctionWidget<P>} fn - 小部件
 * @returns {TsFunctionWidget<P>} - 导出的小部件
 */
export function exportWidget<P extends AnyProps>(fn: FunctionWidget<P>): TsFunctionWidget<P> {
  return fn as TsFunctionWidget<P>
}

/**
 * 检查一个值是否是ClassWidget类型的实例
 * 这是一个类型谓词函数，用于类型收窄
 *
 * @param val 需要检查的值
 * @returns {boolean} 如果值是类Widget构造函数类型返回true，否则返回false
 */
export function isClassWidget(val: any): val is ClassWidget {
  // 使用可选链操作符安全地访问对象的CLASS_WIDGET_BASE_SYMBOL属性
  // 并检查其值是否为true
  return val?.[CLASS_WIDGET_BASE_SYMBOL] === true
}

/**
 * ## 视图构建器。
 *
 * > 注意：在类小部件中不要使用`build`函数，类中的build方法就是构建器。
 *
 * 一般情况编译器会自动添加`()=>`，但是使用了三元运算符或包裹在了if块中则无法添加，
 * 所以需要使用返回`()=>Element`来保证响应式，但是这样做tsx会不认可返回()=>Element的函数做为组件，特此声明了此方法。
 *
 * 在编译时会自动去除build调用表达式
 *
 * ```tsx
 * const App = () => {
 *  const show = ref(true)
 *  // ❌ 这样写编译器不会自动添加 () => 会导致视图是静态的，丢失响应式
 *  return state.value ? <div>真</div> : <div>假</div>
 *  // ✅ 这样写只是强制转换了类型，在编译时 build会被自动去除
 *  return build(() => show.value ? <div>真</div> : <div>假</div>)
 * }
 * export default App
 * ```
 *
 * @param element - 虚拟节点对象|视图构建器函数|null
 * @returns - 为了符合TSX类型校验，会将视图构建器函数重载为VNode类型
 * @throws TypeError - 如果传入的参数不符合要求，则会抛出TypeError异常
 */
export function build<T extends BuildVNode>(element: T): T extends null ? null : VNode {
  if (element === null) return null as any
  if (typeof element === 'function') return element as any
  if (isVNode(element)) return element as any
  throw new TypeError('[Vitarx.build]：函数组件返回值只能是null、VNode、() => VNode | null')
}

/**
 * 属性变化监听函数
 *
 * 当给组件接收的属性值支持信号时，
 * 如果传入的是一个信号（例如ref,reactive创建的信号对象）直接监听watch(props,...)是无效的。
 * 因为props是一个浅层信号对象，监听不到深层次的变化,
 * 所以我们可以使用 `onPropChange` 来对属性进行监听，它内部自动处理了信号/非信号属性的监听逻辑。
 *
 * @example
 * ```tsx
 * interface Props {
 *   title: PropValue<string>
 * }
 * function MyComponent(props: Props) {
 *   // 假设在App中修改了title.value的值，这里的回调函数是不会被执行的
 *   watchProperty(props,'title', () => {})
 *   // 通过onPropChange就能够完美的监听属性变化
 *   onPropChange(props,'title', (newValue, oldValue) => {
 *     console.log('title changed:', newValue, oldValue)
 *   })
 *   return (
 *     <div>{props.title}</div>
 *   )
 * }
 * function App() {
 *   const title = ref('Hello World')
 *   return (<MyComponent>{title}</MyComponent>)
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
      // 切换 signal 订阅（如果需要）
      if (isSignal(current)) {
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
