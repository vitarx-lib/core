/**
 * attributes 类型定义单元测试
 *
 * 测试目标：验证属性类型定义的类型推导和约束
 */
import { describe, expect, it } from 'vitest'
import type { CSSProperties, HTMLElementProps } from '../../src/index.js'

describe('types/attributes', () => {
  describe('类型推导', () => {
    it('HTMLElementProps 应该正确推导元素属性类型', () => {
      type DivProps = HTMLElementProps<HTMLDivElement>

      // 验证类型包含预期的属性
      const props: DivProps = {
        id: 'test',
        className: 'test-class',
        style: { color: 'red' },
        onClick: () => {}
      }

      expect(props.id).toBe('test')
      expect(props.className).toBe('test-class')
    })

    it('应该支持全局属性', () => {
      type DivProps = HTMLElementProps<HTMLDivElement>

      const props: DivProps = {
        id: 'test-id',
        title: 'Test Title',
        tabIndex: 0,
        hidden: false,
        draggable: true,
        contentEditable: 'true',
        lang: 'zh-CN'
      }

      expect(props.id).toBe('test-id')
      expect(props.title).toBe('Test Title')
      expect(props.tabIndex).toBe(0)
    })

    it('应该支持局部特定属性', () => {
      type InputProps = HTMLElementProps<HTMLInputElement>

      const props: InputProps = {
        type: 'text',
        placeholder: 'Enter text',
        disabled: false,
        required: true,
        maxlength: 100,
        pattern: '[A-Z]+',
        readonly: false
      }

      expect(props.type).toBe('text')
      expect(props.placeholder).toBe('Enter text')
      expect(props.required).toBe(true)
    })

    it('应该支持自定义属性', () => {
      type DivProps = HTMLElementProps<HTMLDivElement>

      const props: DivProps = {
        'data-test': 'test-value',
        'data-count': '123',
        'aria-label': 'Custom Label',
        'custom-attr': 'custom value'
      }

      expect(props['data-test']).toBe('test-value')
      expect(props['data-count']).toBe('123')
    })
  })

  describe('样式类型', () => {
    it('HTMLStyleRules 应该支持 CSS 属性', () => {
      const styles: CSSProperties = {
        color: 'red',
        fontSize: '16px',
        margin: '10px',
        padding: '5px 10px',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#fff'
      }

      expect(styles.color).toBe('red')
      expect(styles.fontSize).toBe('16px')
      expect(styles.display).toBe('flex')
    })

    it('HTMLStyleRules 应该支持 CSS 变量', () => {
      const styles: CSSProperties = {
        '--primary-color': 'blue',
        '--font-size': '14px',
        '--spacing': 0
      }

      expect(styles['--primary-color']).toBe('blue')
      expect(styles['--font-size']).toBe('14px')
      expect(styles['--spacing']).toBe(0)
    })

    it('style 属性应该支持字符串和对象', () => {
      type DivProps = HTMLElementProps<HTMLDivElement>

      const propsWithString: DivProps = {
        style: 'color: red; font-size: 16px;'
      }

      const propsWithObject: DivProps = {
        style: {
          color: 'red',
          fontSize: '16px'
        }
      }

      expect(propsWithString.style).toBe('color: red; font-size: 16px;')
      expect(typeof propsWithObject.style).toBe('object')
    })
  })

  describe('class 属性类型', () => {
    it('class 应该支持字符串', () => {
      type DivProps = HTMLElementProps<HTMLDivElement>

      const props: DivProps = {
        class: 'foo bar baz'
      }

      expect(props.class).toBe('foo bar baz')
    })

    it('class 应该支持字符串数组', () => {
      type DivProps = HTMLElementProps<HTMLDivElement>

      const props: DivProps = {
        class: ['foo', 'bar', 'baz']
      }

      expect(Array.isArray(props.class)).toBe(true)
      expect((props.class as string[]).length).toBe(3)
    })

    it('class 应该支持对象字典', () => {
      type DivProps = HTMLElementProps<HTMLDivElement>

      const props: DivProps = {
        class: {
          active: true,
          disabled: false,
          'my-class': true
        }
      }

      expect(typeof props.class).toBe('object')
      expect((props.class as Record<string, boolean>).active).toBe(true)
    })

    it('className 应该与 class 类型一致', () => {
      type DivProps = HTMLElementProps<HTMLDivElement>

      const propsWithString: DivProps = {
        className: 'test-class'
      }

      const propsWithArray: DivProps = {
        className: ['foo', 'bar']
      }

      const propsWithObject: DivProps = {
        className: { active: true }
      }

      expect(propsWithString.className).toBe('test-class')
      expect(Array.isArray(propsWithArray.className)).toBe(true)
      expect(typeof propsWithObject.className).toBe('object')
    })
  })

  describe('特殊属性', () => {
    it('应该支持 v-html 属性', () => {
      type DivProps = HTMLElementProps<HTMLDivElement>

      const props: DivProps = {
        'v-html': '<span>HTML Content</span>'
      }

      expect(props['v-html']).toBe('<span>HTML Content</span>')
    })

    it('应该支持布尔类型属性', () => {
      type InputProps = HTMLElementProps<HTMLInputElement>

      const props: InputProps = {
        disabled: true,
        checked: false,
        required: true,
        readonly: false,
        multiple: true
      }

      expect(props.disabled).toBe(true)
      expect(props.checked).toBe(false)
      expect(props.required).toBe(true)
    })

    it('应该支持数字类型属性', () => {
      type InputProps = HTMLElementProps<HTMLInputElement>

      const props: InputProps = {
        maxlength: 100,
        size: 20,
        tabIndex: 0,
        max: 10,
        min: 0
      }

      expect(props.maxlength).toBe(100)
      expect(props.size).toBe(20)
      expect(props.max).toBe(10)
    })

    it('应该支持宽度和高度属性', () => {
      type ImgProps = HTMLElementProps<HTMLImageElement>

      const propsWithNumber: ImgProps = {
        width: 200,
        height: 100
      }

      const propsWithString: ImgProps = {
        width: '200px',
        height: '100px'
      }

      expect(propsWithNumber.width).toBe(200)
      expect(propsWithString.width).toBe('200px')
    })
  })
})
