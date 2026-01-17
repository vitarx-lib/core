import { ViewFlag } from '../shared/constants/viewFlag.js'
import type { ViewDriver } from '../types/index.js'

let override: ViewDriver | null = null

type DriverMap = Partial<{
  [Flag in ViewFlag]: ViewDriver<Flag>
}>
const drivers: DriverMap = Object.create(null)

/**
 * 注册视图驱动
 *
 * 将特定类型的视图驱动注册到驱动映射表中，用于处理不同类型的视图渲染、挂载和销毁操作。
 * 每种 ViewFlag 都应该有对应的驱动实现，以确保框架能够正确处理各种视图类型。
 *
 * @param flag 视图标志，用于标识视图类型
 * @param driver 对应的视图驱动实现，提供渲染、挂载和销毁功能
 */
export function registerDriver<Flag extends ViewFlag>(flag: Flag, driver: ViewDriver<Flag>): void {
  drivers[flag] = driver as DriverMap[Flag]
}

/**
 * 覆盖所有视图驱动
 *
 * 提供全局替换所有视图驱动的能力，主要用于以下场景：
 * - SSR（服务器端渲染）：替换为服务端渲染驱动
 * - 测试环境：使用模拟驱动进行单元测试
 * - 自定义渲染：实现特殊的渲染逻辑
 *
 * @param driver 全局视图驱动，设置为 null 可恢复为默认驱动
 */
export function overrideDriver(driver: ViewDriver | null): void {
  override = driver
}

/**
 * 获取视图驱动
 *
 * 根据视图标志获取对应的驱动实现。优先返回全局覆盖驱动，
 * 如果没有设置覆盖驱动，则从驱动映射表中查找对应的驱动。
 *
 * @param flag 视图标志，用于标识视图类型
 * @returns {ViewDriver} 对应的视图驱动实例
 * @throws {Error} 当没有找到对应的驱动实现时抛出错误
 */
export function getDriver<Flag extends ViewFlag>(flag: Flag): ViewDriver<Flag> {
  if (override) return override as ViewDriver<Flag>
  const driver = drivers[flag]
  if (!driver) {
    throw new Error(`No ViewDriver registered for flag: ${flag}`)
  }
  return driver
}
