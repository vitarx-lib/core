import type { AnyArray, AnyCollection, AnyRecord } from './types'

/**
 * 判断是否为对象
 *
 * @note null值不会被识别为对象
 *
 * @param val - 要判断的变量
 * @returns {boolean} 如果是对象则返回true
 */
export function isObject(val: any): val is object {
  return typeof val === 'object' && val !== null
}

/**
 * 判断变量是否为键值对记录对象
 *
 * @note 仅排除 Array 类型，集合类型也会被认为是一个键值对对象
 *
 * @param val - 要判断的变量
 * @returns { boolean } - 如果是键值对对象则返回true
 */
export function isRecordObject(val: any): val is AnyRecord {
  return val !== null && typeof val === 'object' && !Array.isArray(val)
}

/**
 * 判断是否为数组对象
 *
 * @param val - 要判断的变量
 * @returns {boolean} 如果是数组则返回true
 */
export function isArray(val: any): val is Array<any> {
  return Array.isArray(val)
}

/**
 * 判断是否为字符串
 *
 * @param val - 要判断的变量
 * @returns {boolean} 如果是字符串则返回true
 */
export function isString(val: any): val is string {
  return typeof val === 'string'
}

/**
 * 判断是否为number类型
 *
 * @param val - 要判断的变量
 * @returns {boolean} 如果是数字则返回true
 */
export function isNumber(val: any): val is number {
  return typeof val === 'number'
}

/**
 * 判断是否为布尔值
 *
 * @param val - 要判断的变量
 * @returns {boolean} 如果是布尔值则返回true
 */
export function isBool(val: any): val is boolean {
  return typeof val === 'boolean'
}

/**
 * 判断变量是否为空
 *
 * 空对象、空集合、空数组、0、false、null、undefined，都会被视为空
 *
 * @param val - 要判断的变量
 * @returns {boolean} 如果为空返回true
 */
export function isEmpty(val: any): boolean {
  if (!val) return true

  if (typeof val === 'object') {
    if (isArray(val)) {
      return !val.length
    }
    if (isCollection(val)) {
      return ('size' in val ? val.size : 1) === 0
    }
    return Object.keys(val).length === 0
  }
  return false
}

/**
 * 判断函数是否使用了async关键字声明
 *
 * @note 仅判断是否使用了async关键字，不判断返回Promise类型
 *
 * @param func - 要判断的函数
 * @returns {boolean} 如果是异步函数则返回true
 */
export function isAsyncFunction(func: Function): func is (...args: any[]) => Promise<any> {
  return Object.getPrototypeOf(func) === Object.getPrototypeOf(async function () {})
}

/**
 * 判断是否为函数
 *
 * @param val - 要判断的变量
 * @returns {boolean} 如果是函数则返回true
 */
export function isFunction(val: any): val is (...args: any[]) => any {
  return typeof val === 'function'
}

/**
 * 判断是否为纯函数，非类构造函数
 *
 * @param val - 要判断的变量
 * @returns {boolean} 如果是纯函数则返回true
 */
export function isPureFunction(val: any): val is (...args: any[]) => any {
  return typeof val === 'function' && !val.toString().startsWith('class ')
}

/**
 * 判断是否为类构造函数
 *
 * @note 使用 func.toString().startsWith('class ') 判断，可能存在性能问题
 *
 * @param func - 要判断的函数
 * @returns {boolean} 如果是类构造函数则返回true
 */
export function isConstructor(func: any): func is new (...args: any[]) => any {
  return typeof func === 'function' && func.toString().startsWith('class ')
}

/**
 * 判断是否为一个简单的getter函数
 *
 * @note 必须是 `()=>any` 写法
 *
 * @param fn - 要判断的函数
 * @returns {boolean} 如果是简单getter函数则返回true
 */
