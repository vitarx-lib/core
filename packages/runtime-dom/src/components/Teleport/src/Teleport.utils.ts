import type { CodeLocation, HostContainer } from '@vitarx/runtime-core'
import { logger } from '@vitarx/utils'

/**
 * 根据选择器获取目标DOM元素
 * @param to - CSS选择器字符串，用于查找目标元素
 * @param location - 可选的代码位置信息，用于日志记录
 * @returns {HostContainer | null} 返回匹配到的DOM元素，如果未找到或选择器无效则返回null
 */
export function getTarget(to: string, location?: CodeLocation): HostContainer | null {
  try {
    // 使用document.querySelector方法尝试匹配DOM元素
    const target = document.querySelector(to)
    // 如果未找到匹配的元素，记录警告日志
    if (!target) {
      logger.warn(
        `Teleport target element not found: selector '${to}' does not match any element in the DOM`,
        location
      )
    }
    return target
  } catch (error) {
    // 如果选择器无效导致异常，记录错误日志
    logger.warn(
      `Teleport target selector invalid: '${to}' is not a valid CSS selector - `,
      error,
      location
    )
    return null
  }
}
