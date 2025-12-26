/**
 * 只读代理标识
 */
export const IS_READONLY = Symbol.for('__v_reactivity:is-readonly')
/**
 * 引用信号（用于 isRef ）判断
 */
export const IS_REF = Symbol.for('__v_reactivity:is-ref')
/**
 * reactive 独有标识
 */
export const IS_REACTIVE = Symbol.for('__v_reactivity:is-reactive')
/**
 * shallowReactive 独有标识
 */
export const IS_SHALLOW = Symbol.for('__v_reactivity:is-shallow')
/**
 * 忽略响应性自动包装（用于 isMarkRaw 判断）
 */
export const IS_RAW = Symbol.for('__v_reactivity:is-raw')
/**
 * 获取包装的原始值
 */
export const RAW_VALUE = Symbol.for('__v_reactivity:to-raw')
/**
 * signal 标记
 */
export const IS_SIGNAL = Symbol.for('__v_reactivity:is-signal')
