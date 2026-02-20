import { describe, it, expect } from 'vitest'
import { compile } from './utils'

describe('Props getter 行为', () => {
  it('静态字符串属性', async () => {
    const code = `const App = () => <div className="test"></div>`
    const result = await compile(code)
    expect(result).toMatchInlineSnapshot(`
      "import { createView } from "vitarx";
      const App = () => /* @__PURE__ */createView("div", {
        className: "test"
      });"
    `)
  })

  it('静态数字属性', async () => {
    const code = `const App = () => <div count={42}></div>`
    const result = await compile(code)
    expect(result).toMatchInlineSnapshot(`
      "import { createView } from "vitarx";
      const App = () => /* @__PURE__ */createView("div", {
        count: 42
      });"
    `)
  })

  it('静态布尔属性', async () => {
    const code = `const App = () => <div disabled={true}></div>`
    const result = await compile(code)
    expect(result).toMatchInlineSnapshot(`
      "import { createView } from "vitarx";
      const App = () => /* @__PURE__ */createView("div", {
        disabled: true
      });"
    `)
  })

  it('Identifier 属性生成 getter', async () => {
    const code = `const App = () => <div className={className}></div>`
    const result = await compile(code)
    expect(result).toMatchInlineSnapshot(`
      "import { createView, unref } from "vitarx";
      const App = () => /* @__PURE__ */createView("div", {
        get className() {
          return unref(className);
        }
      });"
    `)
  })

  it('MemberExpression 属性生成 getter', async () => {
    const code = `const App = () => <div className={props.className}></div>`
    const result = await compile(code)
    expect(result).toMatchInlineSnapshot(`
      "import { createView } from "vitarx";
      const App = () => /* @__PURE__ */createView("div", {
        get className() {
          return props.className;
        }
      });"
    `)
  })

  it('复杂表达式属性生成 getter', async () => {
    const code = `const App = () => <div className={a + b}></div>`
    const result = await compile(code)
    expect(result).toMatchInlineSnapshot(`
      "import { createView } from "vitarx";
      const App = () => /* @__PURE__ */createView("div", {
        get className() {
          return a + b;
        }
      });"
    `)
  })

  it('v-bind 属性', async () => {
    const code = `const App = () => <div v-bind={props}></div>`
    const result = await compile(code)
    expect(result).toMatchInlineSnapshot(`
      "import { createView } from "vitarx";
      const App = () => /* @__PURE__ */createView("div", {
        "v-bind": props
      });"
    `)
  })

  it('spread 属性转换为 v-bind', async () => {
    const code = `const App = () => <div {...props}></div>`
    const result = await compile(code)
    expect(result).toMatchInlineSnapshot(`
      "import { createView } from "vitarx";
      const App = () => /* @__PURE__ */createView("div", {
        "v-bind": props
      });"
    `)
  })
})
