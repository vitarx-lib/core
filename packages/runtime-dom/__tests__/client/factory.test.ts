/**
 * factory 单元测试
 *
 * 测试目标：验证工厂函数和渲染器注册机制
 */
import { type AppConfig, h } from '@vitarx/runtime-core'
import { describe, expect, it } from 'vitest'
import { createApp } from '../../src/index.js'

describe('factory', () => {
  describe('createApp', () => {
    it('应该使用 VNode 创建应用', () => {
      const vnode = h('div')

      const app = createApp(vnode as any)

      expect(app).toBeDefined()
      expect(app.mount).toBeDefined()
      expect(app.unmount).toBeDefined()
    })

    it('应该使用 Widget 创建应用', () => {
      class TestWidget {
        render() {
          return h('div')
        }
      }

      const app = createApp(TestWidget as any)

      expect(app).toBeDefined()
    })

    it('应该传入配置参数', () => {
      const vnode = h('div')

      const config: AppConfig = {
        errorHandler: (error, info) => {
          console.error(error, info)
        }
      }

      const app = createApp(vnode, config)

      expect(app.config.errorHandler).toBeDefined()
    })
  })
})
