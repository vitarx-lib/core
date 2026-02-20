import { describe, it, expect } from 'vitest'
import { compile } from './utils'

describe('Children 处理', () => {
  it('Identifier 子元素保持原样（不使用 unref）', async () => {
    const code = `const App = () => <div>{value}</div>`
    const result = await compile(code)
    expect(result).toMatchInlineSnapshot(`
      "import { createView } from "vitarx";
      const App = () => /* @__PURE__ */createView("div", {
        children: value
      });"
    `)
  })

  it('MemberExpression 子元素使用 access', async () => {
    const code = `const App = () => <div>{props.value}</div>`
    const result = await compile(code)
    expect(result).toMatchInlineSnapshot(`
      "import { createView, access } from "vitarx";
      const App = () => /* @__PURE__ */createView("div", {
        children: access(props, "value")
      });"
    `)
  })

  it('ConditionalExpression 子元素生成 branch（条件使用 unref）', async () => {
    const code = `const App = () => <div>{cond ? 'yes' : 'no'}</div>`
    const result = await compile(code)
    expect(result).toMatchInlineSnapshot(`
      "import { createView, branch, unref } from "vitarx";
      const App = () => /* @__PURE__ */createView("div", {
        children: /* @__PURE__ */branch(() => unref(cond) ? 0 : 1, [() => 'yes', () => 'no'])
      });"
    `)
  })

  it('ConditionalExpression with Identifier condition', async () => {
    const code = `const App = () => <div>{show ? 'yes' : 'no'}</div>`
    const result = await compile(code)
    expect(result).toMatchInlineSnapshot(`
      "import { createView, branch, unref } from "vitarx";
      const App = () => /* @__PURE__ */createView("div", {
        children: /* @__PURE__ */branch(() => unref(show) ? 0 : 1, [() => 'yes', () => 'no'])
      });"
    `)
  })

  it('LogicalExpression 子元素生成 dynamic', async () => {
    const code = `const App = () => <div>{a && b}</div>`
    const result = await compile(code)
    expect(result).toMatchInlineSnapshot(`
      "import { createView, dynamic } from "vitarx";
      const App = () => /* @__PURE__ */createView("div", {
        children: /* @__PURE__ */dynamic(() => a && b)
      });"
    `)
  })

  it('CallExpression 子元素保持不变', async () => {
    const code = `const App = () => <div>{render()}</div>`
    const result = await compile(code)
    expect(result).toMatchInlineSnapshot(`
      "import { createView } from "vitarx";
      const App = () => /* @__PURE__ */createView("div", {
        children: render()
      });"
    `)
  })
})

describe('多子元素处理', () => {
  it('多个文本子元素', async () => {
    const code = `const App = () => <div>Hello {'World'}!</div>`
    const result = await compile(code)
    expect(result).toMatchInlineSnapshot(`
      "import { createView } from "vitarx";
      const App = () => /* @__PURE__ */createView("div", {
        children: ["Hello", 'World', "!"]
      });"
    `)
  })

  it('多个 Identifier 子元素', async () => {
    const code = `const App = () => <div>{a}{b}{c}</div>`
    const result = await compile(code)
    expect(result).toMatchInlineSnapshot(`
      "import { createView } from "vitarx";
      const App = () => /* @__PURE__ */createView("div", {
        children: [a, b, c]
      });"
    `)
  })

  it('混合类型子元素（文本 + Identifier + 嵌套元素）', async () => {
    const code = `const App = () => <div>Hello {name}!<span>child</span></div>`
    const result = await compile(code)
    expect(result).toMatchInlineSnapshot(`
      "import { createView } from "vitarx";
      const App = () => /* @__PURE__ */createView("div", {
        children: ["Hello", name, "!", /* @__PURE__ */createView("span", {
          children: "child"
        })]
      });"
    `)
  })

  it('多个嵌套元素', async () => {
    const code = `const App = () => <div><span>A</span><span>B</span><span>C</span></div>`
    const result = await compile(code)
    expect(result).toMatchInlineSnapshot(`
      "import { createView } from "vitarx";
      const App = () => /* @__PURE__ */createView("div", {
        children: [/* @__PURE__ */createView("span", {
          children: "A"
        }), /* @__PURE__ */createView("span", {
          children: "B"
        }), /* @__PURE__ */createView("span", {
          children: "C"
        })]
      });"
    `)
  })

  it('混合 MemberExpression 和 Identifier', async () => {
    const code = `const App = () => <div>{props.a}{b}{props.c}</div>`
    const result = await compile(code)
    expect(result).toMatchInlineSnapshot(`
      "import { createView, access } from "vitarx";
      const App = () => /* @__PURE__ */createView("div", {
        children: [access(props, "a"), b, access(props, "c")]
      });"
    `)
  })
})

