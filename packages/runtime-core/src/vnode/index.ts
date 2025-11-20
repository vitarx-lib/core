/**
 * VNode 工厂模块
 *
 * 职责：
 * - 提供统一的VNode创建入口
 * - 将创建逻辑分散到各个专门的模块中
 * - 保持代码的清晰和可维护性
 */

// 主创建函数
export { createVNode, h } from './create.js'

// 节点创建器
export * from './hostNodeCreator.js'
// 组件创建器
export * from './widgetNodeCreator.js'
// 节点驱动器
export * from './driver.js'
// 节点关系
export * from './relations.js'
// 克隆节点
export * from './clone.js'
