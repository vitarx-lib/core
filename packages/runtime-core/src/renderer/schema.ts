import type { HostVoidElementNames } from '../types/index.js'

export interface HostSchema {
  // HTML 等宿主平台的 void 元素集合，如 img/input/br...
  voidElements?: Set<string>
}

let globalSchema: HostSchema = { voidElements: new Set() }

/**
 * 设置全局主机模式
 * @param schema - 主机模式对象，包含void元素的集合
 */
export function setHostSchema(schema: HostSchema): void {
  // 将传入的schema赋值给全局变量globalSchema，如果未传入则使用默认值（仅包含空的voidElements集合）
  globalSchema = schema || { voidElements: new Set() }
}

/**
 * 获取主机架构信息
 * 该函数用于获取全局架构配置信息
 * @returns {HostSchema} 返回全局架构配置对象
 */
export function getHostSchema(): HostSchema {
  return globalSchema // 返回全局架构配置对象
}

/**
 * 检查给定的节点类型是否为void元素（自闭合标签）
 * @param tag - 需要检查的节点类型，可以是字符串或其他类型
 * @returns 如果是void元素返回true，否则返回false
 */
export function isVoidTag(tag: string): tag is HostVoidElementNames {
  // 检查全局schema中是否包含该标签，如果未定义则返回false
  return globalSchema.voidElements?.has(tag) ?? false
}
