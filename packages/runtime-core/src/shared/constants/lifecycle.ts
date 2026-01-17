/**
 * 生命周期阶段枚举
 *
 * 定义了组件在生命周期中的各个阶段
 */
export const enum LifecycleStage {
  /** 准备数据阶段，发生在首次渲染之前 */
  prepare = 'prepare',
  /** 挂载前阶段 */
  beforeMount = 'beforeMount',
  /** 挂载完成阶段 */
  mounted = 'mounted',
  /** 进入运行态（可能多次触发） */
  activated = 'activated',
  /** 离开运行态（可能多次触发） */
  deactivated = 'deactivated',
  /** 卸载完成阶段 */
  dispose = 'dispose'
}
export const LifecycleStageMethodMap = {
  [LifecycleStage.prepare]: 'onPrepare',
  [LifecycleStage.beforeMount]: 'onBeforeMount',
  [LifecycleStage.mounted]: 'onMounted',
  [LifecycleStage.activated]: 'onActivated',
  [LifecycleStage.deactivated]: 'onDeactivated',
  [LifecycleStage.dispose]: 'onDispose'
} as const
