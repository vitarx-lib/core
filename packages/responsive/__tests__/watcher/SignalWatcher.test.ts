import { describe, expect, it, vi } from 'vitest'
import { createDepLink, ref, RefSignalWatcher } from '../../src/index.js'

describe('watcher/SignalWatcher', () => {
  describe('constructor', () => {
    it('should create a SignalWatcher instance', () => {
      const signal = ref(42)
      const callback = vi.fn()
      const watcher = new RefSignalWatcher(signal, callback, {})

      expect(watcher).toBeInstanceOf(RefSignalWatcher)
      expect(watcher.value).toBe(42)
    })

    it('should create a link between watcher and signal', async () => {
      const signal = ref(42)
      const callback = vi.fn()
      const createDepLinkSpy = vi.spyOn(
        await import('../../src/core/signal/index.js'),
        'createDepLink'
      )

      new RefSignalWatcher(signal, callback, {})

      expect(createDepLinkSpy).toHaveBeenCalled()
    })
  })

  describe('getter', () => {
    it('should return the signal value using peekSignal', async () => {
      const signal = ref(42)
      const callback = vi.fn()
      const watcher = new RefSignalWatcher(signal, callback, {})

      const peekSignalSpy = vi
        .spyOn(await import('../../src/core/signal/index.js'), 'peekSignal')
        .mockReturnValue(42)

      const result = watcher['getter']()
      expect(peekSignalSpy).toHaveBeenCalledWith(signal, 'value')
      expect(result).toBe(42)
    })
  })
})
