import { deepClone, isArray, isObject, isPlainObject, isString, numStrToNum } from '../utils'
import { WATCHER_TAG_SYMBOL, withWatcher } from './watch.js'
import { Dep } from './track-dependencies.js'
// 代理标识符
export const PROXY_SYMBOL = Symbol('VITARX_PROXY_SYMBOL')
// 值代理标识符
export const PLAIN_PROXY_SYMBOL = Symbol('VITARX_IS_PLAIN_PROXY_SYMBOL')
// 获取代理对象的所在的根对象
export const VITARX_PROXY_GET_ROOT_SYMBOL = Symbol('VITARX_PROXY_GET_ROOT_SYMBOL')
// 用于描述基于根对象的索引
export type Index = Array<string | symbol | number>

// 格式化数组键
function formatKey(obj: any, key: any) {
  if (isArray(obj) && isString(key)) return numStrToNum(key)
  return key
}

/**
 * 判断是否为代理对象
 *
 * @alias isReactive
 * @param {any} target - 任意变量
 */
export function isProxy(target: any): boolean {
  if (typeof target !== 'object') {
    return false
  }
  return target[PROXY_SYMBOL] !== undefined
}

/**
 * 与isProxy功能相同
 *
 * @alias isProxy
 * @see isProxy
 */
export function isReactive(target: any): boolean {
  return isProxy(target)
}

/**
 * 判断是否为值代理
 *
 * @param target
 */
export function isRef(target: any): boolean {
  if (typeof target !== 'object') return false
  return target[PLAIN_PROXY_SYMBOL] === true
}

/**
 * 获取代理对象对应的索引
 *
 * @param target
 * @returns {Index|undefined} - 如果不存在，则返回 undefined
 */
export function getProxyIndex(target: any): undefined | Index {
  if (typeof target !== 'object') return undefined
  return target[PROXY_SYMBOL]
}

/**
 * 获取根代理对象，
 *
 * 这在嵌套代理的时候非常有用，可以拿到其所在的根对象。
 *
 * @param proxy
 */
export function getProxyRoot(proxy: Vitarx.Ref<object>): any {
  // @ts-ignore
  return proxy?.[VITARX_PROXY_GET_ROOT_SYMBOL]
}

/**
 * 将目标变量转换为值代理
 *
 * @param target
 */
function toRef<T>(target: T): Vitarx.Ref<T> {
  // 对象代理
  const source: Vitarx.Ref<T> = {
    value: target
  } as unknown as Vitarx.Ref<T>
  Object.defineProperty(source, PLAIN_PROXY_SYMBOL, { value: true })
  // 调整toString方法
  Object.defineProperty(source, 'toString', {
    value: function () {
      return this.value?.toString() || 'undefined'
    }
  })
  return source
}

/**
 * 创建代理对象
 *
 * 只需要传入target
 *
 * @template T - 目标变量类型
 * @param source
 * @param deep - 是否深度代理，如果是则会对其子孙嵌套对象进行惰性代理，默认为true
 * @param index - 索引-递归时使用
 * @param root - 顶级代理对象-递归时使用
 */
function createRefProxy<T extends object>(
  source: T,
  deep: boolean = true,
  index: Index = [],
  root?: any
): T {
  // 避免循环代理
  if (isProxy(source)) {
    console.trace('循环代理对象，这可能是无意的，请检查代码。')
    return source
  }
  Object.defineProperty(source, PROXY_SYMBOL, {
    value: index
  })
  root ||= source
  // 代理对象
  return new Proxy(source, {
    get(target, prop, receiver): any {
      // 观察者管理器
      if (prop === WATCHER_TAG_SYMBOL) return withWatcher(root)
      // 获取顶级代理对象
      if (prop === VITARX_PROXY_GET_ROOT_SYMBOL) return root
      let result = Reflect.get(target, prop, receiver)
      // 获取索引直接返回值
      if (prop === PROXY_SYMBOL || prop === PLAIN_PROXY_SYMBOL) return result
      // 子孙级惰性代理
      if (
        isObject(result) &&
        !isProxy(result) &&
        (deep || (isPlainObject(root) && index.length === 0))
      ) {
        const proxy = createRefProxy(result, deep, [...index, formatKey(target, prop)], root)
        // 赋值给父对象
        ;(target as any)[prop] = proxy
        result = proxy as any
      }
      if (target.hasOwnProperty(prop)) {
        // 追踪对象属性引用记录
        Dep.track(root, [...index, formatKey(target, prop)])
      }
      return result
    },
    set(target, key, value, receiver) {
      const oldValue = Reflect.get(target, key)
      if (oldValue !== value) {
        const oldRoot = deepClone(root)
        const result = Reflect.set(target, key, value, receiver)
        if (result) {
          withWatcher(root, false)?.trigger([...index, formatKey(target, key)], root, oldRoot)
        }
        return result
      }
      return true
    },
    deleteProperty(target, prop) {
      // 处理属性被删除
      if (prop === PROXY_SYMBOL || prop === WATCHER_TAG_SYMBOL || prop === PLAIN_PROXY_SYMBOL) {
        console.trace('不允许删除Vitarx代理对象的内部关键属性')
        return false
      }
      const oldRoot = deepClone(root)
      // 实际删除属性
      const result = Reflect.deleteProperty(target, prop)
      if (result) {
        withWatcher(root, false)?.trigger([...index, formatKey(target, prop)], root, oldRoot)
      }
      return result
    }
  })
}

/**
 * 响应式对象
 *
 * @template T - 目标对象类型
 * @param {T} obj - 对象或数组
 * @param {boolean} deep - 是否深度代理，如果是则会对其子孙嵌套对象进行惰性代理，默认为true
 */
export function reactive<T extends Vitarx.ReactiveTarget>(
  obj: T,
  deep: boolean = true
): Vitarx.Reactive<T> {
  return createRefProxy(obj as Vitarx.Reactive<T>, deep)
}

/**
 * ## 创建一个值代理对象，使用`.value`访问或修改
 *
 * > **注意**：使用`deep`选项时需谨慎，当值是一个对象时会惰性的代理所有被访问的子孙级对象，
 * 可能导致内存溢出，应该尽量避免对过于复杂的对象进行`deep`深度代理，使用`Vitarx.trigger`方法来触发更新事件更为合适。
 *
 * @template T - 目标变量类型
 * @param target - 任意目标变量
 * @param deep - 是否深度代理，如果是则会对其子孙嵌套对象进行惰性代理，默认为true
 * @returns {Vitarx.Ref<T>} - 响应式变量
 */
export function ref<T>(target: T, deep: boolean = true): Vitarx.Ref<T> {
  return createRefProxy(toRef(target), deep)
}
