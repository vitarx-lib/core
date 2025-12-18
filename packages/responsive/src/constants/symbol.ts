/**
 * signal 标记（用于 isSignal 判断）
 */
export const IS_SIGNAL = Symbol.for('__v_signal:is-signal')
/**
 * 只读代理标识
 */
export const READONLY_SYMBOL = Symbol.for('__v_symbol:is-readonly')
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

// effect <-> signal 双向链表头
export const EFFECT_DEP_HEAD = Symbol.for('__v_dep:effect_dep_head')
export const EFFECT_DEP_TAIL = Symbol.for('__v_dep:effect_dep_tail')

// signal <-> effect 双向链表头
export const SIGNAL_DEP_HEAD = Symbol.for('__v_dep:signal_dep_head')
export const SIGNAL_DEP_TAIL = Symbol.for('__v_dep:signal_dep_tail')
