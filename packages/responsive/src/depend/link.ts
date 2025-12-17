import {
  EFFECT_DEP_HEAD,
  EFFECT_DEP_TAIL,
  SIGNAL_DEP_HEAD,
  SIGNAL_DEP_TAIL
} from '../constants/index.js'
import type { DepEffect, Signal } from '../types/index.js'

/**
 * DepLink 类用于表示依赖关系中的双向链表节点
 *
 * 它在两个维度上维护链表结构：signal维度和effect维度
 *
 * 这种结构允许在signal和effect之间建立高效的依赖关系
 */
export class DepLink {
  // signal 维度链表的前驱节点，指向同一个signal的前一个依赖关系
  sigPrev?: DepLink
  // signal 维度链表的后继节点，指向同一个signal的后一个依赖关系
  sigNext?: DepLink
  // effect 维度链表
  ePrev?: DepLink
  eNext?: DepLink
  constructor(
    public signal: Signal,
    public effect: DepEffect
  ) {}
}

/**
 * 创建 signal <-> effect 双向链表关联
 *
 * @internal 内部核心助手函数
 */
export function createDepLink(effect: DepEffect, signal: Signal): DepLink {
  const link = new DepLink(signal, effect)

  // -------------------
  // effect 维度链表
  // -------------------
  if (!effect[EFFECT_DEP_HEAD]) {
    effect[EFFECT_DEP_HEAD] = effect[EFFECT_DEP_TAIL] = link
  } else {
    link.ePrev = effect[EFFECT_DEP_TAIL]!
    effect[EFFECT_DEP_TAIL]!.eNext = link
    effect[EFFECT_DEP_TAIL] = link
  }

  // -------------------
  // signal 维度链表
  // -------------------
  if (!signal[SIGNAL_DEP_HEAD]) {
    signal[SIGNAL_DEP_HEAD] = signal[SIGNAL_DEP_TAIL] = link
  } else {
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
export function destroyDepLink(link: DepLink): void {
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
}

/**
 * 移除 effect 关联的所有信号依赖（用于重新收集或销毁）
 */
export function clearEffectDeps(effect: DepEffect) {
  let link = effect[EFFECT_DEP_HEAD]
  while (link) {
    const next = link.eNext
    destroyDepLink(link)
    link = next
  }
  effect[EFFECT_DEP_HEAD] = effect[EFFECT_DEP_TAIL] = undefined
}

/**
 * 移除 Signal 关联的 effect 依赖
 */
export function clearSignalEffects(signal: Signal) {
  let link = signal[SIGNAL_DEP_HEAD]
  while (link) {
    const next = link.sigNext
    destroyDepLink(link)
    link = next
  }
  signal[SIGNAL_DEP_HEAD] = signal[SIGNAL_DEP_TAIL] = undefined
}

/**
 * 将信号(signal)相关的观察者(effects)转换为数组
 *
 * 注意：时间复杂度为O(n)，一般仅用于测试环境
 *
 * @param signal - 需要转换的信号对象
 * @returns {DepEffect[]} 包含所有相关观察者的数组
 */
export function getSignalEffects(signal: Signal): DepEffect[] {
  const arr: DepEffect[] = []
  let node = signal[SIGNAL_DEP_HEAD] as DepLink | undefined
  while (node) {
    arr.push(node.effect)
    node = node.sigNext
  }
  return arr
}

/**
 * 将观察者(effect)的信号链表转换为信号数组
 *
 * 该函数遍历观察者维护的信号链表，将每个信号依次添加到数组中
 *
 * 注意：时间复杂度为O(n)，一般仅用于测试环境
 *
 * @param effect - 观察者对象，包含信号链表的头指针
 * @returns Signal[] - 包含所有信号的数组
 */
export function getEffectSignals(effect: DepEffect): Signal[] {
  const arr: Signal[] = []
  let node = effect[EFFECT_DEP_HEAD] as DepLink | undefined
  while (node) {
    arr.push(node.signal)
    node = node.eNext
  }
  return arr
}
