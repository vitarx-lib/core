# @vitarx/runtime-core

runtime-core 是 Vitarx 框架的核心运行时模块，提供了创建和管理虚拟 DOM、组件系统以及 JSX 运行时支持等核心功能。

## 功能特性

- **虚拟 DOM 系统**：高效的虚拟 DOM 实现和 diff 算法
- **组件系统**：支持函数组件和类组件的定义与管理
- **JSX 运行时**：支持 JSX 语法的编译时和运行时支持
- **DOM 操作**：封装了常用的 DOM 操作方法
- **响应式集成**：与 @vitarx/responsive 模块深度集成

## 核心概念

### VNode (虚拟节点)

VNode 是虚拟 DOM 的核心数据结构，用于描述真实 DOM 节点或组件。

主要类型包括：

- 元素节点 (Element VNode)
- 文本节点 (Text VNode)
- 注释节点 (Comment VNode)
- Fragment 节点 (Fragment VNode)
- 组件节点 (Widget VNode)
- 容器节点 (Container VNode)

### Widget (组件)

Widget 是组件系统的核心，支持创建函数组件和类组件。

内置组件：

- `Suspense`：处理异步依赖
- `KeepAlive`：组件缓存
- `LazyWidget`：懒加载组件
- `Teleport`：传送组件

### 生命周期

组件具有完整的生命周期钩子：

- `onCreate`：小部件实例创建时触发
- `onBeforeMount`：小部件挂载之前触发，可以返回一个 DOM 元素作为挂载目标容器
- `onMounted`：小部件挂载完成后触发
- `onDeactivated`：小部件被临时停用时触发（由`KeepAlive`内置组件触发）
- `onActivated`：小部件从停用状态恢复时触发
- `onBeforeUnmount`：小部件实例销毁前触发
- `onUnmounted`：小部件卸载完成后触发
- `onBeforeUpdate`：小部件更新之前触发
- `onUpdated`：小部件更新完成后触发
- `onError`：小部件渲染或构建过程中捕获到异常时触发
- `onBeforeRemove`：真实的`Element`被移除前触发，可以返回`Promise`来延迟移除
- `onServerPrefetch`：服务端预取钩子，仅在服务端渲染时有效

### 函数组件

函数组件是接收 props 并返回 VNode 的简单函数：

```typescript
import { jsx } from '@vitarx/runtime-core'

const MyComponent = (props) => {
  return jsx('div', { className: 'my-component' }, props.message)
}
```

### 类组件

类组件通过继承 Widget 类来实现，提供更多功能：

```typescript
import { Widget, jsx } from '@vitarx/runtime-core'

class MyComponent extends Widget {
  render() {
    return jsx('div', { className: 'my-component' }, 'Hello World')
  }
}
```

### JSX 运行时

提供了 JSX 语法的支持：

- `jsx()`：生产环境 JSX 运行时
- `jsxDEV()`：开发环境 JSX 运行时

### DOM Helper

封装了 DOM 操作相关的工具方法，包括：

- CSS 类名处理
- 样式处理
- 属性处理
- 事件处理

## 安装

```bash
npm install @vitarx/runtime-core
```

## 使用示例

```typescript
import { createApp, jsx, Widget } from 'vitarx'

// 创建函数组件
const App = () => {
  return jsx('div', { className: 'app' }, 'Hello Vitarx!')
}

// 创建应用并挂载
const app = createApp(App)
app.mount('#app')
```

## API 文档

详细 API 文档请参考各子模块：

- [VNode API](./src/vnode/)
- [Widget API](./src/widget/)
- [DOM Helper API](./src/dom/)
