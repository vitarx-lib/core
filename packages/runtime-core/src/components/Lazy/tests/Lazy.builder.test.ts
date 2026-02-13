import { describe, expect, it } from 'vitest'
import type { HostElementTag, View } from '../../../types/index.js'
import { createView } from '../../../view/index.js'
import { lazy, Lazy } from '../src/index.js'

describe('Lazy Builder', () => {
  const testTag = 'div' as HostElementTag

  const createLoader = () => {
    return (): Promise<{ default: () => View }> =>
      Promise.resolve({
        default: () => createView(testTag, { children: 'Loaded Content' })
      })
  }

  describe('Basic Functionality', () => {
    it('should create a lazy component builder with basic loader', () => {
      const LazyComponent = lazy(createLoader())

      expect(typeof LazyComponent).toBe('function')
      // 验证返回的是一个视图构建器
      const viewInstance = LazyComponent({})
      expect(viewInstance).toBeDefined()
      expect(viewInstance.constructor.name).toBe('ComponentView')
    })

    it('should pass props to the underlying Lazy component', () => {
      const LazyComponent = lazy(createLoader())
      const props = { className: 'test-class', id: 'test-id' }

      const viewInstance = LazyComponent(props)

      // 验证视图实例是否包含正确的属性
      expect(viewInstance.component).toBe(Lazy)
      expect(viewInstance.props).toBeDefined()
    })

    it('should accept basic loader function', () => {
      const loader = createLoader()
      const LazyComponent = lazy(loader)

      expect(LazyComponent).toBeTruthy()
    })
  })

  describe('Advanced Options', () => {
    it('should accept delay option', () => {
      const LazyComponent = lazy(createLoader(), { delay: 500 })

      expect(LazyComponent).toBeTruthy()
    })

    it('should accept timeout option', () => {
      const LazyComponent = lazy(createLoader(), { timeout: 3000 })

      expect(LazyComponent).toBeTruthy()
    })

    it('should accept loading option', () => {
      const loadingView = () => createView(testTag, { children: 'Loading...' })
      const LazyComponent = lazy(createLoader(), { loading: loadingView })

      expect(LazyComponent).toBeTruthy()
    })

    it('should accept onError option', () => {
      const onErrorHandler = (error: unknown) =>
        createView(testTag, { children: `Error: ${String(error)}` })
      const LazyComponent = lazy(createLoader(), { onError: onErrorHandler })

      expect(LazyComponent).toBeTruthy()
    })

    it('should accept all options together', () => {
      const loadingView = () => createView(testTag, { children: 'Loading...' })
      const onErrorHandler = (error: unknown) =>
        createView(testTag, { children: `Error: ${String(error)}` })

      const LazyComponent = lazy(createLoader(), {
        delay: 200,
        timeout: 5000,
        loading: loadingView,
        onError: onErrorHandler
      })

      expect(LazyComponent).toBeTruthy()
    })
  })

  describe('View Builder Functionality', () => {
    it('should create a view that uses Lazy component internally', () => {
      const LazyComponent = lazy(createLoader())

      // 创建视图实例
      const view = LazyComponent({})

      // 验证视图类型是 ComponentView
      expect(view.constructor.name).toBe('ComponentView')
      expect(view.component.name).toBe('Lazy')
    })

    it('should pass loader and options to Lazy component', () => {
      const loader = createLoader()
      const loadingView = () => createView(testTag, { children: 'Loading...' })

      const LazyComponent = lazy(loader, {
        delay: 300,
        loading: loadingView
      })

      const view = LazyComponent({ children: 'Children Content' })

      // 验证传递给 Lazy 组件的属性
      expect(view.props.loader).toBe(loader)
      expect(view.props.delay).toBe(300)
      expect(view.props.loading).toBe(loadingView)
      expect(view.props.bindProps).toEqual({ children: 'Children Content' })
    })

    it('should properly wrap the component with builder pattern', () => {
      const loader = createLoader()
      const LazyComponent = lazy(loader)

      const view = LazyComponent({ className: 'test-class' })

      // 验证视图构建器模式正确包装了 Lazy 组件
      expect(view.component.name).toBe('Lazy')
      expect(view.props.bindProps).toEqual({ className: 'test-class' })
      expect(typeof view.props.loader).toBe('function')
    })
  })
})
