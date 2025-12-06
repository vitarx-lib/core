import type { VoidElementNodeType } from '@vitarx/runtime-core'
import { BaseElementDriver } from '../base/BaseElementDriver.js'

/**
 * 空元素驱动器
 *
 * 用于处理不支持子节点的自闭合元素（如 <img>、<br>、<input> 等）。
 * 继承自 BaseElementDriver，但不混入容器驱动器功能。
 *
 * 核心功能：
 * - 创建和管理空元素节点
 * - 处理空元素的属性更新
 *
 * 使用限制：
 * - 不支持子节点
 * - 仅适用于自闭合标签元素
 *
 * 使用示例：
 * ```typescript
 * const driver = new VoidElementDriver();
 * // 驱动器会自动通过注册系统使用
 * ```
 */
export class VoidElementDriver extends BaseElementDriver<VoidElementNodeType> {}
