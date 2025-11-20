import { NON_SIGNAL_SYMBOL, unref } from '@vitarx/responsive'
import { isObject, logger, popProperty } from '@vitarx/utils'
import { NodeKind, NodeState, VIRTUAL_NODE_SYMBOL } from '../constants/index.js'
import { getAppContext } from '../runtime/index.js'
import type { AnyProps, VNode, VNodeTypes } from '../types/index.js'
import { __DEV__, isRefEl, popNodeDevInfo } from '../utils/index.js'
import { bindProps } from './propsNormalizer.js'

// 支持 ref 的节点类型
const nonSupportRefKind = new Set([
  NodeKind.TEXT,
  NodeKind.COMMENT,
  NodeKind.FRAGMENT,
  NodeKind.STATELESS_WIDGET
])
/**
 * 创建基础的虚拟节点
 *
 * @param type
 * @param kind
 * @param props
 * @param autoUnref
 */
export const createBaseVNode = (
  type: VNodeTypes,
  kind: NodeKind,
  props: AnyProps,
  autoUnref: boolean = true
): VNode => {
  props = { ...props }
  const node: VNode = {
    [NON_SIGNAL_SYMBOL]: true,
    [VIRTUAL_NODE_SYMBOL]: true,
    state: NodeState.Created,
    type,
    kind,
    props,
    appContext: getAppContext()
  }

  // --------- 开发信息（可选） ----------
  if (__DEV__) {
    const devInfo = popNodeDevInfo(props)
    if (devInfo) node.devInfo = devInfo
  }
  // 无 props 直接返回
  if (!Object.keys(props).length) return node
  // --------- 提取 ref ---------
  if ('ref' in props) {
    if (nonSupportRefKind.has(kind)) {
      logger.warn(`ref is not supported for ${node.type} node`, node.devInfo?.source)
    } else {
      const ref = popProperty(props, 'ref')
      if (isRefEl(ref)) {
        node.ref = ref
      } else if (__DEV__) {
        logger.warn(
          `ref value is not valid and must be a RefSignal type object`,
          node.devInfo?.source
        )
      }
    }
  }
  // --------- 提取 key ---------
  if ('key' in props) {
    node.key = popProperty(props, 'key')
  }
  // --------- 特殊属性：v-static ---------
  if ('v-static' in props) node.static = popProperty(props, 'v-static')
  // --------- 执行 v-bind 合并 ---------
  const bind = popProperty(props, 'v-bind')
  if (isObject(bind)) bindProps(props, bind)
  if (autoUnref) {
    for (const [key, value] of Object.entries(props)) {
      props[key] = unref(value)
    }
  }
  return node
}
