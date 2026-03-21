import { sleep } from '@vitarx/utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { HostElementTag, View } from '../../../types/index.js'
import { createView } from '../../../view/index.js'
import { getCachedComponent, getLazyLoader, Lazy, lazy } from '../src/index.js'

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
      const viewInstance = LazyComponent({})
      expect(viewInstance).toBeDefined()
      expect(viewInstance.constructor.name).toBe('ComponentView')
    })

    it('should pass props to the underlying Lazy component', () => {
      const LazyComponent = lazy(createLoader())
      const props = { className: 'test-class', id: 'test-id' }

      const viewInstance = LazyComponent(props)

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

      const view = LazyComponent({})

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

      expect(view.props.loader).toBe(loader)
      expect(view.props.delay).toBe(300)
      expect(view.props.loading).toBe(loadingView)
      expect(view.props.props).toEqual({ children: 'Children Content' })
    })

    it('should properly wrap the component with builder pattern', () => {
      const loader = createLoader()
      const LazyComponent = lazy(loader)

      const view = LazyComponent({ class: 'test-class' })

      expect(view.component.name).toBe('Lazy')
      expect(view.props.props).toEqual({ class: 'test-class' })
      expect(typeof view.props.loader).toBe('function')
    })
  })

  describe('Cache Integration', () => {
    let container: HTMLElement

    beforeEach(() => {
      container = document.createElement('div')
      document.body.appendChild(container)
    })

    afterEach(() => {
      document.body.removeChild(container)
      container.innerHTML = ''
    })

    it('should use cached component when lazy builder is called multiple times', async () => {
      const loader = vi.fn(createLoader())
      const LazyComponent = lazy(loader)

      const view1 = LazyComponent({})
      view1.mount(container)
      await sleep(20)

      expect(loader).toHaveBeenCalledTimes(1)
      expect(container.textContent).toContain('Loaded Content')
      view1.dispose()

      container.innerHTML = ''

      const view2 = LazyComponent({ children: 'New Children' })
      view2.mount(container)
      await sleep(0)

      expect(loader).toHaveBeenCalledTimes(1)
      expect(container.textContent).toContain('Loaded Content')

      view2.dispose()
    })

    it('should share cache between lazy builder and direct Lazy usage', async () => {
      const loader = vi.fn(createLoader())

      const LazyComponent = lazy(loader)
      const view1 = LazyComponent({})
      view1.mount(container)
      await sleep(20)

      expect(loader).toHaveBeenCalledTimes(1)
      view1.dispose()

      container.innerHTML = ''

      const view2 = createView(Lazy, { loader })
      view2.mount(container)
      await sleep(0)

      expect(loader).toHaveBeenCalledTimes(1)
      expect(container.textContent).toContain('Loaded Content')

      view2.dispose()
    })

    it('should cache the loaded component', async () => {
      const loader = createLoader()
      const LazyComponent = lazy(loader)

      expect(getCachedComponent(loader)).toBeUndefined()

      const view = LazyComponent({})
      view.mount(container)
      await sleep(20)

      expect(getCachedComponent(loader)).toBeDefined()

      view.dispose()
    })

    it('should handle concurrent lazy component instances with same loader', async () => {
      const loader = vi.fn(createLoader())
      const LazyComponent = lazy(loader)

      const view1 = LazyComponent({})
      const view2 = LazyComponent({})

      const container2 = document.createElement('div')
      document.body.appendChild(container2)

      view1.mount(container)
      view2.mount(container2)

      await sleep(20)

      expect(loader).toHaveBeenCalledTimes(1)
      expect(container.textContent).toContain('Loaded Content')
      expect(container2.textContent).toContain('Loaded Content')

      view1.dispose()
      view2.dispose()
      document.body.removeChild(container2)
    })
  })

  describe('getLazyLoader', () => {
    it('should return loader for lazy component builder', () => {
      const loader = createLoader()
      const LazyComponent = lazy(loader)

      const result = getLazyLoader(LazyComponent)

      expect(result).toBe(loader)
    })

    it('should return null for non-lazy component', () => {
      const regularComponent = () => createView(testTag, {})

      const result = getLazyLoader(regularComponent)

      expect(result).toBeNull()
    })

    it('should return null for null input', () => {
      const result = getLazyLoader(null)

      expect(result).toBeNull()
    })

    it('should return null for undefined input', () => {
      const result = getLazyLoader(undefined)

      expect(result).toBeNull()
    })

    it('should return null for object without loader symbol', () => {
      const obj = { foo: 'bar' }

      const result = getLazyLoader(obj)

      expect(result).toBeNull()
    })

    it('should return null when LAZY_LOADER property is not a function', () => {
      const obj = { [Symbol.for('__v_lazy_loader')]: 'not a function' }

      const result = getLazyLoader(obj)

      expect(result).toBeNull()
    })

    it('should return the same loader instance for multiple calls', () => {
      const loader = createLoader()
      const LazyComponent = lazy(loader)

      const result1 = getLazyLoader(LazyComponent)
      const result2 = getLazyLoader(LazyComponent)

      expect(result1).toBe(result2)
      expect(result1).toBe(loader)
    })

    it('should return correct loader for lazy component with options', () => {
      const loader = createLoader()
      const loadingView = () => createView(testTag, { children: 'Loading...' })
      const LazyComponent = lazy(loader, {
        delay: 300,
        timeout: 5000,
        loading: loadingView
      })

      const result = getLazyLoader(LazyComponent)

      expect(result).toBe(loader)
    })
  })
})
