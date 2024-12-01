export * from './clone.js'
export * from './detect.js'
export * from './diff.js'
export * from './conversion.js'
export * from './uuid.js'
export * from './quick.js'

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
  type DeepReadonly<T> =
    T extends Promise<any>
      ? T
      : T extends AnyFunction
        ? T
        : T extends object
          ? {
              readonly [P in keyof T]: DeepReadonly<T[P]>
            }
          : Readonly<T>
  /** 深度可写 */
  type unDeepReadonly<T> =
    T extends Readonly<object>
      ? {
          [P in keyof T]: unDeepReadonly<T[P]>
        }
      : T
  /** 让接口的部分属性 为必填项 */
  type MakeRequired<T extends object, K extends keyof T> = T & {
    [P in K]-?: T[P] // 强制指定的属性 K 为必填
  }
}
