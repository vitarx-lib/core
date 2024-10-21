// noinspection JSUnusedGlobalSymbols,JSUnusedLocalSymbols

import LifeCycle from './life-cycle'
import { createVNode } from '../../index'

type OnlyKeyType = string | undefined
type ReadonlyProps<P> = Readonly<P>

/**
 * 组件基类
 *
 * @abstract
 */
export abstract class Widget<PROPS extends Vitarx.AnyProps = {}> extends LifeCycle {
  /**
   * 组件是否处于激活状态
   *
   * @private
   */
  #isActive: boolean = false
  /**
   * 组件是否已挂载到 DOM 节点上
   *
   * @private
   */
  #isMounted: boolean = false
  /**
   * 组件属性
   *
   * @private
   */
  readonly #props: ReadonlyProps<PROPS>
  /**
   * 组件唯一标识符
   *
   * @private
   */
  readonly #key: OnlyKeyType

  constructor(props: ReadonlyProps<PROPS>, key?: string) {
    super()
    // 初始化组件属性
    this.#props = props
    // 初始化组件唯一标识符
    this.#key = key
    // 触发组件创建声明周期
    this.onCreated?.()
  }

  /**
   * 小部件唯一标识符
   *
   * @returns {string}
   */
  get key(): OnlyKeyType {
    return this.#key
  }

  /**
   * 小部件属性
   *
   * @readonly
   */
  get props(): ReadonlyProps<PROPS> {
    return this.#props
  }

  /**
   * 获取组件是否处于激活状态
   *
   * @returns {boolean}
   */
  get isActive(): boolean {
    return this.#isActive
  }

  /**
   * 获取组件是否已挂载
   *
   * @returns {boolean}
   */
  get isMounted(): boolean {
    return this.#isMounted
  }

  /**
   * 该方法用于更新视图
   *
   * 默认情况下通过setState更新状态时，会自动调用该方法。
   *
   * @param force - 是否强制更新，默认为false，如果设置为true则不会判断状态是否更新
   */
  updateView(force: boolean = false) {}

  /**
   * 打包组件视图
   *
   *
   * @returns {Vitarx.VNode} 返回用于描述组件视图的对象
   */
  abstract build(): Vitarx.VNode

  /**
   * 更新组件状态
   *
   * @param {Record<string,any> | (() => void)} state - 支持箭头函数或对象两种方式设置状态
   * @protected
   */
  protected setState(state: Partial<Widget> | (() => void)) {}
}

class MyWidget extends Widget<{ name: number }> {
  override onCreated() {
    console.log('创建完成了', this.props)
  }

  build(): Vitarx.VNode {
    return createVNode('d', null)
  }
}

new MyWidget({ name: 1111 })
