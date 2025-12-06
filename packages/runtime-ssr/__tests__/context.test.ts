import { describe, expect, it } from 'vitest'
import { isHydrating, isSSR, useSSRContext } from '../src/index.js'

describe('SSR Context', () => {
  it('isSSR should return false when not in SSR context', () => {
    expect(isSSR()).toBe(false)
  })

  it('isHydrating should return false when not hydrating', () => {
    expect(isHydrating()).toBe(false)
  })

  it('useSSRContext should return undefined when not in render context', () => {
    expect(useSSRContext()).toBe(undefined)
  })
})
