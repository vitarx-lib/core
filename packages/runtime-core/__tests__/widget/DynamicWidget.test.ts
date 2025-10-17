import { describe, it } from 'vitest'
import { createElement } from '../../src/index.js'

describe('DynamicWidget', () => {
  it('支持动态渲染', () => {
    const node = createElement('widget', {
      is: 'div',
      className: 'test',
      'v-bind': { id: 'test' }
    })
    expect(node.props).toEqual({ class: ['test'], id: 'test' })
    expect(node.type).toBe('div')
  })
  it('支持透传key等特殊的内置属性', () => {
    const node = createElement('widget', {
      is: 'div',
      'v-static': true,
      'v-bind': { key: 'test' }
    })
    expect(node.isStatic).toBe(true)
    expect(node.key).toBe('test')
  })
})
