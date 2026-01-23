import { type VoidCallback } from '@vitarx/utils'
import { type EffectState } from './effect.js'
import { NEXT_EFFECT, OWNER_SCOPE, PREV_EFFECT } from './symbol.js'

/**
 * 作用域错误处理函数
 *
 * @param error - 错误对象
 * @param source - 错误源，例如 'dispose' | 'pause' | 'resume' | 副作用自定义错误源
 */
export type EffectScopeErrorHandler = (error: unknown, source: string) => void

/**
 * 作用域可选配置选项
 */
export interface EffectScopeOptions {
  /**
   * 作用域名称，用于在调试时更直观地识别作用域
   * 可以是字符串或Symbol类型
   *
   * @default "anonymous"
   */
  name?: string | symbol
  /**
   * 错误处理器，用于处理作用域内的错误。
   * 当一个错误被抛出时，会调用此处理器，并传入错误对象和错误源。
   *
   * @default undefined
   */
  errorHandler?: EffectScopeErrorHandler
}

/**
 * 副作用效果接口定义
 *
 * 定义了副作用效果应该具备的基本方法，这些方法用于管理副作用的生命周期。
 * 所有方法都是可选的，允许实现部分或全部功能。
 */
export interface DisposableEffect {
  /**
   * 双向链表节点引用
   *
   * @internal  由EffectScope注入和使用—— 注意：不可直接修改
   */
  [PREV_EFFECT]?: DisposableEffect
  /**
   * 双向链表节点引用
   *
   * @internal 由EffectScope注入和使用 —— 注意：不可直接修改
   */
  [NEXT_EFFECT]?: DisposableEffect
  /**
   * EffectScope 实例
   *
   * @internal 由EffectScope注入和使用 —— 注意：不可直接修改
   */
  [OWNER_SCOPE]?: EffectScope
  /**
   * 释放资源的方法
   *
   * 当副作用不再需要时调用此方法来清理相关资源，如取消订阅、清除定时器等。
   * 实现此方法可以确保不会发生内存泄漏。
   */
  dispose: () => void
  /**
   * 暂停副作用的方法
   *
   * 用于临时暂停副作用的执行，但不释放其资源。
   * 这在某些场景下很有用，比如组件暂时不可见时暂停更新。
   */
  pause?: () => void
  /**
   * 恢复副作用的方法
   *
   * 用于恢复之前被暂停的副作用执行。
   * 应当与 pause 方法配对使用。
   */
  resume?: () => void
}

let currentActiveScope: EffectScope | undefined

/**
 * EffectScope 作用域
 *
 * 用于管理一组相关的副作用效果，提供统一的生命周期管理。
 * 它维护了一个效果链表，支持添加、移除、暂停、恢复和销毁操作。
 */
export class EffectScope {
  /**
   * 作用域名称
   */
  public readonly name: string | symbol
  /**
   * 可选的错误处理器，用于处理作用域内的错误
   */
  public errorHandler?: EffectScopeErrorHandler
  /**
   * 私有属性，用于存储不同类型的回调函数集合。
   * 使用 Map 数据结构，键为回调类型（'dispose' | 'pause' | 'resume'），值为对应的回调函数集合。
   */
  private _callbacks?: Map<'dispose' | 'pause' | 'resume', Set<VoidCallback>>
  /** 链表头部 */
  private _head?: DisposableEffect
  /** 链表尾部 */
  private _tail?: DisposableEffect
  /** 当前状态 */
  private _state: EffectState = 'active'
  /**
   * 获取当前状态
   */
  get state(): EffectState {
    return this._state
  }

  /**
   * 构造函数，创建一个新的 EffectScope 实例。
   * @param options - 可选配置对象，包含名称和错误处理器
   */
  constructor(options?: EffectScopeOptions) {
    this.name = options?.name || 'anonymous' // 如果没有提供名称，则使用默认名称 'anonymous'
    this.errorHandler = options?.errorHandler // 设置错误处理器
    if (this.errorHandler && typeof this.errorHandler !== 'function') {
      throw new TypeError('errorHandler must be a function') // 验证错误处理器是否为函数
    }
  }

  /**
   * 获取当前作用域中的效果数量
   *
   * 获取数量需要遍历链表，因此时间复杂度为O(n)，一般仅用于测试作用域大小
   *
   * @returns {number} 当前作用域中的效果数量
   */
  get count(): number {
    let n = 0
    let node = this._head
    while (node) {
      n++
      node = node[NEXT_EFFECT]
    }
    return n
  }

