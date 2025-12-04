# @vitarx/runtime-core

Vitarx 框架的核心运行时模块,提供虚拟 DOM、组件系统和渲染机制。

## 安装

```bash
npm install @vitarx/runtime-core
```

## 快速开始

```tsx
import { createApp } from '@vitarx/runtime-dom'
import { ref } from '@vitarx/responsive'

function App() {
  const count = ref(0)
  return (
    <div>
      <p>Count: {count.value}</p>
      <button onClick={() => count.value++}>增加</button>
    </div>
  )
}

createApp(App).mount('#app')
```

## 核心功能

### 虚拟 DOM

支持 7 种节点类型:

- `RegularElementVNode` - 常规元素 (`<div>`, `<span>`)
- `VoidElementVNode` - 自闭合元素 (`<img>`, `<input>`)
- `TextVNode` - 文本节点
- `CommentVNode` - 注释节点
- `FragmentVNode` - 片段节点 (`<>...</>`)
- `StatefulWidgetVNode` - 有状态组件
- `StatelessWidgetVNode` - 无状态组件

### 组件系统

**函数组件:**

```tsx
import { ref, onMounted } from '@vitarx/runtime-core'

function Counter() {
  const count = ref(0)
  
  onMounted(() => {
    console.log('组件已挂载')
  })
  
  return <div>{count.value}</div>
}
```

**类组件:**

```tsx
import { Widget } from '@vitarx/runtime-core'
import { ref } from '@vitarx/responsive'

class Counter extends Widget {
  count = ref(0)
  
  onMounted() {
    console.log('组件已挂载')
  }
  
  build() {
    return <div>{this.count.value}</div>
  }
}
```

### 生命周期钩子

| 钩子                | 触发时机          |
|-------------------|---------------|
| `onCreate`        | 组件创建          |
| `onRender`        | 渲染前           |
| `onMounted`       | 挂载后           |
| `onBeforeUpdate`  | 更新前           |
| `onUpdated`       | 更新后           |
| `onBeforeUnmount` | 卸载前           |
| `onUnmounted`     | 卸载后           |
| `onActivated`     | 激活(KeepAlive) |
| `onDeactivated`   | 停用(KeepAlive) |
| `onDestroy`       | 组件即将销毁        |

### 内置组件

- `Suspense` - 异步组件加载
- `Transition` / `TransitionGroup` - 过渡动画
- `KeepAlive` - 组件缓存
- `Lazy` - 懒加载
- `Teleport` - DOM 传送

### 依赖注入

```tsx
import { provide, inject } from '@vitarx/runtime-core'

// 提供数据
function Parent() {
  provide('theme', { mode: 'dark' })
  return <Child />
}

// 注入数据
function Child() {
  const theme = inject('theme')
  return <div>{theme.mode}</div>
}
```

### 指令系统

```tsx
// 使用内置指令
<div v-show={visible.value}>内容</div>

// 注册自定义指令
app.directive('focus', {
  mounted(el) {
    el.focus()
  }
})
```

## API

### 应用管理

```tsx
import { App } from '@vitarx/runtime-core'

const app = new App(RootComponent)
app.provide('key', value)  // 全局依赖注入
app.directive('name', {})  // 注册指令
app.mount('#app')          // 挂载应用
```

### 虚拟节点

```tsx
import { createVNode } from '@vitarx/runtime-core'

const vnode = createVNode('div', { class: 'container' }, 'Hello')
```

## 许可证

[MIT](LICENSE)
