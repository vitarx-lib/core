import { describe, expect, it, vi } from 'vitest'
import {
  Effect,
  EffectScope,
  onScopeDispose,
  onScopePause,
  onScopeResume
} from '../../../src/index.js'

describe('effect/scope', () => {
  describe('EffectScope', () => {
    class TestEffect extends Effect {}

    it('should create a new scope', () => {
      const scope = new EffectScope()
      expect(scope.effects.length).toBe(0)
      expect(scope.state).toBe('active')
    })

    it('should add effects to the scope', () => {
      const scope = new EffectScope()
      const effect = new TestEffect(scope)

      expect(scope.effects.length).toBe(1)
      expect(scope.effects.includes(effect)).toBe(true)
    })

    it('should dispose all effects when scope is disposed', () => {
      const scope = new EffectScope()
      new TestEffect(scope)
      new TestEffect(scope)

      expect(scope.effects.length).toBe(2)

      scope.dispose()

      expect(scope.state).toBe('disposed')
    })

    it('should pause and resume all effects when scope is paused and resumed', () => {
      const scope = new EffectScope()
      new TestEffect(scope)
      new TestEffect(scope)

      expect(scope.state).toBe('active')

      scope.pause()

      expect(scope.state).toBe('paused')

      scope.resume()

      expect(scope.state).toBe('active')
    })

    it('should run a function in the scope context', () => {
      const scope = new EffectScope()
      let activeScope: EffectScope | undefined

      scope.run(() => {
        // This would normally set the active scope
        activeScope = scope
      })

      expect(activeScope).toBe(scope)
    })

    it('should collect effects created within run()', () => {
      const scope = new EffectScope()

      scope.run(() => {
        new TestEffect(true) // This should be added to the scope
      })

      expect(scope.effects.length).toBe(1)
    })

    // 回归测试：向已 disposed 的 scope 添加 effect 应抛错
    // 对应修复：scope.ts add() 开头检查 _state === 'disposed'
    it('should throw when adding effect to a disposed scope', () => {
      const scope = new EffectScope()
      scope.dispose()

      expect(() => new TestEffect(scope)).toThrow(
        '[EffectScope] Cannot add effect to a disposed scope'
      )
    })

    // 回归测试：在已 disposed 的 scope 上 run 应抛错
    // 对应修复：scope.ts run() 开头检查 _state === 'disposed'
    it('should throw when running in a disposed scope', () => {
      const scope = new EffectScope()
      scope.dispose()

      expect(() => scope.run(() => {})).toThrow(
        '[EffectScope] Cannot run in a disposed scope'
      )
    })

    // 回归测试：effect.dispose() 抛错时，errorHandler 正常处理则不中断遍历
    it('should not interrupt disposal when errorHandler handles the error', () => {
      const errorHandler = vi.fn()
      const scope = new EffectScope({ errorHandler })

      const disposedCalls: string[] = []
      const throwingEffect: any = {
        dispose: () => {
          disposedCalls.push('throwing')
          throw new Error('dispose boom')
        }
      }
      const normalEffect: any = {
        dispose: () => {
          disposedCalls.push('normal')
        }
      }

      scope.add(throwingEffect)
      scope.add(normalEffect)

      // errorHandler 正常处理错误，不中断遍历
      expect(() => scope.dispose()).not.toThrow()
      expect(disposedCalls).toEqual(['throwing', 'normal'])
      expect(errorHandler).toHaveBeenCalledWith(expect.any(Error), 'dispose')
    })

    // 回归测试：errorHandler 自身抛错时直接传播（fail fast，不静默吞掉）
    // 设计原则：handleError 是处理异常的程序，若它自身抛错说明 errorHandler 有 bug，
    // 应让错误暴露而非用日志降级——否则真正的 bug 会被忽略
    it('should propagate error when errorHandler rethrows (fail fast)', () => {
      const scope = new EffectScope({
        errorHandler: () => {
          throw new Error('handler rethrow')
        }
      })

      const disposedCalls: string[] = []
      const throwingEffect: any = {
        dispose: () => {
          disposedCalls.push('throwing')
          throw new Error('dispose boom')
        }
      }
      const normalEffect: any = {
        dispose: () => {
          disposedCalls.push('normal')
        }
      }

      scope.add(throwingEffect)
      scope.add(normalEffect)

      // errorHandler 抛错应直接传播，不被静默吞掉
      expect(() => scope.dispose()).toThrow('handler rethrow')
      // 遍历在第一个 effect 处中断，第二个 effect 未执行
      expect(disposedCalls).toEqual(['throwing'])
    })

    // 回归测试：pause/resume 时 errorHandler 正常处理则不中断遍历
    it('should not interrupt pause/resume when errorHandler handles the error', () => {
      const errorHandler = vi.fn()
      const scope = new EffectScope({ errorHandler })

      const calls: string[] = []
      const throwingEffect: any = {
        dispose: () => {},
        pause: () => {
          calls.push('throwing-pause')
          throw new Error('pause boom')
        },
        resume: () => {
          calls.push('throwing-resume')
          throw new Error('resume boom')
        }
      }
      const normalEffect: any = {
        dispose: () => {},
        pause: () => calls.push('normal-pause'),
        resume: () => calls.push('normal-resume')
      }

      scope.add(throwingEffect)
      scope.add(normalEffect)

      // pause：errorHandler 正常处理，不中断遍历
      expect(() => scope.pause()).not.toThrow()
      expect(calls).toEqual(['throwing-pause', 'normal-pause'])

      // resume：errorHandler 正常处理，不中断遍历
      expect(() => scope.resume()).not.toThrow()
      expect(calls).toEqual([
        'throwing-pause',
        'normal-pause',
        'throwing-resume',
        'normal-resume'
      ])
    })

    // 回归测试：onDispose 回调抛错时，errorHandler 正常处理则不中断遍历
    it('should not interrupt dispose callbacks when errorHandler handles the error', () => {
      const errorHandler = vi.fn()
      const scope = new EffectScope({ errorHandler })

      const calls: string[] = []
      scope.onDispose(() => {
        calls.push('throwing')
        throw new Error('callback boom')
      })
      scope.onDispose(() => {
        calls.push('normal')
      })

      // errorHandler 正常处理错误，不中断遍历
      expect(() => scope.dispose()).not.toThrow()
      expect(calls).toEqual(['throwing', 'normal'])
      expect(errorHandler).toHaveBeenCalled()
    })
  })

  describe('lifecycle functions', () => {
    it('should register dispose callbacks', () => {
      const scope = new EffectScope()
      const callback = vi.fn()

      scope.run(() => {
        onScopeDispose(callback)
      })

      expect(callback).not.toHaveBeenCalled()

      scope.dispose()
      expect(callback).toHaveBeenCalled()
    })

    it('should register pause callbacks', () => {
      const scope = new EffectScope()
      const callback = vi.fn()

      scope.run(() => {
        onScopePause(callback)
      })

      expect(callback).not.toHaveBeenCalled()

      scope.pause()
      expect(callback).toHaveBeenCalled()
    })

    it('should register resume callbacks', () => {
      const scope = new EffectScope()
      const callback = vi.fn()

      scope.run(() => {
        onScopeResume(callback)
      })

      expect(callback).not.toHaveBeenCalled()

      // Pause the scope
      scope.pause()

      // Resume the scope
      scope.resume()
      expect(callback).toHaveBeenCalled()
    })

    it('should warn when registering callbacks outside of scope', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      onScopeDispose(() => {})

      expect(warnSpy).toHaveBeenCalledWith('onScopeDispose() no active scope found')

      warnSpy.mockRestore()
    })
  })
})
