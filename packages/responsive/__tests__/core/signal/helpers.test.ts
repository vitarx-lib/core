import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushSync, ref, runEffect } from '../../../src/index.js'

describe('runEffect', () => {
  beforeEach(() => {
    // 清理可能的副作用
    vi.clearAllMocks()
  })

  it('应该正确创建并执行 effect', () => {
    const count = ref(0)
    const effect = vi.fn(() => count.value)
    const stop = runEffect(effect)
    expect(effect).toHaveBeenCalled()
    count.value++
    stop?.()
  })
  it('应该支持在依赖变化时触发时异步触发', () => {
    const count = ref(0)
    const effect = vi.fn(() => count.value)
    const stop = runEffect(effect)
    count.value++
    expect(effect).toHaveBeenCalledTimes(1)
    flushSync()
    expect(effect).toHaveBeenCalledTimes(2)
    stop?.()
  })
  it('应该支持在依赖变化时触发同步触发', () => {
    const count = ref(0)
    const effect = vi.fn(() => count.value)
    const stop = runEffect(effect, { flush: 'sync' })
    count.value++
    expect(effect).toHaveBeenCalledTimes(2)
    stop?.()
  })

  it('当 effect 不是函数时应该抛出 TypeError', () => {
    // @ts-ignore 测试非函数输入
    expect(() => runEffect(null)).toThrow(TypeError)
    // @ts-ignore 测试非函数输入
    expect(() => runEffect('not a function')).toThrow(TypeError)
    // @ts-ignore 测试非函数输入
    expect(() => runEffect(123)).toThrow(TypeError)
  })

  it('应该支持默认的 flush 和 track 选项', () => {
    const effect = vi.fn()
    const stop = runEffect(effect)
    expect(effect).toHaveBeenCalled()
    stop?.()
  })

  it('应该支持自定义 track 选项', () => {
    const effect = vi.fn()
    // @ts-ignore
    const stop = runEffect(effect, { track: 'manual' })
    expect(effect).toHaveBeenCalled()
    stop?.()
  })

  it('没有依赖时不返回停止函数', () => {
    const effect = vi.fn()
    const stop = runEffect(effect)
    expect(stop).toBe(null)
    stop?.()
  })

  it('停止函数应该能正确停止 effect', () => {
    const effect = vi.fn()
    const stop = runEffect(effect)
    stop?.()
    // 停止后再次调用应该不会触发 effect
    expect(effect).toHaveBeenCalledTimes(1)
  })

  it('应该支持同时使用多个 options', () => {
    const effect = vi.fn()
    const stop = runEffect(effect, {
      flush: 'sync',
      track: 'once'
    })
    stop?.()
  })

  it('应该处理空 options 对象', () => {
    const effect = vi.fn()
    const stop = runEffect(effect, {})
    expect(effect).toHaveBeenCalled()
    stop?.()
  })

  it('应该处理 undefined options', () => {
    const effect = vi.fn()
    // @ts-ignore 测试 undefined options
    const stop = runEffect(effect, undefined)
    expect(effect).toHaveBeenCalled()
    stop?.()
  })

  it('应该处理 effect 抛出错误的情况', () => {
    const effect = vi.fn(() => {
      throw new Error('Test error')
    })
    expect(() => runEffect(effect)).toThrow('Test error')
  })

  it('应该支持多次调用停止函数', () => {
    const effect = vi.fn()
    const stop = runEffect(effect)
    stop?.()
    stop?.()
    stop?.()
    expect(effect).toHaveBeenCalledTimes(1)
  })
})
