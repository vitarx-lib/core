import { triggerSignal } from '../../../depend/index.js'
import { ChildSignal, ObjectProxyHandler } from './object.js'

/**
 * ArrayProxyHandler 类继承自 ObjectProxyHandler，用于处理数组类型的代理操作
 * @template T - 表示数组类型，必须是 any[] 的子类型
 */
export class ArrayProxyHandler<T extends any[]> extends ObjectProxyHandler<T> {
  // 存储数组旧长度的私有属性
  private oldLength: number
  // 存储数组长度特殊子信号的只读属性
  private readonly lengthSignal: ChildSignal<T, 'length'>
  /**
   * 构造函数
   * @param target - 目标数组
   * @param deep - 是否深度代理，可选参数，默认为 false
   */
  constructor(target: T, deep?: boolean) {
    super(target, deep)
    // 初始化旧长度为当前数组长度
    this.oldLength = target.length
    // 与构建长度特殊子信号
    this.lengthSignal = new ChildSignal(target, 'length', false)
    this.childMap.set('length', this.lengthSignal)
  }
  protected override doSet(target: T, p: keyof T, newValue: any, receiver: any): boolean {
    if (p === 'length') {
      if (typeof newValue !== 'number' || newValue < 0 || !Number.isInteger(newValue)) {
        throw new TypeError(`Invalid array length: ${newValue}`)
      }
      const oldValue = this.oldLength
      if (newValue === oldValue) return true
      target.length = newValue
      for (let i = newValue; i < oldValue; i++) {
        const sig = this.childMap.get(i)
        if (sig) {
          sig.invalidate(undefined) // 解绑依赖
          this.childMap.delete(i)
        }
      }
      this.oldLength = newValue
      // 触发长度更新通知，必须主动触发，不能通过修改子信号值触发，因为子信号会判断值是否一致
      triggerSignal(this.lengthSignal, 'set', { oldValue, newValue })
      // 触发代理对象 结构变化信号
      this.triggerSignal('add', { key: p, oldValue, newValue })
      return true
    }
    return super.doSet(target, p, newValue, receiver)
  }
}
