import { describe, expect, it } from 'vitest'
import type { CompileOptions } from '../src/index.js'
import { compile } from './utils'

describe('HMR 协议结构', () => {
  it('HMR 模式下不生成 HMR 代码（当前版本暂不实现）', async () => {
    const hmrOptions: CompileOptions = {
      hmr: true,
      dev: true,
      ssr: false,
      runtimeModule: 'vitarx',
      sourceMap: false
    }
    const code = `const App = () => <div></div>`
    const result = await compile(code, hmrOptions)
    expect(result).not.toContain('import.meta.hot')
  })
})
