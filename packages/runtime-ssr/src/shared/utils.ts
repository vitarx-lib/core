import { flushSync } from '@vitarx/responsive'
import { ComponentView } from '@vitarx/runtime-core'

/**
 * 异步等待组件视图初始化完成。
 *
 * @param view - 组件视图对象，包含需要等待初始化的实例。
 * @returns Promise<void> - 返回一个 Promise，在初始化完成后解析。
 *
 * @remarks
 * 该函数会检查视图实例的 initPromise 属性，如果存在则等待其完成。
 * 完成后会调用 flushSync() 确保所有同步更新被刷新。
 *
 * @example
 * ```typescript
 * const myView: ComponentView = { ... };
 * await waitAsyncInit(myView);
 * ```
 */
export async function waitAsyncInit(view: ComponentView): Promise<void> {
  const initPromise = view.instance!.initPromise
  if (initPromise) {
    await initPromise
    flushSync()
  }
}
