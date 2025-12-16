import type { AnyArray, AnyCollection, AnyRecord } from './types'

const objectToString = Object.prototype.toString
const toTypeString = (value: any): string => objectToString.call(value)
const asyncFunction = Object.getPrototypeOf(async function () {})
/**
 * 判断是否为对象
 *
 * @note null值不会被识别为对象
 *
 * @param val - 要判断的变量
 * @returns {boolean} 如果是对象则返回true
 *
 * @example
 * ```typescript
 * isObject({}); // true
 * isObject([]); // true
 * isObject(null); // false
 * isObject(42); // false
 * ```
 */
export function isObject(val: any): val is { [key: PropertyKey]: any } {
  return typeof val === 'object' && val !== null
}
/**
 * 判断变量是否为记录对象
 *
 * @param val - 要判断的变量
 * @returns { boolean } - 如果是键值对对象则返回true
 * @example
 * ```typescript
 * isRecordObject({}); // true
 * isRecordObject([]); // false
 * isRecordObject(new Map()); // false
 * isRecordObject(null); // false
 * isRecordObject(42); // false
 * ```
 */
export function isPlainObject(val: any): val is AnyRecord {
  return toTypeString(val) === '[object Object]'
}
/**
 * 判断是否为数组对象
 *
 * @param val - 要判断的变量
 * @returns {boolean} 如果是数组则返回true
 *
 * @example
 * ```typescript
 * isArray([]); // true
 * isArray(new Array()); // true
 * isArray({}); // false
 * isArray("array"); // false
 * isArray(null); // false
 * ```
 */
export function isArray(val: any): val is Array<any> {
  return Array.isArray(val)
}

/**
 * 判断是否为字符串
 *
 * @param val - 要判断的变量
 * @returns {boolean} 如果是字符串则返回true
 *
 * @example
 * ```typescript
 * isString("hello"); // true
 * isString(String(42)); // true
 * isString(42); // false
 * isString({}); // false
 * isString(null); // false
 * ```
 */
export function isString(val: any): val is string {
  return typeof val === 'string'
}

/**
 * 判断是否为number类型
 *
 * @param val - 要判断的变量
 * @returns {boolean} 如果是数字则返回true
 *
 * @example
 * ```typescript
 * isNumber(42); // true
 * isNumber(3.14); // true
 * isNumber(NaN); // true
 * isNumber(Infinity); // true
 * isNumber("42"); // false
 * isNumber(null); // false
 * ```
 */
export function isNumber(val: any): val is number {
  return typeof val === 'number'
}

/**
 * 判断是否为布尔值
 *
 * @param val - 要判断的变量
 * @returns {boolean} 如果是布尔值则返回true
 *
 * @example
 * ```typescript
 * isBool(true); // true
 * isBool(false); // true
 * isBool(Boolean(1)); // true
 * isBool(1); // false
 * isBool("true"); // false
 * isBool(null); // false
 * ```
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
 *
 * @example
 * ```typescript
 * isEmpty(null); // true
 * isEmpty(undefined); // true
 * isEmpty(0); // true
 * isEmpty(false); // true
 * isEmpty(""); // true
 * isEmpty([]); // true
 * isEmpty({}); // true
 * isEmpty(new Map()); // true
 * isEmpty(new Set()); // true
 * isEmpty([1]); // false
 * isEmpty({a: 1}); // false
 * isEmpty("hello"); // false
 * isEmpty(42); // false
 * isEmpty(true); // false
 * ```
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
 *
 * @example
 * ```typescript
 * isAsyncFunction(async function() {}); // true
 * isAsyncFunction(async () => {}); // true
 * isAsyncFunction(function() {}); // false
 * isAsyncFunction(() => {}); // false
 * isAsyncFunction(function() { return Promise.resolve(); }); // false
 * isAsyncFunction({}); // false
 * ```
 */
export function isAsyncFunction(func: Function): func is (...args: any[]) => Promise<any> {
  return Object.getPrototypeOf(func) === asyncFunction
}

/**
 * 判断是否为函数
 *
 * @param val - 要判断的变量
 * @returns {boolean} 如果是函数则返回true
 *
 * @example
 * ```typescript
 * isFunction(function() {}); // true
 * isFunction(() => {}); // true
 * isFunction(async function() {}); // true
 * isFunction(class {}); // true
 * isFunction(function*() {}); // true
 * isFunction({}); // false
 * isFunction("function"); // false
 * isFunction(null); // false
 * ```
 */
export function isFunction(val: any): val is (...args: any[]) => any {
  return typeof val === 'function'
}

