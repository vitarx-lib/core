import { logger } from '@vitarx/utils'
import { IS_READONLY, IS_REF, type Ref } from '../shared/index.js'

/**
 * GetterRef 类，用于创建一个只读的引用包装器
 * @template T - 引用值的类型
 */
export class GetterRef<T> implements Ref<T> {
  // 标记此对象是一个引用
  readonly [IS_REF]: true = true
  // 是否是只读引用
  readonly [IS_READONLY]: true = true
  /**
   * 构造函数
   * @param getter - 一个获取值的函数，用于初始化引用
   */
  constructor(private readonly getter: () => T) {}
  /**
   * 获取引用的值
   * 这是一个 getter 属性，用于获取被包装的值
   * @returns - 通过 getter 函数获取的值
   */
  get value(): T {
    return this.getter()
  }
  /**
   * 尝试设置引用的值
   * 这是一个 setter 属性，用于尝试设置被包装的值
   * 对于 ReadonlyRef 来说，设置操作是不允许的
   * @param _newVal - 新值
   * @throws - 总是抛出错误，因为这是只读引用
   */
  set value(_newVal: T) {
    logger.warn('[ReadonlyRef] Cannot set value to a readonly ref')
  }
}
