import { describe, expect, it } from 'vitest'
import {
  _handleBindAllProps,
  _handleBindProps,
  createVNode,
  defineDefaultProps,
  defineProps,
  type Element,
  Widget
} from '../../src/index.js'

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
  it('支持defineProps定义默认属性', () => {
    const node = createVNode(MockWidget)
    expect(node.instance.test).toBe(1)
    expect(defineProps).toBe(defineDefaultProps)
  })

  it('应该处理 bind props，排除内在属性', () => {
    const props = {
      'v-bind': { id: 'test', class: 'btn', key: 'value' },
      existingProp: 'existing'
    } as any

    _handleBindProps(props)

    // 应该移除 v-bind 属性
    expect(props['v-bind']).toBeUndefined()

    // 应该合并非内置属性
    expect(props.id).toBe('test')
    expect(props.existingProp).toBe('existing')

    // 应该排除内置属性如 key
    expect(props.key).toBeUndefined()
  })

  it('应该在不排除内在属性的情况下处理 bind 属性', () => {
    const props = {
      'v-bind': { id: 'test', key: 'value' },
      existingProp: 'existing'
    } as any

    _handleBindProps(props, false)

    // 应该移除 v-bind 属性
    expect(props['v-bind']).toBeUndefined()

    // 应该合并所有属性包括内置属性
    expect(props.id).toBe('test')
    expect(props.key).toBe('value')
    expect(props.existingProp).toBe('existing')
  })

  it('应该处理绑定所有 props，包括内在属性', () => {
    const props = {
      'v-bind-all': { id: 'test', key: 'value', 'v-if': true },
      existingProp: 'existing'
    } as any

    _handleBindAllProps(props)

    // 应该移除 v-bind-all 属性
    expect(props['v-bind-all']).toBeUndefined()

    // 应该合并所有属性包括内置属性
    expect(props.id).toBe('test')
    expect(props.key).toBe('value')
    expect('v-if' in props).toBe(false)
    expect(props.existingProp).toBe('existing')
  })

  it('应该在 bind props 中处理样式和类合并', () => {
    const props = {
      'v-bind': { style: { color: 'red' }, class: ['btn'] },
      style: { fontSize: '14px' },
      class: 'container'
    }

    _handleBindProps(props)

    // 应该合并样式
    expect(props.style).toEqual({ color: 'red', fontSize: '14px' })

    // 应该合并类名
    expect(props.class).toEqual('container btn')
  })
})