/**
 * 判断是否为纯函数，非类构造函数
 *
 * @param val - 要判断的变量
 * @returns {boolean} 如果是纯函数则返回true
 *
 * @example
 * ```typescript
 * isPureFunction(function() {}); // true
 * isPureFunction(() => {}); // true
 * isPureFunction(async function() {}); // true
 * isPureFunction(function*() {}); // true
 * isPureFunction(class {}); // false
 * isPureFunction({}); // false
 * isPureFunction("function"); // false
 * ```
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
 *
 * @example
 * ```typescript
 * isConstructor(class {}); // true
 * isConstructor(class Test {}); // true
 * isConstructor(function() {}); // false
 * isConstructor(() => {}); // false
 * isConstructor({}); // false
 * isConstructor("class"); // false
 * ```
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
 *
 * @example
 * ```typescript
 * isSimpleGetterFunction(() => 42); // true
 * isSimpleGetterFunction(() => "value"); // true
 * isSimpleGetterFunction(() => obj.prop); // true
 * isSimpleGetterFunction(() => { return 42; }); // false
 * isSimpleGetterFunction(function() { return 42; }); // false
 * isSimpleGetterFunction(val => val); // false
 * isSimpleGetterFunction({}); // false
 * ```
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
 *
 * @example
 * ```typescript
 * isNumString("123"); // true
 * isNumString("00123"); // true
 * isNumString("123.45"); // false
 * isNumString("12a3"); // false
 * isNumString(" 123 "); // false
 * isNumString(" 123 ", true); // true
 * isNumString(123); // false
 * isNumString(null); // false
 * ```
 */
export function isNumString(str: any, allowSpace: boolean = false): str is `${number}` {
  if (typeof str !== 'string') return false
  const integerRegex = /^\d+$/
  if (allowSpace) str = str.replace(/\s+/g, '')
  return integerRegex.test(str)
}

/**
 * 判断是否为Map对象
 *
 * @param obj - 要判断的变量
 * @returns {boolean} 如果是Map对象则返回true
 *
 * @example
 * ```typescript
 * isMap(new Map()); // true
 * isMap(new Map([['key', 'value']])); // true
 * isMap({}); // false
 * isMap(new Set()); // false
 * isMap(new WeakMap()); // false
 * isMap(null); // false
 * ```
 */
export function isMap(obj: any): obj is Map<any, any> {
  return !!obj && obj instanceof Map
}

/**
 * 判断是否为Set对象
 *
 * @param obj - 要判断的变量
 * @returns {boolean} 如果是Set对象则返回true
 *
 * @example
 * ```typescript
 * isSet(new Set()); // true
 * isSet(new Set([1, 2, 3])); // true
 * isSet({}); // false
 * isSet(new Map()); // false
 * isSet(new WeakSet()); // false
 * isSet(null); // false
 * ```
 */
export function isSet(obj: any): obj is Set<any> {
  return !!obj && obj instanceof Set
}

/**
 * 判断是否为WeakMap对象
 *
 * @param obj - 要判断的变量
 * @returns {boolean} 如果是WeakMap对象则返回true
 *
 * @example
 * ```typescript
 * isWeakMap(new WeakMap()); // true
 * isWeakMap({}); // false
 * isWeakMap(new Map()); // false
 * isWeakMap(new Set()); // false
 * isWeakMap(new WeakSet()); // false
 * isWeakMap(null); // false
 * ```
 */
export function isWeakMap(obj: any): obj is WeakMap<WeakKey, any> {
  return !!obj && obj instanceof WeakMap
}

/**
 * 判断是否为WeakSet对象
 *
 * @param obj - 要判断的变量
 * @returns {boolean} 如果是WeakSet对象则返回true
 *
 * @example
 * ```typescript
 * isWeakSet(new WeakSet()); // true
 * isWeakSet({}); // false
 * isWeakSet(new Set()); // false
 * isWeakSet(new Map()); // false
 * isWeakSet(new WeakMap()); // false
 * isWeakSet(null); // false
 * ```
 */
export function isWeakSet(obj: any): obj is WeakSet<WeakKey> {
  return !!obj && obj instanceof WeakSet
}

/**
 * 判断是否集合对象
 *
 * 不区分 Map、Set、WeakMap、WeakSet
 *
 * @param obj - 要判断的变量
 * @returns {boolean} 如果是集合对象则返回true
 *
 * @example
 * ```typescript
 * isCollection(new Map()); // true
 * isCollection(new Set()); // true
 * isCollection(new WeakMap()); // true
 * isCollection(new WeakSet()); // true
 * isCollection({}); // false
 * isCollection([]); // false
 * isCollection(null); // false
 * ```
 */
export function isCollection(obj: any): obj is AnyCollection {
  return (
    obj != null &&
    (obj instanceof Map || obj instanceof Set || obj instanceof WeakMap || obj instanceof WeakSet)
  )
}

