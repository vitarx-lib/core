import { REF_SYMBOL } from '../../constants/index.js'
import type { RefWrapper } from '../../types/index.js'

/**
 * PropertyRef 是一个泛型类，用于对象属性的引用。
 *
 * 核心功能：
 * - 提供对象属性访问
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
export class PropertyRef<T extends object, K extends keyof T> implements RefWrapper<T[K]> {
  constructor(
    private readonly _target: T,
    private readonly _key: K,
    private readonly _defaultValue?: T[K]
  ) {}
  readonly [REF_SYMBOL]: true = true
  get value(): T[K] {
    const v = this._target[this._key]
    return v === undefined ? this._defaultValue! : v
  }
  set value(newVal: T[K]) {
    this._target[this._key] = newVal
  }
}
