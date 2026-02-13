import { describe, expect, it } from 'vitest'
import {
  escapeHTML,
  serializeAttributes,
  tagClose,
  tagOpen,
  tagSelfClosing
} from '../../src/shared/html.js'

describe('escapeHTML', () => {
  it('should escape HTML special characters', () => {
    expect(escapeHTML('&')).toBe('&amp;')
    expect(escapeHTML('<')).toBe('&lt;')
    expect(escapeHTML('>')).toBe('&gt;')
    expect(escapeHTML('"')).toBe('&quot;')
    expect(escapeHTML("'")).toBe('&#39;')
  })

  it('should escape multiple characters', () => {
    expect(escapeHTML('<div class="test">')).toBe('&lt;div class=&quot;test&quot;&gt;')
    expect(escapeHTML("Tom & Jerry's")).toBe('Tom &amp; Jerry&#39;s')
  })

  it('should handle empty string', () => {
    expect(escapeHTML('')).toBe('')
  })

  it('should handle text without special characters', () => {
    expect(escapeHTML('Hello World')).toBe('Hello World')
  })
})

describe('serializeAttributes', () => {
  it('should serialize basic attributes', () => {
    const result = serializeAttributes({ id: 'test', name: 'value' })
    expect(result).toContain('id="test"')
    expect(result).toContain('name="value"')
  })

  it('should handle class attribute', () => {
    expect(serializeAttributes({ class: 'foo bar' })).toBe(' class="foo bar"')
    expect(serializeAttributes({ className: 'foo' })).toBe(' class="foo"')
  })

  it('should handle style attribute', () => {
    const result = serializeAttributes({ style: { color: 'red', fontSize: '14px' } })
    expect(result).toContain('style=')
    expect(result).toContain('color')
    expect(result).toContain('red')
  })

  it('should handle boolean attributes', () => {
    expect(serializeAttributes({ disabled: true })).toBe(' disabled')
    expect(serializeAttributes({ disabled: false })).toBe('')
  })

  it('should filter out function values', () => {
    const result = serializeAttributes({ onClick: () => {}, id: 'test' })
    expect(result).not.toContain('onClick')
    expect(result).toContain('id="test"')
  })

  it('should filter out null and undefined', () => {
    const result = serializeAttributes({ a: null, b: undefined, c: 'value' })
    expect(result).not.toContain('a=')
    expect(result).not.toContain('b=')
    expect(result).toContain('c="value"')
  })

  it('should skip children property', () => {
    const result = serializeAttributes({ children: ['child'], id: 'test' })
    expect(result).not.toContain('children')
    expect(result).toContain('id="test"')
  })

  it('should skip v-html property', () => {
    const result = serializeAttributes({ 'v-html': '<p>test</p>', id: 'test' })
    expect(result).not.toContain('v-html')
    expect(result).toContain('id="test"')
  })

  it('should escape attribute values', () => {
    const result = serializeAttributes({ title: 'Tom & Jerry' })
    expect(result).toBe(' title="Tom &amp; Jerry"')
  })

  it('should return empty string for empty props', () => {
    expect(serializeAttributes({})).toBe('')
  })
})

describe('tagOpen', () => {
  it('should generate opening tag without attributes', () => {
    expect(tagOpen('div', {})).toBe('<div>')
  })

  it('should generate opening tag with attributes', () => {
    const result = tagOpen('div', { id: 'test', class: 'foo' })
    expect(result).toContain('<div')
    expect(result).toContain('id="test"')
    expect(result).toContain('class="foo"')
    expect(result).toContain('>')
  })
})

describe('tagClose', () => {
  it('should generate closing tag', () => {
    expect(tagClose('div')).toBe('</div>')
    expect(tagClose('span')).toBe('</span>')
  })
})

describe('tagSelfClosing', () => {
  it('should generate self-closing tag without attributes', () => {
    expect(tagSelfClosing('img', {})).toBe('<\img />')
  })

  it('should generate self-closing tag with attributes', () => {
    const result = tagSelfClosing('img', { src: 'test.jpg', alt: 'Test' })
    expect(result).toContain('<img')
    expect(result).toContain('src="test.jpg"')
    expect(result).toContain('alt="Test"')
    expect(result).toContain('/>')
  })
})
