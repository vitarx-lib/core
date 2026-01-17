/**
 * 节点生命周期状态枚举
 *
 * - 已进入运行时状态(ALLOCATED):
 *   runtime 对象已存在，但运行时数据可能还未就绪。
 * - 所有运行时所需数据已就绪（READY）:
 *   HostNode 已创建，指令已生效，视图副作用已建立，
 *   挂载前的准备工作已完成，但尚未进入 host 树。
 *
 * - 已挂载完成（mounted）:
 *   节点已挂载到 host 树中，内容可能呈现在荧幕上。
 *
 * - 销毁（disposed）:
 *   节点已被卸载并销毁，所有关联资源与副作用已释放。
 *
 * @enum {string}
 */
export const enum ViewState {
  ALLOCATED,
  READY,
  MOUNTED,
  DISPOSED
}
