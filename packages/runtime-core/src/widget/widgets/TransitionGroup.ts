/**
 * @fileoverview TransitionGroup 组件实现
 *
 * 提供对多个元素进行过渡动画的功能，支持进入、离开和移动动画。
 * 与 Transition 组件不同，TransitionGroup 可以同时处理多个子元素的过渡。
 */

import { type Fragment, FRAGMENT_NODE_TYPE } from '../../constants/index.js'
import { diffDirectives } from '../../directive/index.js'
import { useRenderer } from '../../renderer/index.js'
import type {
  ContainerVNode,
  ElementVNode,
  FragmentVNodeType,
  HostRegularElementNames,
  VNode,
  VNodeChild,
  WithNodeProps
} from '../../types/index.js'
import { getNodeElement, isContainerNode } from '../../utils/index.js'
import { type ChildNodeUpdateHooks, PatchUpdate } from '../../vnode/core/update.js'
import { createVNode } from '../../vnode/index.js'
import { BaseTransition, type BaseTransitionProps } from './BaseTransition.js'

/**
 * TransitionGroup 组件属性接口
 *
 * 扩展了 BaseTransitionProps，添加了多元素过渡所需的额外属性。
 * TransitionGroup 可以同时处理多个子元素的进入、离开和移动动画。
 *
 * @template T - 包裹元素的标签类型，默认为 FragmentNodeType
 */
interface TransitionGroupProps<
  T extends HostRegularElementNames | Fragment | FragmentVNodeType = FragmentVNodeType
> extends BaseTransitionProps {
  /** 包裹子节点的标签名，默认为 fragment */
  tag?: T
  /** 元素移动时使用的类名，默认为 `${name}-move` */
  moveClass?: string
  /** 传递给包裹元素的属性 */
  bindProps?: WithNodeProps<T>
}

/**
 * TransitionGroup 组件
 *
 * 提供对多个元素进行过渡动画的功能，支持进入、离开和移动动画。
 * 与 Transition 组件不同，TransitionGroup 可以同时处理多个子元素的过渡。
 *
 * ## 主要特性
 *
 * - 支持多个子元素同时进行过渡动画
 * - 支持进入、离开和移动三种动画类型
 * - 继承 BaseTransition 的所有功能
 * - 可自定义包裹元素和移动类名
 *
 * ## 使用示例
 *
 * ```tsx
 * // 基础用法
 * <TransitionGroup name="list">
 *   {items.map(item => (
 *     <div key={item.id}>
 *       {item.text}
 *     </div>
 *   ))}
 * </TransitionGroup>
 *
 * // 自定义包裹元素
 * <TransitionGroup name="list" tag="ul">
 *   {items.map(item => (
 *     <li key={item.id}>
 *       {item.text}
 *     </li>
 *   ))}
 * </TransitionGroup>
 *
 * // 对应的 CSS
 * .list-enter-active, .list-leave-active {
 *   transition: all 0.5s;
 * }
 * .list-enter-from {
 *   opacity: 0;
 *   transform: translateY(-30px);
 * }
 * .list-leave-to {
 *   opacity: 0;
 *   transform: translateY(30px);
 * }
 * .list-move {
 *   transition: transform 0.5s;
 * }
 * ```
 *
 * ## 动画类型
 *
 * - **进入动画**：当新元素添加到列表时触发
 * - **离开动画**：当元素从列表中移除时触发
 * - **移动动画**：当元素在列表中改变位置时触发
 *
 * ## 注意事项
 *
 * - 子元素必须有 key 属性，以便正确识别和追踪元素
 * - 移动动画依赖于 transform 属性，确保子元素没有冲突的 transform 样式
 * - 当使用 appear 属性时，初始渲染时会为所有子元素触发进入动画
 */
export class TransitionGroup extends BaseTransition<TransitionGroupProps> {
  /**
   * 组件挂载时的生命周期钩子
   *
   * 如果设置了 appear 属性为 true，则在组件首次挂载时
   * 为所有子元素触发进入动画。
   */
  override onMounted() {
    if (this.props.appear && isContainerNode(this.$vnode)) {
      for (const child of this.$vnode.children) {
        this.runEnter(child)
      }
    }
  }

  /**
   * 构建组件渲染内容
   *
   * 创建指定标签类型的容器节点，并将子节点和绑定属性传递给它。
   * 默认使用 fragment 作为容器，可以通过 tag 属性自定义。
   *
   * @returns {VNodeChild} 创建的容器节点
   */
  override build(): VNodeChild {
    return createVNode(this.props.tag || FRAGMENT_NODE_TYPE, {
      children: this.props.children,
      'v-bind': this.props.bindProps
    })
  }

