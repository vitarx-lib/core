import { isFunction } from '@vitarx/utils'
import { trackSignal, triggerSignal } from '../../core/index.js'
import { IS_REF, IS_SIGNAL, type RefSignal } from '../shared/index.js'

/**
 * ShallowRef 类是一个浅层引用类，实现了 RefSignal 接口
 *
 * @template T - 泛型参数，表示引用值的类型
 */
export class ShallowRef<T = any> implements RefSignal<T> {
  // 标记此对象是一个 ref
  readonly [IS_REF]: true = true
  // 标记此对象是一个 signal
  readonly [IS_SIGNAL]: true = true
  /**
   * 构造函数，创建一个新的 ShallowRef 实例
   * @param initialValue - 初始值
   */
  constructor(initialValue: T) {
    this._value = initialValue
  }
  // 私有属性，存储实际的值
  private _value: T
  /**
   * 获取值的访问器
   * @returns - 返回存储的值
   */
  get value(): T {
    // 当获取值时，追踪信号依赖
    trackSignal(this, 'get', { key: 'value' })
    return this._value
  }
  /**
   * 设置值的访问器
   * @param newValue - 要设置的新值
   */
  set value(newValue: T) {
    // 保存旧值用于比较
    const oldValue = this._value
    // 如果新旧值相同，则不触发更新
    if (Object.is(newValue, oldValue)) return
    // 更新值
    this._value = newValue
    // 触发信号更新，通知依赖
    triggerSignal(this, 'set', { key: 'value', newValue, oldValue })
  }
  toString(): string {
    const val = this.value
    if (val?.toString && isFunction(val.toString)) {
      return val.toString()
    }
    return `[Object Ref<${typeof val}>]`
  }
  [Symbol.toPrimitive](hint: string): any {
    switch (hint) {
      case 'number':
        return this.value
      case 'string':
        return this.toString()
      case 'default':
        return this.value
    }
  }
}
