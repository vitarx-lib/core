import { ref } from '@vitarx/responsive'
import { describe, expect, it } from 'vitest'
import { DYNAMIC_RENDER_TYPE } from '../../../src/index.js'
import {
  bindProps,
  isSupportChildren,
  normalizerStyleAndClassProp
} from '../../../src/vnode/normalizer/props.js'

describe('vnode/normalizer/props', () => {
  describe('normalizerStyleAndClassProp - 样式和类名规范化', () => {
    it('应该规范化字符串 class', () => {
      const props = { class: 'foo bar' }
      normalizerStyleAndClassProp(props)

      expect(props.class).toEqual(['foo', 'bar'])
    })

    it('应该规范化数组 class', () => {
      const props = { class: ['foo', 'bar'] }
      normalizerStyleAndClassProp(props)

      expect(props.class).toEqual(['foo', 'bar'])
    })

    it('应该合并 class 和 className', () => {
      const props = { class: 'foo', className: 'bar' }
      normalizerStyleAndClassProp(props)

      expect(props.class).toEqual(['foo', 'bar'])
      expect(props.className).toBeUndefined()
    })

    it('应该处理只有 className 的情况', () => {
      const props = { className: 'foo bar' }
      normalizerStyleAndClassProp(props)

      expect((props as any).class).toEqual(['foo', 'bar'])
      expect(props.className).toBeUndefined()
    })

    it('应该规范化对象 style', () => {
      const props = { style: { color: 'red', fontSize: '14px' } }
      normalizerStyleAndClassProp(props)

      expect(props.style).toEqual({ color: 'red', fontSize: '14px' })
    })

    it('应该规范化字符串 style', () => {
      const props = { style: 'color: red; font-size: 14px' }
      normalizerStyleAndClassProp(props)

      expect(props.style).toBeDefined()
      expect(typeof props.style).toBe('object')
    })

    it('应该规范化数组 style', () => {
      const props = { style: [{ color: 'red' }, { fontSize: '14px' }] }
      normalizerStyleAndClassProp(props)

      expect(props.style).toBeDefined()
      expect(typeof props.style).toBe('object')
    })

    it('应该处理空 class', () => {
      const props = { class: '' }
      normalizerStyleAndClassProp(props)

      // 空字符串应该被处理
      expect(props.class).toBeDefined()
    })

    it('应该处理空 className', () => {
      const props = { className: '' }
      normalizerStyleAndClassProp(props)

      expect(props.className).toBeUndefined()
    })

    it('应该保留其他属性', () => {
      const props = { id: 'test', class: 'foo', 'data-value': '123' }
      normalizerStyleAndClassProp(props)

      expect(props.id).toBe('test')
      expect(props['data-value']).toBe('123')
    })
  })

  describe('bindProps - v-bind 属性绑定', () => {
    it('应该绑定对象属性到 props', () => {
      const props: any = {}
      const bind = { id: 'test', name: 'example' }
      bindProps(props, bind)

      expect(props.id).toBe('test')
      expect(props.name).toBe('example')
    })

    it('应该不覆盖已存在的属性', () => {
      const props: any = { id: 'existing' }
      const bind = { id: 'new', name: 'example' }
      bindProps(props, bind)

      expect(props.id).toBe('existing')
      expect(props.name).toBe('example')
    })

    it('应该支持数组形式的绑定', () => {
      const props: any = {}
      const bind = [{ id: 'test', name: 'example' }, []]
      bindProps(props, bind as any)

      expect(props.id).toBe('test')
      expect(props.name).toBe('example')
    })

    it('应该排除指定的属性', () => {
      const props: any = {}
      const bind = [{ id: 'test', name: 'example', title: 'Title' }, ['id', 'name']]
      bindProps(props, bind as any)

      expect(props.id).toBeUndefined()
      expect(props.name).toBeUndefined()
      expect(props.title).toBe('Title')
    })

    it('应该忽略 undefined 值', () => {
      const props: any = {}
      const bind = { id: 'test', name: undefined }
      bindProps(props, bind)

      expect(props.id).toBe('test')
      expect(props.name).toBeUndefined()
    })

    it('应该解包 ref 值', () => {
      const props: any = {}
      const idRef = ref('test-id')
      const bind = { id: idRef }
      bindProps(props, bind)

      expect(props.id).toBe('test-id')
    })

    it('应该忽略内置属性', () => {
      const props: any = {}
      const bind = { key: 'key-1', ref: {}, id: 'test' }
      bindProps(props, bind)

      // key 和 ref 是内置属性，不应该被绑定
      expect(props.key).toBeUndefined()
      expect(props.ref).toBeUndefined()
      expect(props.id).toBe('test')
    })

    it('应该处理空对象', () => {
      const props: any = { id: 'existing' }
      const bind = {}
      bindProps(props, bind)

      expect(props.id).toBe('existing')
    })

    it('应该处理非对象绑定源', () => {
      const props: any = { id: 'existing' }
      bindProps(props, 'invalid' as any)

      // 非对象应该被忽略
      expect(props.id).toBe('existing')
    })

    it('应该处理数组形式的非对象源', () => {
      const props: any = { id: 'existing' }
      bindProps(props, ['invalid', []] as any)

      // 非对象应该被忽略
      expect(props.id).toBe('existing')
    })

    it('应该处理空排除列表', () => {
      const props: any = {}
      const bind = [{ id: 'test', name: 'example' }, []]
      bindProps(props, bind as any)

      expect(props.id).toBe('test')
      expect(props.name).toBe('example')
    })

    it('应该处理 null 排除列表', () => {
      const props: any = {}
      const bind = [{ id: 'test', name: 'example' }, null]
      bindProps(props, bind as any)

      expect(props.id).toBe('test')
      expect(props.name).toBe('example')
    })
  })

  describe('isSupportChildren - 子节点支持检查', () => {
    it('应该返回 false 对于 TEXT_NODE_TYPE', () => {
      expect(isSupportChildren('plain-text')).toBe(false)
    })

    it('应该返回 false 对于 COMMENT_NODE_TYPE', () => {
      expect(isSupportChildren('comment')).toBe(false)
    })

    it('应该返回 true 对于 FRAGMENT_NODE_TYPE', () => {
      expect(isSupportChildren('fragment')).toBe(true)
    })

    it('应该返回 true 对于 DYNAMIC_RENDER_TYPE', () => {
      expect(isSupportChildren(DYNAMIC_RENDER_TYPE)).toBe(true)
    })

    it('应该返回 true 对于常规元素', () => {
      expect(isSupportChildren('div')).toBe(true)
    })

    it('应该返回 false 对于 void 元素', () => {
      expect(isSupportChildren('img')).toBe(false)
      expect(isSupportChildren('input')).toBe(false)
      expect(isSupportChildren('br')).toBe(false)
    })

    it('应该返回 true 对于 Widget 类型', () => {
      const MyWidget = () => null
      expect(isSupportChildren(MyWidget as any)).toBe(true)
    })

    it('应该返回 true 对于对象类型', () => {
      class MyWidget {}
      expect(isSupportChildren(MyWidget as any)).toBe(true)
    })
  })

  describe('综合测试', () => {
    it('应该正确处理复杂的 props 规范化', () => {
      const props: any = {
        class: 'foo',
        style: 'color: red',
        id: 'test'
      }

      normalizerStyleAndClassProp(props)

      expect(props.class).toEqual(['foo'])
      expect(props.style).toBeDefined()
      expect(typeof props.style).toBe('object')
      expect(props.id).toBe('test')
    })
  })
})
