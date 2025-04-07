import { Observer } from '../../observer/index'
import type { BaseSignal } from './types'

/**
 * 信号父级关系映射
 */
export type Parents = Map<BaseSignal, Set<AnyKey>>

/**
 * 信号管理器 - 负责管理信号之间的父子关系
 *
 * @description
 * SignalManager提供了一系列静态方法来管理信号之间的父子关系，
 * 用于跟踪和维护信号之间的依赖关系。
 */
export class SignalManager {
  /** 用于存储信号父子关系的WeakMap */
  private static _parentSignalMap = new WeakMap<BaseSignal, Parents>()

  /**
   * 获取指定信号的所有父信号及其关联的键
   *
   * @param signal - 要查询的信号
   * @returns {Parents | undefined} 返回一个Map，其中键为父信号，值为与该父信号关联的键的集合
   */
  public static getParents(signal: BaseSignal): Parents | undefined {
    return this._parentSignalMap.get(signal)
  }

  /**
   * 添加父子信号关系
   *
   * @param signal - 子信号
   * @param parentSignal - 父信号
   * @param key - 关联的键
   * @returns {void}
   */
  public static addParent(signal: BaseSignal, parentSignal: AnyObject, key: AnyKey): void {
    const signalMap = this._parentSignalMap.get(signal) || new Map()
    const parentSet = signalMap.get(parentSignal) || new Set()

    if (!this._parentSignalMap.has(signal)) {
      this._parentSignalMap.set(signal, signalMap)
    }

    if (!signalMap.has(parentSignal)) {
      signalMap.set(parentSignal, parentSet)
    }
    parentSet.add(key)
  }

  /**
   * 移除父子信号关系
   *
   * @param signal - 子信号
   * @param parentSignal - 父信号
   * @param key - 要移除的关联键
   * @returns {void}
   */
  public static removeParent(signal: BaseSignal, parentSignal: BaseSignal, key: AnyKey): void {
    const parentMap = this._parentSignalMap.get(signal)
    if (!parentMap) return
    const keySet = parentMap.get(parentSignal)
    if (!keySet) return
    keySet.delete(key)
    if (keySet.size === 0) parentMap.delete(parentSignal)
    if (parentMap.size === 0) this._parentSignalMap.delete(signal)
  }

  /**
   * 检查是否存在特定的父子信号关系
   *
   * @param signal - 子信号
   * @param parentSignal - 父信号
   * @param key - 要检查的关联键
   * @returns {boolean} - 如果存在指定的父子关系则返回true，否则返回false
   */
  public static hasParent(signal: BaseSignal, parentSignal: BaseSignal, key: AnyKey): boolean {
    const parentMap = this._parentSignalMap.get(signal)
    if (!parentMap) return false
    const keySet = parentMap.get(parentSignal)
    if (!keySet) return false
    return keySet.has(key)
  }

  /**
   * 通知父级信号对象，触发其更新操作。
   *
   * 该方法会获取给定信号的父级信号映射，并遍历每个父级信号，通知其进行更新。
   *
   * @param {BaseSignal} signal - 需要通知父级的信号对象，类型为 `BaseSignal`。
   * @returns {void} 无返回值。
   */
  public static notifyParent(signal: BaseSignal): void {
    // 获取信号的父级映射
    const parentMap = SignalManager.getParents(signal)
    if (!parentMap) return
    // 遍历父级映射，通知每个父级信号进行更新
    for (const [parent, keys] of parentMap) {
      Observer.notify(parent, Array.from(keys) as any)
    }
  }

  /**
   * 通知订阅者属性已更新
   *
   * @template T - 信号类型
   * @param {T} signal - 信号
   * @param {keyof T | Array<keyof T>} property - 属性
   * @param {boolean} [notifyParent=true] - 是否通知父级信号
   * @returns {void}
   */
  public static notifySubscribers<T extends BaseSignal>(
    signal: T,
    property: keyof T | Array<keyof T>,
    notifyParent: boolean = true
  ): void {
    Observer.notify(signal, property)
    if (notifyParent) SignalManager.notifyParent(signal)
  }
}
