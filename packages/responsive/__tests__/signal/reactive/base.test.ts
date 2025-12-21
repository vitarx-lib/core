import { describe, expect, it, vi } from 'vitest'
import { IS_REF, IS_SIGNAL } from '../../../src/index.js'
import { ReactiveProxy } from '../../../src/signal/reactive/base.js'

class TestReactiveSource<T extends object> extends ReactiveProxy<T> {
  protected doGet(_target: T, _p: string | symbol, _receiver: any): any {
    // Implementation for testing
  }
}

describe('signal/reactive/base', () => {
  describe('ReactiveSource', () => {
    it('should create a ReactiveSource instance', () => {
      const target = { prop: 42 }
      const reactiveSource = new TestReactiveSource(target)

      expect(reactiveSource).toBeInstanceOf(ReactiveProxy)
      expect(reactiveSource.target).toBe(target)
      expect(reactiveSource.deep).toBe(true)
      expect(reactiveSource.proxy).toBeDefined()
    })

    it('should create a shallow ReactiveSource instance', () => {
      const target = { prop: 42 }
      const reactiveSource = new TestReactiveSource(target, false as true)

      expect(reactiveSource.deep).toBe(false)
    })

    it('should implement RefSignal interface', () => {
      const target = { prop: 42 }
      const reactiveSource = new TestReactiveSource(target)

      expect(reactiveSource[IS_SIGNAL]).toBe(true)
      expect(reactiveSource[IS_REF]).toBe(true)
      expect(reactiveSource.value).toBe(0)
    })

    it('should trigger signals', async () => {
      const target = { prop: 42 }
      const reactiveSource = new TestReactiveSource(target)
      const triggerSignalSpy = vi.spyOn(
        await import('../../../src/depend/index.js'),
        'triggerSignal'
      )

      // @ts-ignore - accessing protected method for testing
      reactiveSource.triggerSignal('get', { key: 'prop' })

      expect(triggerSignalSpy).toHaveBeenCalledWith(reactiveSource, 'get', { key: 'prop' })
    })

    it('should track signals', async () => {
      const target = { prop: 42 }
      const reactiveSource = new TestReactiveSource(target)
      const trackSignalSpy = vi.spyOn(await import('../../../src/depend/index.js'), 'trackSignal')

      // @ts-ignore - accessing protected method for testing
      reactiveSource.trackSignal('get', { key: 'prop' })

      expect(trackSignalSpy).toHaveBeenCalledWith(reactiveSource, 'get', { key: 'prop' })
    })

    it('should handle get operations', () => {
      const target = { prop: 42 }
      const reactiveSource = new TestReactiveSource(target)

      // Mock the doGet method
      const doGetSpy = vi.spyOn(reactiveSource as any, 'doGet').mockReturnValue(42)

      const value = reactiveSource.proxy.prop
      expect(doGetSpy).toBeCalled()
      expect(value).toBe(42)
    })
  })
})
