import { createView, getRenderer } from '@vitarx/runtime-core'
import { beforeEach, describe, expect, it } from 'vitest'
import { createApp, WebApp } from '../../src/core/app.js'
import { DOMRenderer } from '../../src/index.js'

describe('createApp', () => {
  const mockView = createView('div')
  beforeEach(() => {
    document.body.innerHTML = ''
  })
  it('应该使用默认配置创建App实例', () => {
    const app = createApp(mockView)
    expect(app).instanceof(WebApp)
    expect(getRenderer()).instanceof(DOMRenderer)
  })
  it('应该支持挂载', () => {
    const app = createApp(mockView)
    app.mount(document.body)
    expect(document.body.contains(mockView.$node)).toBe(true)
  })
})
