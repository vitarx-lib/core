import { describe, expect, it } from 'vitest'
import { compile } from '../utils'

describe('v-if 连续链', () => {
  it('单独 v-if 生成 branch', async () => {
    const code = `const App = () => <div v-if={show}>visible</div>`
    const result = await compile(code)
    expect(result).toMatchInlineSnapshot(`
      "import { createView, branch, unref } from "vitarx";
      const App = () => /* @__PURE__ */branch(() => unref(show) ? 0 : null, [() => /* @__PURE__ */createView("div", {
        children: "visible"
      })]);"
    `)
  })

  it('v-if + v-else 生成 branch', async () => {
    const code = `const App = () => <>
      <div v-if={show}>visible</div>
      <span v-else>hidden</span>
    </>`
    const result = await compile(code)
    expect(result).toMatchInlineSnapshot(`
      "import { createView, Fragment, branch, unref } from "vitarx";
      const App = () => /* @__PURE__ */createView(Fragment, {
        children: /* @__PURE__ */branch(() => unref(show) ? 0 : 1, [() => /* @__PURE__ */createView("div", {
          children: "visible"
        }), () => /* @__PURE__ */createView("span", {
          children: "hidden"
        })])
      });"
    `)
  })

  it('v-if + v-else-if + v-else 生成 branch', async () => {
    const code = `const App = () => <>
      <div v-if={a}>A</div>
      <span v-else-if={b}>B</span>
      <p v-else>C</p>
    </>`
    const result = await compile(code)
    expect(result).toMatchInlineSnapshot(`
      "import { createView, Fragment, branch, unref } from "vitarx";
      const App = () => /* @__PURE__ */createView(Fragment, {
        children: /* @__PURE__ */branch(() => unref(a) ? 0 : unref(b) ? 1 : 2, [() => /* @__PURE__ */createView("div", {
          children: "A"
        }), () => /* @__PURE__ */createView("span", {
          children: "B"
        }), () => /* @__PURE__ */createView("p", {
          children: "C"
        })])
      });"
    `)
  })

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
