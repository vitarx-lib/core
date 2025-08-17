# Vitarx

[![Gitee](https://img.shields.io/badge/Gitee-blue?style=flat-square&logo=Gitee)](https://gitee.com/vitarx/core)
[![GitHub](https://img.shields.io/badge/Github-blue?style=flat-square&logo=Github)](https://github.com/vitarx/core)
[![npm](https://img.shields.io/npm/v/vitarx)](https://www.npmjs.com/package/vitarx)
________________________________________________________________________

## 介绍

`Vitarx` 是一个现代化的前端框架，它融合了 `React` 的 `JSX` 语法，`Vue` 的响应式系统，且大部分功能和API命名与 `Vue` 一致
，使得开发者可以快速上手。[查看文档](https://vitarx.cn)

## 特性

- **JSX**：`vitarx` 支持使用 `JSX` 语法，可以写出更简洁、更易于理解的代码。
- **组件化**：在 `vitarx` 中万物皆为小部件 `Widget`，支持函数式小部件，亦支持类小部件。
- **响应式数据**：`vitarx` 支持使用 `响应式数据`，且 `API` 命名和功能和 `Vue` 大部分一致，减少学习成本，例如 `ref`、
  `reactive`、
  `watch`、`computed` 等。
- **状态管理**：`vitarx` 与 `Vue` 的组件状态管理机制大致相同，当视图中绑定的 `响应式数据` 数据发生变化时，会自动更新视图。
- **生命周期**：`vitarx` 组件支持生命周期钩子，如 `onMounted`、`onUnmounted` 等10余个关键的钩子。
- **虚拟DOM节点**：`vitarx` 和大部分现代化的前端框架一样，采用了虚拟DOM节点，以及高效的Diff算法，差异化更新视图降低渲染性能开销。

> 2.x版本已弃用（但会修复BUG），新项目请使用3.x版本！！！

## 组件示例

### 函数式组件
```tsx
import { ref, onMounted } from 'vitarx'

// JSX语法
function App() {
  const count = ref(0)
  const add = () => {
    count.value++
  }
  // 注册生命周期钩子
  onMounted(() => {
    console.log('App mounted')
  })
  // 在内部渲染App小部件时，会自动收集视图中依赖的响应式数据，并监听其变化，自动更新视图。
  return (<div>
    <h1>count: {count.value}</h1>
    <button onClick={add}>add</button>
  </div>)
}
```

### 类组件示例
```tsx
import { Widget, ref } from 'vitarx'

interface Props {
  title: string
}

class App extends Widget<Props> {
  count = ref(0)

  add() {
    this.count.value++
  }

  onCreated() {
    // 小部件已经创建完毕，但还没有挂载到节点上，此时可以做一些初始化工作，例如初始化数据等。
    console.log(this.props.title)
  }

  onMounted() {
    // 小部件已经挂载到节点上，此时可以做一些后续工作，例如订阅事件等。
    console.log('App mounted')
  }

  build() {
    return (<div class="center-box">
      <h1>{this.props.title}</h1>
      <h1>count: {this.count.value}</h1>
      <button onClick={this.add.bind(this)}>add</button>
    </div>)
  }
}
```

