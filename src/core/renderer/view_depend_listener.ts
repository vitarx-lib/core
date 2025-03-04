import { Listener } from '../observer/index.js'
import { microTaskDebouncedCallback } from '../../utils/index.js'

/**
 * 视图依赖监听器
 */
export class _WidgetViewDependListener extends Listener {
  constructor(callback: VoidCallback) {
    super(microTaskDebouncedCallback(callback), { scope: false })
  }

  /**
   * 清理上一次注册的所有监听器
   */
  clear(): void {
    this.onDestroyedCallback?.forEach(callback => callback())
    this.onDestroyedCallback = undefined
  }
}
