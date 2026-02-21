import { describe, it, expect } from 'vitest'
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
      "import { branch } from "vitarx";
      const App = () => /* @__PURE__ */branch(() => a ? 0 : b ? 1 : null, [() => "A", () => "B"]);"
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
      "import { branch } from "vitarx";
      const App = () => /* @__PURE__ */branch(() => a ? 0 : 1, [() => "A", () => "Default"]);"
    `)
  })
})
