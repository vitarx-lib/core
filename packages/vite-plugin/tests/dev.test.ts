import { describe, it, expect } from 'vitest'
import { compile, devOptions } from './utils'

describe('Dev 位置信息', () => {
  it('dev 模式注入位置信息', async () => {
    const code = `const App = () => <div></div>`
    const result = await compile(code, devOptions)
    expect(result).toMatchInlineSnapshot(`
      "import { createView } from "vitarx";
      const App = () => /* @__PURE__ */createView("div", null, {
        fileName: "/test.tsx",
        lineNumber: 1,
        columnNumber: 19
      });"
    `)
  })

  it('dev 模式嵌套元素位置信息', async () => {
    const code = `const App = () => <div><span></span></div>`
    const result = await compile(code, devOptions)
    expect(result).toMatchInlineSnapshot(`
      "import { createView } from "vitarx";
      const App = () => /* @__PURE__ */createView("div", {
        children: /* @__PURE__ */createView("span", null, {
          fileName: "/test.tsx",
          lineNumber: 1,
          columnNumber: 24
        })
      }, {
        fileName: "/test.tsx",
        lineNumber: 1,
        columnNumber: 19
      });"
    `)
  })
})
