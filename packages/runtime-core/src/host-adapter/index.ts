import type { HostAdapter } from '../types/index.js'

let _domAdapter: HostAdapter | null = null

/**
 * 设置DOM适配器
 * @param adapter - 要设置的DOM适配器实例，用于处理DOM操作
 */
export function setDomAdapter(adapter: HostAdapter) {
  _domAdapter = adapter // 将传入的适配器实例保存到全局变量_domAdapter中
}

/**
 * 获取已注册的DomAdapter实例
 * 如果DomAdapter尚未注册，则会抛出错误
 *
 * @returns {HostAdapter} 返回已注册的DomAdapter实例
 * @throws {Error} 当DomAdapter未注册时抛出错误，错误信息为'[vitarx][ERROR] DomAdapter has not been registered.'
 */
export function getDomAdapter(): HostAdapter {
  // 检查_domAdapter是否已定义
  if (!_domAdapter) {
    // 如果_domAdapter未定义，抛出错误
    throw new Error('[vitarx][ERROR] DomAdapter has not been registered.')
  }
  // 返回已定义的_domAdapter
  return _domAdapter
}
