import { describe, expect, it, vi } from 'vitest'
import {
  isProxySignal,
  isRefSignal,
  isSignal,
  Observer,
  reactive,
  ref,
  SignalManager
} from '../../src/index'

describe('Signal Core', () => {
  describe('SignalManager', () => {
    it('应该能够添加父子信号关系', () => {
      const childSignal = ref(0)
      const parentSignal = ref(1)
      const key = 'testKey'

      SignalManager.addParent(childSignal, parentSignal, key)

      expect(SignalManager.hasParent(childSignal, parentSignal, key)).toBe(true)
    })

    it('应该能够移除父子信号关系', () => {
      const childSignal = ref(0)
      const parentSignal = ref(1)
      const key = 'testKey'

      SignalManager.addParent(childSignal, parentSignal, key)
      SignalManager.removeParent(childSignal, parentSignal, key)

      expect(SignalManager.hasParent(childSignal, parentSignal, key)).toBe(false)
    })

    it('应该能够获取信号的父级映射', () => {
      const childSignal = ref(0)
      const parentSignal1 = ref(1)
      const parentSignal2 = ref(2)
      const key1 = 'testKey1'
      const key2 = 'testKey2'

      SignalManager.addParent(childSignal, parentSignal1, key1)
      SignalManager.addParent(childSignal, parentSignal2, key2)

      const parents = SignalManager.getParents(childSignal)

      expect(parents).toBeDefined()
      expect(parents?.has(parentSignal1)).toBe(true)
      expect(parents?.has(parentSignal2)).toBe(true)
      expect(parents?.get(parentSignal1)?.has(key1)).toBe(true)
      expect(parents?.get(parentSignal2)?.has(key2)).toBe(true)
    })
  })

  it('应该能够通知父级信号', () => {
    const childSignal = ref(0)
    const parentSignal = ref(1)
    const key = 'testKey'

    // 模拟Observer.notify方法
    const notifySpy = vi.spyOn(Observer, 'notify')

    // 建立父子关系
    SignalManager.addParent(childSignal, parentSignal, key)

    // 触发通知
    SignalManager.notifyParent(childSignal)

    // 验证Observer.notify被调用
    expect(notifySpy).toHaveBeenCalledWith(parentSignal, [key])

    // 清理
    notifySpy.mockRestore()
  })

  it('应该能够通知订阅者属性已更新', () => {
    const signal = ref(0)
    const property = 'value'

    // 模拟Observer.notify和SignalManager.notifyParent方法
    const observerNotifySpy = vi.spyOn(Observer, 'notify')
    const notifyParentSpy = vi.spyOn(SignalManager, 'notifyParent')

    // 触发通知
    SignalManager.notifySubscribers(signal, property)

    // 验证Observer.notify和SignalManager.notifyParent被调用
    expect(observerNotifySpy).toHaveBeenCalledWith(signal, property)
    expect(notifyParentSpy).toHaveBeenCalledWith(signal)

    // 清理
    observerNotifySpy.mockRestore()
    notifyParentSpy.mockRestore()
  })

  it('应该能够通知订阅者属性已更新但不通知父级', () => {
    const signal = ref(0)
    const property = 'value'

    // 模拟Observer.notify和SignalManager.notifyParent方法
    const observerNotifySpy = vi.spyOn(Observer, 'notify')
    const notifyParentSpy = vi.spyOn(SignalManager, 'notifyParent')

    // 触发通知，但不通知父级
    SignalManager.notifySubscribers(signal, property, false)

    // 验证Observer.notify被调用，但SignalManager.notifyParent没有被调用
    expect(observerNotifySpy).toHaveBeenCalledWith(signal, property)
    expect(notifyParentSpy).not.toHaveBeenCalled()

    // 清理
    observerNotifySpy.mockRestore()
    notifyParentSpy.mockRestore()
  })
})

describe('工具函数', () => {
  it('应该正确识别信号对象', () => {
    const refSignal = ref(0)
    expect(isRefSignal(refSignal)).toBe(true)
    const reactiveSignal = reactive({ count: 0 })
    expect(isProxySignal(reactiveSignal)).toBe(true)
    const plainObject = { value: 0 }
    const primitiveValue = 42

    expect(isSignal(refSignal)).toBe(true)
    expect(isSignal(reactiveSignal)).toBe(true)
    expect(isSignal(plainObject)).toBe(false)
    expect(isSignal(primitiveValue)).toBe(false)
    expect(isSignal(null)).toBe(false)
    expect(isSignal(undefined)).toBe(false)
  })
})
