import { useDomAdapter } from '../../host-adapter/index.js'
import type {
  FragmentNodeType,
  HostRegularElementNames,
  VNodeChild,
  WithNodeProps
} from '../../types/index.js'
import {
  type ContainerNode,
  createVNode,
  type Fragment,
  FRAGMENT_NODE_TYPE,
  isContainerNode,
  VNode,
  VNodeUpdate
} from '../../vnode/index.js'
import { BaseTransition, type BaseTransitionProps } from './BaseTransition.js'

interface TransitionGroupProps<
  T extends HostRegularElementNames | Fragment | FragmentNodeType = FragmentNodeType
> extends BaseTransitionProps {
  /**
   * 包裹子节点的标签名
   *
   * 默认使用的是片段节点
   *
   * @default 'fragment'
   */
  tag?: T
  /**
   * 元素移动时使用的类名
   *
   * @default `${name}-move`
   */
  moveClass?: string
  /**
   * 传递给包裹元素的props
   *
   * 此属性对象会绑定到包裹元素上
   */
  bindProps?: WithNodeProps<T>
}
export class TransitionGroup extends BaseTransition<TransitionGroupProps> {
  override build(): VNodeChild {
    return createVNode(this.props.tag || FRAGMENT_NODE_TYPE, {
      children: this.props.children,
      'v-bind': this.props.bindProps
    })
  }
  /**
   * 覆盖更新方法，用于处理动画
   * @param currentVNode - 当前虚拟节点
   * @param nextVNode - 下一个虚拟节点
   * @returns {VNode} 更新后的虚拟节点
   */
  override $patchUpdate(currentVNode: VNode, nextVNode: VNode): VNode {
    // 如果用户更改了根节点类型，则直接替换，不执行任何动画！
    if (currentVNode.type !== nextVNode.type || currentVNode.key !== nextVNode.key) {
      VNodeUpdate.replace(currentVNode, nextVNode)
      return nextVNode
    }
    // 同类型节点，更新属性
    VNodeUpdate.patchUpdateProps(currentVNode, nextVNode)
    if (isContainerNode(currentVNode)) {
      /**
       * 容器节点
       */
      const container = currentVNode as ContainerNode
      // === 1️⃣ 记录更新前子节点位置 ===
      const prevRects = new Map<VNode, DOMRect>()
      container.children.forEach(child => {
        if (dom.isElement(child.element)) {
          prevRects.set(child, dom.getBoundingClientRect(child.element))
        }
      })
      // === 2️⃣ 更新子节点 ===
      VNodeUpdate.patchUpdateChildren(container, nextVNode as ContainerNode, {
        onMount: child => this.runEnter(child),
        onUnmount: (child, done) => this.runLeave(child, done),
        onUpdate: (oldChild, newChild, done) => {
          if (oldChild.show !== newChild.show) {
            if (oldChild.show) {
              this.runTransition(oldChild.element, 'leave', () => (oldChild.show = false))
              done(true)
            } else {
              done()
              this.runTransition(oldChild.element, 'enter')
            }
          } else {
            done()
          }
        }
      })

      // === 3️⃣ 记录新位置并执行 move 动画 ===
      const moveClass = this.props.moveClass || `${this.props.name}-move`
      const dom = useDomAdapter()
      container.children.forEach(child => {
        const el = child.element
        const oldRect = prevRects.get(child)
        if (!dom.isElement(el) || !oldRect) return
        const newRect = dom.getBoundingClientRect(el)
        const dx = oldRect.left - newRect.left
        const dy = oldRect.top - newRect.top
        if (dx || dy) {
          // 记录旧动画的取消函数
          const prevCancel = (el as any)._moveCancel
          if (prevCancel) prevCancel()
          // 初始化到旧位置
          const recoverTransform = dom.addStyle(el, 'transform', `translate(${dx}px, ${dy}px)`)
          const recoverTransitionDuration = dom.addStyle(el, 'transitionDuration', '0s')
          // 强制 reflow
          if ('offsetWidth' in el) void el.offsetWidth
          // 应用 move 过渡
          dom.addClass(el, moveClass)
          // 下一帧恢复到新位置
          dom.requestAnimationFrame(() => {
            recoverTransform()
            recoverTransitionDuration()
          })
          // 设置定时器，清理 moveClass
          const duration = this.getDuration(el, 'enter')
          const timer = setTimeout(() => {
            dom.removeClass(el, moveClass)
            delete (el as any)._moveCancel
          }, duration + 16)

          // 暴露取消函数
          ;(el as any)._moveCancel = () => {
            clearTimeout(timer)
            dom.removeClass(el, moveClass)
            delete (el as any)._moveCancel
          }
        }
      })
    }
    return currentVNode
  }
}
