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
      const App = () => /* @__PURE__ */branch(() => unref(a) ? 0 : (unref(b) ? 1 : null), [() => "A", () => "B"]);"
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
    // 布尔字面量 true 被优化，条件永远为真
    expect(result).not.toContain('unref')
    // true ? 0 : null 被优化为 0
    expect(result).toContain('branch(() => 0')
  })

  describe('错误处理', () => {
    it('Match 不允许单独使用', async () => {
      const code = `const App = () => {
        return <><Match when={b}>B</Match></>
      }`
      await expect(compile(code)).rejects.toThrow('[E012]')
    })

    it('Match 在非 Switch 父元素中使用时报错', async () => {
      const code = `const App = () => {
        return <div><Match when={b}>B</Match></div>
      }`
      await expect(compile(code)).rejects.toThrow('[E012]')
    })

    it('Match 没有子元素时报错', async () => {
      const code = `const App = () => (
        <Switch>
          <Match when={a}></Match>
        </Switch>
      )`
      await expect(compile(code)).rejects.toThrow('[E013]')
    })

    it('Switch 没有 Match 子元素时报错', async () => {
      const code = `const App = () => (
        <Switch></Switch>
      )`
      await expect(compile(code)).rejects.toThrow('[E015]')
    })

    it('Switch 有非 Match 子元素时报错', async () => {
      const code = `const App = () => (
        <Switch>
          <div>invalid</div>
        </Switch>
      )`
      await expect(compile(code)).rejects.toThrow('[E006]')
    })

    it('Match 缺少 when 属性时报错', async () => {
      const code = `const App = () => (
        <Switch>
          <Match>A</Match>
        </Switch>
      )`
      await expect(compile(code)).rejects.toThrow('[E007]')
    })
  })
})
