// 任意函数
export type AnyFunction = (...args: any[]) => any
export type AnyObject = Record<string | symbol, any>
export type AnyArray = Array<any>
export type AnyObjectOrArray = AnyObject | AnyArray

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
