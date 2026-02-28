import { describe, expect, it } from 'vitest'
import { compile, devOptions } from '../utils'

describe('Dev 位置信息', () => {
  it('dev 模式注入位置信息', async () => {
    const code = `const App = () => <div></div>`
    const result = await compile(code, devOptions)
    expect(result).toMatchInlineSnapshot(`
      "import { createView } from "vitarx";
      const App = () => /* @__PURE__ */createView("div", null, {
        fileName: "/test.tsx",
        lineNumber: 1,
        columnNumber: 19
      });"
    `)
  })

  it('dev 模式嵌套元素位置信息', async () => {
    const code = `const App = () => <div><span></span></div>`
    const result = await compile(code, devOptions)
    expect(result).toMatchInlineSnapshot(`
      "import { createView } from "vitarx";
      const App = () => /* @__PURE__ */createView("div", {
        children: /* @__PURE__ */createView("span", null, {
          fileName: "/test.tsx",
          lineNumber: 1,
          columnNumber: 24
        })
      }, {
        fileName: "/test.tsx",
        lineNumber: 1,
        columnNumber: 19
      });"
    `)
  })

  it('dev 模式多行代码位置信息', async () => {
    const code = `export default function App() {
  const items = ref([1, 2, 3])
  return (
    <div>
      <ul>
        <li>item</li>
      </ul>
    </div>
  )
}`
    const result = await compile(code, devOptions)
    // div 应该在第 4 行
    expect(result).toContain('lineNumber: 4')
    // ul 应该在第 5 行
    expect(result).toContain('lineNumber: 5')
    // li 应该在第 6 行
    expect(result).toContain('lineNumber: 6')
  })

  it('dev 模式带 import 的多行代码位置信息', async () => {
    const code = `import { For, ref, View } from 'vitarx'

export default function DynamicList(): View {
  const items = ref([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
  return (
    <div>
      <ul>
        <For each={items}>{(item) => <li>{item}</li>}</For>
      </ul>
    </div>
  )
}`
    const result = await compile(code, devOptions)
    // div 应该在第 6 行（import 占 1 行，空行 1 行，函数声明 1 行，items 1 行，return 1 行）
    expect(result).toContain('lineNumber: 6')
    // ul 应该在第 7 行
    expect(result).toContain('lineNumber: 7')
    // For 应该在第 8 行
    expect(result).toContain('lineNumber: 8')
  })
})
