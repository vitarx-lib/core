import { describe, expect, it } from 'vitest'
import { compile } from '../utils'

describe('IfBlock 组件', () => {
  it('IfBlock 包含 v-if 和 v-else', async () => {
    const code = `const App = () => (
      <IfBlock>
        <div v-if={show}>visible</div>
        <span v-else>hidden</span>
      </IfBlock>
    )`
    const result = await compile(code)
    expect(result).toMatchInlineSnapshot(`
      "import { createView, branch, unref } from "vitarx";
      const App = () => /* @__PURE__ */branch(() => unref(show) ? 0 : 1, [() => /* @__PURE__ */createView("div", {
        children: "visible"
      }), () => /* @__PURE__ */createView("span", {
        children: "hidden"
      })]);"
    `)
  })

  it('IfBlock 包含 v-if、v-else-if 和 v-else', async () => {
    const code = `const App = () => (
      <IfBlock>
        <div v-if={a}>A</div>
        <span v-else-if={b}>B</span>
        <p v-else>C</p>
      </IfBlock>
    )`
    const result = await compile(code)
    expect(result).toMatchInlineSnapshot(`
      "import { createView, branch, unref } from "vitarx";
      const App = () => /* @__PURE__ */branch(() => unref(a) ? 0 : (unref(b) ? 1 : 2), [() => /* @__PURE__ */createView("div", {
        children: "A"
      }), () => /* @__PURE__ */createView("span", {
        children: "B"
      }), () => /* @__PURE__ */createView("p", {
        children: "C"
      })]);"
    `)
  })

  it('IfBlock 仅包含 v-if', async () => {
    const code = `const App = () => (
      <IfBlock>
        <div v-if={show}>visible</div>
      </IfBlock>
    )`
    const result = await compile(code)
    expect(result).toMatchInlineSnapshot(`
      "import { createView, branch, unref } from "vitarx";
      const App = () => /* @__PURE__ */branch(() => unref(show) ? 0 : null, [() => /* @__PURE__ */createView("div", {
        children: "visible"
      })]);"
    `)
  })

  it('IfBlock 包含多个 v-else-if', async () => {
    const code = `const App = () => (
      <IfBlock>
        <div v-if={a}>A</div>
        <span v-else-if={b}>B</span>
        <p v-else-if={c}>C</p>
        <section v-else>D</section>
      </IfBlock>
    )`
    const result = await compile(code)
    expect(result).toMatchInlineSnapshot(`
      "import { createView, branch, unref } from "vitarx";
      const App = () => /* @__PURE__ */branch(() => unref(a) ? 0 : (unref(b) ? 1 : (unref(c) ? 2 : 3)), [() => /* @__PURE__ */createView("div", {
        children: "A"
      }), () => /* @__PURE__ */createView("span", {
        children: "B"
      }), () => /* @__PURE__ */createView("p", {
        children: "C"
      }), () => /* @__PURE__ */createView("section", {
        children: "D"
      })]);"
    `)
  })

  it('IfBlock 包含组件', async () => {
    const code = `const App = () => (
      <IfBlock>
        <MyComponent v-if={show} />
        <OtherComponent v-else />
      </IfBlock>
    )`
    const result = await compile(code)
    expect(result).toMatchInlineSnapshot(`
      "import { createView, branch, unref } from "vitarx";
      const App = () => /* @__PURE__ */branch(() => unref(show) ? 0 : 1, [() => /* @__PURE__ */createView(MyComponent), () => /* @__PURE__ */createView(OtherComponent)]);"
    `)
  })

  it('IfBlock 作为子元素', async () => {
    const code = `const App = () => (
      <div>
        <IfBlock>
          <span v-if={show}>visible</span>
          <span v-else>hidden</span>
        </IfBlock>
      </div>
    )`
    const result = await compile(code)
    expect(result).toMatchInlineSnapshot(`
      "import { createView, branch, unref } from "vitarx";
      const App = () => /* @__PURE__ */createView("div", {
        children: /* @__PURE__ */branch(() => unref(show) ? 0 : 1, [() => /* @__PURE__ */createView("span", {
          children: "visible"
        }), () => /* @__PURE__ */createView("span", {
          children: "hidden"
        })])
      });"
    `)
  })
})

describe('IfBlock 错误处理', () => {
  it('IfBlock 子元素缺少 v-if 指令时报错', async () => {
    const code = `const App = () => (
      <IfBlock>
        <div>no directive</div>
      </IfBlock>
    )`
    await expect(compile(code)).rejects.toThrow('[E008]')
  })

  it('IfBlock 包含文本节点时报错', async () => {
    const code = `const App = () => (
      <IfBlock>
        plain text
        <div v-if={show}>visible</div>
      </IfBlock>
    )`
    await expect(compile(code)).rejects.toThrow('[E008]')
  })

  it('IfBlock 第一个元素不是 v-if 时报错', async () => {
    const code = `const App = () => (
      <IfBlock>
        <div v-else>hidden</div>
      </IfBlock>
    )`
    await expect(compile(code)).rejects.toThrow('[E008]')
  })

  it('IfBlock 中 v-else 后面还有元素时报错', async () => {
    const code = `const App = () => (
      <IfBlock>
        <div v-if={show}>visible</div>
        <span v-else>hidden</span>
        <p v-if={other}>other</p>
      </IfBlock>
    )`
    await expect(compile(code)).rejects.toThrow('[E008]')
  })

  it('IfBlock 中 v-else-if 跟在 v-else 后面时报错', async () => {
    const code = `const App = () => (
      <IfBlock>
        <div v-if={a}>A</div>
        <span v-else>B</span>
        <p v-else-if={c}>C</p>
      </IfBlock>
    )`
    await expect(compile(code)).rejects.toThrow('[E008]')
  })

  describe('错误处理', () => {
    it('IfBlock 没有子元素时报错', async () => {
      const code = `const App = () => (
        <IfBlock></IfBlock>
      )`
      await expect(compile(code)).rejects.toThrow('[E014]')
    })

    it('IfBlock 子元素缺少 v-if 指令时报错', async () => {
      const code = `const App = () => (
        <IfBlock>
          <div>no directive</div>
        </IfBlock>
      )`
      await expect(compile(code)).rejects.toThrow('[E008]')
    })
  })
})
