# Vitarx

Vitarx 是一个 **响应式驱动** 的 JSX 前端框架。以信号粒度的精确依赖追踪取代虚拟 DOM 差量比对，通过引擎级视图控制实现最小化更新。

## 特性概览

| 特性                     | 描述                                                 |
|------------------------|----------------------------------------------------|
| 🚀 **JSX 支持**          | 使用熟悉的 JSX 语法构建界面，完整类型支持                            |
| 🔧 **响应式系统**           | 提供 `ref`、`reactive`、`computed`、`watch` 等精细响应式 API  |
| ⚡ **高性能更新**            | 精确依赖追踪，避免不必要的渲染                                    |
| 🎯 **组件化开发**           | 函数组件 + 生命周期钩子，可实现复杂视图控制（如 `For`、`Freeze`）          |
| 🎨 **渲染机制灵活**          | 多平台渲染适配，浏览器提供完整 DOM 操作能力                           |
| 💉 **依赖注入**            | 应用级和组件级 `provide` / `inject`                       |
| 📦 **内置组件**            | `Suspense`、`Transition`、`Freeze`、`Lazy`、`Teleport` |
| 🎯 **指令系统**            | 内置 `v-show`、`v-html`、`v-text`，支持自定义扩展              |
| 📘 **TypeScript 完整支持** | 类型推导完整，开发体验友好                                      |
| 🔌 **工具函数库**           | 深拷贝、类型检测、防抖/节流、渲染辅助函数等                             |

## 包结构

本仓库采用 monorepo 架构，基于 pnpm workspace 管理：

| 包名                                              | 说明                                                                 |
|-------------------------------------------------|--------------------------------------------------------------------|
| [`vitarx`](packages/vitarx)                     | 聚合包，统一导出所有子包 API                                                   |
| [`@vitarx/responsive`](packages/responsive)     | 响应式核心 — `ref`、`reactive`、`computed`、`watch`、`effect`、`effectScope` |
| [`@vitarx/runtime-core`](packages/runtime-core) | 运行时核心 — 组件系统、视图构建、生命周期、依赖注入、指令、内置组件                                |
| [`@vitarx/runtime-dom`](packages/runtime-dom)   | 浏览器渲染 — DOM 渲染器、`Transition`、`Teleport`、`Head`、内置指令                |
| [`@vitarx/runtime-ssr`](packages/runtime-ssr)   | 服务端渲染 — `renderToString`、`renderToStream`、客户端水合                    |
| [`@vitarx/utils`](packages/utils)               | 工具函数 — 深拷贝、类型检测、日志、防抖/节流                                           |

## 快速开始

### 安装

```bash
npm install vitarx
```

### 使用

```tsx
import { ref, createApp } from 'vitarx'

function App() {
  const count = ref(0)

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => count.value++}>+1</button>
    </div>
  )
}

createApp(App).mount('#app')
```

## 开发

```bash
# 安装依赖
pnpm install

# 构建
pnpm build

# 运行测试
pnpm test

# 类型检查
pnpm typecheck
```

## 链接

- [官方文档](https://vitarx.cn)
- [GitHub](https://github.com/vitarx-lib/core)
- [更新日志](CHANGELOG.md)

## 许可证

[MIT](LICENSE)

Copyright © 2024 - present, ZhuChongLin
