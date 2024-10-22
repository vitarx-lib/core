import { deepClone, diffIndex, isArray, isObject, isString, numStrToNum } from '../utils'
import { WATCHER_TAG_SYMBOL, withWatcher } from './watch.js'
import { Dep } from './track-dependencies.js'
// 代理标识符
export const IS_PROXY_SYMBOL = Symbol('VITARX_IS_PROXY_SYMBOL')
// 值代理标识符
export const IS_PLAIN_PROXY_SYMBOL = Symbol('VITARX_IS_PLAIN_PROXY_SYMBOL')
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
 * @param {any} target - 任意变量
 */
export function isProxy(target: any): boolean {
  if (typeof target !== 'object') {
    return false
  }
  return target[IS_PROXY_SYMBOL] !== undefined
}

/**
 * 判断是否为值代理
 *
 * @param target
 */
export function isPlainProxy(target: any): boolean {
  if (typeof target !== 'object') return false
  return target[IS_PLAIN_PROXY_SYMBOL] === true
}

/**
 * 获取代理对象对应的索引
 *
 * @param target
 * @returns {Index|undefined} - 如果不存在，则返回 undefined
 */
export function getProxyIndex(target: any): undefined | Index {
  if (typeof target !== 'object') return undefined
  return target[IS_PROXY_SYMBOL]
}

/**
 * 变量转换为响应对象
 *
 * @param target
 * @param index
 */
function toRefObject<T>(target: T, index: Index = []) {
  let source: Ref<T>
  // 对象代理
  if (isObject(target)) {
    source = target as Ref<T>
  }
  // 值代理
  else {
    source = {
      value: target
    } as unknown as Ref<T>
    Object.defineProperty(source, IS_PLAIN_PROXY_SYMBOL, { value: true })
    // 调整toString方法
    Object.defineProperty(source, 'toString', {
      value: function () {
        return this.value.toString()
      }
    })
  }
  // 标识为代理对象
  Object.defineProperty(source, IS_PROXY_SYMBOL, {
    value: index
  })
  return source
}

/**
 * 创建代理对象
 *
 * 只需要传入target
 *
 * @template T - 目标变量类型
 * @param target - 任意目标变量
 * @param deep - 是否深度代理，如果是则会对其子孙嵌套对象进行惰性代理，默认为true
 * @param index - 索引-递归时使用
 * @param root - 顶级代理对象-递归时使用
 */
function createProxy<T>(
  target: T,
  deep: boolean = true,
  index: Index = [],
  root?: Ref<any>
): Ref<T> {
  // 避免循环代理
  if (isProxy(target)) return target as Ref<T>
  const source = toRefObject(target, index)
  root ||= source
  Object.defineProperty(source, WATCHER_TAG_SYMBOL, {
    value: withWatcher(root)
  })
  // 判断是否为值代理
  const plainProxy = isPlainProxy(source)
  // 代理对象
  return new Proxy(source, {
    get(target, prop, receiver): any {
      // 观察者管理器
      if (prop === WATCHER_TAG_SYMBOL) return withWatcher(root)
      let result = Reflect.get(target, prop, receiver)
      // 获取索引直接返回值
      if (prop === IS_PROXY_SYMBOL || prop === IS_PLAIN_PROXY_SYMBOL) return result
      // 子孙级惰性代理
      if (isObject(result) && deep) {
        if (!isProxy(result)) {
          const proxy = createProxy(result, deep, [...index, formatKey(target, prop)], root)
          ;(target as any)[prop] = proxy
          result = proxy as any
        }
      }
      if (target.hasOwnProperty(prop)) {
        // 基本类型代理，跟踪整个对象的变更
        if (plainProxy) {
          // 追踪对象引用记录
          Dep.track(target)
        } else {
          // 追踪对象属性引用记录
          Dep.track(target, formatKey(target, prop))
        }
      }
      return result
    },
    set(target, key, value, receiver) {
      const oldValue = Reflect.get(target, key)
      if (oldValue !== value) {
        const events = [...index, formatKey(target, key)]
        const oldRoot = deepClone(root)
        const result = Reflect.set(target, key, value, receiver)
        if (result) {
          withWatcher(root, false)?.trigger(events, root, oldRoot)
        }
        return result
      }
      return true
    },
    deleteProperty(target, prop) {
      // 处理属性被删除
      if (
        prop === IS_PROXY_SYMBOL ||
        prop === WATCHER_TAG_SYMBOL ||
        prop === IS_PLAIN_PROXY_SYMBOL
      ) {
        console.error('不允许删除Vitarx代理对象的内部关键属性')
        return false
      }
      // 获取被删除属性的值
      const delData = Reflect.get(target, prop)
      // 判断被删除的值是否为代理对象
      const isRef = isProxy(delData)
      const oldRoot = deepClone(root)
      // 实际删除属性
      const result = Reflect.deleteProperty(target, prop)
      if (result) {
        const change = plainProxy ? root.value : root
        if (isRef) {
          const observers = withWatcher(root, false)
          if (observers) {
            // 代理对象被删除触发代理对象变更的所有事件
            diffIndex(delData, {}).forEach((item) => {
              observers.trigger([...index, formatKey(target, prop), ...item], change, oldRoot)
            })
          }
        } else {
          withWatcher(root, false)?.trigger([...index, formatKey(target, prop)], change, oldRoot)
        }
      }
      return result
    }
  })
}

/**
 * 创建响应式变量
 *
 * @template T - 目标变量类型
 * @param target - 任意目标变量
 * @param deep - 是否深度代理，如果是则会对其子孙嵌套对象进行惰性代理，默认为true
 * @returns {Ref<T>} - 响应式变量
 */
export function ref<T>(target: T, deep: boolean = true): Ref<T> {
  return createProxy(target, deep)
}
