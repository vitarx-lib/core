/**
 * 忽略响应性自动包装（用于 isMarkRaw 判断）
 */
export const IS_RAW = Symbol.for('__v_utils:is-raw')
/**
 * toRaw 获取原始值
 */
export const RAW_VALUE = Symbol.for('__v_utils:to-raw')
/**
 * 只读代理标识
 */
export const IS_READONLY = Symbol.for('__v_utils:is-readonly')
