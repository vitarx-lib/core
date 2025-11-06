import type { HostAdapter } from '../types/index.js'

let _domAdapter: HostAdapter

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
export function useDomAdapter(): HostAdapter {
  // 检查_domAdapter是否已定义
  if (_domAdapter) return _domAdapter
  throw new Error('[vitarx][ERROR] DomAdapter has not been registered.')
}
