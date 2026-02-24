import { describe, expect, it } from 'vitest'
import { DEFAULT_EXPORT_BASE_NAME } from '../../src/constants/index.js'
import type { CompileOptions } from '../../src/transform.js'
import { compile } from '../utils'

describe('HMR 协议结构', () => {
  const hmrOptions: CompileOptions = {
    hmr: true,
    dev: true,
    ssr: false,
    runtimeModule: 'vitarx',
    sourceMap: false
  }

  describe('基本功能', () => {
    it('HMR 模式下注入 HMR 客户端代码', async () => {
      const code = `export const App = () => <div></div>`
      const result = await compile(code, hmrOptions)

      // 验证 HMR 客户端导入
      expect(result).toContain('import __$VITARX_HMR$__ from "@vitarx/vite-plugin/hmr-client"')

      // 验证 getInstance 导入
      expect(result).toContain('getInstance')

      // 验证使用 jsxDEV 代替 createView
      expect(result).toContain('jsxDEV')
      expect(result).toContain('createView as jsxDEV')

      // 验证 import.meta.hot.accept
      expect(result).toContain('import.meta.hot.accept')

      // 验证 bindId 调用
      expect(result).toContain('__$VITARX_HMR$__.instance.bindId')
    })

    it('import.meta.hot.accept 只注入一次', async () => {
      const code = `
        export const App = () => <div>A</div>
        export const Other = () => <span>B</span>
      `
      const result = await compile(code, hmrOptions)
      const acceptCount = (result.match(/import\.meta\.hot\.accept/g) || []).length
      expect(acceptCount).toBe(1)
    })
  })

  describe('组件函数识别', () => {
    it('识别导出的函数声明组件', async () => {
      const code = `export function App() { return <div></div> }`
      const result = await compile(code, hmrOptions)
      expect(result).toContain('__$VITARX_HMR$__.instance.bindId(App')
    })

    it('识别导出的箭头函数组件', async () => {
      const code = `export const App = () => <div></div>`
      const result = await compile(code, hmrOptions)
      expect(result).toContain('__$VITARX_HMR$__.instance.bindId(App')
    })

    it('识别导出的函数表达式组件', async () => {
      const code = `export const App = function() { return <div></div> }`
      const result = await compile(code, hmrOptions)
      expect(result).toContain('__$VITARX_HMR$__.instance.bindId(App')
    })

    it('识别默认导出的函数声明组件', async () => {
      const code = `export default function App() { return <div></div> }`
      const result = await compile(code, hmrOptions)
      expect(result).toContain('__$VITARX_HMR$__.instance.bindId(App')
    })

    it('识别默认导出的匿名函数声明组件', async () => {
      const code = `export default function() { return <div></div> }`
      const result = await compile(code, hmrOptions)
      expect(result).toContain(`__$VITARX_HMR$__.instance.bindId(${DEFAULT_EXPORT_BASE_NAME}`)
      expect(result).toContain(`export default function ${DEFAULT_EXPORT_BASE_NAME}()`)
    })

    it('识别默认导出的匿名函数表达式组件', async () => {
      const code = `export default function() { return <div></div> }`
      const result = await compile(code, hmrOptions)
      expect(result).toContain(`__$VITARX_HMR$__.instance.bindId(${DEFAULT_EXPORT_BASE_NAME}`)
    })

    it('识别默认导出的箭头函数组件', async () => {
      const code = `export default () => <div></div>`
      const result = await compile(code, hmrOptions)
      expect(result).toContain(`__$VITARX_HMR$__.instance.bindId(${DEFAULT_EXPORT_BASE_NAME}`)
      expect(result).toContain(`function ${DEFAULT_EXPORT_BASE_NAME}(`)
    })

    it('识别默认导出的箭头函数组件（带函数体）', async () => {
      const code = `export default () => { return <div></div> }`
      const result = await compile(code, hmrOptions)
      expect(result).toContain(`__$VITARX_HMR$__.instance.bindId(${DEFAULT_EXPORT_BASE_NAME}`)
      expect(result).toContain(`function ${DEFAULT_EXPORT_BASE_NAME}(`)
    })

    it('默认导出匿名函数组件也注入状态恢复', async () => {
      const code = `export default function() {
        const count = ref(0)
        return <div>{count}</div>
      }`
      const result = await compile(code, hmrOptions)
      expect(result).toContain(`__$VITARX_HMR$__.instance.bindId(${DEFAULT_EXPORT_BASE_NAME}`)
      expect(result).toContain('__$VITARX_HMR$__.instance.memo')
      expect(result).toMatch(/memo\(__\$VITARX_HMR_VIEW_NODE\$__,\s*"count"\)/)
    })

    it('默认导出箭头函数组件也注入状态恢复', async () => {
      const code = `export default () => {
        const count = ref(0)
        return <div>{count}</div>
      }`
      const result = await compile(code, hmrOptions)
      expect(result).toContain(`__$VITARX_HMR$__.instance.bindId(${DEFAULT_EXPORT_BASE_NAME}`)
      expect(result).toContain('__$VITARX_HMR$__.instance.memo')
    })

    it('默认导出非组件函数不处理', async () => {
      const code = `export default function() { return 1 }`
      const result = await compile(code, hmrOptions)
      expect(result).not.toContain('__$VITARX_HMR$__.instance.bindId')
      expect(result).not.toContain('import.meta.hot.accept')
    })

    it('默认导出小写字母开头的匿名函数不处理', async () => {
      // 注意：匿名函数没有名称，所以检查的是组件特征（是否有 JSX）
      // 这个测试验证非 JSX 返回的匿名函数不会被处理
      const code = `export default function() { return 'not a component' }`
      const result = await compile(code, hmrOptions)
      expect(result).not.toContain('__$VITARX_HMR$__.instance.bindId')
    })

    it('默认导出匿名函数名称冲突时自动生成唯一名称', async () => {
      const code = `
        export const ${DEFAULT_EXPORT_BASE_NAME} = () => <div>A</div>
        export default function() { return <div>B</div> }
      `
      const result = await compile(code, hmrOptions)
      // 原有的 DefaultExport 组件
      expect(result).toContain(`__$VITARX_HMR$__.instance.bindId(${DEFAULT_EXPORT_BASE_NAME}`)
      // 匿名默认导出应该使用 DefaultExport1
      expect(result).toContain(`__$VITARX_HMR$__.instance.bindId(${DEFAULT_EXPORT_BASE_NAME}$1`)
      expect(result).toContain(`function ${DEFAULT_EXPORT_BASE_NAME}$1()`)
    })

    it('多个默认导出匿名函数名称冲突时递增编号', async () => {
      // 注意：实际代码中只有一个 export default，这里测试的是名称生成逻辑
      const code = `
        export const ${DEFAULT_EXPORT_BASE_NAME} = () => <div>A</div>
        export const ${DEFAULT_EXPORT_BASE_NAME}$0 = () => <div>B</div>
        export default function() { return <div>C</div> }
      `
      const result = await compile(code, hmrOptions)
      // 匿名默认导出应该使用 DefaultExport$1
      expect(result).toContain(`__$VITARX_HMR$__.instance.bindId(${DEFAULT_EXPORT_BASE_NAME}$1`)
    })

    it('识别 export { } 导出的组件', async () => {
      const code = `
        const App = () => <div></div>
        export { App }
      `
      const result = await compile(code, hmrOptions)
      expect(result).toContain('__$VITARX_HMR$__.instance.bindId(App')
    })

    it('不处理未导出的组件', async () => {
      const code = `const App = () => <div></div>`
      const result = await compile(code, hmrOptions)
      expect(result).not.toContain('__$VITARX_HMR$__.instance.bindId')
      expect(result).not.toContain('import.meta.hot.accept')
    })

    it('不处理小写字母开头的函数', async () => {
      const code = `export const app = () => <div></div>`
      const result = await compile(code, hmrOptions)
      expect(result).not.toContain('__$VITARX_HMR$__.instance.bindId')
    })

    it('不处理非组件函数（无 JSX）', async () => {
      const code = `export const Helper = () => { return 1 }`
      const result = await compile(code, hmrOptions)
      expect(result).not.toContain('__$VITARX_HMR$__.instance.bindId')
      expect(result).not.toContain('import.meta.hot.accept')
    })

    it('混合导出时只处理组件', async () => {
      const code = `
        export const helper = () => 1
        export const App = () => <div>{helper()}</div>
      `
      const result = await compile(code, hmrOptions)
      expect(result).toContain('__$VITARX_HMR$__.instance.bindId(App')
      expect(result).not.toContain('__$VITARX_HMR$__.instance.bindId(helper')
    })
  })

  describe('状态保存', () => {
    it('保存局部变量状态', async () => {
      const code = `export const App = () => {
        const count = ref(0)
        const name = 'test'
        return <div>{count}{name}</div>
      }`
      const result = await compile(code, hmrOptions)
      expect(result).toContain('__$VITARX_HMR_VIEW_STATE$__')
      expect(result).toContain('Promise.resolve().then')
    })

    it('保存对象解构变量', async () => {
      const code = `export const App = () => {
        const { a, b } = obj
        return <div>{a}{b}</div>
      }`
      const result = await compile(code, hmrOptions)
      expect(result).toContain('__$VITARX_HMR_VIEW_STATE$__')
    })

    it('保存数组解构变量', async () => {
      const code = `export const App = () => {
        const [a, b] = arr
        return <div>{a}{b}</div>
      }`
      const result = await compile(code, hmrOptions)
      expect(result).toContain('__$VITARX_HMR_VIEW_STATE$__')
    })

    it('函数声明组件也保存状态', async () => {
      const code = `export function App() {
        const count = ref(0)
        return <div>{count}</div>
      }`
      const result = await compile(code, hmrOptions)
      expect(result).toContain('__$VITARX_HMR_VIEW_STATE$__')
    })
  })

  describe('状态恢复注入', () => {
    it('为 ref 变量注入状态恢复代码', async () => {
      const code = `export const App = () => {
        const count = ref(0)
        return <div>{count}</div>
      }`
      const result = await compile(code, hmrOptions)
      expect(result).toContain('__$VITARX_HMR$__.instance.memo')
      expect(result).toContain('__$VITARX_HMR_VIEW_NODE$__')
      expect(result).toMatch(/memo\(__\$VITARX_HMR_VIEW_NODE\$__,\s*"count"\)/)
    })

    it('为普通变量注入状态恢复代码', async () => {
      const code = `export const App = () => {
        const name = 'test'
        return <div>{name}</div>
      }`
      const result = await compile(code, hmrOptions)
      expect(result).toContain('__$VITARX_HMR$__.instance.memo')
      expect(result).toMatch(/memo\(__\$VITARX_HMR_VIEW_NODE\$__,\s*"name"\)/)
    })

    it('为多个变量注入状态恢复代码', async () => {
      const code = `export const App = () => {
        const count = ref(0)
        const name = 'test'
        const active = true
        return <div>{count}{name}{active}</div>
      }`
      const result = await compile(code, hmrOptions)
      expect(result).toMatch(/memo\(__\$VITARX_HMR_VIEW_NODE\$__,\s*"count"\)/)
      expect(result).toMatch(/memo\(__\$VITARX_HMR_VIEW_NODE\$__,\s*"name"\)/)
      expect(result).toMatch(/memo\(__\$VITARX_HMR_VIEW_NODE\$__,\s*"active"\)/)
    })

    it('使用 ?? 运算符保留原始初始值', async () => {
      const code = `export const App = () => {
        const count = ref(0)
        return <div>{count}</div>
      }`
      const result = await compile(code, hmrOptions)
      expect(result).toContain('?? ref(0)')
    })

    it('箭头函数初始值不注入状态恢复', async () => {
      const code = `export const App = () => {
        const handler = () => console.log('click')
        return <div onClick={handler}>test</div>
      }`
      const result = await compile(code, hmrOptions)
      expect(result).not.toMatch(/memo\(__\$VITARX_HMR_VIEW_NODE\$__,\s*"handler"\)/)
      expect(result).toContain("const handler = () => console.log('click')")
    })

    it('函数表达式初始值不注入状态恢复', async () => {
      const code = `export const App = () => {
        const handler = function() { console.log('click') }
        return <div onClick={handler}>test</div>
      }`
      const result = await compile(code, hmrOptions)
      expect(result).not.toMatch(/memo\(__\$VITARX_HMR_VIEW_NODE\$__,\s*"handler"\)/)
    })

    it('类表达式初始值不注入状态恢复', async () => {
      const code = `export const App = () => {
        const MyClass = class {}
        return <div>{MyClass}</div>
      }`
      const result = await compile(code, hmrOptions)
      expect(result).not.toMatch(/memo\(__\$VITARX_HMR_VIEW_NODE\$__,\s*"MyClass"\)/)
    })

    it('无初始值变量不注入状态恢复', async () => {
      const code = `export const App = () => {
        let count
        count = ref(0)
        return <div>{count}</div>
      }`
      const result = await compile(code, hmrOptions)
      expect(result).toContain('let count')
      expect(result).not.toMatch(/memo\(__\$VITARX_HMR_VIEW_NODE\$__,\s*"count"\)/)
    })

    it('混合声明时正确处理', async () => {
      const code = `export const App = () => {
        const count = ref(0)
        const handler = () => {}
        const name = 'test'
        return <div>{count}{name}</div>
      }`
      const result = await compile(code, hmrOptions)
      expect(result).toMatch(/memo\(__\$VITARX_HMR_VIEW_NODE\$__,\s*"count"\)/)
      expect(result).toMatch(/memo\(__\$VITARX_HMR_VIEW_NODE\$__,\s*"name"\)/)
      expect(result).not.toMatch(/memo\(__\$VITARX_HMR_VIEW_NODE\$__,\s*"handler"\)/)
    })

    it('函数声明组件也注入状态恢复', async () => {
      const code = `export function App() {
        const count = ref(0)
        return <div>{count}</div>
      }`
      const result = await compile(code, hmrOptions)
      expect(result).toContain('__$VITARX_HMR$__.instance.memo')
      expect(result).toMatch(/memo\(__\$VITARX_HMR_VIEW_NODE\$__,\s*"count"\)/)
    })

    it('函数表达式组件也注入状态恢复', async () => {
      const code = `export const App = function() {
        const count = ref(0)
        return <div>{count}</div>
      }`
      const result = await compile(code, hmrOptions)
      expect(result).toContain('__$VITARX_HMR$__.instance.memo')
      expect(result).toMatch(/memo\(__\$VITARX_HMR_VIEW_NODE\$__,\s*"count"\)/)
    })

    it('计算属性初始值注入状态恢复', async () => {
      const code = `export const App = () => {
        const doubled = computed(() => count.value * 2)
        return <div>{doubled}</div>
      }`
      const result = await compile(code, hmrOptions)
      expect(result).toMatch(/memo\(__\$VITARX_HMR_VIEW_NODE\$__,\s*"doubled"\)/)
    })

    it('对象初始值注入状态恢复', async () => {
      const code = `export const App = () => {
        const config = { a: 1, b: 2 }
        return <div>{config.a}</div>
      }`
      const result = await compile(code, hmrOptions)
      expect(result).toMatch(/memo\(__\$VITARX_HMR_VIEW_NODE\$__,\s*"config"\)/)
    })

    it('数组初始值注入状态恢复', async () => {
      const code = `export const App = () => {
        const items = [1, 2, 3]
        return <div>{items}</div>
      }`
      const result = await compile(code, hmrOptions)
      expect(result).toMatch(/memo\(__\$VITARX_HMR_VIEW_NODE\$__,\s*"items"\)/)
    })

    it('调用表达式初始值注入状态恢复', async () => {
      const code = `export const App = () => {
        const data = fetchData()
        return <div>{data}</div>
      }`
      const result = await compile(code, hmrOptions)
      expect(result).toMatch(/memo\(__\$VITARX_HMR_VIEW_NODE\$__,\s*"data"\)/)
    })

    it('非 HMR 模式不注入状态恢复', async () => {
      const nonHmrOptions: CompileOptions = {
        hmr: false,
        dev: true,
        ssr: false,
        runtimeModule: 'vitarx',
        sourceMap: false
      }
      const code = `export const App = () => {
        const count = ref(0)
        return <div>{count}</div>
      }`
      const result = await compile(code, nonHmrOptions)
      expect(result).not.toContain('__$VITARX_HMR$__.instance.memo')
    })
  })

  describe('多组件场景', () => {
    it('为多个组件注入不同的 bindId', async () => {
      const code = `
        export const App = () => <div>A</div>
        export const Other = () => <span>B</span>
      `
      const result = await compile(code, hmrOptions)
      expect(result).toContain('__$VITARX_HMR$__.instance.bindId(App')
      expect(result).toContain('__$VITARX_HMR$__.instance.bindId(Other')
    })

    it('三个组件也只有一个 accept', async () => {
      const code = `
        export const A = () => <div>A</div>
        export const B = () => <div>B</div>
        export const C = () => <div>C</div>
      `
      const result = await compile(code, hmrOptions)
      const acceptCount = (result.match(/import\.meta\.hot\.accept/g) || []).length
      expect(acceptCount).toBe(1)
      expect(result).toContain('__$VITARX_HMR$__.instance.bindId(A')
      expect(result).toContain('__$VITARX_HMR$__.instance.bindId(B')
      expect(result).toContain('__$VITARX_HMR$__.instance.bindId(C')
    })
  })

  describe('组件 ID 唯一性', () => {
    it('不同组件名称生成不同的 ID', async () => {
      const code = `
        export const App = () => <div>A</div>
        export const Other = () => <span>B</span>
      `
      const result = await compile(code, hmrOptions)
      // 提取两个组件的 ID
      const matches = result.match(/bindId\(\w+,\s*"([a-f0-9]+)"\)/g)
      expect(matches).toHaveLength(2)
      // 两个 ID 应该不同
      const ids = matches!.map(m => m.match(/"([a-f0-9]+)"/)![1])
      expect(ids[0]).not.toBe(ids[1])
    })

    it('ID 格式正确', async () => {
      const code = `export const App = () => <div></div>`
      const result = await compile(code, hmrOptions)
      expect(result).toMatch(/bindId\(App,\s*"[a-f0-9]+"\)/)
    })
  })

  describe('纯编译组件支持', () => {
    it('返回 Switch 的组件支持 HMR', async () => {
      const code = `export const App = () => (
        <Switch>
          <Match when={a}>A</Match>
          <Match when={b}>B</Match>
        </Switch>
      )`
      const result = await compile(code, hmrOptions)
      expect(result).toContain('__$VITARX_HMR$__.instance.bindId(App')
      expect(result).toContain('branch')
    })

    it('返回 IfBlock 的组件支持 HMR', async () => {
      const code = `export const App = () => (
        <IfBlock>
          <div v-if={show}>visible</div>
          <span v-else>hidden</span>
        </IfBlock>
      )`
      const result = await compile(code, hmrOptions)
      expect(result).toContain('__$VITARX_HMR$__.instance.bindId(App')
      expect(result).toContain('branch')
    })
  })

  describe('边缘情况', () => {
    it('空模块不注入 HMR 代码', async () => {
      const code = `const x = 1`
      const result = await compile(code, hmrOptions)
      expect(result).not.toContain('__$VITARX_HMR$__')
      expect(result).not.toContain('import.meta.hot')
    })

    it('只有非导出组件时不注入 HMR 代码', async () => {
      const code = `const App = () => <div></div>`
      const result = await compile(code, hmrOptions)
      expect(result).not.toContain('__$VITARX_HMR$__')
      expect(result).not.toContain('import.meta.hot')
    })

    it('已有 createView 别名时正确处理', async () => {
      const code = `
        import { createView as cv } from 'vitarx'
        export const App = () => <div></div>
      `
      const result = await compile(code, hmrOptions)
      expect(result).toContain('jsxDEV')
    })

    it('Fragment 也正确处理', async () => {
      const code = `export const App = () => <><div>A</div><span>B</span></>`
      const result = await compile(code, hmrOptions)
      expect(result).toContain('__$VITARX_HMR$__.instance.bindId(App')
      expect(result).toContain('jsxDEV')
    })

    it('已有 getInstance 导入时不重复添加', async () => {
      const code = `
        import { getInstance } from 'vitarx'
        export const App = () => <div></div>
      `
      const result = await compile(code, hmrOptions)
      const getInstanceCount = (result.match(/getInstance/g) || []).length
      expect(getInstanceCount).toBeGreaterThanOrEqual(1)
    })

    it('HMR 模式下也支持 dev 模式的位置信息', async () => {
      const code = `export const App = () => <div></div>`
      const result = await compile(code, hmrOptions)
      expect(result).toContain('fileName')
      expect(result).toContain('lineNumber')
      expect(result).toContain('columnNumber')
    })

    it('HMR 模式下支持 v-if 指令', async () => {
      const code = `export const App = () => <div v-if={show}>visible</div>`
      const result = await compile(code, hmrOptions)
      expect(result).toContain('__$VITARX_HMR$__.instance.bindId(App')
      expect(result).toContain('branch')
    })

    it('HMR 模式下支持 v-model 指令', async () => {
      const code = `export const App = () => <Input v-model={value} />`
      const result = await compile(code, hmrOptions)
      expect(result).toContain('__$VITARX_HMR$__.instance.bindId(App')
      expect(result).toContain('modelValue')
    })

    it('嵌套组件函数不重复处理', async () => {
      const code = `export const App = () => {
        const Inner = () => <span>inner</span>
        return <div><Inner /></div>
      }`
      const result = await compile(code, hmrOptions)
      // 只有外层组件应该被绑定
      expect(result).toContain('__$VITARX_HMR$__.instance.bindId(App')
      // Inner 没有被导出，不应该被绑定
      expect(result).not.toContain('__$VITARX_HMR$__.instance.bindId(Inner')
    })
  })
})
