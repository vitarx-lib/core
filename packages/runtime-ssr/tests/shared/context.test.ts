import { describe, expect, it } from 'vitest'
import { isHydrating, isSSR, useSSRContext } from '../../src/index.js'

describe('SSR Context', () => {
  it('当不在SSR上下文中时isSSR应该返回false', () => {
    expect(isSSR()).toBe(false)
  })

  it('当不处于激活状态时isHydrating应该返回false', () => {
    expect(isHydrating()).toBe(false)
  })

  it('当不在渲染上下文中时useSSRContext应该返回undefined', () => {
    expect(useSSRContext()).toBe(null)
  })
})
