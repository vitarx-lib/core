export * from './clone.js'
export * from './detect.js'
export * from './diff.js'
export * from './conversion.js'
export * from './quick.js'
export * from './css_utils.js'

declare global {
  /** 任意函数 */
  type AnyFunction = (...args: any[]) => any
  /** 任意回调函数 */
  type AnyCallback = AnyFunction
  /** void 回调函数 */
  type VoidCallback = VoidFunction
  /** 任意对象 */
  type AnyRecord = Record<any, any>
  /** 任意数组 */
  type AnyArray = Array<any>
  /** 任意 Map */
  type AnyMap = Map<any, any>
  /** 任意 WeakMap */
  type AnyWeakMap = WeakMap<WeakKey, any>
  /** 任意 WeakSet */
  type AnyWeakSet = WeakSet<WeakKey>
  /** 任意 Set */
  type AnySet = Set<any>
  /** 任意集合对象 */
  type AnyCollection = AnyMap | AnyWeakMap | AnyWeakSet | AnySet
  /** 任意对象类型 函数除外 */
  type AnyObject = AnyRecord | AnyArray | AnyMap | AnySet | AnyWeakMap | AnyWeakSet
  /** 任意原始值类型 */
  type AnyPrimitive = null | undefined | boolean | number | string | bigint | symbol
  /** 深度只读 */
  type DeepReadonly<T> = {
    readonly [P in keyof T]: T[P] extends Record<string | symbol, any> ? DeepReadonly<T[P]> : T[P]
  }
  /** 取消只读 */
  type UnReadonly<T> = {
    [P in keyof T]: T[P] extends Record<string | symbol, any> ? UnReadonly<T[P]> : T[P]
  }
  /** 将接口的部分属性 为必填项 */
  type MakeRequired<T extends object, K extends keyof T> = T & {
    [P in K]-?: Exclude<T[P], void> // 强制指定的属性 K 为必填
  }
  /** 深度必填 */
  type DeepRequired<T> = {
    [K in keyof T]-?: T extends Record<string | symbol, any> ? DeepRequired<T[K]> : T[K]
  }
  /** 深度可选 */
  type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends Record<string | symbol, any> ? DeepPartial<T[P]> : T[P]
  }
  /** 将接口的部分属性设为可选 */
  type MakePartial<T extends object, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
}