  /**
   * 获取所有副作用的访问器属性
   *
   * 返回一个包含所有副作用的数组，按照添加顺序排列
   *
   * 获取数量需要遍历链表，因此时间复杂度为O(n)，一般仅用于测试阶段
   *
   * @warning 仅测试环境有用，开发环境返回固定的空数组
   * @returns {Effect[]} 包含所有效果的数组
   */
  get effects(): DisposableEffect[] {
    if (__DEV__) {
      // 初始化一个空数组用于存放效果
      const list: DisposableEffect[] = []
      // 从链表头部开始遍历
      let node = this._head
      // 遍历整个效果链表
      while (node) {
        // 将当前节点添加到数组中
        list.push(node)
        // 移动到下一个节点
        node = node[NEXT_EFFECT]
      }
      // 返回包含所有效果的数组
      return list
    } else {
      return []
    }
  }

  /**
   * 添加一个在效果被释放时执行的回调函数。
   * @param cb - 要添加的回调函数
   * @returns 返回当前实例，支持链式调用
   */
  onDispose(cb: VoidCallback): this {
    return this.addCallback(cb, 'dispose')
  }

  /**
   * 添加一个在效果被暂停时执行的回调函数。
   * @param cb - 要添加的回调函数
   * @returns 返回当前实例，支持链式调用
   */
  onPause(cb: VoidCallback): this {
    return this.addCallback(cb, 'pause')
  }

  /**
   * 添加一个在效果恢复时执行的回调函数。
   * @param cb - 要添加的回调函数
   * @returns 返回当前实例，支持链式调用
   */
  onResume(cb: VoidCallback): this {
    return this.addCallback(cb, 'resume')
  }

  /**
   * 向效果链表中添加一个新的效果
   * @param effect - 要添加的效果对象
   */
  add(effect: DisposableEffect) {
    // 如果 effect 已经属于当前 scope，直接返回
    if (effect[OWNER_SCOPE] === this) return
    // 如果 effect 当前属于其他 scope，抛出错误而不是静默切换
    if (effect[OWNER_SCOPE]) {
      throw new Error(
        '[Vitarx.EffectScope]: Cannot add effect to scope. Effect already belongs to another scope. Please remove it from the current scope first.'
      )
    }
    // 将当前效果的_scope指针指向当前作用域
    effect[OWNER_SCOPE] = this
    // 将当前效果的_prev指针指向链表的尾部
    effect[PREV_EFFECT] = this._tail
    // 初始化当前效果的_next指针为undefined，因为它是最后一个效果
    effect[NEXT_EFFECT] = undefined
    if (!this._head) this._head = this._tail = effect
    else {
      this._tail![NEXT_EFFECT] = effect
      this._tail = effect
    }
  }

  /**
   * 从效果链表中移除指定的效果节点
   * @param effect - 需要被移除的效果节点
   */
  remove(effect: DisposableEffect) {
    if (!effect[OWNER_SCOPE]) return
    // 将当前效果的_scope指针置为undefined，表示它不再属于任何作用域
    effect[OWNER_SCOPE] = undefined
    // 获取要移除节点的前一个节点和后一个节点
    const prev = effect[PREV_EFFECT]
    const next = effect[NEXT_EFFECT]
    // 如果存在前一个节点，将其_next指针指向后一个节点，从而跳过当前节点
    if (prev) prev[NEXT_EFFECT] = next
    // 如果不存在前一个节点，说明当前节点是头节点，将头节点指向后一个节点
    else this._head = next
    // 如果存在后一个节点，将其_prev指针指向前一个节点，从而跳过当前节点
    if (next) next[PREV_EFFECT] = prev
    // 如果不存在后一个节点，说明当前节点是尾节点，将尾节点指向前一个节点
    else this._tail = prev
    // 清空当前节点的_prev和_next指针，帮助垃圾回收
    effect[PREV_EFFECT] = effect[NEXT_EFFECT] = undefined
  }

  /**
   * 在当前作用域上下文中执行一个函数
   *
   * @template T - 函数返回值的类型
   * @param {() => T} fn - 要执行的函数
   * @returns {T} 函数执行的结果
   */
  run<T>(fn: () => T): T {
    const preScope = currentActiveScope
    try {
      currentActiveScope = this
      return fn()
    } finally {
      currentActiveScope = preScope
    }
  }

