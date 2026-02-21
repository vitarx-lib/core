import { describe, it, expect } from 'vitest'
import { compile } from '../utils'

describe('基础元素转换', () => {
  it('转换简单的原生元素', async () => {
    const code = `const App = () => <div></div>`
    const result = await compile(code)
    expect(result).toMatchInlineSnapshot(`
      "import { createView } from "vitarx";
      const App = () => /* @__PURE__ */createView("div");"
    `)
  })

  it('转换带文本子元素的元素', async () => {
    const code = `const App = () => <div>Hello World</div>`
    const result = await compile(code)
    expect(result).toMatchInlineSnapshot(`
      "import { createView } from "vitarx";
      const App = () => /* @__PURE__ */createView("div", {
        children: "Hello World"
      });"
    `)
  })

  it('转换组件元素', async () => {
    const code = `const App = () => <MyComponent />`
    const result = await compile(code)
    expect(result).toMatchInlineSnapshot(`
      "import { createView } from "vitarx";
      const App = () => /* @__PURE__ */createView(MyComponent);"
    `)
  })

  it('转换嵌套元素', async () => {
    const code = `const App = () => <div><span>text</span></div>`
    const result = await compile(code)
    expect(result).toMatchInlineSnapshot(`
      "import { createView } from "vitarx";
      const App = () => /* @__PURE__ */createView("div", {
        children: /* @__PURE__ */createView("span", {
          children: "text"
        })
      });"
    `)
  })
})
