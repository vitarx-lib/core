/** 任意函数 */
export type AnyFunction = (...args: any[]) => any
/**
 * 此类型用于定义一个函数类型
 *
 * @template {Array} P 函数参数类型数组
 * @template {any} R 函数返回值类型
 */
export type FnCallback<P extends any[], R = void> = (...args: P) => R
/** 任意回调函数 */
export type AnyCallback = AnyFunction
/** void 回调函数 */
export type VoidCallback = VoidFunction
/** 任意对象 */
export type AnyRecord = Record<AnyKey, any>
/** 任意数组 */
export type AnyArray = Array<any>
/** 任意 Map */
export type AnyMap = Map<any, any>
/** 任意 WeakMap */
export type AnyWeakMap = WeakMap<WeakKey, any>
/** 任意 WeakSet */
export type AnyWeakSet = WeakSet<WeakKey>
/** 任意 Set */
export type AnySet = Set<any>
/** 任意键 */
export type AnyKey = string | number | symbol
/** 任意集合对象 */
export type AnyCollection = AnyMap | AnyWeakMap | AnyWeakSet | AnySet
/** 任意对象类型 函数除外 */
export type AnyObject = AnyRecord | AnyArray | AnyMap | AnySet | AnyWeakMap | AnyWeakSet
/** 任意原始值类型 */
export type AnyPrimitive = null | undefined | boolean | number | string | bigint | symbol
/**
 * 递归将对象类型中所有属性设为只读
 *
 * 此类型工具会递归地将对象及其嵌套对象中所有属性设为只读（readonly）
 *
 * @template T - 要处理的对象类型
 * @returns {Object} 一个新类型，其中所有属性及嵌套属性都变为只读
 *
 * @example
 * interface User {
 *   id: number;
 *   name: string;
 *   profile: {
 *     avatar: string;
 *     settings: {
 *       theme: string;
 *     }
 *   }
 *   tags: string[];
 * }
 *
 * // 将所有属性及嵌套属性设为只读
 * type ReadonlyUser = DeepReadonly<User>;
 * // 结果等同于:
 * // {
 * //   readonly id: number;
 * //   readonly name: string;
 * //   readonly profile: {
 * //     readonly avatar: string;
 * //     readonly settings: {
 * //       readonly theme: string;
 * //     }
 * //   }
 * //   readonly tags: readonly string[];
 * // }
 */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends AnyFunction | AnyPrimitive | AnyCollection
    ? T[P]
    : T[P] extends Set<infer U>
      ? ReadonlySet<U>
      : T[P] extends Map<infer K, infer V>
        ? ReadonlyMap<K, V>
        : T[P] extends Array<infer U>
          ? ReadonlyArray<DeepReadonly<U>>
          : T[P] extends object
            ? DeepReadonly<T[P]>
            : T[P]
}
/**
 * 递归移除对象类型中所有属性的只读修饰符
 *
 * 此类型工具会递归地移除对象及其嵌套对象中所有属性的只读（readonly）修饰符
 *
 * @template T - 要处理的对象类型
 * @returns {Object} 一个新类型，其中所有属性及嵌套属性都不再是只读的
 *
 * @example
 * interface ReadonlyUser {
 *   readonly id: number;
 *   readonly name: string;
 *   readonly profile: {
 *     readonly avatar: string;
 *     readonly settings: {
 *       readonly theme: string;
 *     }
 *   }
 * }
 *
 * // 移除所有只读修饰符
 * type WritableUser = UnReadonly<ReadonlyUser>;
 * // 结果等同于:
 * // {
 * //   id: number;
 * //   name: string;
 * //   profile: {
 * //     avatar: string;
 * //     settings: {
 * //       theme: string;
 * //     }
 * //   }
 * // }
 */
export type UnReadonly<T> = {
  -readonly [P in keyof T]: T[P] extends AnyFunction | AnyPrimitive | AnyCollection
    ? T[P]
    : T[P] extends Array<infer U>
      ? Array<UnReadonly<U>>
      : T[P] extends Map<infer K, infer V>
        ? Map<K, V>
        : T[P] extends WeakMap<infer K, infer V>
          ? WeakMap<K, V>
          : T[P] extends WeakSet<infer V>
            ? WeakSet<V>
            : T[P] extends object
              ? UnReadonly<T[P]>
              : T[P]
}
/**
 * 将对象类型中的指定属性设为必填项
 *
 * 此类型工具接收一个对象类型和一组键名，将这些键对应的属性转换为必填项，
 * 同时移除这些属性的 undefined 类型
 *
 * @template T - 要处理的对象类型
 * @template K - 需要设为必填的属性键
 * @returns {Object} 一个新类型，其中K指定的属性变为必填，其他属性保持不变
 *
 * @example
 * interface User {
 *   id?: number;
 *   name?: string;
 *   email?: string;
 * }
 *
 * // 将id和name设为必填
 * type RequiredUser = MakeRequired<User, 'id' | 'name'>;
 * // 结果等同于: { id: number; name: string; email?: string; }
 */
