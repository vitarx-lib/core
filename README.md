# Vitarx：新一代信号驱动的高性能前端框架

## 什么是 Vitarx？

Vitarx（读音 /ˈviːtɑːrks/，中文谐音"维塔克"）是一个**响应式驱动**的 JSX 前端框架。它以**信号粒度的精确依赖追踪**取代传统虚拟 DOM 差量比对，通过引擎级视图控制实现最小化更新，从而获得卓越的运行时性能。

与 React、Vue 等传统虚拟 DOM 框架不同，Vitarx 不需要整棵树的 diff 比对——当响应式数据变化时，框架精确知道哪些视图节点需要更新，并直接操作对应的 DOM 节点，避免了不必要的计算和渲染开销。

---

## 核心特性

### ⚡️ 信号级精确更新

这是 Vitarx 最核心的特性。通过细粒度的依赖追踪系统，当数据变化时，**仅更新关联的 DOM 节点**，完全跳过虚拟 DOM 的 diff 过程。

```tsx
import { ref } from 'vitarx'

function Counter() {
  const count = ref(0)

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => count.value++}>+1</button>
    </div>
  )
}
```

当 `count` 变化时，**只有 `<p>` 标签内的文本节点会被更新**，整个组件不会重新执行。

### 🚀 完整的响应式系统

Vitarx 提供了丰富的响应式 API，借鉴了 Vue 3 的设计理念：

```tsx
import { ref, reactive, computed, watch, watchEffect } from 'vitarx'

// 基本响应式引用
const name = ref('Vitarx')

// 响应式对象
const state = reactive({
  count: 0,
  items: []
})

// 计算属性
const doubled = computed(() => state.count * 2)

// 监听
watch(count, (newVal, oldVal) => {
  console.log(`count changed: ${oldVal} -> ${newVal}`)
})

// 自动追踪依赖的副作用
watchEffect(() => {
  console.log(`current count: ${count.value}`)
})
```

### 🎯 函数组件 + 生命周期

Vitarx 采用简洁的函数组件模型，搭配完整的生命周期钩子：

```tsx
import { onInit, onMounted, onDispose } from 'vitarx'

function MyComponent() {
  onInit(() => {
    console.log('组件初始化')
  })

  onMounted(() => {
    console.log('组件挂载到 DOM')
  })

  onDispose(() => {
    console.log('组件销毁，清理资源')
  })

  return <div>Hello Vitarx</div>
}
```

### 📦 丰富的内置组件

Vitarx 提供了开箱即用的内置组件：

```tsx
import { For, Suspense, Lazy, Freeze, Transition, Teleport } from 'vitarx'

// 列表渲染
<For each={items} key={(item) => item.id}>
  {(item) => <div>{item.name}</div>}
</For>

// 异步加载
<Suspense fallback={<Loading />}>
  <Lazy loader={() => import('./HeavyComponent')} />
</Suspense>

// 冻结组件（不响应外部信号变化）
<Freeze>
  <StaticContent />
</Freeze>

// 过渡动画
<Transition name="fade">
  <div v-show={visible}>内容</div>
</Transition>

// 传送门
<Teleport to="body">
  <Modal />
</Teleport>
```

在 Vitarx 中，**万物皆组件** —— 上述所有高阶内置组件（`For`、`Suspense`、`Lazy`、`Transition`、`Teleport`）并非不可触碰的黑盒，它们本身就是用 Vitarx 核心 API 构建的普通组件。开发者可以轻松查看源码、理解实现原理，并根据业务需求进行扩展、定制甚至完全重写。这种**无黑盒架构**设计赋予了框架极高的可扩展性，让你真正掌控每一层实现细节。

### 💉 依赖注入

支持应用级和组件级的依赖注入：

```tsx
// 父组件提供数据
function Parent() {
  provide('theme', 'dark')
  return <Child />
}

// 子组件注入数据
function Child() {
  const theme = inject('theme', 'light')
  return <div class={`theme-${theme}`}>内容</div>
}
```

### 🌐 SSR 支持

内置服务端渲染能力：

```tsx
import { renderToString, renderToStream } from 'vitarx'

// 字符串渲染
const html = await renderToString(App)

// 流式渲染
const stream = await renderToStream(App)
```

---

## 架构设计

Vitarx 采用分层架构设计，各层职责清晰、依赖单向：

```
┌─────────────────────────────────────────────┐
│                   vitarx                    │  ← 聚合包，统一导出
├────────────┬─────────────┬──────────────────┤
│runtime-dom │ runtime-ssr │                  │  ← 平台适配层
├────────────┴─────────────┼──────────────────┤
│        runtime-core      │     utils        │  ← 运行时核心 & 工具
├──────────────────────────┼──────────────────┤
│        responsive        │                  │  ← 响应式系统
└──────────────────────────┴──────────────────┘
```

| 包名                   | 说明                                                      |
| ---------------------- | --------------------------------------------------------- |
| `vitarx`               | 聚合包，统一导出所有子包 API                              |
| `@vitarx/responsive`   | 响应式核心 — ref、reactive、computed、watch、effect       |
| `@vitarx/runtime-core` | 运行时核心 — 组件系统、视图构建、生命周期、依赖注入、指令 |
| `@vitarx/runtime-dom`  | 浏览器渲染 — DOM 渲染器、Transition、Teleport、Head       |
| `@vitarx/runtime-ssr`  | 服务端渲染 — renderToString、renderToStream、客户端水合   |
| `@vitarx/utils`        | 工具函数 — 深拷贝、类型检测、日志、防抖/节流              |

---

