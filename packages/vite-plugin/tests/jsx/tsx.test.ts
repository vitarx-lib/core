import { describe, expect, it } from 'vitest'
import { compile } from '../utils'

describe('TSX 支持', () => {
  it('支持 TypeScript 类型注解', async () => {
    const code = `const App: Vitarx.FC = () => <div></div>`
    const result = await compile(code)
    expect(result).toContain('createView("div"')
  })

  it('支持泛型组件', async () => {
    const code = `const App = () => <Component<string> value="test" />`
    const result = await compile(code)
    expect(result).toContain('createView(Component')
  })
})
