# @vitarx/runtime-core

runtime-core 是 Vitarx 框架的核心运行时模块，提供了创建和管理虚拟 DOM、组件系统等核心功能。

## 功能特性

- **虚拟 DOM 系统**：高效的虚拟 DOM 实现和 diff 算法
- **组件系统**：支持函数组件和类组件的定义与管理
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
- `Transition`: 动画过渡，4.0版本新增
- `TransitionGroup`：列表动画，4.0版本新增
- `KeepAlive`：组件缓存
- `PropBind`: 快捷透传绑定属性给多个一级子节点，4.0版本新增
- `LazyWidget`：懒加载组件
- ~~`Teleport`~~：传送组件，于4.0被移除，使用 v-parent 指令代替

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
- `onError`：小部件内部发生未捕获异常时触发
- `onServerPrefetch`：服务端预取钩子，仅在服务端渲染时有效

### 函数组件

函数组件是接收 props 并返回 VNode 的简单函数：

```tsx
const MyComponent = (props) => {
  return <div class="my-component">Hello Vitarx!</div>
}
```

### 类组件

类组件通过继承 Widget 类来实现，提供更多功能：

```typescript
import { Widget, createVNode } from '@vitarx/runtime-core' // vitarx

class MyComponent extends Widget {
  build() {
    return createVNode('div', { className: 'my-component' }, 'Hello World') // 使用 createVNode 创建虚拟节点
  }
}
```

### HostAdapter

定义了 不同平台 DOM Adapter 相关接口，包括：

- createElement
- setAttribute
- addEventListener
- ... 具体方法请查看源码

## 安装

```bash
npm install @vitarx/runtime-core
```

## 使用示例

```tsx
import { createApp, Widget } from 'vitarx'

// 创建函数组件
const App = () => {
  return <div>Hello Vitarx!</div>
}

// 创建应用并挂载
const app = createApp(App)
app.mount('#app')
```

## API 文档

详细 API 文档请参考各子模块：

- [VNode API](./src/vnode/)
- [Widget API](./src/widget/)
- [DOM Adapter API](./src/adapter/)
