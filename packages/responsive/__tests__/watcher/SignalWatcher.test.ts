import { describe, expect, it, vi } from 'vitest'
import { ref, SignalWatcher } from '../../src/index.js'

describe('watcher/SignalWatcher', () => {
  describe('constructor', () => {
    it('should create a SignalWatcher instance', () => {
      const signal = ref(42)
      const callback = vi.fn()
      const watcher = new SignalWatcher(signal, callback, {})

      expect(watcher).toBeInstanceOf(SignalWatcher)
      expect(watcher.value).toBe(42)
    })

    it('should create a link between watcher and signal', async () => {
      const signal = ref(42)
      const callback = vi.fn()
      const createDepLinkSpy = vi.spyOn(
        await import('../../src/core/signal/index.js'),
        'linkSignalToEffect'
      )

      const watcher = new SignalWatcher(signal, callback, {})

      expect(createDepLinkSpy).toHaveBeenCalledWith(watcher, signal)
    })
  })

  describe('getter', () => {
    it('should return the signal value using peekSignal', async () => {
      const signal = ref(42)
      const callback = vi.fn()
      const watcher = new SignalWatcher(signal, callback, {})

      const peekSignalSpy = vi
        .spyOn(await import('../../src/core/signal/index.js'), 'peekSignal')
        .mockReturnValue(42)

      const result = watcher['getter']()
      expect(peekSignalSpy).toHaveBeenCalledWith(signal, 'value')
      expect(result).toBe(42)
    })
  })
})
