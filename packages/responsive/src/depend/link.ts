import type { IWatcher, Signal } from '../types/index.js'

/**
 * signal → watcher 双向链表头
 */
export const DEP_LINK_HEAD = Symbol.for('__v_dep:link-head')
/**
 * signal → watcher 双向链表尾
 */
export const DEP_LINK_TAIL = Symbol.for('__v_dep:link-tail')
/**
 * DepLink 类用于表示依赖关系中的双向链表节点
 *
 * 它在两个维度上维护链表结构：signal维度和watcher维度
 *
 * 这种结构允许在signal和watcher之间建立高效的依赖关系
 */
export class DepLink {
  // signal 维度链表的前驱节点，指向同一个signal的前一个依赖关系
  sigPrev?: DepLink
  // signal 维度链表的后继节点，指向同一个signal的后一个依赖关系
  sigNext?: DepLink
  // watcher 维度链表
  wPrev?: DepLink
  wNext?: DepLink
  constructor(
    public signal: Signal,
    public watcher: IWatcher
  ) {}
}
/**
 * 添加 signal <-> watcher 双向链表关联
 *
 * @internal 内部核心助手函数
 */
export function linkSignalWatcher(watcher: IWatcher, signal: Signal): DepLink {
  const link = new DepLink(signal, watcher)

  // -------------------
  // watcher 维度链表
  // -------------------
  if (!watcher[DEP_LINK_HEAD]) {
    watcher[DEP_LINK_HEAD] = watcher[DEP_LINK_TAIL] = link
  } else {
    link.wPrev = watcher[DEP_LINK_TAIL]!
    watcher[DEP_LINK_TAIL]!.wNext = link
    watcher[DEP_LINK_TAIL] = link
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
 * 移除 signal <-> watcher 链表关联
 *
 * @internal 内部核心助手函数
 */
export function unlinkSignalWatcher(link: DepLink): void {
  const watcher = link.watcher
  const signal = link.signal

  // -------------------
  // watcher 维度
  // -------------------
  if (link.wPrev) link.wPrev.wNext = link.wNext
  if (link.wNext) link.wNext.wPrev = link.wPrev
  if (watcher[DEP_LINK_HEAD] === link) watcher[DEP_LINK_HEAD] = link.wNext
  if (watcher[DEP_LINK_TAIL] === link) watcher[DEP_LINK_TAIL] = link.wPrev

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
 * 移除 Watcher 的所有依赖（用于重新收集或销毁）
 */
export function removeWatcherDeps(watcher: IWatcher) {
  let link = watcher[DEP_LINK_HEAD]
  while (link) {
    const next = link.wNext
    unlinkSignalWatcher(link)
    link = next
  }
  watcher[DEP_LINK_HEAD] = watcher[DEP_LINK_TAIL] = undefined
}

/**
 * 移除 Signal 的所有 Watcher 依赖
 */
export function removeSignalDeps(signal: Signal) {
  let link = signal[DEP_LINK_HEAD]
  while (link) {
    const next = link.sigNext
    unlinkSignalWatcher(link)
    link = next
  }
  signal[DEP_LINK_HEAD] = signal[DEP_LINK_TAIL] = undefined
}

/**
 * 将信号(signal)相关的观察者(watchers)转换为数组
 *
 * 注意：时间复杂度为O(n)，一般仅用于测试环境
 *
 * @param signal - 需要转换的信号对象
 * @returns {IWatcher[]} 包含所有相关观察者的数组
 */
export function signalWatchersToArray(signal: Signal): IWatcher[] {
  const arr: IWatcher[] = [] // 初始化一个空数组，用于存储观察者
  // 从信号的依赖链头部开始遍历
  let node = signal[DEP_LINK_HEAD] as DepLink | undefined
  // 遍历依赖链，将每个观察者添加到数组中
  while (node) {
    arr.push(node.watcher) // 将当前节点中的观察者添加到数组
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
 * @param watcher - 观察者对象，包含信号链表的头指针
 * @returns Signal[] - 包含所有信号的数组
 */
export function watcherSignalsToArray(watcher: IWatcher): Signal[] {
  const arr: Signal[] = [] // 用于存储信号的数组
  // 从链表头开始遍历
  let node = watcher[DEP_LINK_HEAD] as DepLink | undefined
  // 遍历链表，直到节点为undefined
  while (node) {
    arr.push(node.signal) // 将当前节点的信号添加到数组
    node = node.wNext // 移动到下一个节点
  }
  return arr // 返回包含所有信号的数组
}
