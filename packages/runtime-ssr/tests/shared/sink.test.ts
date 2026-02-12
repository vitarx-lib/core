import { describe, expect, it } from 'vitest'
import { StringSink } from '../../src/shared/sink.js'

describe('StringSink', () => {
  it('should initialize with empty buffer', () => {
    const sink = new StringSink()
    expect(sink.size).toBe(0)
    expect(sink.toString()).toBe('')
  })

  it('should push content to buffer', () => {
    const sink = new StringSink()
    sink.push('Hello')
    expect(sink.size).toBe(1)
    expect(sink.toString()).toBe('Hello')
  })

  it('should concatenate multiple pushes', () => {
    const sink = new StringSink()
    sink.push('Hello')
    sink.push(' ')
    sink.push('World')
    expect(sink.size).toBe(3)
    expect(sink.toString()).toBe('Hello World')
  })

  it('should handle empty strings', () => {
    const sink = new StringSink()
    sink.push('')
    sink.push('Hello')
    sink.push('')
    expect(sink.size).toBe(3)
    expect(sink.toString()).toBe('Hello')
  })

  it('should handle HTML content', () => {
    const sink = new StringSink()
    sink.push('<div>')
    sink.push('Content')
    sink.push('</div>')
    expect(sink.toString()).toBe('<div>Content</div>')
  })
})