/**
 * 判断两个数组是否相等
 *
 * @param a - 第一个数组
 * @param b - 第二个数组
 * @returns {boolean} 如果两个数组长度相等且对应位置元素相等则返回true，否则返回false
 *
 * @example
 * ```typescript
 * isArrayEqual([1, 2, 3], [1, 2, 3]); // true
 * isArrayEqual(['a', 'b'], ['a', 'b']); // true
 * isArrayEqual([1, 2], [1, 2, 3]); // false
 * isArrayEqual([1, 2, 3], [1, 2, 4]); // false
 * isArrayEqual([1, 2], "1,2"); // false
 * isArrayEqual(null, []); // false
 * ```
 */
export function isArrayEqual(a: AnyArray, b: AnyArray): boolean {
  // 如果不是数组，直接返回false
  if (!Array.isArray(a) || !Array.isArray(b)) return false

  // 如果长度不同，直接返回false
  if (a.length !== b.length) {
    return false
  }

  // 逐个比较元素
  for (let i = 0; i < a.length; i++) {
    if (!Object.is(a[i], b[i])) return false
  }

  return true
}

/**
 * 深度比较两个变量内容是否一致
 *
 * @param var1 - 要比较的第一个变量
 * @param var2 - 要比较的第二个变量
 * @param depth - 比较深度，默认为无限深度。0表示只比较引用，1表示只比较一层属性/元素，以此类推
 * @returns {boolean} 如果两个变量在指定深度内完全相等，则返回true；否则返回false
 *
 * @example
 * ```typescript
 * // 基本比较
 * isDeepEqual(1, 1); // true
 * isDeepEqual("hello", "hello"); // true
 * isDeepEqual(null, null); // true
 * isDeepEqual(1, "1"); // false
 *
 * // 对象比较
 * isDeepEqual({a: 1}, {a: 1}); // true
 * isDeepEqual({a: 1}, {a: 2}); // false
 * isDeepEqual({a: 1}, {b: 1}); // false
 *
 * // 数组比较
 * isDeepEqual([1, 2, 3], [1, 2, 3]); // true
 * isDeepEqual([1, 2, 3], [1, 2, 4]); // false
 * isDeepEqual([1, 2], [1, 2, 3]); // false
 *
 * // 嵌套对象比较
 * const obj1 = {a: 1, b: {c: 2}};
 * const obj2 = {a: 1, b: {c: 2}};
 * isDeepEqual(obj1, obj2); // true
 *
 * // 使用深度参数
 * const obj3 = {a: 1, b: {c: {d: 3}}};
 * const obj4 = {a: 1, b: {c: {d: 4}}};
 * isDeepEqual(obj3, obj4, 1); // true (只比较一层)
 * isDeepEqual(obj3, obj4, 2); // false (比较两层)
 *
 * // 特殊情况
 * isDeepEqual(NaN, NaN); // true
 * isDeepEqual(0, -0); // false
 * isDeepEqual({}, {}); // true
 * isDeepEqual(new Date(2023, 0, 1), new Date(2023, 0, 1)); // true
 * ```
 */
export function isDeepEqual(var1: any, var2: any, depth: number = Infinity): boolean {
  // 精确比较两个值是否相同
  if (Object.is(var1, var2)) return true

  // 如果类型不相等或者有一个是null，返回false
  if (typeof var1 !== 'object' || typeof var2 !== 'object' || var1 === null || var2 === null) {
    return false
  }

  // 如果深度为0，只比较引用，已经处理过引用相等的情况，所以这里返回false
  if (depth === 0) return false

  const keys1 = Reflect.ownKeys(var1)
  const keys2 = Reflect.ownKeys(var2)

  if (keys1.length !== keys2.length) return false // 键数量不同

  // 深度在进入下一层比较前减1
  const nextDepth = depth - 1

  for (const key of keys1) {
    // 递归比较嵌套对象
    const value1 = var1[key]
    const value2 = var2[key]

    // 兼容性更好的属性检查方法
    if (
      !Object.hasOwn(var2, key) ||
      !isDeepEqual(value1, value2, nextDepth) // 使用预先计算的下一层深度
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
 *
 * @example
 * ```typescript
 * isPromise(new Promise(() => {})); // true
 * isPromise(Promise.resolve()); // true
 * isPromise(Promise.reject()); // true
 * isPromise(async function() {}); // false
 * isPromise({ then: () => {} }); // false
 * isPromise({}); // false
 * isPromise(null); // false
 * ```
 */
export function isPromise(val: any): val is Promise<any> {
  return !!val && val instanceof Promise
}
