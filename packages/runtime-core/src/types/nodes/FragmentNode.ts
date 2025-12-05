import type { FragmentNodeType } from '../vnode.js'
import type { ContainerNode } from './VNode.js'

/**
 * 片段节点接口
 *
 * 表示一个可以包含多个子节点的容器，但自身不渲染为任何DOM元素。
 * 片段节点允许组件返回多个根节点，而不需要额外的包装元素。
 *
 * 在渲染时，片段节点的所有子节点会被直接插入到父节点中，
 * 而片段节点本身不会产生任何DOM元素。这对于实现某些布局
 * 和组件结构非常有用，可以避免不必要的DOM嵌套。
 *
 * 片段节点继承自ContainerNode，因为它可以包含多个子节点。
 */
export interface FragmentNode extends ContainerNode<FragmentNodeType> {}
