import { Scheduler } from '@vitarx/responsive'
import { logger } from '@vitarx/utils'
import { getRenderer } from '../renderer/index.js'
import { getCurrentVNode } from '../runtime/index.js'
import type {
  Directive,
  DirectiveOptions,
  ElementNode,
  HostElements,
  HostNodeElements,
  NodeDirectives,
  VNode,
  WidgetNode
} from '../types/index.js'
import { __DEV__, isElementNode, isStatefulWidgetNode, isWidgetNode } from '../utils/index.js'

const globalDirectives = new Map<string, Directive>()

/**
 * 定义指令
 *
 * 如果在有状态的组件上下文中定义，则会将指令存储在当前组件的指令缓存中，否则存储在全局指令缓存中
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
  if (isStatefulWidgetNode(vnode)) {
    if (vnode.directiveStore) {
      vnode.directiveStore.set(normalizedName, resolvedDirective)
    } else {
      vnode.directiveStore = new Map([[normalizedName, resolvedDirective]])
    }
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
export function normalizeDirective(
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
 * 支持两种指令格式：简单指令对象和包含指令、值和参数的数组形式。
 *
 * @param vnode - 要添加指令的虚拟节点
 * @param directives - 要添加的指令数组，可以是Directive对象数组或[Directive, value?, arg?]形式的元组数组
 *
 * @example
 * ```typescript
 * // 使用简单指令对象形式
 * const focusDirective = { name: 'focus', mounted: el => el.focus() };
 * const tooltipDirective = { name: 'tooltip', mounted: (el, binding) => { //... } };
 *
 * // 将指令添加到虚拟节点
 * withDirectives(createVNode('div'), [focusDirective, tooltipDirective]);
 * ```
 *
 * @example
 * ```typescript
 * // 使用数组形式，包含指令、值和参数
 * const modelDirective = { name: 'model', mounted: (el, binding) => { //... } };
 * const colorDirective = { name: 'color', mounted: (el, binding) => { //... } };
 *
 * // 将指令添加到虚拟节点，同时传递值和参数
 * withDirectives(createVNode('input'), [
 *   [modelDirective, inputValue], // 只有指令和值
 *   [colorDirective, 'red', 'theme'] // 指令、值和参数
 * ]);
 * ```
 */
export function withDirectives<T extends VNode>(
  vnode: T,
  directives:
    | Array<[directive: Directive, value?: any, arg?: string | undefined]>
    | Array<Directive>
): T {
  if (!isElementNode(vnode) && !isWidgetNode(vnode)) return vnode
  vnode.directives ??= new Map()
  for (const item of directives) {
    let dir: Directive
    let value: any
    let arg: string | undefined
    if (Array.isArray(item)) {
      dir = item[0]
      value = item[1]
      arg = item[2]
    } else {
      dir = item
    }
    // 开发模式类型检查
    if (__DEV__) {
      if (!dir || typeof dir.name !== 'string' || !dir.name.length) {
        logger.warn(
          `withDirectives() invalid directive provided. Each directive must have a non-empty "name" property.`,
          dir
        )
        continue
      }
    }
    vnode.directives.set(dir.name, [dir, value, arg])
  }
  return vnode
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
  if (name.startsWith('v-')) name = name.slice(2)
  const vnode = getCurrentVNode()
  if (isStatefulWidgetNode(vnode)) {
    if (vnode.directiveStore?.has(name)) {
      // 获取组件局部指令
      return vnode.directiveStore.get(name)
    } else if (vnode.appContext?.directive(name)) {
      // 获取应用级指令
      return vnode.appContext.directive(name)
    }
  }
  // 获取全局指令
  return globalDirectives.get(name)
}

/**
 * 指令差异更新选项
 */
export interface DiffDirectivesOptions {
  /**
   * 只更新指定的指令名称列表
   * 如果提供，则只处理这些指令的更新，其他指令将被忽略
   */
  only?: string[]
  /**
   * 跳过这些指令的更新
   * 如果提供，这些指令将不会被处理
   */
  skip?: string[]
}

