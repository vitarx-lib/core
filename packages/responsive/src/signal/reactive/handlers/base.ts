import {
  DEP_LINK_HEAD,
  DEP_LINK_TAIL,
  DepLink,
  trackSignal,
  triggerSignal
} from '../../../depend/index.js'
import type { DebuggerEventOptions, Signal, SignalOpType } from '../../../types/index.js'
import { IS_SIGNAL, SIGNAL_RAW_VALUE, SIGNAL_VALUE } from '../../core/index.js'
import { IS_REACTIVE_SIGNAL } from '../symbol.js'

/**
 * BaseProxyHandler 是一个抽象基类，实现了 ProxyHandler 接口
 * @template T - 必须是 object 类型的泛型参数
 */
export abstract class BaseProxyHandler<T extends object> implements ProxyHandler<T> {
  // 依赖链头部，可选属性
  [DEP_LINK_HEAD]?: DepLink;
  // 依赖链尾部，可选属性
  [DEP_LINK_TAIL]?: DepLink
  // 只读属性，存储 Signal 类型的代理对象
  readonly proxy: Signal<T>
  /**
   * 是否允许跟踪自身
   *
   * @protected
   */
  protected allowTrackSelf: boolean = false
  /**
   * 构造函数
   * @param target - 要代理的目标对象
   */
  constructor(public target: T) {
    // 创建代理对象并赋值给 proxy 属性
    this.proxy = new Proxy(this.target, this) as Signal<T>
  }
  /**
   * ProxyHandler 的 get 方法实现
   * @param target - 目标对象
   * @param p - 属性键，可以是字符串或 symbol
   * @param receiver - 代理对象或继承代理对象
   * @returns - 属性值
   */
  get(target: T, p: string | symbol, receiver: any): any {
    // 如果属性键是 symbol 类型
    if (typeof p === 'symbol') {
      // 使用 switch 语句处理特定的 symbol 属性
      switch (p) {
        case DEP_LINK_HEAD:
          return this[DEP_LINK_HEAD]
        case DEP_LINK_TAIL:
          return this[DEP_LINK_TAIL]
        case SIGNAL_RAW_VALUE:
          return target
        case IS_SIGNAL:
          return true
        case IS_REACTIVE_SIGNAL:
          return true
        case SIGNAL_VALUE:
          // 跟踪信号依赖
          if (this.allowTrackSelf) trackSignal(this.proxy)
          return target
      }
    }
    // 调用子类实现的 doGet 方法处理非 symbol 属性
    return this.doGet(target, p, receiver)
  }
  /**
   * ProxyHandler 的 set 方法实现
   * @param target - 目标对象
   * @param p - 属性键，可以是字符串或 symbol
   * @param newValue - 要设置的新值
   * @param receiver - 代理对象或继承代理对象
   * @returns - 设置操作是否成功
   */
  set(target: T, p: string | symbol, newValue: any, receiver: any): boolean {
    // 如果是依赖链头尾属性，直接设置并返回 true
    if (p === DEP_LINK_HEAD || p === DEP_LINK_TAIL) {
      ;(this as any)[p] = newValue
      return true
    }
    // 调用子类实现的 doSet 方法处理其他属性
    return this.doSet(target, p, newValue, receiver)
  }

  /**
   * 触发信号的方法
   * 根据当前环境是否为开发环境决定是否传递 devInfo 参数
   * @param type - 信号操作类型
   * @param devInfo - 调试器事件选项（可选参数，仅在开发环境使用）
   */
  protected triggerSignal(type: SignalOpType, devInfo?: DebuggerEventOptions) {
    // 判断是否为开发环境
    if (__DEV__) {
      // 在开发环境下，传递 devInfo 参数
      triggerSignal(this.proxy, type, devInfo)
    } else {
      // 在非开发环境下，不传递 devInfo 参数
      triggerSignal(this.proxy, type)
    }
  }
  /**
   * 跟踪信号的方法
   * @param type - 信号操作类型，指定要跟踪的信号操作类型
   * @param devInfo - 可选参数，设备信息对象，包含设备的额外信息
   * 该方法用于跟踪与代理对象相关的信号操作，将相关信息传递给trackSignal函数
   */
  protected trackSignal(type: SignalOpType, devInfo?: DebuggerEventOptions) {
    trackSignal(this.proxy, type, devInfo) // 调用trackSignal函数，传入代理对象、操作类型和设备信息
  }

  /**
   * 抽象方法，由子类实现，处理 get 操作
   * @param target
   * @param p
   * @param receiver
   * @protected
   */
  protected abstract doGet(target: T, p: string | symbol, receiver: any): any

  /**
   * 抽象方法，由子类实现，处理 set 操作
   * @param target
   * @param p
   * @param newValue
   * @param receiver
   * @protected
   */
  protected abstract doSet(target: T, p: string | symbol, newValue: any, receiver: any): boolean
}
