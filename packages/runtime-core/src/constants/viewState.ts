/**
 * 节点生命周期状态枚举
 *
 * - 分离状态 (DETACHED):
 *   View 对象已创建，但还未进入运行时视图树。
 *
 * - 初始化完成（INITIALIZED）:
 *   View 已完成初始化，子树结构确定。
 *
 * - 已挂载（MOUNTED）:
 *   View 已挂载到 DOM 树中。
 */
export enum ViewState {
  DETACHED = 'detached',
  INITIALIZED = 'initialized',
  MOUNTED = 'mounted'
}
