/**
 * 生命周期阶段枚举
 *
 * 定义了组件在生命周期中的各个阶段
 */
export const enum Lifecycle {
  /** 准备数据阶段，发生在首次渲染之前 */
  init = 'init',
  /** 挂载阶段 */
  beforeMount = 'beforeMount',
  /** 显式阶段 */
  show = 'show',
  /** 即将挂载阶段 */
  mounted = 'mounted',
  /** 隐藏阶段 */
  hide = 'hide',
  /** 即将卸载阶段 */
  dispose = 'dispose'
}