## 设计理念与框架对比

### 性能定位与取舍

Vitarx 采用信号级精确更新机制，在高频状态变化场景下优势明显，整体性能处于**第一梯队**。但需要客观说明的是，Vitarx 并不追求在所有场景下"全面碾压"成熟框架——在大规模静态内容渲染等特定场景下，与 Vue/React 等经过多年优化的框架相比并无显著优势。

Vitarx 的核心竞争力在于**架构设计**而非单纯的性能数字：通过**万物皆组件**的设计哲学和**无黑盒**的透明实现，为开发者提供更高的可扩展性和定制自由度。

### 性能基准对比

以下数据来自官方 [JS Framework Benchmark](https://github.com/vitarx-lib/js-framework-benchmark) 测试（单位：毫秒/MB/KB）：

#### 执行时间对比

| 测试场景         | Vue 3.6  | React-hooks 19 | Vitarx 4.0 |
| ---------------- | -------- | -------------- | ---------- |
| 创建1000行       | 81.9     | 82.4           | 112.2      |
| 更新1000行       | 88.2     | 84.8           | 122.4      |
| 部分更新(每10行) | 19.1     | 11.2           | 9.2        |
| 选中行           | 9.8      | 5.8            | 4.5        |
| 交换行           | 10.7     | 67.6           | 10.4       |
| 删除行           | 20.9     | 18.1           | 17.2       |
| 创建10000行      | 880.2    | 1143.5         | 1104.1     |
| 追加1000行       | 89.1     | 82.5           | 117.0      |
| 清空表格         | 8.3      | 11.5           | 20.3       |
| **几何均值**     | **1.17** | **1.21**       | **1.28**   |

#### 内存分配对比

| 测试场景     | Vue 3.6  | React-hooks 19 | Vitarx 4.0 |
| ------------ | -------- | -------------- | ---------- |
| 初始内存     | 0.86 MB  | 1.18 MB        | 0.83 MB    |
| 运行内存     | 3.77 MB  | 4.42 MB        | 5.46 MB    |
| 创建/清理后  | 1.23 MB  | 1.97 MB        | 1.16 MB    |
| **几何均值** | **1.03** | **1.41**       | **1.13**   |

#### 传输大小对比

| 项目         | Vue 3.6  | React-hooks 19 | Vitarx 4.0 |
| ------------ | -------- | -------------- | ---------- |
| 未压缩大小   | 63.7 KB  | 180.3 KB       | 57.8 KB    |
| 压缩后大小   | 22.9 KB  | 51.4 KB        | 17.0 KB    |
| 首次绘制时间 | 134.4 ms | 359.6 ms       | 137.7 ms   |
| **几何均值** | **1.14** | **2.99**       | **1.01**   |

### 相比虚拟 DOM 框架（React、Vue）

| 维度      | 虚拟 DOM 框架        | Vitarx                   |
| --------- | -------------------- | ------------------------ |
| 更新机制  | 组件级重渲染 + diff  | 信号级精确更新           |
| 更新粒度  | 组件                 | DOM 节点                 |
| diff 开销 | 有                   | 无                       |
| 架构特点  | 内置组件多为黑盒实现 | 万物皆组件，可扩展可定制 |

### 相比其他信号框架（Solid、Svelte）

Vitarx 同样采用"信号"驱动的更新策略，但在两方面做出了不同的设计选择：

**API 风格**：Vitarx 更贴近 Vue 的响应式风格，提供了 `ref`、`reactive`、`computed` 等开发者熟悉的 API，降低了学习成本。同时采用 JSX 作为模板语法，兼具灵活性与类型安全。

**架构路线**：与 Solid、Svelte 等走**极致编译时优化**路线的框架不同，Vitarx 选择保留强大的**运行时渲染编排能力**。`Teleport`、`Transition`、`Suspense`、`Lazy`、`Freeze` 等高阶组件并非框架底层的黑盒实现，而是完全基于 Vitarx 公开的渲染引擎 API 构建而成。开发者不仅可以查看和理解它们的实现原理，还能基于同一套渲染引擎 API 构建自己的自定义渲染逻辑。

---

## 快速上手

### 创建项目

```bash
pnpm create vitarx
```

运行后按照提示依次选择：

- 项目名称 — 输入你的项目目录名
- 开发语言 — 选择 TypeScript 或 JavaScript
- 项目模板 — 选择适合的模板

### 启动项目

```bash
npm run dev
```

## 为什么选择 Vitarx？

如果你追求较高的运行时性能，同时看重框架的可扩展性和架构透明度，Vitarx 是一个值得尝试的选择。它以**信号级依赖追踪**实现高性能更新，以**万物皆组件**的设计理念保障可扩展性，以**无黑盒架构**让开发者真正掌控每一层实现细节。

无论是构建复杂的业务系统，还是深入探索前端框架的底层原理，Vitarx 都能为你提供友好而强大的开发体验。

## 资源链接

- **Gitee**: [代码仓库](https://gitee.com/vitarx/core)
- **GitHub**: [代码仓库](https://github.com/vitarx-lib/core)
- **官方文档**: [查看文档](https://vitarx.cn)
- **交流QQ群**: [点击加入](https://qm.qq.com/cgi-bin/qm/qr?k=2daHjQr-L5il1BaR-kg_X14TCQkBGTzp&jump_from=webapi&authKey=UuYORimg6o8o1vkmNEdx+GY50NSo2W1VsuB8Q8s2kLpxhdd4i1It8L7O2plEUhwD)

## 许可证

[MIT](./LICENSE)

Copyright © 2024 - present, ZhuChongLin
