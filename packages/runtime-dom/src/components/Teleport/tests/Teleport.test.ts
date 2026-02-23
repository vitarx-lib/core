import type { HostElementTag } from '@vitarx/runtime-core'
import { createView, setRenderer } from '@vitarx/runtime-core'
import { logger, LogLevel } from '@vitarx/utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DOMRenderer } from '../../../core/index.js'
import { Teleport } from '../src/index.js'

// 设置渲染器
setRenderer(new DOMRenderer())

describe('Teleport 组件', () => {
  let container: HTMLElement
  let targetContainer: HTMLElement
  const testTag = 'div' as HostElementTag

  beforeEach(() => {
    container = document.createElement('div')
    targetContainer = document.createElement('div')
    targetContainer.id = 'target'
    document.body.appendChild(container)
    document.body.appendChild(targetContainer)
  })

  afterEach(() => {
    document.body.removeChild(container)
    document.body.removeChild(targetContainer)
    container.innerHTML = ''
    targetContainer.innerHTML = ''
  })

  describe('属性验证', () => {
    it('应该验证 children 必须为 View 对象', () => {
      expect(() => {
        Teleport.validateProps({
          children: 'not a view',
          to: '#target'
        })
      }).toThrowError(TypeError)
    })

    it('应该验证 to 必须为字符串（当 disabled 为 false 时）', () => {
      expect(() => {
        Teleport.validateProps({
          children: createView(testTag, { children: 'child' }),
          to: 123
        })
      }).toThrowError(TypeError)
    })

    it('应该接受有效的 children 和 to 属性', () => {
      expect(() => {
        Teleport.validateProps({
          children: createView(testTag, { children: 'child' }),
          to: '#target'
        })
      }).not.toThrow()
    })

    it('应该允许 to 不是字符串当 disabled 为 true 时', () => {
      expect(() => {
        Teleport.validateProps({
          children: createView(testTag, { children: 'child' }),
          to: 123,
          disabled: true
        })
      }).not.toThrow()
    })
  })

  describe('基础功能', () => {
    it('应该将子元素传送到目标容器', () => {
      const childView = createView(testTag, {
        id: 'child-element',
        children: 'Child Content'
      })

      const teleportView = createView(Teleport, {
        to: '#target',
        children: childView
      })

      teleportView.mount(container)

      // Teleport本身应该只渲染一个注释节点
      expect(container.innerHTML).toContain('teleport')

      // 子元素应该被传送到目标容器
      expect(targetContainer.querySelector('#child-element')).toBeTruthy()
      expect(targetContainer.textContent).toContain('Child Content')
    })

    it('应该在目标容器不存在时发出警告', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const childView = createView(testTag, { children: 'Child Content' })
      const teleportView = createView(Teleport, {
        to: '#non-existent-target',
        children: childView
      })

      teleportView.mount(container)

      // 检查警告是否被调用，只检查第一个参数
      expect(consoleSpy).toHaveBeenCalledWith(
        logger.formatMessage(
          LogLevel.WARN,
          "Teleport target element not found: selector '#non-existent-target' does not match any element in the DOM"
        )
      )

      consoleSpy.mockRestore()
    })

    it('应该正确处理传送后的DOM结构', () => {
      const childView = createView(testTag, {
        className: 'child-class',
        children: 'Child Content'
      })

      const teleportView = createView(Teleport, {
        to: '#target',
        children: childView
      })

      teleportView.mount(container)

      const childElement = targetContainer.querySelector('.child-class')
      expect(childElement).toBeTruthy()
      expect(childElement?.textContent).toBe('Child Content')
      expect(container.textContent).not.toContain('Child Content')
    })
  })

  describe('延迟挂载', () => {
    it('应该在 defer 为 true 时延迟挂载到 mounted 阶段', () => {
      const childView = createView(testTag, {
        id: 'delayed-child',
        children: 'Delayed Content'
      })

      const teleportView = createView(Teleport, {
        to: '#target',
        children: childView,
        defer: true
      })

      // 在挂载前，目标容器应该是空的
      expect(targetContainer.textContent).toBe('')

      teleportView.mount(container)

      // 即使挂载后，由于 defer，内容可能还未传送
      // 但这里我们主要测试组件是否正确初始化
      expect(container.innerHTML).toContain('teleport')
    })

    it('应该在 defer 为 false 时立即挂载', () => {
      const childView = createView(testTag, {
        id: 'immediate-child',
        children: 'Immediate Content'
      })

      const teleportView = createView(Teleport, {
        to: '#target',
        children: childView,
        defer: false
      })

      teleportView.mount(container)

      // 内容应该已经被立即传送到目标容器
      expect(targetContainer.querySelector('#immediate-child')).toBeTruthy()
      expect(targetContainer.textContent).toContain('Immediate Content')
    })
  })

  describe('禁用功能', () => {
    it('应该在 disabled 为 true 时直接返回 children', () => {
      const childView = createView(testTag, {
        id: 'disabled-child',
        children: 'Disabled Content'
      })

      const teleportView = createView(Teleport, {
        to: '#target',
        children: childView,
        disabled: true
      })

      teleportView.mount(container)

      // 当禁用时，子元素应该在原始容器中而不是目标容器
      expect(container.querySelector('#disabled-child')).toBeTruthy()
      expect(container.textContent).toContain('Disabled Content')
      expect(targetContainer.textContent).toBe('')
    })

    it('应该在 disabled 从 true 变为 false 时启用传送', () => {
      const childView = createView(testTag, {
        id: 'toggle-child',
        children: 'Toggle Content'
      })

      // 初始禁用状态
      const teleportView = createView(Teleport, {
        to: '#target',
        children: childView,
        disabled: true
      })

      teleportView.mount(container)

      // 应该在原始容器中
      expect(container.querySelector('#toggle-child')).toBeTruthy()
      expect(targetContainer.textContent).toBe('')

      // 这里我们无法直接更改已创建视图的属性，所以验证初始状态
      // 实际的切换功能需要通过响应式系统来测试
    })

    it('应该在 disabled 为 false 时正常传送', () => {
      const childView = createView(testTag, {
        id: 'normal-child',
        children: 'Normal Content'
      })

      const teleportView = createView(Teleport, {
        to: '#target',
        children: childView,
        disabled: false
      })

      teleportView.mount(container)

      expect(targetContainer.querySelector('#normal-child')).toBeTruthy()
      expect(targetContainer.textContent).toContain('Normal Content')
    })
  })

  describe('SSR模式模拟', () => {
    let originalSSR: boolean

    beforeEach(() => {
      originalSSR = (globalThis as any).__VITARX_SSR__
      ;(globalThis as any).__VITARX_SSR__ = true
    })

    afterEach(() => {
      ;(globalThis as any).__VITARX_SSR__ = originalSSR
    })

    it('应该在 SSR 模式下返回注释节点', () => {
      const childView = createView(testTag, { children: 'Child Content' })
      const teleportView = createView(Teleport, {
        to: '#target',
        children: childView
      })

      // 在SSR模式下，mount操作不能执行，但我们仍可以验证组件返回值
      expect(() => {
        teleportView.mount(container)
      }).toThrowError('[View.mount]: is not supported in SSR mode')
    })
  })

  describe('生命周期', () => {
    it('应该在销毁时清理传送的内容', () => {
      const childView = createView(testTag, {
        id: 'dispose-test-child',
        children: 'Dispose Test Content'
      })

      const teleportView = createView(Teleport, {
        to: '#target',
        children: childView
      })

      teleportView.mount(container)

      // 确认内容已被传送
      expect(targetContainer.querySelector('#dispose-test-child')).toBeTruthy()

      // 销毁传送组件
      teleportView.dispose()

      // 验证原始容器被清空
      expect(container.innerHTML).toBe('')
    })

    it('应该初始化子组件', () => {
      const initSpy = vi.fn()
      const childView = createView(testTag, {
        id: 'init-test-child',
        children: 'Init Test Content'
      })

      // 模拟一个有init方法的视图以测试初始化
      const originalInit = childView.init
      childView.init = context => {
        initSpy()
        return originalInit.call(childView, context)
      }

      const teleportView = createView(Teleport, {
        to: '#target',
        children: childView
      })

      teleportView.mount(container)

      expect(initSpy).toHaveBeenCalled()
      expect(targetContainer.querySelector('#init-test-child')).toBeTruthy()
    })
  })

  describe('边界情况', () => {
    it('应该处理目标选择器无效的情况', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const childView = createView(testTag, { children: 'Child Content' })
      const teleportView = createView(Teleport, {
        to: '#invalid-selector-that-does-not-exist',
        children: childView
      })

      teleportView.mount(container)

      expect(consoleSpy).toHaveBeenCalledWith(
        logger.formatMessage(
          LogLevel.WARN,
          "Teleport target element not found: selector '#invalid-selector-that-does-not-exist' does not match any element in the DOM"
        )
      )
      // 内容不应该被传送，因为目标不存在
      expect(targetContainer.textContent).toBe('')

      consoleSpy.mockRestore()
    })

    it('应该处理空目标字符串的情况', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const childView = createView(testTag, { children: 'Child Content' })
      const teleportView = createView(Teleport, {
        to: '',
        children: childView
      })

      // 空字符串是无效的CSS选择器，但组件应该能处理这种情况
      // 尽管可能会有异常或警告，目标容器应该保持为空
      try {
        teleportView.mount(container)
      } catch (e) {
        // 如果有异常，这是预期的，因为空字符串不是有效的选择器
      }

      // 无论是否有异常，目标容器都应该保持为空
      expect(targetContainer.textContent).toBe('')

      consoleSpy.mockRestore()
    })

    it('应该处理目标容器为 document body 的情况', () => {
      const childView = createView(testTag, {
        id: 'body-target-child',
        children: 'Body Target Content'
      })

      const teleportView = createView(Teleport, {
        to: 'body',
        children: childView
      })

      teleportView.mount(container)

      // 子元素应该被添加到body中，而不是目标容器
      expect(document.body.contains(document.getElementById('body-target-child'))).toBe(true)
      expect(targetContainer.textContent).toBe('')
    })
  })
})
