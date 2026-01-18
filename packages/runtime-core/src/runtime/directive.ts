import { isArray, isPlainObject, logger } from '@vitarx/utils'
import { ViewFlag } from '../shared/constants/viewFlag.js'
import type { Directive, DirectiveBinding, ElementView, HostElement, View } from '../types/index.js'
import { getInstance } from './context.js'

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
export function defineDirective(name: string, directive: Directive): void {
  // 验证并规范化指令名称
  const normalizedName = name.trim()

  if (!normalizedName) throw new Error('Directive name cannot be empty.')

  // 获取当前组件上下文
  const ctx = getInstance()

  // 存储指令到适当的缓存中
  if (ctx) {
    if (ctx.directiveStore) {
      ctx.directiveStore.set(normalizedName, directive)
    } else {
      ctx.directiveStore = new Map([[normalizedName, directive]])
    }
  } else {
    globalDirectives.set(normalizedName, directive)
  }
}
/**
 * 解析指令
 *
 * 根据指令名称查找并返回对应的指令对象。
 * 查找顺序遵循优先级：组件局部指令 > 应用级指令 > 全局指令。
 *
 * @param name - 要查找的指令名称
 * @returns { Directive | undefined } 找到的指令对象，如果未找到则返回undefined
 */
export function resolveDirective(name: string): Directive | undefined {
  if (name.startsWith('v-')) name = name.slice(2)
  const ctx = getInstance()
  if (ctx) {
    if (ctx.directiveStore?.has(name)) {
      // 获取组件局部指令
      return ctx.directiveStore.get(name)
    } else if (ctx.app?.directive(name)) {
      // 获取应用级指令
      return ctx.app.directive(name)
    }
  }
  // 获取全局指令
  return globalDirectives.get(name)
}
/**
 * 为虚拟节点添加指令
 *
 * 将一个或多个指令添加到虚拟节点的指令集合中。
 * 每个指令通过其名称进行标识，并存储在vnode的directives Map中。
 * 支持两种指令格式：简单指令对象和包含指令、值和参数的数组形式。
 *
 * @param view - 要添加指令的虚拟节点
 * @param directives - 要添加的指令数组，可以是Directive对象数组或[Directive, value?, arg?]形式的元组数组
 *
 * @example
 * ```typescript
 * // 使用简单指令对象形式
 * const focusDirective = { mounted: el => el.focus() };
 * const tooltipDirective = { mounted: (el, binding) => { //... } };
 *
 * // 将指令添加到虚拟节点
 * withDirectives(createVNode('div'), [focusDirective, tooltipDirective]);
 * ```
 *
 * @example
 * ```typescript
 * // 使用数组形式，包含指令、值和参数
 * const colorDirective = { mounted: (el, binding) => { //... } };
 *
 * const color = ref('red');
 * // 将指令添加到虚拟节点，同时传递值和参数
 * withDirectives(createVNode('input'), [
 *   [colorDirective, {get value(){return color.value}, arg:'theme'}] // 指令、值和参数
 * ]);
 * ```
 */
export function withDirectives<T extends View>(
  view: T,
  directives: Array<[name: string | Directive, binding: DirectiveBinding]> | Array<Directive>
): T {
  if (
    view.flag !== ViewFlag.ELEMENT &&
    view.flag !== ViewFlag.WIDGET &&
    view.flag !== ViewFlag.DYNAMIC
  ) {
    return view
  }
  view.directives ??= new Map()
  for (const item of directives) {
    if (isArray(item)) {
      const [name, binding] = item
      if (isPlainObject(name)) {
        view.directives.set(name, binding)
        continue
      }
      const directive = resolveDirective(name)
      if (!directive) {
        logger.warn(`[withDirectives] Unknown directive: ${name}`, view.location)
        continue
      }
      view.directives.set(directive, binding)
      continue
    }
    if (isPlainObject(item)) {
      view.directives.set(item as Directive, { value: undefined })
      continue
    }
    logger.warn(`[withDirectives] Invalid directive: `, item, view.location)
  }
  return view
}
/**
 * 调用指令钩子
 *
 * @internal
 * @param view - 虚拟节点
 * @param element
 * @param hook - 钩子名称
 */
export function applyDirective(
  view: ElementView,
  element: HostElement,
  hook: Exclude<keyof Directive, 'getSSRProps'>
): void {
  if (!view.directives) return
  for (const [directive, binding] of view.directives.entries()) {
    directive[hook]?.(element, binding, view)
  }
}
