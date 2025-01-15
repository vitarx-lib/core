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
 * 判断是否为数字
 *
 * @param val
 */
export function isNumber(val: any): val is number {
  return typeof val === 'number'
}

/**
 * 判断是否为布尔值
 *
 * @param {any} val - 要判断的变量
 * @returns {boolean}
 */
export function isBool(val: any): val is boolean {
  return typeof val === 'boolean'
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
export function isAsyncFunction(func: Function): func is (...args: any[]) => Promise<any> {
  return Object.getPrototypeOf(func) === Object.getPrototypeOf(async function () {})
}

/**
 * 判断是否为函数
 *
 * @param val
 */
export function isFunction(val: any): val is (...args: any[]) => any {
  return typeof val === 'function'
}

/**
 * 判断是否为纯函数，非类构造函数
 *
 * @param val
 */
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
 * @param str - 待检测的字符串
 * @param allowSpace - 是否包含允许空格字符
 * @returns {boolean} - 是否为纯数字字符串
 */
export function isNumString(str: any, allowSpace: boolean = false): str is `${number}` {
  if (typeof str !== 'string') return false
  const integerRegex = /\d+$/
  str = Object(str)
  if (allowSpace) str = str.replace(/\s+/g, '')
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

/**
 * 深度比较两个变量是否相等
 *
 * @param {any} var1 - 要比较的第一个变量
 * @param {any} var2 - 要比较的第二个变量
 * @returns {boolean} - 如果两个变量完全相等，则返回 true；否则返回 false
 */
export function isDeepEqual(var1: any, var2: any): boolean {
  // 精确比较两个值是否相同
  if (Object.is(var1, var2)) return true

  // 如果类型不相等或者有一个是 null，返回 false
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
      return false // 键值不一致，立即返回 false
    }
  }

  return true // 所有键和值一致
}

/**
 * 判断是否为Promise
 *
 * @param val
 */
export function isPromise(val: any): val is Promise<any> {
  return val instanceof Promise
}
