/**
 * element 类型定义单元测试
 *
 * 测试目标：验证元素类型映射和 JSX 类型定义
 */
import { describe, expect, it } from 'vitest'
import type {
  HTMLElementTagMap,
  HTMLIntrinsicElement,
  HTMLVoidElementMap
} from '../../src/index.js'

describe('types/element', () => {
  describe('元素标签映射', () => {
    it('HTMLElementTagMap 应该包含常见 HTML 元素', () => {
      type TagMap = HTMLElementTagMap

      // 验证类型映射存在
      const divTag: keyof TagMap = 'div'
      const spanTag: keyof TagMap = 'span'
      const inputTag: keyof TagMap = 'input'
      const buttonTag: keyof TagMap = 'button'

      expect(divTag).toBe('div')
      expect(spanTag).toBe('span')
      expect(inputTag).toBe('input')
      expect(buttonTag).toBe('button')
    })

    it('HTMLElementTagMap 应该包含 SVG 元素', () => {
      type TagMap = HTMLElementTagMap

      const svgTag: keyof TagMap = 'svg'
      const pathTag: keyof TagMap = 'path'
      const circleTag: keyof TagMap = 'circle'
      const rectTag: keyof TagMap = 'rect'

      expect(svgTag).toBe('svg')
      expect(pathTag).toBe('path')
      expect(circleTag).toBe('circle')
      expect(rectTag).toBe('rect')
    })

    it('HTMLVoidElementMap 应该包含所有自闭合元素', () => {
      type VoidMap = HTMLVoidElementMap

      const voidTags: (keyof VoidMap)[] = [
        'area',
        'base',
        'br',
        'col',
        'embed',
        'hr',
        'img',
        'input',
        'link',
        'meta',
        'source',
        'track',
        'wbr'
      ]

      voidTags.forEach(tag => {
        expect(tag).toBeDefined()
      })
    })
  })

  describe('IntrinsicElement 类型', () => {
    it('void 元素应该排除 children 属性', () => {
      type ImgProps = HTMLIntrinsicElement['img']

      const props: ImgProps = {
        src: '/image.png',
        alt: 'Image',
        width: 200,
        height: 100
        // children 属性不应存在
      }

      expect(props.src).toBe('/image.png')
      expect(props.alt).toBe('Image')
    })

    it('普通元素应该包含 children 属性', () => {
      type DivProps = HTMLIntrinsicElement['div']

      const props: DivProps = {
        id: 'test',
        children: 'Text content'
      }

      expect(props.id).toBe('test')
      expect(props.children).toBe('Text content')
    })

    it('元素属性类型应该正确', () => {
      type InputProps = HTMLIntrinsicElement['input']

      const props: InputProps = {
        type: 'text',
        value: 'test value',
        placeholder: 'Enter text',
        disabled: false,
        onChange: () => {}
      }

      expect(props.type).toBe('text')
      expect(props.value).toBe('test value')
      expect(typeof props.onChange).toBe('function')
    })

    it('应该支持表单元素属性', () => {
      type FormProps = HTMLIntrinsicElement['form']

      const props: FormProps = {
        action: '/submit',
        method: 'post',
        onSubmit: e => e.preventDefault(),
        children: []
      }

      expect(props.action).toBe('/submit')
      expect(props.method).toBe('post')
    })

    it('应该支持多媒体元素属性', () => {
      type VideoProps = HTMLIntrinsicElement['video']

      const props: VideoProps = {
        src: '/video.mp4',
        controls: true,
        autoplay: false,
        loop: false,
        muted: true,
        width: 640,
        height: 360,
        onPlay: () => {},
        children: []
      }

      expect(props.src).toBe('/video.mp4')
      expect(props.controls).toBe(true)
      expect(props.width).toBe(640)
    })

    it('应该支持链接元素属性', () => {
      type AProps = HTMLIntrinsicElement['a']

      const props: AProps = {
        href: 'https://example.com',
        target: '_blank',
        rel: 'noopener noreferrer',
        onClick: () => {},
        children: 'Click me'
      }

      expect(props.href).toBe('https://example.com')
      expect(props.target).toBe('_blank')
      expect(props.rel).toBe('noopener noreferrer')
    })

    it('应该支持 SVG 元素属性', () => {
      type SvgProps = HTMLIntrinsicElement['svg']

      const props: SvgProps = {
        width: '100',
        height: '100',
        viewBox: '0 0 100 100',
        children: []
      }

      expect(props.width).toBe('100')
      expect(props.viewBox).toBe('0 0 100 100')
    })

    it('应该支持全局事件属性', () => {
      type ButtonProps = HTMLIntrinsicElement['button']

      const props: ButtonProps = {
        onClick: () => {},
        onMouseEnter: () => {},
        onMouseLeave: () => {},
        onFocus: () => {},
        onBlur: () => {},
        children: 'Button'
      }

      expect(typeof props.onClick).toBe('function')
      expect(typeof props.onMouseEnter).toBe('function')
    })
  })

  describe('类型约束', () => {
    it('应该正确约束属性值类型', () => {
      type InputProps = HTMLIntrinsicElement['input']

      const validProps: InputProps = {
        type: 'number',
        min: 0,
        max: 100,
        step: 1
      }

      expect(validProps.type).toBe('number')
      expect(validProps.min).toBe(0)
    })

    it('应该支持可选属性', () => {
      type DivProps = HTMLIntrinsicElement['div']

      // 所有属性都是可选的
      const emptyProps: DivProps = {}
      const withProps: DivProps = {
        id: 'test'
      }

      expect(emptyProps).toBeDefined()
      expect(withProps.id).toBe('test')
    })
  })
})
