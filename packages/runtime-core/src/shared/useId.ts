import { logger } from '@vitarx/utils'
import type { App } from '../app/index.js'
import { getApp } from '../runtime/index.js'

let globalId = 0

/**
 * 各 App 实例独立的 ID 计数器
 *
 * 使用 WeakMap 管理，避免在 App 实例上挂载任意属性，
 * 同时保证 App 实例被回收后计数器自动释放。
 */
const appIdCounters = new WeakMap<App, number>()

/**
 * 生成应用内唯一的 id
 *
 * 算法为 `${前缀}-${递增计数器}`
 *
 * - 组件内：使用 appContext 独立计数
 * - 非组件环境：使用全局计数器
 *
 * @param prefix ID 前缀（优先级最高）
 * @returns 唯一 ID 字符串
 */
export const useId = (prefix?: string): string => {
  const appContext = getApp()

  // 若无 APP 实例，使用全局 ID
  if (!appContext) {
    logger.warn(
      'No associated app context was found, using the global counter to generate the id, it is recommended to use useId in the top-level scope of the component.'
    )
    return `${prefix || 'v'}-g-${globalId++}`
  }

  // 从 WeakMap 获取或初始化该 App 的计数器
  const id = appIdCounters.get(appContext) ?? 0
  appIdCounters.set(appContext, id + 1)

  // 计算前缀优先级：传入参数 > app.config.idPrefix > 'v'
  const idPrefix = prefix ?? appContext.config.idPrefix ?? 'v'

  return `${idPrefix}-${id}`
}
