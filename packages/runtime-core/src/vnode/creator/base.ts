import { NON_SIGNAL_SYMBOL, unref } from '@vitarx/responsive'
import { isObject, logger, popProperty } from '@vitarx/utils'
import {
  NodeKind,
  NodeState,
  SPECIAL_NODE_KINDS,
  VIRTUAL_NODE_SYMBOL
} from '../../constants/index.js'
import { resolveDirective } from '../../directive/index.js'
import { getAppContext } from '../../runtime/index.js'
import type { AnyProps, VNode, VNodeDirectives, VNodeTypes } from '../../types/index.js'
import { __DEV__, isRefEl, popNodeDevInfo } from '../../utils/index.js'
import { bindProps } from '../normalizer/props.js'

/**
 * 创建基础的虚拟节点
 *
 * @param type
 * @param kind
 * @param props
 */
export const createBaseVNode = (type: VNodeTypes, kind: NodeKind, props: AnyProps): VNode => {
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
    if (SPECIAL_NODE_KINDS.has(kind)) {
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
    const key = popProperty(props, 'key')
    if (key !== null && key !== undefined) node.key = key
  }
  // --------- 特殊属性：v-static ---------
  if ('v-static' in props) node.static = popProperty(props, 'v-static')
  if (SPECIAL_NODE_KINDS.has(kind)) {
    for (const [key, value] of Object.entries(props)) {
      props[key] = unref(value)
    }
  } else {
    // --------- 执行 v-bind 合并 ---------
    const bind = popProperty(props, 'v-bind')
    if (isObject(bind)) bindProps(props, bind)
    const directives: VNodeDirectives = new Map()
    for (const [key, value] of Object.entries(props)) {
      props[key] = unref(value)
      if (key.startsWith('v-') && !SPECIAL_NODE_KINDS.has(kind)) {
        // 删除 v- 前缀
        const raw = key.slice(2)
        // 解析参数（只支持一个冒号）
        const [name, arg] = raw.split(':', 2)
        // 查找指令
        const directive = resolveDirective(name)
        if (directive) {
          directives.set(name, [directive, props[key], arg])
          delete props[key]
        }
      }
    }
    if (directives.size) node.directives = directives
  }

  return node
}
