import { describe, it, expect } from 'vitest'
import { compile, devOptions } from './utils'

describe('v-model 指令', () => {
  it('v-model 绑定 Identifier (ref)', async () => {
    const code = `const App = () => <Input v-model={value} />`
    const result = await compile(code)
    expect(result).toMatchInlineSnapshot(`
      "import { createView, unref } from "vitarx";
      const App = () => /* @__PURE__ */createView(Input, {
        get modelValue() {
          return unref(value);
        },
        "onUpdate:modelValue": v => {
          value.value = v;
        }
      });"
    `)
  })

  it('v-model 绑定 MemberExpression', async () => {
    const code = `const App = () => <Input v-model={data.value} />`
    const result = await compile(code)
    expect(result).toMatchInlineSnapshot(`
      "import { createView } from "vitarx";
      const App = () => /* @__PURE__ */createView(Input, {
        get modelValue() {
          return data.value;
        },
        "onUpdate:modelValue": v => data.value = v
      });"
    `)
  })

  it('v-model 绑定数组索引', async () => {
    const code = `const App = () => <Input v-model={arr[0]} />`
    const result = await compile(code)
    expect(result).toMatchInlineSnapshot(`
      "import { createView } from "vitarx";
      const App = () => /* @__PURE__ */createView(Input, {
        get modelValue() {
          return arr[0];
        },
        "onUpdate:modelValue": v => arr[0] = v
      });"
    `)
  })

  it('v-model 绑定嵌套 MemberExpression', async () => {
    const code = `const App = () => <Input v-model={props.data.value} />`
    const result = await compile(code)
    expect(result).toMatchInlineSnapshot(`
      "import { createView } from "vitarx";
      const App = () => /* @__PURE__ */createView(Input, {
        get modelValue() {
          return props.data.value;
        },
        "onUpdate:modelValue": v => props.data.value = v
      });"
    `)
  })

  it('v-model dev 模式添加 isRef 检查', async () => {
    const code = `const App = () => <Input v-model={value} />`
    const result = await compile(code, devOptions)
    expect(result).toMatchInlineSnapshot(`
      "import { createView, unref, isRef } from "vitarx";
      const App = () => /* @__PURE__ */createView(Input, {
        get modelValue() {
          return unref(value);
        },
        "onUpdate:modelValue": v => {
          if (!isRef(value)) {
            throw new Error("[v-model] Identifier must be a ref. Invalid usage at /test.tsx:1:26");
          }
          value.value = v;
        }
      }, {
        fileName: "/test.tsx",
        lineNumber: 1,
        columnNumber: 19
      });"
    `)
  })

  it('v-model 与其他属性共存', async () => {
    const code = `const App = () => <Input v-model={value} placeholder="test" />`
    const result = await compile(code)
    expect(result).toMatchInlineSnapshot(`
      "import { createView, unref } from "vitarx";
      const App = () => /* @__PURE__ */createView(Input, {
        placeholder: "test",
        get modelValue() {
          return unref(value);
        },
        "onUpdate:modelValue": v => {
          value.value = v;
        }
      });"
    `)
  })
})

describe('v-model 错误处理', () => {
  it('v-model 与 modelValue 同时使用报错', async () => {
    const code = `const App = () => <Input v-model={value} modelValue={value} />`
    await expect(compile(code)).rejects.toThrow('[E009]')
  })

  it('v-model 与 onUpdate:modelValue 同时使用报错', async () => {
    const code = `const App = () => <Input v-model={value} onUpdate:modelValue={fn} />`
    await expect(compile(code)).rejects.toThrow('[E009]')
  })

  it('v-model 绑定非 Identifier/MemberExpression 报错', async () => {
    const code = `const App = () => <Input v-model={fn()} />`
    await expect(compile(code)).rejects.toThrow('[E010]')
  })
})