export type MakeRequired<T extends object, K extends keyof T> = Omit<T, K> & {
  [P in K]-?: Exclude<T[P], undefined> // 强制指定的属性 K 为必填
}
/**
 * 深度必填类型
 *
 * 将对象类型的所有属性及其嵌套属性都变为必填，并移除 undefined 类型
 *
 * @template T - 要处理的对象类型
 * @returns {Object} 一个新类型，其中所有属性及嵌套属性都变为必填
 *
 * @example
 * interface User {
 *   id: number;
 *   name?: string;
 *   profile?: {
 *     avatar?: string;
 *     settings?: {
 *       theme?: string;
 *       notifications?: boolean;
 *     }
 *   }
 * }
 *
 * // 所有属性及嵌套属性都变为必填
 * type RequiredUser = DeepRequired<User>;
 * // 等同于:
 * // {
 * //   id: number;
 * //   name: string;
 * //   profile: {
 * //     avatar: string;
 * //     settings: {
 * //       theme: string;
 * //       notifications: boolean;
 * //     }
 * //   }
 * // }
 */
export type DeepRequired<T> = {
  [K in keyof T]-?: T extends Record<string | symbol, any>
    ? DeepRequired<T[K]>
    : Exclude<T[K], undefined>
}
/**
 * 深度可选类型
 *
 * 将对象类型的所有属性及其嵌套属性都变为可选
 *
 * @template T - 要处理的对象类型
 * @returns {Object} 一个新类型，其中所有属性及嵌套属性都变为可选
 *
 * @example
 * interface User {
 *   id: number;
 *   name: string;
 *   profile: {
 *     avatar: string;
 *     settings: {
 *       theme: string;
 *       notifications: boolean;
 *     }
 *   }
 * }
 *
 * // 所有属性及嵌套属性都变为可选
 * type PartialUser = DeepPartial<User>;
 * // 等同于:
 * // {
 * //   id?: number;
 * //   name?: string;
 * //   profile?: {
 * //     avatar?: string;
 * //     settings?: {
 * //       theme?: string;
 * //       notifications?: boolean;
 * //     }
 * //   }
 * // }
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends Record<string | symbol, any> ? DeepPartial<T[P]> : T[P]
}
/**
 * 将接口的指定属性设为可选
 *
 * @template T - 要处理的对象类型
 * @template K - 需要设为可选的属性键
 * @returns {Object} 一个新类型，其中K指定的属性变为可选，其他属性保持不变
 *
 * @example
 * interface User {
 *   id: number;
 *   name: string;
 *   email: string;
 * }
 *
 * // 将name和email设为可选
 * type PartialUser = MakePartial<User, 'name' | 'email'>;
 * // 结果等同于: { id: number; name?: string; email?: string; }
 */
export type MakePartial<T extends object, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
/**
 * 提取对象类型中所有可选属性的键
 *
 * @template T - 要被提取的对象类型
 * @returns {string} 一个联合类型，包含T中所有可选属性的键名
 *
 * @example
 * interface User {
 *   id: number;
 *   name?: string;
 *   email?: string;
 *   age: number;
 * }
 *
 * // 提取所有可选属性的键
 * type UserOptionalKeys = OptionalKeys<User>;
 * // 结果为: 'name' | 'email'
 */
export type OptionalKeys<T extends Object> = {
  [K in keyof T]: undefined extends T[K] ? K : never
}[keyof T]
/**
 * 挑选出对象类型中所有可选属性，并将它们转换为必选属性
 *
 * @template T - 键值对对象类型
 * @returns {Object} 一个新类型，仅包含原类型中的可选属性，但这些属性变为必选且不允许undefined值
 *
 * @example
 * interface User {
 *   id: number;
 *   name?: string;
 *   email?: string | null;
 *   age: number;
 * }
 *
 * // 提取所有可选属性并转为必选
 * type RequiredOptionalProps = PickOptional<User>;
 * // 结果为: { name: string; email: string | null; }
 */
export type PickOptional<T extends Object> = {
  [K in OptionalKeys<T>]-?: Exclude<T[K], undefined>
}
/**
 * 提取对象类型中所有必填属性的键
 *
 * @template T - 要被提取的对象类型
 * @returns {string} 一个联合类型，包含T中所有必填属性的键名
 */
export type RequiredKeys<T extends Object> = {
  [K in keyof T]: undefined extends T[K] ? never : K
}[keyof T]

/**
 * 挑选出必填属性，去除所有可选属性
 *
 * @template T - 键值对对象类型
 * @returns {Object} 一个新类型，仅包含原类型中的必填属性
 *
 * @example
 * interface User {
 *   id: number;
 *   name?: string;
 *   email?: string | null;
 *   age: number;
 * }
 *
 * // 仅保留必填属性
 * type RequiredPropsOnly = PickRequired<User>;
 * // 结果为: { id: number; age: number; }
 */
export type PickRequired<T extends Object> = {
  [K in RequiredKeys<T>]: T[K]
}
