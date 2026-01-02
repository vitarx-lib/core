import type { DebuggerOptions } from './debug.js'
import {
  DEP_INDEX_MAP,
  DEP_VERSION,
  EFFECT_DEP_HEAD,
  EFFECT_DEP_TAIL,
  SIGNAL_DEP_HEAD,
  SIGNAL_DEP_TAIL
} from './symbol.js'

/**
 * Signal 协议接口（内部使用）
 *
 * Signal 并不是值容器，也不是用户可操作的对象，
 * 它仅作为依赖系统中的协议类型，用于描述对象
 * 可以被 track/trigger，维护依赖链表。
 *
 * 所有信号发出的通知都由值容器（Ref / Reactive / Computed 等）决定，
 * 开发者通常不直接操作 Signal，除非你理解依赖系统机制。
 *
 * @internal
 */
export interface Signal {
  /**
   * signal → effect 链表头
   *
   * ⚠️ 注意：依赖系统核心数据，请勿修改。
   *
   * @internal
   */
  [SIGNAL_DEP_HEAD]?: DepLink
  /**
   * signal → effect 链表尾
   *
   * ⚠️ 注意：依赖系统核心数据，请勿修改。
   *
   * @internal
   */
  [SIGNAL_DEP_TAIL]?: DepLink
  [P: keyof any]: any
}
/**
 * EffectHandle 协议接口（内部使用）
 *
 * Effect 描述对象，可以触发依赖关系。
 *
 * @internal
 */
export interface EffectHandle extends DebuggerOptions {
  /**
   * 依赖版本号
   */
  [DEP_VERSION]?: number
  /**
   * signal <-> effect 索引映射
   *
   * 用于快速查找某个信号的依赖关系。
   * 这是依赖系统的核心数据结构，用于高效地管理依赖关系。
   *
   * ⚠️ 注意：依赖系统核心数据，请勿修改。
   */
  [DEP_INDEX_MAP]?: WeakMap<Signal, DepLink>
  /**
   * signal <-> effect 链表头
   *
   * 用于维护信号到观察者的双向链表结构的起始节点。
   * 这是依赖系统的核心数据结构，用于高效地管理依赖关系。
   *
   * ⚠️ 注意：依赖系统核心数据，请勿修改。
   */
  [EFFECT_DEP_HEAD]?: DepLink
  /**
   * signal <-> effect 链表尾
   *
   * 用于维护信号到观察者的双向链表结构的末尾节点。
   * 这是依赖系统的核心数据结构，用于高效地管理依赖关系。
   *
   * ⚠️ 注意：依赖系统核心数据，请勿修改。
   */
  [EFFECT_DEP_TAIL]?: DepLink
  (): void
}
/**
 * DepLink 类用于表示依赖关系中的双向链表节点
 *
 * 它在两个维度上维护链表结构：signal维度和effect维度
 *
 * 这种结构允许在signal和effect之间建立高效的依赖关系
 */
export class DepLink {
  // signal维度上的前驱节点
  sigPrev?: DepLink
  // signal维度上的后继节点
  sigNext?: DepLink
  // effect维度上的前驱节点
  ePrev?: DepLink
  // effect维度上的后继节点
  eNext?: DepLink;
  // 依赖关系的版本号，用于追踪依赖关系的变化
  [DEP_VERSION]?: number
  /**
   * 构造函数
   * @param signal - 关联的Signal对象
   * @param effect - 关联的DepEffectLike对象
   */
  constructor(
    public signal: Signal,
    public effect: EffectHandle
  ) {}
}

/**
 * 创建 signal <-> effect 双向链表关联
 *
 * @internal 内部核心助手函数
 *
 * @description
 * 该函数用于创建一个双向链表节点，将 effect 和 signal 进行双向关联。
 * 主要包含两个维度的链表维护：
 * 1. effect 维度：维护 effect 所依赖的所有 signal
 * 2. signal 维度：维护所有依赖该 signal 的 effect
 *
 * @param effect - 需要关联的 effect 对象
 * @param signal - 需要关联的 signal 对象
 *
 * @returns 返回新创建的 DepLink 链表节点
 *
 * @example
 * ```typescript
 * const sig = signal(0)
 * const effect = {
 * run(){
 *   console.log('effect run',sig())
 * }
 * }
 * const link = createDepLink(effect, sig)
 * sig(1)
 * ```
 *
 * @remarks
 * - 函数会自动处理链表的头尾节点更新
 * - 使用 EFFECT_DEP_HEAD/EFFECT_DEP_TAIL 和 SIGNAL_DEP_HEAD/SIGNAL_DEP_TAIL 作为链表头尾的标记
 * - 维护了双向链表的前驱(ePrev/sigPrev)和后继(eNext/sigNext)指针
 */