/**
 * 检查指令是否应该被处理
 *
 * @param name - 指令名称
 * @param options - 差异更新选项
 * @returns 如果应该处理返回true，否则返回false
 */
function shouldProcessDirective(name: string, options?: DiffDirectivesOptions): boolean {
  if (!options) return true

  // 如果在跳过列表中，则不处理
  if (options.skip?.includes(name)) {
    return false
  }

  // 如果指定了only列表，则只处理列表中的指令
  if (options.only) {
    return options.only.includes(name)
  }

  return true
}

/**
 * 比较并更新指令差异的函数
 *
 * @param oldVNode - 旧的虚拟DOM节点元素
 * @param newVNode - 新的虚拟DOM节点元素
 * @param options - 差异更新选项，可指定only或skip来控制更新范围
 */
export function diffDirectives(
  oldVNode: ElementNode | WidgetNode,
  newVNode: ElementNode | WidgetNode,
  options?: DiffDirectivesOptions
): void {
  // 获取DOM元素引用
  const el = oldVNode.el! as HostNodeElements
  if (!el) throw new Error('oldVNode.el is not defined.')

  // 获取新旧节点的指令集合，如果不存在则使用空Map
  const oldDirs: NodeDirectives = oldVNode?.directives ?? new Map()
  const newDirs: NodeDirectives = newVNode?.directives ?? new Map()

  // 1. 遍历所有新指令：包含 新增 + 更新
  for (const [name, [dir, newValue, arg]] of newDirs) {
    // 检查是否应该处理此指令
    if (!shouldProcessDirective(name, options)) {
      continue
    }

    // 获取旧指令的对应项
    const oldEntry = oldDirs.get(name)

    if (oldEntry) {
      // --- 更新 ---
      const [, oldValue] = oldEntry
      const binding = { value: newValue, oldValue, arg }

      oldEntry[0] = dir
      oldEntry[1] = newValue
      oldEntry[2] = arg

      // 调用指令的更新生命周期钩子
      dir.beforeUpdate?.(el as never, binding, oldVNode)
      dir.updated &&
        Scheduler.queuePostFlushJob(() => dir.updated?.(el as never, binding, oldVNode))
    } else {
      // --- 新增 ---
      const binding = { value: newValue, oldValue: undefined, arg }

      // 调用指令的挂载生命周期钩子
      dir.beforeMount?.(el as never, binding, oldVNode)
      dir.mounted?.(el as never, binding, oldVNode)
      oldDirs.set(name, [dir, newValue, arg])
    }
  }

  // 2. 遍历旧指令：补充"旧有 → 新无" → 删除
  for (const [name, [dir, oldValue, arg]] of oldDirs) {
    // 检查是否应该处理此指令
    if (!shouldProcessDirective(name, options)) {
      continue
    }

    if (!newDirs.has(name)) {
      const binding = { value: undefined, oldValue, arg }

      dir.beforeUnmount?.(el as never, binding, oldVNode)
      dir.unmounted?.(el as never, binding, oldVNode)
      oldDirs.delete(name)
    }
  }
}
/**
 * 调用 指令钩子
 *
 * @internal
 * @param node - 虚拟节点
 * @param hook - 钩子名称
 * @param [el] - DOM 元素
 */
export function invokeDirHook(
  node: VNode,
  hook: Exclude<keyof DirectiveOptions, 'getSSRProps'>,
  el?: HostElements
): void {
  if (!node.directives) return
  const targetElement = el ?? (node.el! as HostElements)
  if (!targetElement || !getRenderer().isElement(targetElement)) return
  for (const [_name, directive] of node.directives.entries()) {
    const [dirObj, value, arg] = directive
    const method = dirObj[hook]
    if (typeof method === 'function') {
      method(targetElement, { value, oldValue: value, arg }, node)
    }
  }
}
