import type { RegularElementNodeType } from '@vitarx/runtime-core'
import { mixinContainerDriver } from './ContainerDriver.js'
import { ElementDriver } from './ElementDriver.js'

/**
 * RegularElementDriver 是一个用于管理常规 DOM 元素的驱动器类。
 * 它继承自 ElementDriver，并负责创建和管理常规 HTML 和 SVG 元素。
 *
 * 核心功能：
 * - 创建常规 DOM 元素（HTML 或 SVG）
 * - 管理元素的生命周期
 *
 * 代码示例：
 * ```typescript
 * const controller = new RegularElementDriver();
 * const vnode = new RegularElementVNode('div', { class: 'container' });
 * const element = controller.createElement(vnode);
 * ```
 *
 * 构造函数：
 * - 无参数
 *
 * 特殊说明：
 * - 该类通过 mixinContainerDriver 混入了容器驱动器的功能
 * - 创建元素时会根据 isSVGElement 标志决定创建 HTML 元素还是 SVG 元素
 */
export class RegularElementDriver extends ElementDriver<RegularElementNodeType> {
  constructor() {
    super()
    mixinContainerDriver(this)
  }
}
