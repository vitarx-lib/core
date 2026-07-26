import { describe, expect, it, vi } from 'vitest'
import { DEP_VERSION, SIGNAL_DEP_HEAD } from '../../../src/core/signal/symbol.js'
import {
  getActiveEffect,
  hasLinkedSignal,
  hasPropTrack,
  hasTrack,
  reactive,
  ref,
  trackEffect,
  trackSignal,
  untracked,
  watch
} from '../../../src/index.js'

/**
 * 统计一个 signal 的依赖链表节点数（用于验证 DepLink 是否被复用而非重复创建）
 */
const countSignalLinks = (signal: any): number => {
  let n = 0
  let link = signal[SIGNAL_DEP_HEAD]
  const seen = new Set<any>()
  while (link && !seen.has(link)) {
    seen.add(link)
    n++
    link = link.sigNext
  }
  return n
}

describe('depend/track', () => {
  describe('getActiveEffect', () => {
    it('should return null when no active effect', () => {
      expect(getActiveEffect()).toBeNull()
    })
  })

  describe('trackEffectDeps', () => {
    it('should set and reset active effect', () => {
      const effect = {
        run: vi.fn(),
        [DEP_VERSION]: 1
      }

      let capturedEffect
      const result = trackEffect(() => {
        capturedEffect = getActiveEffect()
        return 'test-result'
      }, effect as any)

      expect(result).toBe('test-result')
      expect(capturedEffect).toBe(effect)
      expect(getActiveEffect()).toBeNull()
    })

    it('should increment effect version', () => {
      const effect = {
        run: vi.fn(),
        [DEP_VERSION]: 1
      }

      trackEffect(() => 'test', effect as any)

      // Version should be incremented
      expect(effect[DEP_VERSION]).toBe(2)
    })

    it('should handle effects without initial version', () => {
      const effect = {
        run: vi.fn()
        // No initial version
      }

      trackEffect(() => 'test', effect as any)

      // Version should be set to 1
      expect((effect as any)[DEP_VERSION]).toBe(1)
    })
  })

  describe('trackSignal', () => {
    it('should call track handler when there is an active effect', () => {
      const signal = ref(42)
      const effect = vi.fn()

      trackEffect(() => {
        trackSignal(signal, 'get', { key: 'test' })
      }, effect)

      expect(hasLinkedSignal(effect)).toBe(true)
    })
  })
  describe('hasTrack', () => {
    it('should return true if there is an get ref', () => {
      const signal = ref(42)
      const fn = () => signal.value

      expect(hasTrack(fn).isTrack).toBe(true)
    })
    it('should return false if there is no get ref', () => {
      const fn = () => null
      expect(hasTrack(fn).isTrack).toBe(false)
    })
    it('should return true if there is an get reactive prop', async () => {
      const obj = reactive({ a: 1 })
      const fn = () => obj.a

      expect(hasTrack(fn).isTrack).toBe(true)
    })
    it('should support capturing access in untracked', () => {
      const test = ref('test')
      const fn = () => {
        untracked(() => {
          return test.value
        })
      }
      expect(hasTrack(fn).isTrack).toBe(true)
    })
  })
  describe('hasPropTrack', () => {
    it('should return true if there is an get reactive prop', () => {
      const obj = reactive({ a: 1 })
      expect(hasPropTrack(obj, 'a').isTrack).toBe(true)
    })

    it('should return false if there is no get reactive prop', () => {
      const obj = { a: 1 }
      expect(hasPropTrack(obj, 'a').isTrack).toBe(false)
    })

    it('should return true if there is an get ref deep reactive prop', () => {
      const obj = ref({ a: 1 })
      expect(hasPropTrack(obj.value, 'a').isTrack).toBe(true)
    })
  })
  describe('untracked', () => {
    it('应该正确执行函数并返回结果', () => {
      const result = untracked(() => 42)
      expect(result).toBe(42)
    })
    it('应该在执行函数期间暂停跟踪', () => {
      const test = ref('test')

      const effect = () => {
        untracked(() => {
          return test.value
        })
      }
      trackEffect(effect)
      expect(hasLinkedSignal(effect)).toBeFalsy()
    })
    it('应该只影响当前副作用', () => {
      const test = ref('test')

      const effect2 = () => {
        return test.value
      }
      const effect = () => {
        untracked(() => {
          trackEffect(effect2)
          return test.value
        })
      }
      trackEffect(effect)
      expect(hasLinkedSignal(effect)).toBeFalsy()
      expect(hasLinkedSignal(effect2)).toBeTruthy()
    })
  })

  /**
   * 回归测试：trackHandler 必须复用已存在的 DepLink，而非每次 track 都新建节点。
   *
   * 背景：DEP_INDEX_MAP 此前从未被初始化为 WeakMap，导致 trackHandler 永远走 createDepLink
   * 新建分支，配合 finalizeDeps 清理旧节点，会在 triggerSignal 迭代过程中形成
   * "销毁-重建"循环，使多个 sync watcher 监听同一 signal 时触发永不终止（进程卡死）。
   */
  describe('DepLink 复用（DEP_INDEX_MAP 初始化回归）', () => {
    it('同一 effect 多次 track 同一 signal 时应复用唯一 DepLink', () => {
      const state = ref(0)
      const effect = vi.fn(() => {
        // 读取以建立依赖
        void state.value
      })

      // 首次收集依赖
      trackEffect(effect)
      const linksAfterFirst = countSignalLinks(state)
      expect(linksAfterFirst).toBe(1)

      // 多次重新收集依赖，DepLink 应被复用而非累加
      trackEffect(effect)
      trackEffect(effect)
      trackEffect(effect)

      expect(countSignalLinks(state)).toBe(1)
      expect(linksAfterFirst).toBe(1)
    })

    it('多个 sync watcher 监听同一 signal 触发时不应死循环', () => {
      const state = ref(0)
      const cb1 = vi.fn()
      const cb2 = vi.fn()

      watch(() => state.value, cb1, { flush: 'sync' })
      watch(() => state.value, cb2, { flush: 'sync' })

      // 两个 watcher 各占一个 DepLink
      expect(countSignalLinks(state)).toBe(2)

      // 触发变更：若 DepLink 未复用，此处会进入"销毁-重建"无限循环导致进程卡死
      state.value = 1

      expect(cb1).toHaveBeenCalledWith(1, 0, expect.any(Function))
      expect(cb2).toHaveBeenCalledWith(1, 0, expect.any(Function))
      // 触发后依赖链表长度应保持稳定
      expect(countSignalLinks(state)).toBe(2)
    })

    it('多个 sync watcher 互相触发更新时不应死循环', () => {
      // 模拟 useModel 双向绑定场景：watcher 回调写回另一个 ref 并联动
      const a = ref(0)
      const b = ref(0)

      watch(() => a.value, () => (b.value = a.value), { flush: 'sync' })
      watch(() => b.value, () => (a.value = b.value), { flush: 'sync' })

      // 此处若无 DepLink 复用，sync 调度下会触发迭代不终止
      expect(() => {
        a.value = 1
      }).not.toThrow()

      expect(a.value).toBe(1)
      expect(b.value).toBe(1)
    })
  })
})
