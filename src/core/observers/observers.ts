import Listener from './listener.js'
import { ExtractProp, PropName, Reactive, Ref } from '../variable'
import { AnyCallback, AnyObject } from '../../types/common'
import { isArray, isFunction } from '../../utils'

/** 所有改变事件监听标识 */
const ALL_CHANGE_SYMBOL = Symbol('ALL_CHANGE_SYMBOL')
/** 所有改变事件监听标识类型 */
type AllChangeSymbol = typeof ALL_CHANGE_SYMBOL
/** 监听源，一般是 `ref` | `reactive` 创建的对象 */
type Origin = Ref<any> | Reactive<AnyObject> | AnyObject
/**
 * 根据 WatchOptions 的 onProp 计算 Callback 的 P 参数类型
 */
type ComputeProps<
  T extends object,
  O extends WatchOptions<T>
> = O['onProp'] extends ExtractProp<T>[]
  ? O['onProp'][number]
  : O['onProp'] extends ExtractProp<T>
    ? O['onProp']
    : ExtractProp<T>[]
/**
 * 回调函数类型
 *
 * 如果监听的是对象，则prop为变化的属性名数组，如果监听的是对象属性，则prop为变化的属性名称（单个属性名）
 */
type Callback<T extends Origin, P extends PropName | PropName[]> = (prop: P, origin: T) => void

/**
 * ## 监听器选项
 *
 * - limit: 限制回调函数调用次数，默认为0，不限制，当为1时，表示只调用一次，当为2时，表示调用两次，以此类推。
 * - isBatch: 是否采用批处理，默认为true，谨慎设置为false，假设监听的是一个数组，设置为false时，当执行array.slice等方法会触发多次回调。
 * - onProp: 监听的属性名，当监听的属性发生变化时，回调函数才会被调用，不传则监听对象的所有变化。
 */
interface WatchOptions<T extends object> {
  /**
   * 限制回调函数调用次数，默认为0，不限制，当为1时，表示只调用一次，当为2时，表示调用两次，以此类推。
   *
   * @default 0
   */
  limit?: number
  /**
   * 是否采用批处理，默认为true，需谨慎使用false，假设监听的是一个数组，
   * 设置为false时，当执行array.slice等方法会触发多次回调。
   *
   * @default true
   */
  isBatch?: boolean
  /**
   * 监听的属性名，当监听的属性发生变化时，回调函数才会被调用，不传则监听对象的所有变化。
   *
   * @default undefined
   */
  onProp?: ExtractProp<T> | ExtractProp<T>[]
}

/** 默认配置 */
const DEFAULT_OPTIONS: Required<WatchOptions<any>> = {
  isBatch: true,
  limit: 0,
  onProp: ALL_CHANGE_SYMBOL
}
/** 监听器映射MAP */
type ListenersMap = Map<PropName | AllChangeSymbol, Set<Listener<AnyCallback>>>
/**
 * 全局观察者管理器
 */
