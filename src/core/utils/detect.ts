/**
 * 判断是否为对象
 *
 * @param val
 */
export function isObject(val: any): val is object {
  return typeof val === 'object' && val !== null
}

/**
 * 判断变量是否为普通对象
 *
 * @param val
 * @returns {boolean}
 */
export function isPlainObject(val: any): val is object {
  return val !== null && typeof val === 'object' && !Array.isArray(val)
}

/**
 * 判断是否为数组对象
 *
 * @param val
 * @returns {boolean}
 */
export function isArray(val: any): val is Array<any> {
  return Array.isArray(val)
}

/**
 * 判断是否为字符串
 *
 * @param val
 * @returns {boolean}
 */
export function isString(val: any): val is string {
  return typeof val === 'string'
}

/**
 * 判断变量是否为空
 *
 * @param val
 */
export function isEmpty(val: any): boolean {
  return !val?.length
}

/**
 * 判断是否为异步函数
 *
 * @param func
 */
export function isAsyncFunction(func: Function): boolean {
  return func.constructor.name === 'AsyncFunction'
}

/**
 * 判断是否为函数
 *
 * @param val
 */
export function isFunction(val: any): val is Function {
  return typeof val === 'function'
}
