import { describe, expect, it, vi } from 'vitest'
import { createVNode } from '../../src'

const body = document.createElement('div')
describe('函数组件测试套件', () => {
  it('应该正常渲染组件', () => {
    const Test = (props: { name: string }) => {
      return createVNode('div', { children: props.name })
    }
    const node = createVNode(Test, { name: 'test' })
    node.mount(body)
    expect(body.innerHTML).toBe('<div>test</div>')
  })
  it('应该支持渲染异步组件', () => {
    const Test = async (props: { name: string }) => {
      await new Promise(resolve => resolve)
      return createVNode('div', { children: props.name })
    }
    const node = createVNode(Test, { name: 'test' })
    node.mount(body)
    vi.waitFor(() => {
      expect(body.innerHTML).toBe('<div>test</div>')
    })
  })
})
