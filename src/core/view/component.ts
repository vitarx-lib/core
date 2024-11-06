import { popProperty } from '../../utils/index.js'
import { isRef, ref, Ref } from '../variable/index.js'
import type { VNode } from './VNode.js'

export type ComponentKey = string | symbol | number | bigint
/** 组件构造函数 */
export type ComponentConstructor = new (props: Record<string, any> & IntrinsicProps) => Component

export interface IntrinsicProps {
  /**
   * 控制一个 `Component` 如何替换树中的另一个 `Component`。
   *
   * 在运行时，如果两个Component的`key`相同，则会更新已渲染的Component，否则会移除旧Component，然后插入新Component。
   *
   * 这在某些情况下很有用，例如，当您想重新排序列表时。
   *
   * 通常，作为另一个 Component 的唯一子项的 Component 不需要显式键。
   */
  key?: string | symbol | number | bigint
  /**
   * 引用组件
   */
  ref?: Ref<null | Component>
}

/**
 * 组件基类
 */
export abstract class Component<P = {}> {
  readonly key?: ComponentKey
  readonly props: DeepReadonly<P>

  /**
   * ## 实例化
   *
   * @param props
   */
  constructor(props: IntrinsicProps & P) {
    this.key = popProperty(props, 'key')
    const ref = popProperty(props, 'ref')
    // 引用赋值
    if (ref && isRef(ref)) ref.value = this
    this.props = props as DeepReadonly<P>
  }

  /**
   * 返回一个 `VNode` 节点，用于描述`UI`结构。
   *
   * @returns {VNode}
   */
  // abstract build(): VNode
}

class Test extends Component<{ ref: Ref<null | Test> }> {}

const re = ref<null | Test>(null)
new Test({ ref: re })