  /**
   * 覆盖更新方法：处理 enter / leave / move 动画
   *
   * 实现了 TransitionGroup 的核心更新逻辑，处理子元素的进入、
   * 离开和移动动画。通过记录更新前的位置，计算元素移动距离，
   * 并应用相应的过渡效果。
   *
   * 处理流程：
   * 1. 检查根节点类型和 key，决定是否需要替换
   * 2. 更新节点属性
   * 3. 记录更新前所有子元素的位置
   * 4. 更新子节点，并触发相应的进入/离开动画
   * 5. 计算元素移动距离，并应用移动动画
   *
   * @param currentVNode - 当前的虚拟节点
   * @param nextVNode - 新的虚拟节点
   * @returns {VNode} 更新后的虚拟节点
   */
  override $patchUpdate(currentVNode: VNode, nextVNode: VNode): VNode {
    const dom = useRenderer()

    // 根节点类型或 key 不同 → 替换节点
    if (currentVNode.type !== nextVNode.type || currentVNode.key !== nextVNode.key) {
      PatchUpdate.replace(currentVNode, nextVNode)
      return nextVNode
    }

    // 更新节点属性
    PatchUpdate.patchUpdateProps(currentVNode, nextVNode)

    if (isContainerNode(currentVNode)) {
      const container = currentVNode as ContainerVNode

      // === 1️⃣ 记录更新前位置 ===
      // 保存所有子元素的当前位置，用于后续计算移动距离
      const prevRects = new Map<VNode, DOMRect>()
      for (const child of container.children) {
        const el = getNodeElement(child)
        if (dom.isElement(el)) {
          prevRects.set(child, dom.getBoundingClientRect(el))
        }
      }

      // === 2️⃣ 更新子节点 ===
      // 使用自定义的更新钩子处理子节点的进入、离开和显示状态变化
      PatchUpdate.patchUpdateChildren(container, nextVNode as ContainerVNode, {
        onMount: child => this.runEnter(child),
        onUnmount: (child, done) => this.runLeave(child, done),
        onUpdate: this.handleChildUpdate
      })

      // === 3️⃣ 计算并执行 move 动画 ===
      // 比较新旧位置，计算移动距离并应用移动动画
      // 获取移动类名，默认为 `${name}-move`
      const moveClass = this.props.moveClass || `${this.props.name}-move`

      // 遍历所有子元素，检查是否需要移动
      for (const child of container.children) {
        const el = getNodeElement(child)
        const oldRect = prevRects.get(child)

        // 跳过非元素节点或没有旧位置的元素
        if (!dom.isElement(el) || !oldRect) continue

        // 获取当前位置并计算移动距离
        const newRect = dom.getBoundingClientRect(el)
        const dx = oldRect.left - newRect.left
        const dy = oldRect.top - newRect.top

        // 如果没有移动，跳过
        if (!dx && !dy) continue

        // 检查是否已有 move 动画，若有则取消
        const prevCancel = (el as any)._moveCancel
        if (prevCancel) prevCancel()

        // 初始化到旧位置
        const recoverTransform = dom.addStyle(el, 'transform', `translate(${dx}px, ${dy}px)`)
        const recoverTransitionDuration = dom.addStyle(el, 'transitionDuration', '0s')

        // 强制 reflow，确保动画触发
        if ('offsetWidth' in el) void (el as { offsetWidth: number }).offsetWidth

        // 添加 moveClass，启用过渡
        dom.addClass(el, moveClass)

        // 下一帧恢复到目标位置
        dom.requestAnimationFrame(() => {
          recoverTransform()
          recoverTransitionDuration()
        })

        // 检查动画时长，无动画则直接清理
        const duration = this.getDuration(el, 'enter')
        if (duration <= 0) {
          dom.removeClass(el, moveClass)
          continue
        }

        // 设置清理逻辑，在动画结束后移除类名
        const timer = setTimeout(() => {
          try {
            dom.removeClass(el, moveClass)
          } finally {
            delete (el as any)._moveCancel
          }
        }, duration + 16)

        // 暴露取消函数，允许提前取消动画
        ;(el as any)._moveCancel = () => {
          try {
            clearTimeout(timer)
            dom.removeClass(el, moveClass)
          } finally {
            delete (el as any)._moveCancel
          }
        }
      }
    }

    return currentVNode
  }

  /**
   * 处理子节点更新
   *
   * 在现实状态变化时为其执行过渡动画
   *
   * @param oldChild - 旧子节点
   * @param newChild - 新子节点
   * @param done - 完成回调函数
   */
  private handleChildUpdate: ChildNodeUpdateHooks['onUpdate'] = (oldChild, newChild, done) => {
    const oldShow = oldChild.directives?.get('show')?.[1]
    const newShow = newChild.directives?.get('show')?.[1]
    // 处理显示状态变化
    if (oldShow !== newShow) {
      if (oldShow) {
        done({ skip: ['show'] })
        // 从显示变为隐藏，执行离开动画
        this.runTransition(oldChild.el!, 'leave', () =>
          diffDirectives(oldChild as ElementVNode, newChild as ElementVNode, { only: ['show'] })
        )
      } else {
        // 从隐藏变为显示，先完成更新再执行进入动画
        done()
        this.runTransition(oldChild.el!, 'enter')
      }
    } else {
      // 显示状态未变化，直接完成更新
      done()
    }
  }
}
