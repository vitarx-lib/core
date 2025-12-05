import { setDefaultDriver } from '@vitarx/runtime-core'
import { SSRSyncRenderDriver } from './SSRSyncRenderDriver.js'

/**
 * 设置服务器端渲染驱动
 * 为所有节点类型注册SSR驱动程序
 */
export function setupServerDrivers(): void {
  const driver = new SSRSyncRenderDriver()
  setDefaultDriver(driver)
}
