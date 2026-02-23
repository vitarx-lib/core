import { type ExtraDebugData, type SignalOpType, triggerOnTrigger } from './debug.js'
import type { Signal } from './dep.js'
import { SIGNAL_DEP_HEAD } from './symbol.js'

/**
 * 触发信号的处理函数
 *
 * @param signal - 要触发的信号对象
 * @param type - 信号操作类型，默认为`set`
 * @param debugData - 额外的调试数据，可选参数
 */
export function triggerSignal(
  signal: Signal,
  type: SignalOpType = 'set',
  debugData?: ExtraDebugData
): void {
  // 遍历信号的所有依赖链接
  for (let link = signal[SIGNAL_DEP_HEAD]; link; ) {
    const next = link.sigNext // 保存下一个链接节点
    const effect = link.effect // 获取当前链接的effect

    // 在开发环境下，触发调试回调
    if (__VITARX_DEV__) {
      triggerOnTrigger({ ...debugData, effect, signal, type })
    }
    effect() // 调度effect的执行
    link = next // 移动到下一个链接
  }
}
