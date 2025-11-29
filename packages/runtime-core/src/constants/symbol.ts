/**
 * 虚拟节点的Symbol
 *
 * 定义了用于识别虚拟节点的唯一Symbol。
 * 这个Symbol作为虚拟节点的特殊标记，用于区分普通对象和虚拟节点，
 * 确保类型安全和运行时识别的一致性。
 *
 * 每个虚拟节点都会包含这个Symbol作为其只读属性，
 * 可以通过检查该属性的存在来验证对象是否为虚拟节点。
 */
export const VIRTUAL_NODE_SYMBOL = Symbol.for('__v_node__')
/**
 * props中用于存放devInfo的属性名
 */
export const VNODE_PROPS_DEV_INFO_SYMBOL = Symbol.for('__v_vnode_dev__')
/**
 * 虚拟节点的context属性的Symbol
 */
export const VNODE_CONTEXT_SYMBOL = Symbol.for('__v_vnode_context__')
/**
 * 类小部件的标识符
 */
export const CLASS_WIDGET_BASE_SYMBOL = Symbol.for('__v_class_widget__')
/**
 * 无状态函数组件的标识符
 */
export const STATELESS_F_WIDGET_SYMBOL = Symbol.for('__v_stateless_widget__')
export const VNODE_BUILDER_SYMBOL = Symbol.for('__v_vnode_builder__')
/**
 * 应用上下文的Symbol
 */
export const APP_CONTEXT_SYMBOL = Symbol.for('__v_app_context__')
/**
 * `Suspense` 计数器标识符
 *
 * 用于在组件树中跟踪当前组件的挂起状态。
 */
export const SUSPENSE_COUNTER_SYMBOL = Symbol.for('__v_suspense_counter__')
