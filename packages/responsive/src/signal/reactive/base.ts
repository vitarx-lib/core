import { REACTIVE_SYMBOL, SIGNAL_SYMBOL, SIGNAL_VALUE } from '../../constants/index.js'
import { trackSignal, triggerSignal } from '../../depend/index.js'
import type { DebuggerEventOptions, Reactive, Signal, SignalOpType } from '../../types/index.js'

/**
 * BaseReactive 是一个抽象类，用于创建响应式对象代理。
 */
export abstract class BaseReactive<T extends object, Deep extends boolean = true>
  implements ProxyHandler<T>, Signal<number>
{
  readonly [SIGNAL_SYMBOL]: true = true
  public readonly deep: Deep
  public readonly proxy: Reactive<T, Deep>
  private version: number = 0
  /**
   * 构造函数
   * @param target - 要代理的目标对象
   * @param deep - 是否进行深度代理
   */
  constructor(
    public target: T,
    deep?: Deep
  ) {
    this.deep = deep ?? (true as Deep)
    // 创建代理对象并赋值给 proxy 属性
    this.proxy = new Proxy(this.target, this) as Reactive<T, Deep>
  }
  get [SIGNAL_VALUE]() {
    this.trackSignal('get', { key: SIGNAL_VALUE })
    return this.version
  }
  get(target: T, p: string | symbol, receiver: any): any {
    if (p === REACTIVE_SYMBOL) return this
    // 调用子类实现的 doGet 方法处理非 symbol 属性
    return this.doGet(target, p, receiver)
  }
  /**
   * 触发信号的方法
   * 根据当前环境是否为开发环境决定是否传递 devInfo 参数
   * @param type - 信号操作类型
   * @param devInfo - 调试器事件选项（可选参数，仅在开发环境使用）
   */
  protected triggerSignal(type: SignalOpType, devInfo?: DebuggerEventOptions) {
    this.version++
    // 判断是否为开发环境
    if (__DEV__) {
      // 在开发环境下，传递 devInfo 参数
      triggerSignal(this, type, devInfo)
    } else {
      // 在非开发环境下，不传递 devInfo 参数
      triggerSignal(this, type)
    }
  }
  /**
   * 跟踪信号的方法
   * @param type - 信号操作类型，指定要跟踪的信号操作类型
   * @param devInfo - 可选参数，设备信息对象，包含设备的额外信息
   * 该方法用于跟踪与代理对象相关的信号操作，将相关信息传递给trackSignal函数
   */
  protected trackSignal(type: SignalOpType, devInfo?: DebuggerEventOptions) {
    trackSignal(this, type, devInfo) // 调用trackSignal函数，传入代理对象、操作类型和设备信息
  }
  /**
   * 抽象方法，由子类实现，处理 get 操作
   * @param target
   * @param p
   * @param receiver
   * @protected
   */
  protected abstract doGet(target: T, p: string | symbol, receiver: any): any
}
