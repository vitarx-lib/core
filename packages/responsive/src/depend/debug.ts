import { logger } from '@vitarx/utils'
import type { DebuggerEventHandler, DependType } from '../types/debug.js'
import type { Signal } from '../types/index.js'

/**
 * 调试追踪器
 *
 * @param watcher
 * @param signal
 * @param type
 */
export function triggerOnTrack(
  watcher: { onTrack?: DebuggerEventHandler },
  signal: Signal,
  type: DependType
) {
  try {
    const debugHandler = watcher.onTrack
    if (typeof debugHandler === 'function') debugHandler({ signal, type })
  } catch (e) {
    logger.debug(`[triggerOnTrack] Error in onTrack:`, e)
  }
}

/**
 * 调试触发器
 *
 * @param watcher
 * @param signal
 * @param type
 */
export function triggerOnTrigger(
  watcher: { onTrigger?: DebuggerEventHandler },
  signal: Signal,
  type: DependType
) {
  try {
    const debugHandler = watcher.onTrigger
    if (typeof debugHandler === 'function') debugHandler({ signal, type })
  } catch (e) {
    logger.debug(`[triggerOnTrigger] Error in onTrigger:`, e)
  }
}
