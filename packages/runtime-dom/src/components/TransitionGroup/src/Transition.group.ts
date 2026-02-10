import {
  type AnyProps,
  createElementView,
  defineValidate,
  For,
  getInstance,
  type HostElementTag,
  type ListProps,
  type View,
  type WithProps
} from '@vitarx/runtime-core'
import { isFunction, logger } from '@vitarx/utils'
import type { VoidElementTag } from '../../../types/index.js'
import type { BaseTransitionProps } from '../../Transition/src/index.js'
import { getDuration, isElement, runTransition } from '../../Transition/src/Transition.utils.js'

type ContainerTag = Exclude<HostElementTag, VoidElementTag>
interface TransitionGroupProps<T, Tag extends ContainerTag>
  extends BaseTransitionProps,
    ListProps<T> {
  /** 包裹子节点的标签名 */
  tag?: Tag
  /** 元素移动时使用的类名，默认为 `${name}-move` */
  moveClass?: string
  /** 传递给包裹元素的属性 */
  bindProps?: WithProps<Tag>
}

/**
 * TransitionGroup 组件，用于处理一组元素的进入、离开、移动过渡动画。
 *
 * @param props - 组件属性
 * @returns - 返回渲染的视图
 *
 * @example
 * ```jsx
 * const list = ref(['a', 'b', 'c'])
 * <TransitionGroup each={list} key={item=>item}  name="list" tag="ul">
 *    {item => <li>{item}</li>}
 * </TransitionGroup>
 * ```
 * ```css
 * .list-enter-active,
 * .list-leave-active {
 *   transition: all 0.5s ease;
 * }
 * .list-enter-from,
 * .list-leave-to {
 *   opacity: 0;
 *   transform: translateX(30px);
 * }
 * ```
 */
function TransitionGroup<T, Tag extends ContainerTag = ContainerTag>(
  props: TransitionGroupProps<T, Tag>
): View {
  // 获取当前实例
  const instance = getInstance()!
  // 获取容器标签
  const tag = props.tag
  // 存储元素之前的位置信息
  const prevRects = new Map<View, DOMRect>()
  // 创建列表视图
  const listView = For<T>({
    // 获取要渲染的元素数组
    get each() {
      return props.each
    },
    // 获取子元素渲染函数
    get children() {
      return props.children
    },
    // 获取元素键值
    get key() {
      return props.key
    },
    // 更新前回调
    onBeforeUpdate: (children: View[]): void => {
      // 如果视图未挂载，则直接返回
      if (!instance.isMounted) return void 0
      // 遍历子元素，记录它们的位置信息
      for (const child of children) {
        const el = child.node
        if (isElement(el)) {
          prevRects.set(child, el.getBoundingClientRect())
        }
      }
    },
    // 更新后回调
    onAfterUpdate: (children: View[]): void => {
      // 如果视图未挂载，则直接返回
      if (!instance.isMounted) return void 0
      // 获取过渡类名前缀
      const name = props.name || 'v'
      // 获取移动动画类名
      const moveClass = props.moveClass || `${name}-move`
      // 遍历子元素，处理移动动画
      for (const child of children) {
        const el = child.node
        // 如果不是元素节点，则跳过
        if (!isElement(el)) continue
        // 获取元素之前的位置信息
        const oldRect = prevRects.get(child)
        if (!oldRect) continue
        // 获取元素当前位置信息
        const newRect = el.getBoundingClientRect()
        // 计算位置偏移量
        const dx = oldRect.left - newRect.left
        const dy = oldRect.top - newRect.top
        // 如果没有移动，跳过
        if (!dx && !dy) continue
        // 检查是否已有 move 动画，若有则取消
        const prevCancel = el.__cancelMoveTransition
        if (prevCancel) prevCancel()
        const rawTransform = el.style.getPropertyValue('transform')
        const rawTransitionDuration = el.style.getPropertyValue('transitionDuration')
        el.style.setProperty('transform', `translate(${dx}px, ${dy}px)`)
        el.style.transitionDuration = '0s'
        // 强制重排
        el.offsetWidth
        // 添加 moveClass，启用过渡
        el.classList.add(moveClass)
        // 下一帧恢复到目标位置
        requestAnimationFrame(() => {
          if (rawTransform) {
            el.style.setProperty('transform', rawTransform)
          } else {
            el.style.removeProperty('transform')
          }
          if (rawTransitionDuration) {
            el.style.setProperty('transitionDuration', rawTransitionDuration)
          } else {
            el.style.removeProperty('transitionDuration')
          }
        })
        // 检查动画时长，无动画则直接清理
        const duration = getDuration(el, 'enter', undefined, 'auto')
        if (duration <= 0) {
          el.classList.remove(moveClass)
          continue
        }
        // 设置清理逻辑，在动画结束后移除类名
        const timer = setTimeout(() => {
          try {
            el.classList.remove(moveClass)
          } finally {
            delete el.__cancelMoveTransition
          }
        }, duration + 16)
        el.__cancelMoveTransition = () => {
          try {
            clearTimeout(timer)
            el.classList.remove(moveClass)
          } finally {
            delete el.__cancelMoveTransition
          }
        }
      }
      prevRects.clear()
    },
    onEnter: (view): void => {
      if (view.isMounted) runTransition(view.node, 'enter', props)
    },
    onLeave: (view, done): void => {
      if (view.isMounted) runTransition(view.node, 'leave', props, done)
    }
  })
  return typeof tag === 'string'
    ? createElementView(tag as ContainerTag, { children: listView, 'v-bind': props.bindProps })
    : listView
}
defineValidate(TransitionGroup, (props: AnyProps) => {
  if (!Array.isArray(props.each)) {
    throw new TypeError(`[TransitionGroup]: each expects an array, received ${typeof props.each}`)
  }
  if (!isFunction(props.children)) {
    throw new TypeError(
      `[TransitionGroup]: children expects a function, received ${typeof props.children}`
    )
  }
  if (props.key !== undefined) {
    // 验证 key 类型：必须是函数或字符串（对象属性名）
    if (typeof props.key !== 'function' && typeof props.key !== 'string') {
      throw new TypeError(
        `[TransitionGroup]: key expects a function or string (property name), received ${typeof props.key}`
      )
    }
  } else {
    logger.warn(
      `[TransitionGroup]: key prop is not provided. ` +
        `While not mandatory, providing a key helps optimize list rendering performance ` +
        `and ensures proper component state preservation during list updates. ` +
        `Consider adding a unique key for each item.`,
      location
    )
  }
})
export { TransitionGroup, type TransitionGroupProps }
