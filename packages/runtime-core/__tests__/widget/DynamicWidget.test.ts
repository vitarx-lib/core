import { describe, it } from 'vitest'
import { createElement } from '../../src/index.js'

describe('DynamicWidget', () => {
  it('支持动态渲染Widget', () => {
    const node = createElement('widget', { is: 'div', className: 'test', 'v-bind': { id: 'test' } })
    expect(node.props).toEqual({ class: ['test'], id: 'test' })
  })
})
