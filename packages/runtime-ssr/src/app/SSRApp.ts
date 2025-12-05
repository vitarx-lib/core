import { App, type HostParentElement } from '@vitarx/runtime-core'

/**
 * SSR 应用类
 *
 * 继承自 App，用于服务端渲染场景
 */
export class SSRApp extends App {
  override mount(container: HostParentElement | string): this {
    return super.mount(container)
  }
}
