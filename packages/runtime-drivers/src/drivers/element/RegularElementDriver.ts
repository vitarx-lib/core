import type { RegularElementNodeType } from '@vitarx/runtime-core'
import { BaseElementDriver, mixinContainerDriver } from '../base/index.js'

/**
 * 常规元素驱动器
 *
 * 用于管理常规 DOM 元素（支持子节点）的生命周期。
 * 继承自 BaseElementDriver，并混入容器驱动器功能以支持子节点处理。
 *
 * 核心功能：
 * - 创建常规 DOM 元素（HTML 或 SVG）
 * - 管理元素的属性更新
 * - 处理子节点的渲染、挂载、激活、停用和卸载
 *
 * 使用示例：
 * ```typescript
 * const driver = new RegularElementDriver();
 * // 驱动器会自动通过注册系统使用
 * ```
 */
export class RegularElementDriver extends BaseElementDriver<RegularElementNodeType> {
  constructor() {
    super()
    // 混入容器驱动器功能，支持子节点处理
    mixinContainerDriver(this)
  }
}
