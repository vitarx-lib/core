import { sleep } from '@vitarx/utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { HostElementTag, View } from '../../../types/index.js'
import { createView } from '../../../view/index.js'
import {
  clearComponentCache,
  getCachedComponent,
  preloadComponent
} from '../src/index.js'

describe('Lazy API', () => {
  const testTag = 'div' as HostElementTag

  const createLoader = (delay = 10) => {
    return (): Promise<{ default: () => View }> =>
      new Promise(resolve => {
        setTimeout(() => {
          resolve({ default: () => createView(testTag, { children: 'Loaded Content' }) })
        }, delay)
      })
  }

  const createErrorLoader = () => {
    return (): Promise<{ default: () => View }> =>
      new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Load failed'))
        }, 10)
      })
  }

  const createInvalidLoader = () => {
    return (): Promise<{ default: string }> => Promise.resolve({ default: 'not a function' })
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('preloadComponent', () => {
    it('应该成功预加载组件并存入缓存', async () => {
      const loader = createLoader()

      expect(getCachedComponent(loader)).toBeUndefined()

      const component = await preloadComponent(loader)

      expect(typeof component).toBe('function')
      expect(getCachedComponent(loader)).toBe(component)
    })

    it('应该返回已缓存的组件而不重新加载', async () => {
      const loader = vi.fn(createLoader())

      const component1 = await preloadComponent(loader)
      expect(loader).toHaveBeenCalledTimes(1)

      const component2 = await preloadComponent(loader)
      expect(loader).toHaveBeenCalledTimes(1)
      expect(component2).toBe(component1)
    })

    it('应该等待正在加载中的 Promise', async () => {
      const loader = vi.fn(createLoader(20))

      const promise1 = preloadComponent(loader)
      const promise2 = preloadComponent(loader)

      const [component1, component2] = await Promise.all([promise1, promise2])

      expect(loader).toHaveBeenCalledTimes(1)
      expect(component1).toBe(component2)
    })

    it('应该在加载失败后不缓存组件', async () => {
      const loader = createErrorLoader()

      await expect(preloadComponent(loader)).rejects.toThrow('Load failed')

      expect(getCachedComponent(loader)).toBeUndefined()
    })

    it('应该在模块格式无效时抛出错误', async () => {
      const loader = createInvalidLoader()

      await expect(preloadComponent(loader as any)).rejects.toThrow(
        'Invalid component module: missing default export'
      )
    })
  })

  describe('getCachedComponent', () => {
    it('应该在组件未缓存时返回 undefined', () => {
      const loader = createLoader()
      expect(getCachedComponent(loader)).toBeUndefined()
    })

    it('应该在组件已缓存时返回组件', async () => {
      const loader = createLoader()
      const component = await preloadComponent(loader)
      expect(getCachedComponent(loader)).toBe(component)
    })

    it('应该返回可以用于创建视图的组件', async () => {
      const loader = createLoader()
      const component = await preloadComponent(loader)

      const view = createView(component, { children: 'Test' })

      const container = document.createElement('div')
      view.mount(container)
      expect(container.textContent).toContain('Loaded Content')
      view.dispose()
    })
  })

  describe('clearComponentCache', () => {
    it('应该清除已加载的组件缓存', async () => {
      const loader = createLoader()
      await preloadComponent(loader)

      expect(getCachedComponent(loader)).toBeDefined()

      clearComponentCache(loader)

      expect(getCachedComponent(loader)).toBeUndefined()
    })

    it('应该清除加载中的缓存', async () => {
      const loader = vi.fn(createLoader(50))

      preloadComponent(loader)
      await sleep(0)

      clearComponentCache(loader)

      await preloadComponent(loader)

      expect(loader).toHaveBeenCalledTimes(2)
    })

    it('应该允许重新加载组件', async () => {
      const loader = vi.fn(createLoader())

      await preloadComponent(loader)
      expect(loader).toHaveBeenCalledTimes(1)

      clearComponentCache(loader)

      await preloadComponent(loader)
      expect(loader).toHaveBeenCalledTimes(2)
    })
  })

  describe('API 组合使用', () => {
    it('应该支持预加载后获取缓存组件', async () => {
      const loader = createLoader()

      expect(getCachedComponent(loader)).toBeUndefined()

      await preloadComponent(loader)

      expect(getCachedComponent(loader)).toBeDefined()
    })

    it('应该支持清除缓存后重新加载', async () => {
      const loader = vi.fn(createLoader())

      await preloadComponent(loader)
      expect(loader).toHaveBeenCalledTimes(1)

      clearComponentCache(loader)
      expect(getCachedComponent(loader)).toBeUndefined()

      await preloadComponent(loader)
      expect(loader).toHaveBeenCalledTimes(2)
    })

    it('应该支持加载失败后重新尝试', async () => {
      let shouldFail = true
      const loader = vi.fn(() => {
        if (shouldFail) {
          return Promise.reject(new Error('Load failed'))
        }
        return Promise.resolve({
          default: () => createView(testTag, { children: 'Success' })
        })
      })

      await expect(preloadComponent(loader)).rejects.toThrow('Load failed')
      expect(loader).toHaveBeenCalledTimes(1)
      expect(getCachedComponent(loader)).toBeUndefined()

      shouldFail = false

      const component = await preloadComponent(loader)
      expect(loader).toHaveBeenCalledTimes(2)
      expect(typeof component).toBe('function')
    })
  })
})
