import type { HostContainer, View, ViewContext } from '../types/index.js'

/**
 * 替换视图
 *
 * 此 API 仅做逻辑形替换，并不影响树结构，需自行确保树结构正确。
 *
 * @internal - 视图核心助手函数，开发者慎用！！！
 * @param prev - 前一个视图实例
 * @param next - 即将显示的新视图实例
 */
export function replaceView(prev: View, next: View): void {
  // 检查前一个视图是否已激活，如果未激活则直接返回
  if (!prev.isUnused) return
  // 检查前一个视图是否已被停用，如果已被停用则抛出错误
  if (prev.isDeactivated) {
    throw new Error(
      `[replaceView]: Attempted to replace view, but previous view is already deactivated. ` +
        `This may occur when switching dynamic views too rapidly or due to a bug.`
    )
  }
  // 检查新视图是否已经激活，如果已激活则抛出错误
  if (!next.isUnused && !next.isInitialized) {
    throw new Error(
      `[replaceView]: Attempted to replace view, but next view is already active. ` +
        `This may occur when switching dynamic views too rapidly or due to an unexpected state. ` +
        `Ensure that views are properly managed during transitions. `
    )
  }
  // 根据前一个视图的初始化状态决定如何处理新视图
  if (prev.isInitialized) {
    // 如果前一个视图已初始化，则使用相同的上下文初始化新视图
    next.init(prev.ctx)
  } else {
    // 如果前一个视图未初始化，则直接挂载新视图到指定节点
    next.mount(prev.$node!, 'insert')
  }
  // 处理完新视图后，销毁前一个视图
  prev.dispose()
}

/**
 * 渲染视图函数
 *
 * @param view - 要渲染的视图对象，必须继承自View类
 * @param container - 视图将被挂载到的宿主容器
 * @param ctx - 可选的视图上下文参数
 */
export function renderView<T extends View>(
  view: T,
  container: HostContainer,
  ctx?: ViewContext
): void {
  // 返回类型与输入的视图类型相同
  view.init(ctx).mount(container, 'replace')
}
