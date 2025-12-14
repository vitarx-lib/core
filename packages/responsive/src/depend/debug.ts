import { logger } from '@vitarx/utils'
import type { DebuggerEvent } from '../types/debug.js'

/**
 * 调试追踪器
 *
 * @param event
 */
export function triggerOnTrack(event: DebuggerEvent) {
  try {
    const debugHandler = event.effect.onTrack
    if (typeof debugHandler === 'function') debugHandler(event)
  } catch (e) {
    logger.debug(`[triggerOnTrack] Error in onTrack:`, e)
  }
}
/**
 * 调试触发器
 *
 * @param event
 */
export function triggerOnTrigger(event: DebuggerEvent) {
  try {
    const debugHandler = event.effect.onTrigger
    if (typeof debugHandler === 'function') debugHandler(event)
  } catch (e) {
    logger.debug(`[triggerOnTrigger] Error in onTrigger:`, e)
  }
}
