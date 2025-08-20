# vitarx

Vitarx 框架主包，整合了所有核心功能，提供完整的前端框架能力。

## 简介

Vitarx 是一个现代化的前端框架，融合了 React 的 JSX 语法和 Vue 的响应式系统，旨在提供简洁、高效的开发体验。该包是 Vitarx
框架的主入口，整合了所有核心模块，包括响应式系统、运行时核心和工具函数。

## 功能特性

- 🚀 **JSX 语法支持** - 使用熟悉的 JSX 语法构建用户界面
- 🔧 **响应式系统** - 集成强大的响应式数据管理（ref、reactive、watch、computed）
- 🎯 **组件化开发** - 支持函数式组件和类组件
- 🔄 **虚拟 DOM** - 高性能的虚拟 DOM 实现和 Diff 算法
- 📦 **模块化架构** - 基于 TypeScript 的类型安全设计

## 完全开发文档

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

## 核心 API

### createApp

创建 Vitarx 应用实例的入口函数。

```typescript
import { createApp } from 'vitarx'

const app = createApp(RootWidget, config ?)
```

### App 实例方法

#### mount

将应用挂载到指定的 DOM 容器中。

```typescript
app.mount('#app')
```

#### unmount

卸载应用，清理相关资源。

```typescript
app.unmount()
```

#### provide / getProvide

应用级依赖注入。

```typescript
// 提供数据
app.provide('key', value)

// 获取数据
const value = app.getProvide('key', defaultValue)
```

#### use

安装插件。

```typescript
app.use(plugin, options ?)
```

### JSX 支持

Vitarx 支持 JSX 语法，需要配置相应的编译选项。

```typescript
// 引入 JSX 运行时
import { jsx, jsxs, Fragment } from 'vitarx/jsx-runtime'

// 或者在开发模式下使用
import { jsxDEV, Fragment } from 'vitarx/jsx-dev-runtime'
```

## 导出内容

该包整合了以下模块的所有功能：

- [@vitarx/utils](../utils/README.md) - 工具函数集合
- [@vitarx/responsive](../responsive/README.md) - 响应式系统
- [@vitarx/runtime-core](../runtime-core/README.md) - 运行时核心

## 使用示例

```tsx
import { createApp, ref, reactive } from 'vitarx'

function App() {
  const count = ref(0)
  const state = reactive({ name: 'Vitarx' })

  const increment = () => {
    count.value++
  }

  return (
    <div>
      <h1>{state.name}</h1>
      {/*可以忽略.value*/}
      <p>Count: {count.value}</p>
      <button onClick={increment}>Increment</button>
    </div>
  )
}

createApp(App).mount('#app')
```

## 许可证

[MIT](../../LICENSE)
