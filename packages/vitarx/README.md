# Vitarx

Vitarx 是一个现代化前端框架，融合了 **JSX 语法** 和 **响应式系统**，提供引擎级视图控制能力和完整的前端开发框架。  
该包为 Vitarx 框架主入口，整合核心模块，包括响应式系统、运行时核心、DOM 渲染和工具函数。

---

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


## 官方文档

[查看文档](https://vitarx.cn)

## 安装

```bash
# 使用 npm
npm install vitarx

# 使用 yarn
yarn add vitarx

# 使用 pnpm
pnpm add vitarx
```

## 快速开始

```typescript
import { createApp } from 'vitarx'
import App from './app'
// 创建应用实例
const app = createApp(App)

// 挂载到 DOM 元素
app.mount('#app')
```

## 导出内容

该包整合了以下模块的所有功能：

- [@vitarx/utils](../utils/README.md) - 工具函数集合
- [@vitarx/responsive](../responsive/README.md) - 响应式系统
- [@vitarx/runtime-core](../runtime-core/README.md) - 运行时核心
- [@vitarx/runtime-dom](../runtime-dom/README.md) - 浏览器端 DOM 渲染适配器
- [@vitarx/runtime-ssr](../runtime-ssr/README.md) - 服务端渲染能力

## 许可证

[MIT](./LICENSE)
