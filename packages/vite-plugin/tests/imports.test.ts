import { describe, it, expect } from 'vitest'
import { compile } from './utils'

describe('Import 自动注入', () => {
  it('不使用任何 API 时不注入 import', async () => {
    const code = `const x = 1`
    const result = await compile(code)
    expect(result).not.toContain('import')
  })

  it('仅注入使用到的 API', async () => {
    const code = `const App = () => <div></div>`
    const result = await compile(code)
    expect(result).toContain('import { createView } from "vitarx"')
    expect(result).not.toContain('Fragment')
    expect(result).not.toContain('branch')
  })

  it('不重复注入已存在的 import', async () => {
    const code = `import { createView } from 'vitarx'; const App = () => <div></div>`
    const result = await compile(code)
    expect(result.match(/import.*createView/g)?.length).toBe(1)
  })

  it('使用别名导入时不重复注入', async () => {
    const code = `import { createView as c } from 'vitarx'; const App = () => <div></div>`
    const result = await compile(code)
    expect(result).toMatchInlineSnapshot(`
      "import { createView as c } from 'vitarx';
      const App = () => /* @__PURE__ */c("div");"
    `)
  })

  it('使用多个别名导入时正确使用别名', async () => {
    const code = `import { createView as c, unref as u, branch as b } from 'vitarx'; const App = () => <div v-if={show}>visible</div>`
    const result = await compile(code)
    expect(result).toMatchInlineSnapshot(`
      "import { createView as c, unref as u, branch as b } from 'vitarx';
      const App = () => /* @__PURE__ */b(() => u(show) ? 0 : null, [() => /* @__PURE__ */c("div", {
        children: "visible"
      })]);"
    `)
  })

  it('API名称已被声明为常量时使用别名避免冲突', async () => {
    const code = `const createView = () => {}; const App = () => <div></div>`
    const result = await compile(code)
    expect(result).toMatchInlineSnapshot(`
      "import { createView as createView$1 } from "vitarx";
      const createView = () => {};
      const App = () => /* @__PURE__ */createView$1("div");"
    `)
  })

  it('多个API名称已被声明时使用别名', async () => {
    const code = `const createView = () => {}; const unref = () => {}; const App = () => <div className={className}></div>`
    const result = await compile(code)
    expect(result).toMatchInlineSnapshot(`
      "import { createView as createView$1, unref as unref$1 } from "vitarx";
      const createView = () => {};
      const unref = () => {};
      const App = () => /* @__PURE__ */createView$1("div", {
        get className() {
          return unref$1(className);
        }
      });"
    `)
  })
})
