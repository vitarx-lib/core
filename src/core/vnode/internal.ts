import { Depend, type ExtractProp, type Reactive, ReactiveHandler } from '../responsive/index.js'
import { Observers } from '../observer/index.js'
// 默认属性标记
export const VNODE_PROPS_DEFAULT_DATA = Symbol('VNODE_PROPS_DEFAULT_DATA')
const VNODE_PROPS_SYMBOL = Symbol('VNODE_PROPS_SYMBOL')
/**
 * props代理处理器
 */
class PropsProxyHandler<T extends Record<string, any>> extends ReactiveHandler<T> {
  override get(target: T, prop: ExtractProp<T>, receiver: any) {
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

  override set(target: T, prop: ExtractProp<T>, value: any, receiver: any): boolean {
    if (prop === VNODE_PROPS_DEFAULT_DATA) {
      Object.defineProperty(this, prop, { value })
      return true
    }
    if (import.meta.env?.MODE === 'development') {
      console.warn(
        `[Vitarx.PropsProxyHandler][WARN]：组件的 props 应保持单向数据流，你不应该直接修改它。(此警告信息仅在开发调试阶段存在)`
      )
    }
    return super.set(target, prop, value, receiver)
  }

  override deleteProperty(target: T, prop: ExtractProp<T>): boolean {
    if (import.meta.env?.MODE === 'development') {
      console.warn(
        `[Vitarx.PropsProxyHandler][WARN]：组件的 props 应保持单向数据流，你不应该直接修改它。(此警告信息仅在开发调试阶段存在)`
      )
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
export function _proxyWidgetInstanceProps<T extends Record<string | symbol, any>>(
  props: T
): Readonly<T> {
  // 避免重复代理
  if (props[VNODE_PROPS_SYMBOL]) {
    return props as Readonly<T>
  }
  const proxy = new Proxy(
    props,
    new PropsProxyHandler<T>({
      deep: false,
      trigger: prop => {
        Observers.trigger(proxy, prop)
      },
      track: prop => {
        Depend.track(proxy, prop)
      }
    })
  )
  return proxy as Readonly<T>
}