describe('边界情况', () => {
  it('嵌套 MemberExpression', async () => {
    const code = `const App = () => <div>{props.data.nested.value}</div>`
    const result = await compile(code)
    expect(result).toMatchInlineSnapshot(`
      "import { createView, access } from "vitarx";
      const App = () => /* @__PURE__ */createView("div", {
        children: access(props.data.nested, "value")
      });"
    `)
  })

  it('数组 map 方法调用', async () => {
    const code = `const App = () => <div>{items.map(item => <span>{item}</span>)}</div>`
    const result = await compile(code)
    expect(result).toMatchInlineSnapshot(`
      "import { createView } from "vitarx";
      const App = () => /* @__PURE__ */createView("div", {
        children: items.map(item => /* @__PURE__ */createView("span", {
          children: item
        }))
      });"
    `)
  })

  it('三元表达式嵌套 JSX 元素', async () => {
    const code = `const App = () => <div>{show ? <span>yes</span> : <span>no</span>}</div>`
    const result = await compile(code)
    expect(result).toMatchInlineSnapshot(`
      "import { createView, branch, unref } from "vitarx";
      const App = () => /* @__PURE__ */createView("div", {
        children: /* @__PURE__ */branch(() => unref(show) ? 0 : 1, [() => /* @__PURE__ */createView("span", {
          children: "yes"
        }), () => /* @__PURE__ */createView("span", {
          children: "no"
        })])
      });"
    `)
  })

  it('逻辑或表达式', async () => {
    const code = `const App = () => <div>{a || b}</div>`
    const result = await compile(code)
    expect(result).toMatchInlineSnapshot(`
      "import { createView, dynamic } from "vitarx";
      const App = () => /* @__PURE__ */createView("div", {
        children: /* @__PURE__ */dynamic(() => a || b)
      });"
    `)
  })

  it('复杂混合表达式', async () => {
    const code = `const App = () => <div>{a && b ? <span>x</span> : c || d}</div>`
    const result = await compile(code)
    expect(result).toMatchInlineSnapshot(`
      "import { createView, branch, dynamic } from "vitarx";
      const App = () => /* @__PURE__ */createView("div", {
        children: /* @__PURE__ */branch(() => a && b ? 0 : 1, [() => /* @__PURE__ */createView("span", {
          children: "x"
        }), () => /* @__PURE__ */dynamic(() => c || d)])
      });"
    `)
  })

  it('空表达式容器被忽略', async () => {
    const code = `const App = () => <div>text{/* comment */}</div>`
    const result = await compile(code)
    expect(result).toMatchInlineSnapshot(`
      "import { createView } from "vitarx";
      const App = () => /* @__PURE__ */createView("div", {
        children: "text"
      });"
    `)
  })

  it('纯空白文本被忽略', async () => {
    const code = `const App = () => <div>   </div>`
    const result = await compile(code)
    expect(result).toMatchInlineSnapshot(`
      "import { createView } from "vitarx";
      const App = () => /* @__PURE__ */createView("div");"
    `)
  })

  it('数字字面量子元素', async () => {
    const code = `const App = () => <div>{42}</div>`
    const result = await compile(code)
    expect(result).toMatchInlineSnapshot(`
      "import { createView } from "vitarx";
      const App = () => /* @__PURE__ */createView("div", {
        children: 42
      });"
    `)
  })

  it('布尔字面量子元素', async () => {
    const code = `const App = () => <div>{true}</div>`
    const result = await compile(code)
    expect(result).toMatchInlineSnapshot(`
      "import { createView } from "vitarx";
      const App = () => /* @__PURE__ */createView("div", {
        children: true
      });"
    `)
  })

  it('对象字面量子元素', async () => {
    const code = `const App = () => <div>{{ a: 1 }}</div>`
    const result = await compile(code)
    expect(result).toMatchInlineSnapshot(`
      "import { createView } from "vitarx";
      const App = () => /* @__PURE__ */createView("div", {
        children: {
          a: 1
        }
      });"
    `)
  })

  it('数组字面量子元素', async () => {
    const code = `const App = () => <div>{[1, 2, 3]}</div>`
    const result = await compile(code)
    expect(result).toMatchInlineSnapshot(`
      "import { createView } from "vitarx";
      const App = () => /* @__PURE__ */createView("div", {
        children: [1, 2, 3]
      });"
    `)
  })

  it('模板字面量子元素', async () => {
    const code = 'const App = () => <div>{`hello ${name}`}</div>'
    const result = await compile(code)
    expect(result).toMatchInlineSnapshot(`
      "import { createView } from "vitarx";
      const App = () => /* @__PURE__ */createView("div", {
        children: \`hello \${name}\`
      });"
    `)
  })

  it('函数调用带参数', async () => {
    const code = `const App = () => <div>{render(a, b, c)}</div>`
    const result = await compile(code)
    expect(result).toMatchInlineSnapshot(`
      "import { createView } from "vitarx";
      const App = () => /* @__PURE__ */createView("div", {
        children: render(a, b, c)
      });"
    `)
  })

  it('链式方法调用', async () => {
    const code = `const App = () => <div>{props.items.filter(x => x.active).map(x => x.name)}</div>`
    const result = await compile(code)
    expect(result).toMatchInlineSnapshot(`
      "import { createView } from "vitarx";
      const App = () => /* @__PURE__ */createView("div", {
        children: props.items.filter(x => x.active).map(x => x.name)
      });"
    `)
  })
})
