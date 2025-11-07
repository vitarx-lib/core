/**
 * 节点生命周期状态枚举
 *
 * - 创建（created）: 节点创建完成，但尚未渲染真实DOM
 * - 渲染（rendered）: 节点已经渲染真实DOM，但可能尚未挂载到容器中
 * - 激活（activated）: 节点已经激活，已挂载到容器中
 * - 停用（deactivated）: 节点已经停用，但可能仍然挂载在容器中，除非它被显式地停用
 * - 卸载（unmounted）: 节点已经从DOM中移除
 *
 * @enum {string}
 */
export const enum NodeState {
  Created = 'created',
  Rendered = 'rendered',
  Activated = 'activated',
  Deactivated = 'deactivated',
  Unmounted = 'unmounted'
}
