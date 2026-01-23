/**
 * 节点生命周期状态枚举
 *
 * - 视图未被使用(UNUSED):
 *   View 尚未进入运行时。
 *
 * - 初始化完成（INITIALIZED）:
 *   View 已完成初始化，子树结构确定。
 *
 * - 已挂载（ACTIVATED）:
 *   View 已挂载到 DOM 树中。
 *
 * - 已挂载（DEACTIVATED）:
 *   View 已从 DOM 树中移除。
 *
 * - 已卸载（UNUSED）:
 *   当视图被销毁时，会重新回到 UNUSED 状态。
 *
 * @enum {string}
 */
export const enum ViewState {
  UNUSED,
  INITIALIZED,
  ACTIVATED,
  DEACTIVATED
}