export default class Observers {
  static #listeners: WeakMap<object, ListenersMap> = new WeakMap()
  static #notBatchHandleListeners: WeakMap<object, ListenersMap> = new WeakMap()
  // 微任务队列
  static #triggerQueue: Map<Origin, Set<PropName | AllChangeSymbol>> = new Map()
  // 待触发队列
  static #waitTriggerList: Array<{
    origin: Origin
    props: PropName[]
  }> = []
  // 是否正在处理队列
  static #isHanding = false

  /**
   * 注册监听器
   *
   * @param origin - 监听源，一般是`ref`|`reactive`创建的对象
   * @param callback - 回调函数或监听器实例
   * @param options - 监听器选项
   */
  static register<
    T extends Origin,
    O extends WatchOptions<T>,
    C extends Callback<T, ComputeProps<T, O>>
  >(origin: T, callback: C | Listener<C>, options?: O): Listener<C> {
    // 合并默认选项
    const mOptions: Required<WatchOptions<T>> = Object.assign({}, DEFAULT_OPTIONS, options)
    // 创建监听器
    const listener: Listener<C> = isFunction(callback)
      ? new Listener(callback, mOptions.limit)
      : callback
    // 要监听的目标属性
    const prop = mOptions.onProp

    const list = mOptions.isBatch ? this.#listeners : this.#notBatchHandleListeners

    if (isArray(prop)) {
      prop.forEach(p => this.#addListener(list, origin, p, listener))
      // 如果监听器销毁了，则删除监听器
      listener.onDestroyed(() => {
        prop.forEach(p => this.#removeListener(list, origin, p, listener))
      })
    } else if (prop !== undefined) {
      this.#addListener(list, origin, prop, listener)
      // 如果监听器销毁了，则删除监听器
      listener.onDestroyed(() => {
        this.#removeListener(list, origin, prop, listener)
      })
    }

    return listener
  }

  /**
   * 触发监听器的回调函数
   *
   * @param {Origin} origin - 要触发的源对象，一般是 `ref` | `reactive` 创建的对象
   * @param {PropName} prop - 变更的属性名
   */
  static trigger<T extends Origin, P extends ExtractProp<T>>(origin: T, prop: P | P[]): void {
    // 如果不在微任务中，则开始处理队列
    if (!this.#isHanding) {
      this.#isHanding = true
      // 处理队列
      Promise.resolve().then(this.#handleTrigger.bind(this))
    }
    const props = isArray(prop) ? prop : [prop]
    if (this.#listeners.get(origin)) {
      props.forEach(p => {
        // 触发非批量处理的监听器
        this.#triggerListeners(this.#notBatchHandleListeners.get(origin)?.get(p), origin, p)
        // 推送到队列
        if (this.#triggerQueue.has(origin)) {
          this.#triggerQueue.get(origin)!.add(p)
        } else {
          this.#triggerQueue.set(origin, new Set([p]))
        }
      })
      // 触发默认监听器
      this.#triggerListeners(
        this.#notBatchHandleListeners.get(origin)?.get(ALL_CHANGE_SYMBOL),
        origin,
        props
      )
    }
  }

  /**
   * 添加监听器
   *
   * @param list - 监听器列表
   * @param proxy - 代理对象
   * @param prop - 属性名
   * @param listener - 监听器实例
   */
  static #addListener<T extends Origin, C extends Callback<any, any>>(
    list: WeakMap<T, ListenersMap>,
    proxy: T,
    prop: PropName,
    listener: Listener<C>
  ): void {
    if (!list.has(proxy)) {
      list.set(proxy, new Map())
    }
    const propMap = list.get(proxy)!
    if (!propMap.has(prop)) {
      propMap.set(prop, new Set())
    }
    propMap.get(prop)!.add(listener)
  }

  /**
   * 删除监听器
   *
   * @param list - 监听器列表
   * @param proxy - 代理对象
   * @param prop - 属性名
   * @param listener - 监听器实例
   */
  static #removeListener<T extends Origin, C extends Callback<any, any>>(
    list: WeakMap<T, ListenersMap>,
    proxy: T,
    prop: PropName,
    listener: Listener<C>
  ): void {
    const set = list.get(proxy)?.get(prop)
    if (set) {
      set.delete(listener)
      if (set.size === 0) list.get(proxy)?.delete(prop)
    }
  }

  /**
   * 处理触发队列
   *
   * @private
   */
  static #handleTrigger() {
    while (this.#triggerQueue.size) {
      const [target, props] = this.#triggerQueue.entries().next().value!
      this.#triggerQueue.delete(target)
      this.#waitTriggerList.push({ origin: target, props: Array.from(props) })
    }
    // 克隆 等待触发的目标
    const list = this.#waitTriggerList
    // 清空 等待触发的目标
    this.#waitTriggerList = []
    // 检查是否有新的任务加入队列 一般不会出现这种情况，为了避免极端情况，这里做一个日志记录
    if (this.#triggerQueue.size > 0) {
      console.debug(
        `[Vitarx.Observers][DEBUG]：未知原因导致任务上下文切换！如果你看到了此日志，Vitarx希望您能将此情况提交ISSUE。`
      )
    }
    // 恢复状态
    this.#isHanding = false
    // 触发目标监听器
    list.forEach(({ origin, props }) => {
      props.forEach(p => this.#triggerListeners(this.#listeners.get(origin)?.get(p), origin, p))
      // 如果存在ALL_CHANGE_SYMBOL的监听器，则触发它
      this.#triggerListeners(this.#listeners.get(origin)?.get(ALL_CHANGE_SYMBOL), origin, props)
    })
    // 清空数组，释放引用
    list.length = 0
  }

  /**
   * 触发监听器
   *
   * @private
   * @param listeners
   * @param origin
   * @param p
   */
  static #triggerListeners<T extends Origin>(
    listeners: Set<Listener<Callback<T, any>>> | undefined,
    origin: T,
    p: ExtractProp<T> | ExtractProp<T>[]
  ): void {
    if (listeners?.size) {
      Array.from(listeners).forEach(listener => {
        listener.trigger([p, origin])
      })
    }
  }
}
