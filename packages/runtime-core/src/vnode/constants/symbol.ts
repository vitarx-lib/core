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
export const VIRTUAL_NODE_SYMBOL = Symbol('VIRTUAL_NODE_SYMBOL')

/**
 * props中用于存放devInfo的属性名
 */
export const VNODE_PROPS_DEV_INFO_KEY_SYMBOL = Symbol('VNODE_DEV_INFO_SYMBOL')
