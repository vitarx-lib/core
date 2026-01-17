import { logger } from '@vitarx/utils'
import { getApp } from '../../runtime/context.js'

let globalId = 0

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

  // 初始化上下文内计数器
  const ctx = appContext as Record<string, any>
  if (typeof ctx.__v_global_id !== 'number') {
    ctx.__v_global_id = 0
  }

  // 计算前缀优先级：传入参数 > app.config.idPrefix > 'v'
  const idPrefix = prefix ?? ctx.config?.idPrefix ?? 'v'

  const id = ctx.__v_global_id++
  return `${idPrefix}-${id}`
}
