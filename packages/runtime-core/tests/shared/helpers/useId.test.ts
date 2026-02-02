import { afterEach } from 'vitest'
import { useId } from '../../../src/index.js'

describe('Runtime Core Shared Helpers - useId', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })
  it('应该在没有应用上下文时生成全局ID', () => {
    const id1 = useId()
    const id2 = useId()

    expect(id1).toMatch(/^v-g-\d+$/)
    expect(id2).toMatch(/^v-g-\d+$/)
    expect(id1).not.toBe(id2)
  })

  it('应该支持自定义前缀', () => {
    const id = useId('custom')
    expect(id).toMatch(/^custom-g-\d+$/)
  })
})
