import { describe, it, expect } from 'vitest'
import { compile } from './utils'

describe('Props getter 行为', () => {
  it('静态字符串属性', async () => {
    const code = `const App = () => <div className="test"></div>`
    const result = await compile(code)
    expect(result).toMatchInlineSnapshot(`
      "import { createView } from "vitarx";
      const App = () => /* @__PURE__ */createView("div", {
        className: "test"
      });"
    `)
  })

  it('静态数字属性', async () => {
    const code = `const App = () => <div count={42}></div>`
    const result = await compile(code)
    expect(result).toMatchInlineSnapshot(`
      "import { createView } from "vitarx";
      const App = () => /* @__PURE__ */createView("div", {
        count: 42
      });"
    `)
  })

  it('静态布尔属性', async () => {
    const code = `const App = () => <div disabled={true}></div>`
    const result = await compile(code)
    expect(result).toMatchInlineSnapshot(`
      "import { createView } from "vitarx";
      const App = () => /* @__PURE__ */createView("div", {
        disabled: true
      });"
    `)
  })

  it('Identifier 属性生成 getter', async () => {
    const code = `const App = () => <div className={className}></div>`
    const result = await compile(code)
    expect(result).toMatchInlineSnapshot(`
      "import { createView, unref } from "vitarx";
      const App = () => /* @__PURE__ */createView("div", {
        get className() {
          return unref(className);
        }
      });"
    `)
  })

  it('MemberExpression 属性生成 getter', async () => {
    const code = `const App = () => <div className={props.className}></div>`
    const result = await compile(code)
    expect(result).toMatchInlineSnapshot(`
      "import { createView } from "vitarx";
      const App = () => /* @__PURE__ */createView("div", {
        get className() {
          return props.className;
        }
      });"
    `)
  })

  it('复杂表达式属性生成 getter', async () => {
    const code = `const App = () => <div className={a + b}></div>`
    const result = await compile(code)
    expect(result).toMatchInlineSnapshot(`
      "import { createView } from "vitarx";
      const App = () => /* @__PURE__ */createView("div", {
        get className() {
          return a + b;
        }
      });"
    `)
  })

  it('v-bind 属性', async () => {
    const code = `const App = () => <div v-bind={props}></div>`
    const result = await compile(code)
    expect(result).toMatchInlineSnapshot(`
      "import { createView } from "vitarx";
      const App = () => /* @__PURE__ */createView("div", {
        "v-bind": props
      });"
    `)
  })

  it('spread 属性转换为 v-bind', async () => {
    const code = `const App = () => <div {...props}></div>`
    const result = await compile(code)
    expect(result).toMatchInlineSnapshot(`
      "import { createView } from "vitarx";
      const App = () => /* @__PURE__ */createView("div", {
        "v-bind": props
      });"
    `)
  })
})

