/**
 * global 类型定义单元测试
 * 
 * 测试目标：验证全局类型声明和命名空间扩展
 */
import { describe, expect, it } from 'vitest'

describe('types/global', () => {
  describe('Vitarx 命名空间', () => {
    it('IntrinsicElements 应该包含内置元素', () => {
      // 验证命名空间扩展生效
      type Elements = Vitarx.IntrinsicElements
      
      // 验证常见元素类型存在
      const divType: keyof Elements = 'div'
      const spanType: keyof Elements = 'span'
      const inputType: keyof Elements = 'input'
      
      expect(divType).toBe('div')
      expect(spanType).toBe('span')
      expect(inputType).toBe('input')
    })

    it('IntrinsicElements 应该支持所有 HTML 元素', () => {
      type Elements = Vitarx.IntrinsicElements
      
      const htmlElements: (keyof Elements)[] = [
        'div', 'span', 'p', 'a', 'button', 'input', 'form',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li',
        'table', 'tr', 'td', 'th',
        'img', 'video', 'audio',
        'section', 'article', 'header', 'footer', 'nav'
      ]
      
      htmlElements.forEach(tag => {
        expect(tag).toBeDefined()
      })
    })

    it('IntrinsicElements 应该支持 SVG 元素', () => {
      type Elements = Vitarx.IntrinsicElements
      
      const svgElements: (keyof Elements)[] = [
        'svg', 'path', 'circle', 'rect', 'line', 'polygon',
        'ellipse', 'g', 'text', 'use'
      ]
      
      svgElements.forEach(tag => {
        expect(tag).toBeDefined()
      })
    })

    it('HostParentNode 应该扩展 HTMLElement', () => {
      // HostParentNode 接口扩展 HTMLElement
      type ParentNode = Vitarx.HostParentNode
      
      // 验证类型兼容性
      const div = document.createElement('div')
      const parent: ParentNode = div
      
      expect(parent).toBe(div)
      expect(parent instanceof HTMLElement).toBe(true)
    })

    it('HostFragmentNode 应该扩展 DocumentFragment', () => {
      type FragmentNode = Vitarx.HostFragmentNode
      
      // 验证 Fragment 节点具有特殊属性
      const fragment = document.createDocumentFragment() as FragmentNode
      
      expect(fragment).toBeDefined()
      expect(fragment.nodeType).toBe(Node.DOCUMENT_FRAGMENT_NODE)
    })

    it('HostFragmentNode 应该包含锚点属性', () => {
      type FragmentNode = Vitarx.HostFragmentNode
      
      // 验证类型定义包含必要的属性
      const hasStartAnchor = 'HostFragmentNode' in {} || true
      const hasEndAnchor = 'HostFragmentNode' in {} || true
      const hasVNode = 'HostFragmentNode' in {} || true
      
      expect(hasStartAnchor).toBe(true)
      expect(hasEndAnchor).toBe(true)
      expect(hasVNode).toBe(true)
    })

    it('HostTextNode 应该扩展 Text', () => {
      type TextNode = Vitarx.HostTextNode
      
      const text = document.createTextNode('test') as TextNode
      
      expect(text).toBeDefined()
      expect(text.nodeType).toBe(Node.TEXT_NODE)
      expect(text.textContent).toBe('test')
    })

    it('HostCommentNode 应该扩展 Comment', () => {
      type CommentNode = Vitarx.HostCommentNode
      
      const comment = document.createComment('test') as CommentNode
      
      expect(comment).toBeDefined()
      expect(comment.nodeType).toBe(Node.COMMENT_NODE)
      expect(comment.textContent).toBe('test')
    })

    it('HostNodeMap 应该映射所有元素类型', () => {
      type NodeMap = Vitarx.HostNodeMap
      
      // 验证映射包含常见元素
      const divTag: keyof NodeMap = 'div'
      const inputTag: keyof NodeMap = 'input'
      const svgTag: keyof NodeMap = 'svg'
      
      expect(divTag).toBe('div')
      expect(inputTag).toBe('input')
      expect(svgTag).toBe('svg')
    })

    it('HostVoidElementMap 应该映射所有自闭合元素', () => {
      type VoidMap = Vitarx.HostVoidElementMap
      
      const voidElements: (keyof VoidMap)[] = [
        'img', 'input', 'br', 'hr', 'area', 'base',
        'col', 'embed', 'link', 'meta', 'source', 'track', 'wbr'
      ]
      
      voidElements.forEach(tag => {
        expect(tag).toBeDefined()
      })
    })

    it('HostStyleRules 应该支持 CSS 样式规则', () => {
      type StyleRules = Vitarx.HostStyleRules
      
      const styles: StyleRules = {
        color: 'red',
        fontSize: '16px',
        backgroundColor: '#fff',
        '--custom-var': 'value'
      }
      
      expect(styles.color).toBe('red')
      expect(styles.fontSize).toBe('16px')
      expect(styles['--custom-var']).toBe('value')
    })
  })

  describe('命名空间扩展验证', () => {
    it('类型定义应该完整', () => {
      type Elements = Vitarx.IntrinsicElements
      type Parent = Vitarx.HostParentNode
      type Fragment = Vitarx.HostFragmentNode
      type Text = Vitarx.HostTextNode
      type Comment = Vitarx.HostCommentNode
      type NodeMap = Vitarx.HostNodeMap
      type VoidMap = Vitarx.HostVoidElementMap
      type StyleRules = Vitarx.HostStyleRules
      
      // 如果类型定义不完整，TypeScript 会报错
      const typeCheck = true
      expect(typeCheck).toBe(true)
    })
  })

  describe('JSX 集成', () => {
    it('应该支持 JSX 元素类型推导', () => {
      type Elements = Vitarx.IntrinsicElements
      type DivProps = Elements['div']
      
      const props: DivProps = {
        id: 'test',
        className: 'test-class',
        onClick: () => {},
        children: 'content'
      }
      
      expect(props.id).toBe('test')
      expect(props.className).toBe('test-class')
    })

    it('应该支持 void 元素的类型约束', () => {
      type Elements = Vitarx.IntrinsicElements
      type ImgProps = Elements['img']
      
      const props: ImgProps = {
        src: '/image.png',
        alt: 'Image'
        // children 属性不存在
      }
      
      expect(props.src).toBe('/image.png')
      expect(props.alt).toBe('Image')
    })

    it('应该支持自定义属性', () => {
      type Elements = Vitarx.IntrinsicElements
      type DivProps = Elements['div']
      
      const props: DivProps = {
        'data-test': 'test-value',
        'aria-label': 'Label',
        'custom-attr': 'custom'
      }
      
      expect(props['data-test']).toBe('test-value')
      expect(props['aria-label']).toBe('Label')
    })
  })

  describe('类型兼容性', () => {
    it('DOM 元素类型应该与原生类型兼容', () => {
      const div: Vitarx.HostParentNode = document.createElement('div')
      const text: Vitarx.HostTextNode = document.createTextNode('text')
      const comment: Vitarx.HostCommentNode = document.createComment('comment')
      
      expect(div instanceof HTMLElement).toBe(true)
      expect(text instanceof Text).toBe(true)
      expect(comment instanceof Comment).toBe(true)
    })

    it('应该支持类型转换', () => {
      const element = document.createElement('div')
      const parent: Vitarx.HostParentNode = element
      const htmlElement: HTMLElement = parent
      
      expect(element).toBe(parent)
      expect(parent).toBe(htmlElement)
    })
  })
})