export function isSimpleGetterFunction(fn: any): fn is () => any {
  if (typeof fn !== 'function') return false
  const fnString = fn.toString().trim()
  const regex = /^\(\s*\)\s*=>\s*[^{]+$/
  return regex.test(fnString)
}

/**
 * 判断是否为纯数字字符串
 *
 * @param str - 待检测的字符串
 * @param allowSpace - 是否允许包含空格字符
 * @returns {boolean} 是否为纯数字字符串
 */
export function isNumString(str: any, allowSpace: boolean = false): str is `${number}` {
  if (typeof str !== 'string') return false
  const integerRegex = /^\d+$/
  str = String(str)
  if (allowSpace) str = str.replace(/\s+/g, '')
  return integerRegex.test(str)
}

/**
 * 判断是否为Map对象
 *
 * @param obj - 要判断的变量
 * @returns {boolean} 如果是Map对象则返回true
 */
export function isMap(obj: any): obj is Map<any, any> {
  return Object.prototype.toString.call(obj) === '[object Map]'
}

/**
 * 判断是否为Set对象
 *
 * @param obj - 要判断的变量
 * @returns {boolean} 如果是Set对象则返回true
 */
export function isSet(obj: any): obj is Set<any> {
  return Object.prototype.toString.call(obj) === '[object Set]'
}

/**
 * 判断是否为WeakMap对象
 *
 * @param obj - 要判断的变量
 * @returns {boolean} 如果是WeakMap对象则返回true
 */
export function isWeakMap(obj: any): obj is WeakMap<WeakKey, any> {
  return Object.prototype.toString.call(obj) === '[object WeakMap]'
}

/**
 * 判断是否为WeakSet对象
 *
 * @param obj - 要判断的变量
 * @returns {boolean} 如果是WeakSet对象则返回true
 */
export function isWeakSet(obj: any): obj is WeakSet<WeakKey> {
  return Object.prototype.toString.call(obj) === '[object WeakSet]'
}

/**
 * 判断是否集合对象
 *
 * 不区分 Map、Set、WeakMap、WeakSet
 *
 * @param obj - 要判断的变量
 * @returns {boolean} 如果是集合对象则返回true
 */
export function isCollection(obj: any): obj is AnyCollection {
  return isMap(obj) || isSet(obj) || isWeakMap(obj) || isWeakSet(obj)
}

/**
 * 判断两个数组是否相等
 *
 * @param a - 第一个数组
 * @param b - 第二个数组
 * @returns {boolean} 如果两个数组长度相等且对应位置元素相等则返回true，否则返回false
 */
export function isArrayEqual(a: AnyArray, b: AnyArray): boolean {
  // 如果不是数组，直接返回false
  if (!Array.isArray(a) || !Array.isArray(b)) {
    return false
  }

  // 如果长度不同，直接返回false
  if (a.length !== b.length) {
    return false
  }

  // 逐个比较元素
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      return false
    }
  }

  return true
}

/**
 * 深度比较两个变量内容是否一致
 *
 * @param var1 - 要比较的第一个变量
 * @param var2 - 要比较的第二个变量
 * @returns {boolean} 如果两个变量完全相等，则返回true；否则返回false
 */
export function isDeepEqual(var1: any, var2: any): boolean {
  // 精确比较两个值是否相同
  if (Object.is(var1, var2)) return true

  // 如果类型不相等或者有一个是null，返回false
  if (typeof var1 !== 'object' || typeof var2 !== 'object' || var1 === null || var2 === null) {
    return false
  }

  const keys1 = Reflect.ownKeys(var1)
  const keys2 = Reflect.ownKeys(var2)

  if (keys1.length !== keys2.length) return false // 键数量不同

  for (const key of keys1) {
    // 递归比较嵌套对象
    const value1 = var1[key]
    const value2 = var2[key]

    if (
      !Object.prototype.hasOwnProperty.call(var2, key) ||
      !isDeepEqual(value1, value2) // 对比基本类型
    ) {
      return false // 键值不一致，立即返回false
    }
  }

  return true // 所有键和值一致
}

/**
 * 判断是否为Promise
 *
 * @param val - 要判断的变量
 * @returns {boolean} 如果是Promise对象则返回true
 */
export function isPromise(val: any): val is Promise<any> {
  return val instanceof Promise
}
