import { REF_SIGNAL_SYMBOL, SIGNAL_RAW_VALUE_SYMBOL, SIGNAL_SYMBOL } from '../constants.js'
import type { RefSignal } from '../types/index.js'

/**
 * PropertyRef 是一个泛型类，用于创建对对象属性的引用信号。
 * 它实现了 RefSignal 接口，允许对对象的特定属性进行响应式访问和修改。
 *
 * 核心功能：
 * - 提供对对象属性的响应式访问
 * - 支持默认值设置
 * - 实现了标准的 getter/setter 接口
 *
 * @example
 * ```typescript
 * const obj = reactive({ name: 'John' });
 * const nameRef = new PropertyRef(obj, 'name', 'Default');
 *
 * // 获取值
 * console.log(nameRef.value); // 'John'
 *
 * // 设置值
 * nameRef.value = 'Jane';
 * console.log(obj.name); // 'Jane'
 * ```
 *
 * @param _target - 要引用属性的目标对象
 * @param _key - 要引用的属性键名
 * @param _defaultValue - 可选的默认值，当属性未定义时使用
 *
 * @remarks
 * - 该类使用 TypeScript 的泛型确保类型安全
 * - 目标对象必须是引用类型（object）
 * - 属性键必须是目标对象的有效键
 * - 当属性值为 undefined 时，将返回默认值（如果提供）
 */
export class PropertyRef<T extends object, K extends keyof T> implements RefSignal {
  readonly [REF_SIGNAL_SYMBOL] = true
  readonly [SIGNAL_SYMBOL] = true
  constructor(
    private readonly _target: T,
    private readonly _key: K,
    private readonly _defaultValue?: T[K]
  ) {}
  get [SIGNAL_RAW_VALUE_SYMBOL](): T[K] {
    return this.value
  }
  get value(): T[K] {
    const v = this._target[this._key]
    return v === undefined ? this._defaultValue! : v
  }
  set value(newVal: T[K]) {
    this._target[this._key] = newVal
  }
}

/**
 * 创建一个属性引用对象，用于观察和响应对象属性的变化
 *
 * @param target - 目标对象，其属性将被观察
 * @param key - 目标对象上要观察的属性键
 * @param defaultValue - 可选参数，属性的默认值
 * @returns {PropertyRef<T, K>} 返回一个新的 PropertyRef 实例
 * @template T - 目标对象的类型
 * @template K - 目标对象属性键的类型，必须是 T 的键之一
 * @example
 * const obj = reactive({ name: 'John' });
 * const nameRef = propertyRef(obj, 'name', 'Default');
 * console.log(nameRef.value); // 'John'
 * nameRef.value = 'Jane';
 * console.log(obj.name); // 'Jane'
 *
 * @see {@link PropertyRef}
 */
export function propertyRef<T extends object, K extends keyof T>(
  target: T, // 目标对象，需要被观察属性变化的对象
  key: K, // 目标对象的属性键，将被观察和响应变化
  defaultValue?: T[K] // 可选参数，当属性值为 undefined 时使用的默认值
): PropertyRef<T, K> {
  return new PropertyRef(target, key, defaultValue) // 创建并返回一个新的 PropertyRef 实例
}