export function linkSignalToEffect(effect: EffectHandle, signal: Signal): DepLink {
  // 创建新的链表节点
  const link = new DepLink(signal, effect)

  // -------------------
  // effect 维度链表
  // -------------------
  // 如果 effect 的依赖链表为空，新节点即为头节点和尾节点
  if (!effect[EFFECT_DEP_HEAD]) {
    effect[EFFECT_DEP_HEAD] = effect[EFFECT_DEP_TAIL] = link
  } else {
    // 否则将新节点添加到链表尾部
    link.ePrev = effect[EFFECT_DEP_TAIL]!
    effect[EFFECT_DEP_TAIL]!.eNext = link
    effect[EFFECT_DEP_TAIL] = link
  }

  // -------------------
  // signal 维度链表
  // -------------------
  // 如果 signal 的依赖链表为空，新节点即为头节点和尾节点
  if (!signal[SIGNAL_DEP_HEAD]) {
    signal[SIGNAL_DEP_HEAD] = signal[SIGNAL_DEP_TAIL] = link
  } else {
    // 否则将新节点添加到链表尾部
    link.sigPrev = signal[SIGNAL_DEP_TAIL]!
    signal[SIGNAL_DEP_TAIL]!.sigNext = link
    signal[SIGNAL_DEP_TAIL] = link
  }

  return link
}
/**
 * 销毁 signal <-> effect 链表关联
 *
 * @internal 内部核心助手函数
 */
export function unlinkSignalFromEffect(link: DepLink): void {
  const { effect, signal } = link

  // -------------------
  // effect 维度
  // -------------------
  if (link.ePrev) link.ePrev.eNext = link.eNext
  if (link.eNext) link.eNext.ePrev = link.ePrev
  if (effect[EFFECT_DEP_HEAD] === link) effect[EFFECT_DEP_HEAD] = link.eNext
  if (effect[EFFECT_DEP_TAIL] === link) effect[EFFECT_DEP_TAIL] = link.ePrev

  link.ePrev = link.eNext = undefined

  // -------------------
  // signal 维度
  // -------------------
  if (link.sigPrev) link.sigPrev.sigNext = link.sigNext
  if (link.sigNext) link.sigNext.sigPrev = link.sigPrev
  if (signal[SIGNAL_DEP_HEAD] === link) signal[SIGNAL_DEP_HEAD] = link.sigNext
  if (signal[SIGNAL_DEP_TAIL] === link) signal[SIGNAL_DEP_TAIL] = link.sigPrev

  link.sigPrev = link.sigNext = undefined

  // -------------------
  // index map（关键补充）
  // -------------------
  effect[DEP_INDEX_MAP]?.delete(signal)
}
/**
 * 移除 Effect 和所有 Signal 关联
 */
export function clearEffectLinks(effect: EffectHandle): void {
  let link = effect[EFFECT_DEP_HEAD]
  while (link) {
    const next = link.eNext
    unlinkSignalFromEffect(link)
    link = next
  }
  effect[DEP_VERSION] =
    effect[DEP_INDEX_MAP] =
    effect[EFFECT_DEP_HEAD] =
    effect[EFFECT_DEP_TAIL] =
      undefined
}
/**
 * 移除 Signal 和所有 Effect 关联
 */
export function clearSignalLinks(signal: Signal): void {
  let link = signal[SIGNAL_DEP_HEAD]
  while (link) {
    const next = link.sigNext
    unlinkSignalFromEffect(link)
    link = next
  }
  signal[SIGNAL_DEP_HEAD] = signal[SIGNAL_DEP_TAIL] = undefined
}

/**
 * 迭代一个 signal 关联的所有 effect
 *
 * @warning ⚠️ 注意：O(n)，主要用于测试 / 调试
 */
export function* iterateLinkedEffects(signal: Signal): IterableIterator<EffectHandle> {
  let node = signal[SIGNAL_DEP_HEAD] as DepLink | undefined
  while (node) {
    yield node.effect
    node = node.sigNext
  }
}

/**
 * 迭代一个 effect 依赖的所有 signal
 *
 * @warning ⚠️ 注意：O(n)，主要用于测试 / 调试
 */
export function* iterateLinkedSignals(effect: EffectHandle): IterableIterator<Signal> {
  let node = effect[EFFECT_DEP_HEAD] as DepLink | undefined
  while (node) {
    yield node.signal
    node = node.eNext
  }
}

/**
 * 判断一个副作用对象是否具有信号依赖
 *
 * @param effect - 待检查的副作用对象
 * @returns {boolean} 如果副作用对象具有信号依赖返回true，否则返回false
 */
export function hasLinkedSignal(effect: EffectHandle): boolean {
  return !!effect?.[EFFECT_DEP_HEAD]
}

/**
 * 判断一个信号对象是否具有副作用依赖
 *
 * @param signal - 待检查的信号对象
 * @returns {boolean} 如果信号对象具有副作用依赖返回true，否则返回false
 */
export function hasLinkedEffect(signal: Signal): boolean {
  return !!signal?.[SIGNAL_DEP_HEAD]
}
