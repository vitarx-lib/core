/**
 * reactive 独有标识
 *
 * reactive 通过 `Proxy` 实现响应式信号
 */
export const IS_REACTIVE = Symbol.for('__v_reactive:reactive-signal')
/**
 * 忽略响应性自动包装（用于 isMarkRaw 判断）
 */
export const IS_MARK_RAW = Symbol.for('__v_reactive:mark-raw')
/**
 * 代理标识（用于 isProxy ）判断
 */
export const IS_PROXY = Symbol.for('__v_reactive:proxy')
