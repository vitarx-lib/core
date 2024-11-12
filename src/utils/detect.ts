/**
 * 判断是否为对象
 *
 * @param val
 */
export function isObject(val: any): val is object {
  return typeof val === 'object' && val !== null
}

/**
 * 判断变量是否为键值对记录对象
 *
 * @note 数组类型除外
 *
 * @param val
 * @returns {boolean}
 */
export function isRecordObject(val: any): val is Record<any, any> {
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
  if (!val) return true

  if (typeof val === 'object') {
    if (isArray(val)) {
      return !val.length
    }
    return !Object.keys(val).length
  }
  return false
}

/**
 * 判断函数是否使用了async关键字声明
 *
 * @note 仅判断是否使用了async关键字，不判断返回Promise类型
 *
 * @param func
 */
export function isAsyncFunction(func: Function): func is () => Promise<any> {
  return typeof func === 'function' && func?.constructor?.name === 'AsyncFunction'
}

/**
 * 判断是否为函数
 *
 * @param val
 */
export function isFunction(val: any): val is (...args: any[]) => any {
  return typeof val === 'function'
}

export function isPureFunction(val: any): val is (...args: any[]) => any {
  return typeof val === 'function' && !val.toString().startsWith('class ')
}
/**
 * 判断是否为类构造函数
 *
 * @param func
 */
export function isConstructor(func: any): func is new (...args: any[]) => any {
  return typeof func === 'function' && func.toString().startsWith('class ')
}

/**
 * 判断是否为一个简单的getter函数
 *
 * @note 必须是 `()=>any` 写法
 *
 * @param fn
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
 * @param str
 */
export function isNumString(str: string): boolean {
  const integerRegex = /\d+$/
  return integerRegex.test(str)
}

/**
 * 判断是否为Map对象
 *
 * @param obj
 */
export function isMap(obj: any): obj is Map<any, any> {
  return Object.prototype.toString.call(obj) === '[object Map]'
}

/**
 * 判断是否为Set对象
 *
 * @param obj
 */
export function isSet(obj: any): obj is Set<any> {
  return Object.prototype.toString.call(obj) === '[object Set]'
}

/**
 * 判断是否为WeakMap对象
 *
 * @param obj
 */
export function isWeakMap(obj: any): obj is WeakMap<WeakKey, any> {
  return Object.prototype.toString.call(obj) === '[object WeakMap]'
}

/**
 * 判断是否为WeakSet对象
 *
 * @param obj
 */
export function isWeakSet(obj: any): obj is WeakSet<WeakKey> {
  return Object.prototype.toString.call(obj) === '[object WeakSet]'
}

/**
 * 判断是否集合对象
 *
 * 不区分 Map、Set、WeakMap、WeakSet
 *
 * @param obj
 */
export function isCollection(obj: any): obj is AnyCollection {
  return isMap(obj) || isSet(obj) || isWeakMap(obj) || isWeakSet(obj)
}