  /**
   * 处理副作用错误
   *
   * @param error - 错误对象
   * @param source - 错误源
   */
  public handleError(error: unknown, source: string): void {
    if (this.errorHandler) {
      // 用户自定义处理器
      this.errorHandler(error, source)
    } else {
      throw error instanceof Error
        ? error
        : new Error(`[EffectScope][${String(this.name)}] ${source}: ${String(error)}`)
    }
  }

  /**
   * 释放链表的所有资源，包括每个节点的资源以及链表本身的资源
   * 这是链表的销毁方法，执行后链表将不再可用
   */
  dispose(): void {
    if (this.state === 'disposed') return
    this._state = 'disposed'
    let node = this._head // 从链表头节点开始遍历
    while (node) {
      const next = node[NEXT_EFFECT] // 保存下一个节点的引用，防止当前节点释放后无法访问
      try {
        node.dispose?.() // 尝试调用节点的dispose方法，如果存在的话
      } catch (error) {
        // 如果dispose方法抛出错误，使用错误处理器报告错误
        this.handleError(error, 'dispose')
      } finally {
        node[OWNER_SCOPE] = node[PREV_EFFECT] = node[NEXT_EFFECT] = undefined // 断开当前节点与前后的连接
      }
      node = next // 移动到下一个节点
    }
    // 清空链表的头尾节点引用，使链表完全为空
    this._head = this._tail = undefined
    // 清空错误处理器引用，防止内存泄漏
    this.errorHandler = undefined
    // 触发dispose回调通知监听者
    this.triggerCallback('dispose')
    // 清空所有回调引用，完成资源释放
    this._callbacks = undefined
  }
  /**
   * 暂停链表中的所有节点
   * 该方法会遍历链表中的每个节点，并尝试调用其pause方法（如果存在）
   * 调用完成后，会触发 'pause' 回调
   */
  pause(): void {
    if (this.state !== 'active') return
    this._state = 'paused'
    this.traverseEffects('pause')
  }
  /**
   * 恢复链表中所有节点的执行状态
   * 此方法会遍历链表中的每个节点，并尝试调用其resume方法
   * 如果在恢复过程中发生错误，会通过handleError方法处理
   * 最后会触发 'resume' 类型的回调函数
   */
  resume(): void {
    if (this.state !== 'paused') return
    this._state = 'active'
    this.traverseEffects('resume')
  }
  /**
   * 遍历链表中的每个节点
   *
   * 调用对应的方法
   *
   * @param type - 要调用的方法类型（'pause' | 'resume'）
   */
  private traverseEffects(type: 'pause' | 'resume') {
    let node = this._head
    while (node) {
      const next = node[NEXT_EFFECT]
      try {
        node[type]?.() // 调用对应的方法
      } catch (error) {
        this.handleError(error, type)
      }
      node = next
    }
    this.triggerCallback(type)
  }
  /**
   * 添加回调函数的私有方法。
   * @param cb - 要添加的回调函数
   * @param type - 回调类型（'dispose' | 'pause' | 'resume'）
   * @returns 返回当前实例，支持链式调用
   * @private - 表示此方法仅在类内部可见
   */
  private addCallback(cb: VoidCallback, type: 'dispose' | 'pause' | 'resume') {
    if (this.state === 'disposed') {
      throw new Error(`[EffectScope][${String(this.name)}] EffectScope is already disposed.`)
    }
    if (!this._callbacks) this._callbacks = new Map() // 如果回调映射不存在，则创建一个新的
    const set = this._callbacks.get(type) || new Set() // 获取或创建回调集合
    set.add(cb) // 将回调添加到集合中
    this._callbacks.set(type, set) // 更新回调映射
    return this // 返回当前实例
  }
  /**
   * 触发指定类型的所有回调函数。
   * @param type - 要触发的回调类型（'dispose' | 'pause' | 'resume'）
   * @protected - 表示此方法仅可在类及其子类中访问
   */
  private triggerCallback(type: 'dispose' | 'pause' | 'resume'): void {
    const callbacks = this._callbacks?.get(type) // 获取指定类型的回调集合
    if (!callbacks) return // 如果不存在回调集合，则直接返回
    for (const callback of callbacks) {
      try {
        callback()
      } catch (e) {
        this.handleError(e, `scope.${type}.callback`)
      }
    }
  }
}

/**
 * 获取当前活跃的作用域(EffectScope)
 * 该函数用于从上下文中获取当前的作用域对象
 *
 * @returns {EffectScope | undefined} 返回当前的作用域(EffectScope)对象，如果不存在则返回undefined
 */
export const getActiveScope = (): EffectScope | undefined => currentActiveScope
