import { RAW_VALUE } from '../../constants/index.js'

/**
 * RawValue
 *
 * 该接口用于获取原始值，通常用于获取代理对象的原始值。
 */
export interface RawValue<T> {
  readonly [RAW_VALUE]: T
}
