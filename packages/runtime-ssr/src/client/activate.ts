import { getRenderer, type HostContainer, type HostNode, type View } from '@vitarx/runtime-core'

/**
 * 激活视图
 *
 * @param view 要激活的视图对象
 * @param container 目标容器元素
 */
export function activate(view: View, container: Element): void {
  // 获取渲染器实例
  const renderer = getRenderer()
  // 保存原始的append方法
  const sourceAppendMethod = renderer.append.bind(renderer)
  // 获取节点父节点的函数
  const getParentNode = (node: HostNode): ParentNode | null => {
    // 如果节点是片段，则返回起始锚点的父节点
    if (renderer.isFragment(node)) {
      return node.$startAnchor.parentNode
    }
    // 否则返回节点的直接父节点
    return node.parentNode
  }
  // 重写append方法，添加重复插入检查
  renderer.append = (child: HostNode, parent: HostContainer) => {
    // 如果不允许重复插入，则需要判断节点的父节点是否和当前节点相同
    if (getParentNode(child) === parent) {
      return
    }
    // 调用原始的append方法
    sourceAppendMethod(child, parent)
  }
  // 执行视图的挂载
  view.mount(container)
  // 恢复原始的append方法
  renderer.append = sourceAppendMethod
}