describe('ref 变量优化', () => {
  it('ref 定义的变量直接使用 .value', async () => {
    const code = `import { ref } from 'vitarx'; const count = ref(0); const App = () => <div count={count}></div>`
    const result = await compile(code)
    expect(result).toMatchInlineSnapshot(`
      "import { ref } from 'vitarx';
      import { createView } from "vitarx";
      const count = ref(0);
      const App = () => /* @__PURE__ */createView("div", {
        get count() {
          return count.value;
        }
      });"
    `)
  })

  it('toRef 定义的变量直接使用 .value', async () => {
    const code = `import { toRef } from 'vitarx'; const count = toRef(props, 'count'); const App = () => <div count={count}></div>`
    const result = await compile(code)
    expect(result).toMatchInlineSnapshot(`
      "import { toRef } from 'vitarx';
      import { createView } from "vitarx";
      const count = toRef(props, 'count');
      const App = () => /* @__PURE__ */createView("div", {
        get count() {
          return count.value;
        }
      });"
    `)
  })

  it('shallowRef 定义的变量直接使用 .value', async () => {
    const code = `import { shallowRef } from 'vitarx'; const count = shallowRef(0); const App = () => <div count={count}></div>`
    const result = await compile(code)
    expect(result).toMatchInlineSnapshot(`
      "import { shallowRef } from 'vitarx';
      import { createView } from "vitarx";
      const count = shallowRef(0);
      const App = () => /* @__PURE__ */createView("div", {
        get count() {
          return count.value;
        }
      });"
    `)
  })

  it('computed 定义的变量直接使用 .value', async () => {
    const code = `import { computed } from 'vitarx'; const double = computed(() => count.value * 2); const App = () => <div double={double}></div>`
    const result = await compile(code)
    expect(result).toMatchInlineSnapshot(`
      "import { computed } from 'vitarx';
      import { createView } from "vitarx";
      const double = computed(() => count.value * 2);
      const App = () => /* @__PURE__ */createView("div", {
        get double() {
          return double.value;
        }
      });"
    `)
  })

  it('ref 使用别名时正确识别', async () => {
    const code = `import { ref as r } from 'vitarx'; const count = r(0); const App = () => <div count={count}></div>`
    const result = await compile(code)
    expect(result).toMatchInlineSnapshot(`
      "import { ref as r } from 'vitarx';
      import { createView } from "vitarx";
      const count = r(0);
      const App = () => /* @__PURE__ */createView("div", {
        get count() {
          return count.value;
        }
      });"
    `)
  })

  it('从 @vitarx/responsive 导入的 ref 正确识别', async () => {
    const code = `import { ref } from '@vitarx/responsive'; const count = ref(0); const App = () => <div count={count}></div>`
    const result = await compile(code)
    expect(result).toMatchInlineSnapshot(`
      "import { ref } from '@vitarx/responsive';
      import { createView } from "vitarx";
      const count = ref(0);
      const App = () => /* @__PURE__ */createView("div", {
        get count() {
          return count.value;
        }
      });"
    `)
  })

  it('非 ref 定义的变量仍使用 unref', async () => {
    const code = `const count = someOtherApi(0); const App = () => <div count={count}></div>`
    const result = await compile(code)
    expect(result).toMatchInlineSnapshot(`
      "import { createView, unref } from "vitarx";
      const count = someOtherApi(0);
      const App = () => /* @__PURE__ */createView("div", {
        get count() {
          return unref(count);
        }
      });"
    `)
  })

  it('toRefs 解构定义的 ref 变量', async () => {
    const code = `import { toRefs } from 'vitarx'; const { a, b } = toRefs(props); const App = () => <div a={a} b={b}></div>`
    const result = await compile(code)
    expect(result).toMatchInlineSnapshot(`
      "import { toRefs } from 'vitarx';
      import { createView } from "vitarx";
      const {
        a,
        b
      } = toRefs(props);
      const App = () => /* @__PURE__ */createView("div", {
        get a() {
          return a.value;
        },
        get b() {
          return b.value;
        }
      });"
    `)
  })

  it('toRefs 使用别名时正确识别', async () => {
    const code = `import { toRefs as t } from 'vitarx'; const { a } = t(props); const App = () => <div a={a}></div>`
    const result = await compile(code)
    expect(result).toMatchInlineSnapshot(`
      "import { toRefs as t } from 'vitarx';
      import { createView } from "vitarx";
      const {
        a
      } = t(props);
      const App = () => /* @__PURE__ */createView("div", {
        get a() {
          return a.value;
        }
      });"
    `)
  })

  it('普通对象解构无法静态识别 ref', async () => {
    const code = `import { ref } from 'vitarx'; const { a, b } = { a: ref(1), b: ref(2) }; const App = () => <div a={a} b={b}></div>`
    const result = await compile(code)
    expect(result).toMatchInlineSnapshot(`
      "import { ref } from 'vitarx';
      import { createView, unref } from "vitarx";
      const {
        a,
        b
      } = {
        a: ref(1),
        b: ref(2)
      };
      const App = () => /* @__PURE__ */createView("div", {
        get a() {
          return unref(a);
        },
        get b() {
          return unref(b);
        }
      });"
    `)
  })
})
