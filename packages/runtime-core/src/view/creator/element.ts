import { IS_RAW } from '@vitarx/responsive'
import { popProperty } from '@vitarx/utils/src/index.js'
import { IS_VIEW } from '../../shared/constants/symbol.js'
import { ViewFlag } from '../../shared/constants/viewFlag.js'
import type {
  CodeLocation,
  ElementView,
  HostElementTag,
  ResolvedChildren,
  ValidProps
} from '../../types/index.js'
import { resolveChildren, resolveProps } from './utils.js'

/**
 * 创建一个元素视图的函数
 *
 * @param tag - 宿主元素标签名，可以是任何有效的HTML标签
 * @param props - 元素的属性集合，默认为null
 * @param key - 用于标识元素的唯一键，可选
 * @param [location] - 代码位置信息，可选
 * @returns { ElementView } 返回一个ElementView对象，表示创建的元素视图
 */
export function createElementView<T extends HostElementTag>(
  tag: T,
  props: ValidProps<T> | null = null,
  key?: unknown,
  location?: CodeLocation
): ElementView<T> {
  // 返回类型为ElementView<T>，其中T是HostElementTag的子类型
  let resolvedChildren: ResolvedChildren // 声明一个已解析子元素的变量
  // 检查props是否存在且包含children属性
  if (props && 'children' in props) {
    const propChildren = popProperty(props, 'children') // 从props中移除并获取children属性
    resolvedChildren = resolveChildren(propChildren) // 解析子元素
  } else {
    resolvedChildren = [] // 如果没有子元素，设置为空数组
  }
  // 返回创建的元素视图对象
  return {
    [IS_RAW]: true, // 标记为原始视图
    [IS_VIEW]: true, // 标记为视图
    flag: ViewFlag.ELEMENT, // 设置视图标志为元素
    key, // 设置键
    location, // 设置位置信息
    type: tag, // 设置元素类型
    ...resolveProps(props), // 解析并展开props
    children: resolvedChildren // 设置已解析的子元素
  }
}
