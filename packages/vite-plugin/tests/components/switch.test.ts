import { describe, expect, it } from 'vitest'
import { compile } from '../utils'

describe('Switch + Match', () => {
  it('Switch with Match components', async () => {
    const code = `const App = () => (
      <Switch>
        <Match when={a}>A</Match>
        <Match when={b}>B</Match>
      </Switch>
    )`
    const result = await compile(code)
    expect(result).toMatchInlineSnapshot(`
      "import { branch, unref } from "vitarx";
      const App = () => /* @__PURE__ */branch(() => unref(a) ? 0 : unref(b) ? 1 : null, [() => "A", () => "B"]);"
    `)
  })

  it('Switch with fallback attribute', async () => {
    const code = `const App = () => (
      <Switch fallback="Default">
        <Match when={a}>A</Match>
      </Switch>
    )`
    const result = await compile(code)
    expect(result).toMatchInlineSnapshot(`
      "import { branch, unref } from "vitarx";
      const App = () => /* @__PURE__ */branch(() => unref(a) ? 0 : 1, [() => "A", () => "Default"]);"
    `)
  })
  it('Match 使用ref ', async () => {
    const code = `const App = () => (
       <Switch fallback="Default">
        <Match when={a}>A</Match>
       </Switch>
      )`
    const result = await compile(code)
    expect(result).toContain('unref(a)')
  })

  it('Match when 使用表达式时不添加 unref', async () => {
    const code = `const App = () => (
      <Switch>
        <Match when={a > 0}>A</Match>
      </Switch>
    )`
    const result = await compile(code)
    expect(result).not.toContain('unref')
    expect(result).toContain('a > 0')
  })

  it('Match when 使用布尔字面量时不添加 unref', async () => {
    const code = `const App = () => (
      <Switch>
        <Match when={true}>A</Match>
      </Switch>
    )`
    const result = await compile(code)
    expect(result).not.toContain('unref')
    expect(result).toContain('true')
  })
})
