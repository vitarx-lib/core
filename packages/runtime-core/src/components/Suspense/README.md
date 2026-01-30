# Suspense 组件

Suspense 是一个用于处理异步组件加载时的占位显示的组件。它允许您在异步内容加载期间显示占位符（fallback），并在加载完成后切换到实际内容。

## 概述

Suspense 组件提供了一种优雅的方式来处理异步操作，如异步组件加载、数据获取等。它通过内部维护一个计数器来跟踪异步操作的状态，并在所有异步操作完成后自动切换到实际内容。

## Props

| 属性         | 类型           | 必需 | 描述           |
|------------|--------------|----|--------------|
| children   | `View`       | 是  | 实际要渲染的内容     |
| fallback   | `View`       | 否  | 加载中显示的占位视图   |
| onResolved | `() => void` | 否  | 异步加载完成时的回调函数 |

### 详细说明

#### children
- **类型**: `View`
- **必需**: 是
- **描述**: 实际要渲染的内容，通常是异步组件或需要时间加载的内容。

#### fallback
- **类型**: `View`
- **必需**: 否
- **描述**: 在异步子节点加载完成之前会显示该属性传入的节点，加载完成过后会立即切换为子节点内容。

#### onResolved
- **类型**: `() => void`
- **必需**: 否
- **描述**: 该钩子会在子节点全部渲染完成后执行。

## 使用示例

### 基本用法

```tsx
<Suspense fallback={<div>Loading...</div>}>
  <AsyncComponent />
</Suspense>
```

### 使用 onResolved 回调

```tsx
<Suspense 
  fallback={<div>Loading...</div>} 
  onResolved={() => console.log('Async content loaded!')}>
  <AsyncComponent />
</Suspense>
```

## 工作原理

Suspense 组件通过以下机制工作：

1. 内部维护一个计数器（`counter`），用于跟踪异步操作的数量
2. 通过 `provide` 将计数器传递给子组件，使子组件可以增加或减少计数器
3. 监听计数器的变化，当计数器归零时，表示所有异步操作已完成
4. 切换显示内容从 fallback 到实际的 children
5. 执行 `onResolved` 回调（如果提供）

## 注意事项

- `children` 属性是必需的，并且必须是一个有效的视图节点对象
- `fallback` 属性是可选的，但如果提供，则必须是一个有效的视图节点对象
- `onResolved` 属性是可选的，但如果提供，则必须是一个函数
- 当异步操作完成后，Suspense 会自动切换到显示实际内容

## 错误处理

Suspense 组件会对传入的属性进行验证：
- 如果 `children` 不是视图节点对象，将抛出 `TypeError`
- 如果 `fallback` 不是视图节点对象，将抛出 `TypeError`
- 如果 `onResolved` 不是函数，将抛出 `TypeError`
