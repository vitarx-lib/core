/**
 * signal 原始值访问（只读，不触发跟踪）
 */
export const SIGNAL_RAW_VALUE = Symbol.for('__v_signal:raw-value')
/**
 * signal 读取值（用于 readSignal 读取值，需触发跟踪）
 */
export const SIGNAL_VALUE = Symbol.for('__v_signal:value')
/**
 * 标记该对象是 signal（用于 isSignal 判断）
 */
export const IS_SIGNAL = Symbol.for('__v_signal:is-signal')
/**
 * 忽略 signal（用于 isMarkNonSignal 判断）
 */
export const IS_NON_SIGNAL = Symbol.for('__v_signal:non-signal')
