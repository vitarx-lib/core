import { NodeState } from '../../constants/index.js'
import { linkParentNode } from '../../runtime/index.js'
import type { StatelessWidgetNodeType, VNode } from '../../types/index.js'
import { isVNode } from '../../utils/index.js'
import { patchUpdate } from '../../vnode/core/update.js'
import { createCommentVNode, createTextVNode } from '../../vnode/index.js'
import { WidgetRuntime } from './WidgetRuntime.js'

/**
 * 无状态组件运行时管理器类，用于管理无状态组件的渲染和更新
 * 核心功能：
 * - 管理无状态组件的属性更新和DOM重建
 * - 处理组件的虚拟DOM构建和差异更新
 *
 * 构造函数参数：
 * - type: 无状态组件的构造函数
 * - props: 组件的初始属性对象
 *
 * 使用限制：
 * - 组件构建函数不能返回函数类型的结果
 * - 只能返回VNode、字符串或数字类型的结果
 * - 其他类型的返回值将被转换为注释节点
 */
export class StatelessWidgetRuntime extends WidgetRuntime<StatelessWidgetNodeType> {
  public update(): void {
    // 如果有变化，重新构建子节点，并进行patch更新
    const newNode = this.build()
    if (this.state === NodeState.Created) {
      this.cachedChildVNode = newNode
      return
    }
    this.cachedChildVNode = patchUpdate(this.child, newNode)
  }
  /**
   * 构建组件的核心方法
   * 根据组件类型和属性，构建并返回对应的虚拟DOM节点
   * @returns {VNode} 构建得到的虚拟DOM节点
   */
  public override build(): VNode {
    let child: VNode
    // 调用组件类型方法并传入props，获取构建结果
    // 如果构建结果是字符串或数字，创建文本节点并返回
    const buildResult = this.runInContext(() => this.type.call(null, this.props))
    // 如果构建结果是VNode节点，直接返回
    if (isVNode(buildResult)) {
      child = buildResult
    } else {
      // 获取构建结果的类型
      const t = typeof buildResult
      // 如果构建结果是函数，抛出错误
      if (t === 'function')
        throw new Error(`StatelessWidget<${this.name}> cannot return a function`)
      // 如果构建结果是字符串或数字，创建并返回文本节点
      if (t === 'string' || t === 'number') {
        child = createTextVNode({ text: String(buildResult) })
      } else {
        child = createCommentVNode({
          text: `StatelessWidget<${this.name}> returned invalid type ${t}`
        })
      }
    }
    linkParentNode(child, this.vnode)
    return child
  }
}
