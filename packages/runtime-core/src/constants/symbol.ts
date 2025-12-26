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
export const IS_VNODE = Symbol.for('__v_vnode:is')
/**
 * props中用于存放devInfo的属性名
 */
export const DEV_INFO_PROP = Symbol.for('__v_vnode:props_dev')
/**
 * 虚拟节点的context属性的Symbol
 */
export const VNODE_CONTEXT = Symbol.for('__v_vnode:context')
/**
 * 类小部件的标识符
 */
export const IS_CLASS_WIDGET = Symbol.for('__v_widget:is-class')
/**
 * 无状态函数组件的标识符
 */
export const IS_STATELESS_WIDGET = Symbol.for('__v_widget:is-stateless')
export const IS_VNODE_BUILDER = Symbol.for('__v_vnode:is-builder')
/**
 * 应用上下文的Symbol
 */
export const APP_CONTEXT = Symbol.for('__v_app:context')
/**
 * `Suspense` 计数器标识符
 *
 * 用于在组件树中跟踪当前组件的挂起状态。
 */
export const SUSPENSE_COUNTER = Symbol.for('__v_suspense:counter')
