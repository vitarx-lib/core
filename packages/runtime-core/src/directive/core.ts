import { getCurrentVNode } from '../runtime/index.js'
import type { HostElements } from '../types/index.js'
import type { VNode } from '../vnode/index.js'

interface Binding {
  /**
   * 指令绑定的值，已解包ref！
   */
  value: any
  /**
   * 新的指令绑定的值，已解包ref！
   *
   * 仅在updated/beforeUpdate中可用，其他钩子和value
   */
  newValue: any
  /**
   * 传递给指令的参数
   *
   * @example
   * ```jsx
   * <div v-directive:arg="value" />
   * ```
   */
  arg: string | undefined
}
export interface DirectiveOptions {
  /**
   * 节点元素创建完成后调用
   *
   * @param el - 宿主元素实例
   * @param binding - 指令绑定信息对象
   * @param vnode - 节点实例
   */
  created?(el: HostElements, binding: Binding, vnode: VNode): void
  /**
   * 节点元素即将被挂载到DOM前调用
   *
   * @param el - 宿主元素实例
   * @param binding - 指令绑定信息对象
   * @param vnode - 节点实例
   */
  beforeMount?(el: HostElements, binding: Binding, vnode: any): void
  /**
   * 节点元素被真实挂载到DOM后调用
   *
   * @param el - 宿主元素实例
   * @param binding - 指令绑定信息对象
   * @param vnode - 节点实例
   */
  mounted?(el: HostElements, binding: Binding, vnode: any): void
  /**
   * 节点元素即将被更新前调用
   *
   * @param el - 宿主元素实例
   * @param binding - 指令绑定信息对象
   * @param VNode - 节点实例
   */
  beforeUpdate?(el: HostElements, binding: Binding, VNode: any): void
  /**
   * 节点元素被更新后调用
   *
   * @param el - 宿主元素实例
   * @param binding - 指令绑定信息对象
   * @param vnode - 节点实例
   */
  updated?(el: HostElements, binding: Binding, vnode: any): void
  /**
   * 节点元素即将被卸载前调用
   *
   * @param el - 宿主元素实例
   * @param binding - 指令绑定信息对象
   * @param vnode - 节点实例
   */
  beforeUnmount?(el: HostElements, binding: Binding, vnode: any): void
  /**
   * 节点元素被卸载后调用
   *
   * @param el - 宿主元素实例
   * @param binding - 指令绑定信息对象
   * @param vnode - 节点实例
   */
  unmounted?(el: HostElements, binding: Binding, vnode: any): void
}
export interface Directive extends DirectiveOptions {
  /**
   * 指令名称
   */
  name: string
}

const globalDirectives = new Map<string, Directive>()

/**
 * 定义指令
 *
 * 如果在组件上下文中定义，则会将指令存储在当前组件的指令缓存中，否则存储在全局指令缓存中
 *
 * @param name - 指令名称
 * @param directive - 指令配置对象或函数
 * @returns void
 */
export function defineDirective(
  name: string,
  directive: DirectiveOptions | DirectiveOptions['mounted'] | DirectiveOptions['updated']
): void {
  // 验证并规范化指令名称
  const normalizedName = name.trim()
  if (!normalizedName) {
    throw new Error('Directive name cannot be empty.')
  }

  // 将指令转换为标准格式
  const resolvedDirective = normalizeDirective(directive, normalizedName)

  // 获取当前VNode上下文
  const vnode = getCurrentVNode()

  // 存储指令到适当的缓存中
  if (vnode) {
    if (!vnode.directiveCache) {
      vnode.directiveCache = new Map()
    }
    vnode.directiveCache.set(normalizedName, resolvedDirective)
  } else {
    globalDirectives.set(normalizedName, resolvedDirective)
  }
}

/**
 * 将指令转换为标准格式
 * @param directive - 原始指令配置
 * @param name - 指令名称
 * @returns 标准化的指令对象
 */
function normalizeDirective(
  directive: DirectiveOptions | DirectiveOptions['mounted'] | DirectiveOptions['updated'],
  name: string
): Directive {
  // 如果是函数，转换为指令对象
  if (typeof directive === 'function') {
    return {
      name,
      mounted: directive,
      updated: directive
    }
  }

  // 验证指令对象
  if (typeof directive !== 'object' || directive === null) {
    throw new TypeError(
      `Invalid directive type for "${name}". Expected a function or directive object.`
    )
  }

  // 返回带有名称的指令对象
  return {
    ...directive,
    name
  }
}

/**
 * 为虚拟节点添加指令
 *
 * 将一个或多个指令添加到虚拟节点的指令集合中。
 * 每个指令通过其名称进行标识，并存储在vnode的directives Map中。
 *
 * @param vnode - 要添加指令的虚拟节点
 * @param directives - 要添加的指令数组
 *
 * @example
 * ```typescript
 * // 创建一个虚拟节点
 *
 * // 创建一些指令
 * const focusDirective = { name: 'focus', mounted: el => el.focus() };
 * const tooltipDirective = { name: 'tooltip', mounted: (el, binding) => { //... } };
 * // 将指令添加到虚拟节点
 * withDirectives(createVNode('div'), [focusDirective, tooltipDirective]);
 * ```
 */
export function withDirectives(vnode: VNode, directives: Directive[]) {
  for (const directive of directives) {
    vnode.directives.set(directive.name, directive)
  }
}

/**
 * 解析指令
 *
 * 根据指令名称查找并返回对应的指令对象。
 * 查找顺序遵循优先级：组件局部指令 > 应用级指令 > 全局指令。
 *
 * @param name - 要查找的指令名称
 * @returns 找到的指令对象，如果未找到则返回undefined
 *
 * @example
 * ```typescript
 * // 获取名为"focus"的指令
 * const focusDirective = resolveDirective('focus');
 * if (focusDirective) {
 *   // 使用指令...
 * }
 * ```
 */
export function resolveDirective(name: string): Directive | undefined {
  const vnode = getCurrentVNode()
  if (vnode) {
    if (vnode.directiveCache?.has(name)) {
      // 获取组件局部指令
      return vnode.directiveCache.get(name)
    } else if (vnode.appContext?.directive(name)) {
      // 获取应用级指令
      return vnode.appContext.directive(name)
    }
  }
  // 获取全局指令
  return globalDirectives.get(name)
}
