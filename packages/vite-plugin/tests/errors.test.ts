import { describe, it, expect } from 'vitest'
import { compile } from './utils'

describe('错误处理', () => {
  it('v-else 无前置 v-if 抛出错误', async () => {
    const code = `const App = () => <div v-else>text</div>`
    await expect(compile(code)).rejects.toThrow('[E003]')
  })

  it('v-else-if 无前置 v-if 抛出错误', async () => {
    const code = `const App = () => <>
      <div v-else-if={b}>text</div>
    </>`
    await expect(compile(code)).rejects.toThrow('[E004]')
  })
})
