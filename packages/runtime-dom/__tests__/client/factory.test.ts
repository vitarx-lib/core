/**
 * factory 单元测试
 *
 * 测试目标：验证工厂函数和渲染器注册机制
 */
import { type AppConfig, getRenderer } from '@vitarx/runtime-core'
import { describe, expect, it } from 'vitest'
import { createApp, DomRenderer } from '../../src/index.js'

describe('factory', () => {
  describe('渲染器注册', () => {
    it('应该注册 DomRenderer 到运行时', () => {
      const renderer = getRenderer()

      expect(renderer).toBeDefined()
      expect(renderer).toBeInstanceOf(DomRenderer)
    })
  })

  describe('createApp', () => {
    it('应该使用 VNode 创建应用', () => {
      const vnode = {
        type: 'div',
        props: {},
        children: []
      }

      const app = createApp(vnode as any)

      expect(app).toBeDefined()
      expect(app.mount).toBeDefined()
      expect(app.unmount).toBeDefined()
    })

    it('应该使用 Widget 创建应用', () => {
      class TestWidget {
        render() {
          return {
            type: 'div',
            props: {},
            children: []
          }
        }
      }

      const app = createApp(TestWidget as any)

      expect(app).toBeDefined()
    })

    it('应该传入配置参数', () => {
      const vnode = {
        type: 'div',
        props: {},
        children: []
      }

      const config: AppConfig = {
        errorHandler: (error, info) => {
          console.error(error, info)
        }
      }

      const app = createApp(vnode as any, config)

      expect(app).toBeDefined()
    })
  })
})
