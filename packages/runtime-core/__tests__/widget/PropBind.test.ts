import { describe, it } from 'vitest'
import { createElement, PropBind } from '../../src/index.js'

describe('PropBind', () => {
  it('支持给多个子元素绑定相同属性', () => {
    const div1 = createElement('div')
    const div2 = createElement('div')
    const node = createElement(PropBind, { test: 'test', children: [div1, div2] })
    expect(node.children).toEqual([div1, div2])
    expect(div1.props).toEqual({ test: 'test' })
    expect(div2.props).toEqual({ test: 'test' })
  })
  it('支持给单个子元素绑定不同属性', () => {
    const div1 = createElement('div')
    const node = createElement(PropBind, { test: 'test', children: div1 })
    expect(node.children).toEqual([div1])
    expect(div1.props).toEqual({ test: 'test' })
  })
})
