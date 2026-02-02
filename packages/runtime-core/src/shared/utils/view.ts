import type { HostContainer, View, ViewContext } from '../../types/index.js'

/**
 * 渲染视图函数
 *
 * @param view - 要渲染的视图对象，必须继承自View类
 * @param container - 视图将被挂载到的宿主容器
 * @param ctx - 可选的视图上下文参数
 */
export function render<T extends View>(view: T, container: HostContainer, ctx?: ViewContext): void {
  // 返回类型与输入的视图类型相同
  view.init(ctx).mount(container, 'append')
}
