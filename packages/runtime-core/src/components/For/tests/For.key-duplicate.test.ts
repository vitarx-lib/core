import { describe, expect, it, vi } from 'vitest'
import type { HostElementTag } from '../../../types/index.js'
import { createView } from '../../../view/index.js'
import { For } from '../src/index.js'

describe('For Component - Key Duplicate Warning', () => {
  let container: HTMLElement
  const testTag = 'div' as HostElementTag

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
    // Mock console.warn to capture warning messages
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    document.body.removeChild(container)
    container.innerHTML = ''
    vi.restoreAllMocks()
  })

  it('应该在检测到重复key时显示详细的警告信息', () => {
    const items = ['apple', 'banana', 'apple'] // 重复的 'apple'
    
    const view = createView(For<string>, {
      each: items,
      key: (item: string) => item, // 使用item本身作为key，会导致重复
      children: (item: string) =>
        createView(testTag, {
          children: item
        })
    })

    view.mount(container)

    // 验证控制台警告被调用
    expect(console.warn).toHaveBeenCalled()
    
    // 验证警告信息包含关键内容
    const warnCalls = (console.warn as any).mock.calls
    const warningMessage = warnCalls[0][0]
    
    expect(warningMessage).toContain('Duplicate key')
    expect(warningMessage).toContain('already used at index')
    expect(warningMessage).toContain('now encountered at index')
    expect(warningMessage).toContain('rendering issues')
    expect(warningMessage).toContain('unique values')
    expect(warningMessage).toContain('Example:')
    
    // 验证仍然正确渲染（即使有重复key）
    expect(container.textContent).toBe('applebananaapple')
  })

  it('应该在不同的索引位置显示正确的重复key信息', () => {
    const items = [1, 2, 1, 3, 2] // 多个重复项
    
    const view = createView(For<number>, {
      each: items,
      key: (item: number) => item,
      children: (item: number) =>
        createView(testTag, {
          children: item.toString()
        })
    })

    view.mount(container)

    // 应该有多次警告调用
    expect(console.warn).toHaveBeenCalledTimes(2) // 1和2都重复了
    
    const warnCalls = (console.warn as any).mock.calls
    const firstWarning = warnCalls[0][0]
    const secondWarning = warnCalls[1][0]
    
    // 验证第一次重复警告
    expect(firstWarning).toContain('Duplicate key "1"')
    expect(firstWarning).toContain('already used at index 0')
    expect(firstWarning).toContain('now encountered at index 2')
    
    // 验证第二次重复警告
    expect(secondWarning).toContain('Duplicate key "2"')
    expect(secondWarning).toContain('already used at index 1')
    expect(secondWarning).toContain('now encountered at index 4')
  })
})