import { type AnyRecord, popProperty } from '@vitarx/utils'
import { VNODE_PROPS_DEV_INFO_SYMBOL } from '../constants/index.js'
import type { NodeDevInfo } from '../types/index.js'

/**
 * 是否处于开发模式
 */
export const __DEV__: boolean = import.meta?.env?.DEV === true
/**
 * 从属性对象中弹出开发模式下的节点调试信息
 *
 * @param props - 包含可能包含调试信息的属性对象
 * @returns {NodeDevInfo | undefined} 返回从属性对象中弹出的调试信息，如果不存在则返回undefined
 */
export const popNodeDevInfo = (props: AnyRecord): NodeDevInfo | undefined => {
  // 开发模式下的调试信息
  return popProperty(props, VNODE_PROPS_DEV_INFO_SYMBOL)
}
/**
 * 从给定的属性对象中获取节点开发信息
 *
 * @param props - 包含节点属性的对象，类型为AnyProps
 * @returns {NodeDevInfo} 返回NodeDevInfo类型的数据，如果不存在则返回undefined
 */
export const getNodeDevInfo = (props: AnyRecord): NodeDevInfo | undefined => {
  return props[VNODE_PROPS_DEV_INFO_SYMBOL]
}
/**
 * 将开发环境信息写入节点的属性中
 * @param props 节点的属性对象
 * @param devInfo 开发环境信息对象
 */
export const setNodeDevInfo = (props: AnyRecord, devInfo: NodeDevInfo): void => {
  // 导出函数，用于写入节点开发信息
  props[VNODE_PROPS_DEV_INFO_SYMBOL] = devInfo // 将开发环境信息对象赋值给属性对象的特定键
}
