# Lazy 组件

Lazy 组件是一个用于延迟加载子组件的功能组件，提供了延迟加载、超时处理、加载状态显示和错误处理等功能。

## 概述

Lazy 组件允许你将应用程序拆分为更小的代码块，并按需加载组件。这对于提高应用程序的初始加载性能非常有用，因为它允许你延迟加载不需要立即使用的组件。

## API

## Lazy 组件

### Props

| 属性         | 类型                              | 必需 | 默认值   | 描述                             |
|------------|---------------------------------|----|-------|--------------------------------|
| `loader`   | `() => Promise<{ default: T }>` | 是  | -     | 惰性加载器函数，返回一个包含默认导出组件的 Promise  |
| `loading`  | `() => View`                    | 否  | -     | 加载期间显示的视图函数                    |
| `delay`    | `number`                        | 否  | `200` | 显示加载视图前的延迟时间（毫秒），用于避免短暂的加载状态闪烁 |
| `timeout`  | `number`                        | 否  | `0`   | 加载超时时间（毫秒），设为 `<=0` 表示不限制超时时间  |
| `onError`  | `(e: unknown) => View`          | 否  | -     | 加载失败时的错误处理函数，返回错误状态视图          |
| `inject`   | `WithProps<T>`                  | 否  | -     | 需要透传给加载完成后的组件的属性               |
| `children` | `ComponentProps<T>['children']` | 否  | -     | 透传给加载完成后的组件的子元素                |

### 示例

```jsx
import { Lazy } from '@vitarx/runtime-core'

function App() {
  return (
    <Lazy
      loader={() => import('./MyAsyncComponent')}
      loading={() => <div>正在加载...</div>}
      delay={200}
      timeout={5000}
      onError={(error) => <div>加载失败: {error.message}</div>}
    />
  )
}
```

## lazy 工厂函数

`lazy` 是一个辅助函数，用于创建懒加载组件的视图构建器。

### 参数

| 参数        | 类型                              | 必需 | 描述                                               |
|-----------|---------------------------------|----|--------------------------------------------------|
| `loader`  | `() => Promise<{ default: T }>` | 是  | 惰性加载器函数，返回一个包含默认导出组件的 Promise                    |
| `options` | `LazyLoadOptions`               | 否  | 懒加载组件选项，包括 `loading`、`delay`、`timeout`、`onError` |

### 返回值

- `ViewBuilder<ComponentProps<T>, ComponentView<typeof Lazy<T>>>` - 懒加载组件的视图构建器

### 示例

```jsx
import { lazy } from '@vitarx/runtime-core'

// 基本用法
const Button = lazy(() => import('./Button.js'))

function App() {
  // color, children 都会透传给最终渲染的 Button 组件
  return <Button color="red">按钮</Button>
  // 等效于
  // return <Lazy loader={() => import('./Button.js')} inject={{ color: "red" }}>按钮</Lazy>
}

// 带有 loading 和错误处理的用法
const AdvancedComponent = lazy(
  () => import('./AdvancedComponent.js'),
  {
    delay: 300,
    timeout: 5000,
    loading: () => <div>正在加载...</div>,
    onError: (error) => <div>加载失败: {String(error)}</div>
  }
)
```

## 功能特性

### 延迟加载

Lazy 组件允许你延迟加载组件直到需要时才加载。这对于优化应用启动时间非常重要。

### 加载状态

通过 `loading` 属性，你可以指定在组件加载期间显示的内容。

### 超时处理

通过 `timeout` 属性，你可以设置加载超时时间，防止组件加载时间过长。

### 错误处理

通过 `onError` 属性，你可以处理加载失败的情况，并显示错误状态。

### 延迟显示

通过 `delay` 属性，可以避免短暂的加载状态闪烁，只有在加载时间超过延迟时间时才会显示加载状态。

## 最佳实践

1. **合理设置 delay**: `delay` 通常设置为 200ms 左右，这样可以避免短暂的加载状态闪烁。

2. **提供加载状态**: 为用户提供良好的加载体验，始终提供 `loading` 视图。

3. **错误处理**: 提供适当的错误处理，让用户知道加载失败的情况。

4. **使用 lazy 工厂函数**: 推荐使用 `lazy` 工厂函数而不是直接使用 `Lazy` 组件，因为前者提供了更好的开发体验。

## 注意事项

1. 被懒加载的组件必须使用 `export default` 导出，否则会报错。

2. `loader` 函数必须返回一个 Promise，且 Promise 的 resolve 值必须包含 `default` 属性，该属性是实际的组件。

3. 当组件加载失败且未提供 `onError` 处理函数时，错误会被记录到控制台。

4. Lazy 组件会自动取消未完成的异步任务，防止内存泄漏。

## 与其他组件集成

Lazy 组件可以与 Suspense 组件配合使用，以提供更好的加载状态管理。当 Lazy 组件在 Suspense 内部时，Suspense 的 fallback 会优先于 Lazy 的 loading 属性。

```jsx
<Suspense fallback={<div>等待中...</div>}>
  <Lazy loader={() => import('./AsyncComponent')} />
</Suspense>
```
