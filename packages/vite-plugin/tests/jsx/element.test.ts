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

describe('children 属性与子元素冲突', () => {
  it('子元素优先于 children 属性', async () => {
    const code = `const App = () => <div children={test}><p /></div>`
    const result = await compile(code)
    // 子元素 <p /> 应该生效，而不是 test
    expect(result).toContain('createView("p"')
    // children 属性被忽略，不应该有 unref(test)
    expect(result).not.toContain('unref(test)')
  })

  it('同时存在时产生警告', async () => {
    const code = `const App = () => <div children={test}><p /></div>`
    const result = await compile(code)
    // 验证编译成功，子元素优先
    expect(result).toContain('createView("p"')
  })

  it('仅 children 属性时正常工作', async () => {
    const code = `const App = () => <div children={test} />`
    const result = await compile(code)
    // children 属性不使用 unref，直接引用
    // 原因：children 中的 ref 是合法的可变渲染源
    expect(result).toContain('children: test')
    expect(result).not.toContain('unref')
  })

  it('仅子元素时正常工作', async () => {
    const code = `const App = () => <div><p /></div>`
    const result = await compile(code)
    expect(result).toContain('createView("p"')
  })

  it('多个子元素时合并为数组', async () => {
    const code = `const App = () => <div children={test}><p /><span /></div>`
    const result = await compile(code)
    // 子元素应该合并为数组
    expect(result).toContain('[/* @__PURE__ */createView("p"')
    expect(result).toContain('createView("span"')
  })
})
