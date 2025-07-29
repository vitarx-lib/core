import { ReactiveProxyHandler } from '@vitarx/responsive'

export const VNODE_PROPS_DEFAULT_DATA = Symbol('VNODE_PROPS_DEFAULT_DATA')
const VNODE_PROPS_SYMBOL = Symbol('VNODE_PROPS_SYMBOL')
const message = `[Vitarx.PropsProxyHandler][WARN]：The component's props should maintain a one-way data flow, and you shouldn't modify it directly. (This warning only exists during the development and debugging phase)`

/**
 * props代理处理器
 */
class PropsProxyHandler<T extends Record<string, any>> extends ReactiveProxyHandler<T> {
  override get(target: any, prop: any, receiver: any) {
    if (prop === VNODE_PROPS_SYMBOL) return true
    let value = super.get(target, prop, receiver)
    if (value === undefined || value === null) {
      // 尝试从默认属性中获取
      const defaultProps = Reflect.get(this, VNODE_PROPS_DEFAULT_DATA)
      if (defaultProps && Reflect.has(defaultProps, prop)) {
        value = Reflect.get(defaultProps, prop, defaultProps)
      }
    }
    return value
  }

  override set(target: T, prop: any, value: any, receiver: any): boolean {
    if (prop === VNODE_PROPS_DEFAULT_DATA) {
      Object.defineProperty(this, prop, { value })
      return true
    }
    if (import.meta.env?.MODE === 'development') {
      console.warn(message)
    }
    return super.set(target, prop, value, receiver)
  }

  override deleteProperty(target: T, prop: any): boolean {
    if (import.meta.env?.MODE === 'development') {
      console.warn(message)
    }
    return super.deleteProperty(target, prop)
  }
}

/**
 * 创建props代理
 *
 * @internal 内部使用，请勿外部调用。
 * @param {Record<string, any>} props
 * @returns {Reactive<Record<string, any>>}
 */
export function proxyWidgetProps<T extends Record<string | symbol, any>>(props: T): Readonly<T> {
  // 避免重复代理
  if (props[VNODE_PROPS_SYMBOL]) {
    return props as Readonly<T>
  }
  return new PropsProxyHandler<T>(props).proxy as Readonly<T>
}
