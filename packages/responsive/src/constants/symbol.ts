/**
 * signal 标记（用于 isSignal 判断）
 */
export const IS_SIGNAL = Symbol.for('__v_signal:is-signal')
/**
 * 只读代理标识
 */
export const IS_READONLY = Symbol.for('__v_symbol:is-readonly')
/**
 * 引用信号（用于 isRef ）判断
 */
export const IS_REF = Symbol.for('__v_symbol:is-ref')
/**
 * reactive 独有标识
 */
export const IS_REACTIVE = Symbol.for('__v_symbol:is-reactive')
/**
 * 忽略响应性自动包装（用于 isMarkRaw 判断）
 */
export const IS_RAW = Symbol.for('__v_symbol:is-raw')
/**
 * 获取包装的原始值
 */
export const RAW_VALUE = Symbol.for('__v_symbol:to-raw')
