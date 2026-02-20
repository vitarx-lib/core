import { describe, it, expect } from 'vitest'
import { compile } from './utils'

describe('Fragment', () => {
  it('空 Fragment', async () => {
    const code = `const App = () => <></>`
    const result = await compile(code)
    expect(result).toMatchInlineSnapshot(`
      "import { createView, Fragment } from "vitarx";
      const App = () => /* @__PURE__ */createView(Fragment);"
    `)
  })

  it('Fragment with children', async () => {
    const code = `const App = () => <><div>A</div><span>B</span></>`
    const result = await compile(code)
    expect(result).toMatchInlineSnapshot(`
      "import { createView, Fragment } from "vitarx";
      const App = () => /* @__PURE__ */createView(Fragment, {
        children: [/* @__PURE__ */createView("div", {
          children: "A"
        }), /* @__PURE__ */createView("span", {
          children: "B"
        })]
      });"
    `)
  })
})
