// effect <-> signal 双向链表头
export const EFFECT_DEP_HEAD = Symbol.for('__v_dep:effect_dep_head')
export const EFFECT_DEP_TAIL = Symbol.for('__v_dep:effect_dep_tail')

// signal <-> effect 双向链表头
export const SIGNAL_DEP_HEAD = Symbol.for('__v_dep:signal_dep_head')
export const SIGNAL_DEP_TAIL = Symbol.for('__v_dep:signal_dep_tail')
