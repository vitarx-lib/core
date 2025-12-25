import { AnyObject } from '@vitarx/utils'
import type { ExtraDebugData, SignalOpType } from '../../core/index.js'
import { trackSignal, triggerSignal } from '../../core/index.js'
import { type DeepUnwrapRefs, IS_REACTIVE, RAW_VALUE, type UnwrapRefs } from '../shared/index.js'

/**
 * 响应式类型定义
 *
 * @template T 要转换为响应式的对象类型
 * @template Deep 是否深度响应式，默认为true
 */
export type Reactive<T extends AnyObject = any, Deep extends boolean = true> = (Deep extends true
  ? DeepUnwrapRefs<T>
  : UnwrapRefs<T>) & {
  readonly [IS_REACTIVE]: ReactiveSource<T, Deep>
}

/**
 * ReactiveSource 是一个抽象类，用于创建响应式对象代理。
 *
 * 它实现了 Signal 接口，非集合类型对象，仅会发出结构变化信号。
 */
export abstract class ReactiveSource<T extends object, Deep extends boolean = true>
  implements ProxyHandler<T>
{
  public readonly deep: Deep
  public readonly proxy: Reactive<T, Deep>
  /**
   * 构造函数
   * @param target - 要代理的目标对象
   * @param deep - 是否进行深度代理
   */
  constructor(
    public readonly target: T,
    deep?: Deep
  ) {
    this.deep = deep ?? (true as Deep)
    // 创建代理对象并赋值给 proxy 属性
    this.proxy = new Proxy(this.target, this) as Reactive<T, Deep>
  }
  get(target: T, p: string | symbol, receiver: any): any {
    if (p === IS_REACTIVE) return this
    if (p === RAW_VALUE) return this.target
    // 调用子类实现的 doGet 方法处理非 symbol 属性
    return this.doGet(target, p, receiver)
  }
  /**
   * 触发信号的方法
   * 根据当前环境是否为开发环境决定是否传递 devInfo 参数
   * @param type - 信号操作类型
   * @param devInfo - 调试器事件选项（可选参数，仅在开发环境使用）
   */
  protected triggerSignal(type: SignalOpType, devInfo?: ExtraDebugData) {
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
  protected trackSignal(type: SignalOpType, devInfo?: ExtraDebugData) {
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
