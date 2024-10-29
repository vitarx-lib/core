// 任意函数
export type AnyFunction = (...args: any[]) => any
// 任意回调函数
export type AnyCallback = AnyFunction
// 任意对象
export type AnyRecord = Record<any, any>
// 任意数组
export type AnyArray = Array<any>
// 任意 Map
export type AnyMap = Map<any, any>
// 任意 WeakMap
export type AnyWeakMap = WeakMap<WeakKey, any>
// 任意 WeakSet
export type AnyWeakSet = WeakSet<WeakKey>
// 任意 Set
export type AnySet = Set<any>
// 任意集合对象
export type AnyCollection = AnyMap | AnyWeakMap | AnyWeakSet | AnySet
// 任意对象类型 函数除外
export type AnyObject = AnyRecord | AnyArray | AnyMap | AnySet | AnyWeakMap | AnyWeakSet
// 任意原始值类型
export type AnyPrimitive = null | undefined | boolean | number | string | bigint | symbol
// 深度只读
export type DeepReadonly<T> = T extends object
  ? {
      readonly [P in keyof T]: DeepReadonly<T[P]>
    }
  : Readonly<T>
// 深度可写
export type unDeepReadonly<T> =
  T extends Readonly<object>
    ? {
        [P in keyof T]: unDeepReadonly<T[P]>
      }
    : T
