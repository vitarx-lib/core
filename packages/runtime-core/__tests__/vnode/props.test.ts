import { describe, it } from 'vitest'
import { createVNode, defineProps, type Element, Widget } from '../../src/index.js'

class MockWidget extends Widget<{}, { test: number }> {
  get test() {
    return this.props.test
  }

  override onCreate() {
    defineProps({ test: 1 })
  }

  override build(): Element | null {
    return null
  }
}

describe('props', () => {
  it('defineProps', () => {
    const node = createVNode(MockWidget)
    expect(node.instance.test).toBe(1)
  })
})
