import { getContext, runInContext } from '@vitarx/responsive'

/**
 * 用于存储SSR上下文的唯一Symbol
 */
const SSR_CONTEXT_SYMBOL = Symbol('SSR_CONTEXT_SYMBOL')

/**
 * SSR上下文配置接口
 */
interface SSRContextConfig {
  /** 是否处于客户端水合阶段 */
  isClientHydrate?: boolean
  /** 缓存数据对象 */
  cacheData?: Record<string, any>
}

/**
 * SSR上下文类，用于在服务端渲染和客户端水合过程中共享状态
 */
export class SSRContext {
  /** 缓存数据对象 */
  public readonly cacheData: Record<string, any>
  /** 是否处于客户端水合阶段 */
  public readonly isClientHydrate: boolean

  /**
   * 创建SSR上下文实例
   * @param config SSR上下文配置
   */
  constructor(config: SSRContextConfig) {
    this.cacheData = config.cacheData || {}
    this.isClientHydrate = config.isClientHydrate ?? false
  }

  /**
   * 在指定的SSR上下文中运行函数
   * @param fn 要运行的函数
   * @param config SSR上下文配置，默认为空对象
   * @returns 函数执行结果
   */
  static run<R>(fn: () => R, config: SSRContextConfig = {}): R {
    return runInContext(SSR_CONTEXT_SYMBOL, new SSRContext(config), fn)
  }

  /**
   * 获取当前SSR上下文实例
   * @returns 当前SSR上下文实例，如果不存在则返回undefined
   */
  static get(): SSRContext | undefined {
    return getContext<SSRContext>(SSR_CONTEXT_SYMBOL)
  }

  /**
   * 获取缓存数据
   * @param key 缓存键
   * @returns 缓存值，如果不存在则返回undefined
   */
  public getCacheData<T = any>(key: string): T | undefined {
    return this.cacheData[key]
  }

  /**
   * 设置缓存数据
   * @param key 缓存键
   * @param value 缓存值
   */
  public setCacheData(key: string, value: any): void {
    this.cacheData[key] = value
  }
}

/**
 * 获取当前SSR上下文的Hook函数
 * @returns 当前SSR上下文实例，如果不存在则返回undefined
 */
export function useSSRContext(): SSRContext | undefined {
  return SSRContext.get()
}
