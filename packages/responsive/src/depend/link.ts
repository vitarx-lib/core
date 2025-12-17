import { DEP_LINK_HEAD, DEP_LINK_TAIL } from '../constants/index.js'
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
  wPrev?: DepLink
  wNext?: DepLink
  constructor(
    public signal: Signal,
    public effect: DepEffect
  ) {}
}
/**
 * 添加 signal <-> effect 双向链表关联
 *
 * @internal 内部核心助手函数
 */
export function linkSignalEffect(effect: DepEffect, signal: Signal): DepLink {
  const link = new DepLink(signal, effect)

  // -------------------
  // effect 维度链表
  // -------------------
  if (!effect[DEP_LINK_HEAD]) {
    effect[DEP_LINK_HEAD] = effect[DEP_LINK_TAIL] = link
  } else {
    link.wPrev = effect[DEP_LINK_TAIL]!
    effect[DEP_LINK_TAIL]!.wNext = link
    effect[DEP_LINK_TAIL] = link
  }

  // -------------------
  // signal 维度链表
  // -------------------
  if (!signal[DEP_LINK_HEAD]) {
    signal[DEP_LINK_HEAD] = signal[DEP_LINK_TAIL] = link
  } else {
    link.sigPrev = signal[DEP_LINK_TAIL]!
    signal[DEP_LINK_TAIL]!.sigNext = link
    signal[DEP_LINK_TAIL] = link
  }

  return link
}

/**
 * 移除 signal <-> effect 链表关联
 *
 * @internal 内部核心助手函数
 */
export function unlinkSignalEffect(link: DepLink): void {
  const effect = link.effect
  const signal = link.signal

  // -------------------
  // effect 维度
  // -------------------
  if (link.wPrev) link.wPrev.wNext = link.wNext
  if (link.wNext) link.wNext.wPrev = link.wPrev
  if (effect[DEP_LINK_HEAD] === link) effect[DEP_LINK_HEAD] = link.wNext
  if (effect[DEP_LINK_TAIL] === link) effect[DEP_LINK_TAIL] = link.wPrev

  link.wPrev = link.wNext = undefined

  // -------------------
  // signal 维度
  // -------------------
  if (link.sigPrev) link.sigPrev.sigNext = link.sigNext
  if (link.sigNext) link.sigNext.sigPrev = link.sigPrev
  if (signal[DEP_LINK_HEAD] === link) signal[DEP_LINK_HEAD] = link.sigNext
  if (signal[DEP_LINK_TAIL] === link) signal[DEP_LINK_TAIL] = link.sigPrev

  link.sigPrev = link.sigNext = undefined
}

/**
 * 移除 effect 的所有依赖（用于重新收集或销毁）
 */
export function removeEffectDeps(effect: DepEffect) {
  let link = effect[DEP_LINK_HEAD]
  while (link) {
    const next = link.wNext
    unlinkSignalEffect(link)
    link = next
  }
  effect[DEP_LINK_HEAD] = effect[DEP_LINK_TAIL] = undefined
}

/**
 * 移除 Signal 的所有 effect 依赖
 */
export function removeSignalDeps(signal: Signal) {
  let link = signal[DEP_LINK_HEAD]
  while (link) {
    const next = link.sigNext
    unlinkSignalEffect(link)
    link = next
  }
  signal[DEP_LINK_HEAD] = signal[DEP_LINK_TAIL] = undefined
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
  const arr: DepEffect[] = [] // 初始化一个空数组，用于存储观察者
  // 从信号的依赖链头部开始遍历
  let node = signal[DEP_LINK_HEAD] as DepLink | undefined
  // 遍历依赖链，将每个观察者添加到数组中
  while (node) {
    arr.push(node.effect) // 将当前节点中的观察者添加到数组
    node = node.sigNext // 移动到下一个节点
  }
  return arr // 返回包含所有观察者的数组
}

/**
 * 将观察者(Watcher)的信号链表转换为信号数组
 *
 * 该函数遍历观察者维护的信号链表，将每个信号依次添加到数组中
 *
 * 注意：时间复杂度为O(n)，一般仅用于测试环境
 *
 * @param effect - 观察者对象，包含信号链表的头指针
 * @returns Signal[] - 包含所有信号的数组
 */
export function getEffectSignals(effect: DepEffect): Signal[] {
  const arr: Signal[] = [] // 用于存储信号的数组
  // 从链表头开始遍历
  let node = effect[DEP_LINK_HEAD] as DepLink | undefined
  // 遍历链表，直到节点为undefined
  while (node) {
    arr.push(node.signal) // 将当前节点的信号添加到数组
    node = node.wNext // 移动到下一个节点
  }
  return arr // 返回包含所有信号的数组
}
