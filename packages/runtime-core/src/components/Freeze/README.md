# Freeze 组件

`Freeze` 是一个用于缓存和复用组件视图的组件，它可以避免重复创建和销毁视图，从而提升应用性能。

## 概述

在某些场景下，我们可能需要频繁切换不同的视图，但每次都重新创建和销毁这些视图会带来性能开销。`Freeze` 组件通过缓存非活跃的视图来解决这个问题，当视图再次需要显示时，可以直接从缓存中复用，避免了重复创建的过程。

## API

### Props

| 属性       | 类型            | 必填 | 默认值       | 描述                         |
|----------|---------------|----|-----------|----------------------------|
| children | `View`        | 是  | -         | 需要被缓存的子视图                  |
| include  | `Component[]` | 否  | `[]`      | 需要缓存的组件类型列表，如果指定则只缓存列表中的组件 |
| exclude  | `Component[]` | 否  | `[]`      | 不需要缓存的组件类型列表，优先级高于 include |
| max      | `number`      | 否  | `0` (无限制) | 最大缓存数量，默认为 0 表示不限制         |

## 使用示例

### 基础用法：条件渲染缓存

```jsx
<Freeze>
  {cond ? <ComponentA /> : <ComponentB />}
</Freeze>
```

### 组合Dynamic：动态渲染缓存

```jsx
<Freeze>
  <Dynamic is={activeComponent} />
</Freeze>
```

### 使用 include 只缓存指定组件

```jsx
<Freeze include={[ComponentA, ComponentB]}>
  <Dynamic is={activeComponent} />
</Freeze>
```

### 使用 exclude 排除不需要缓存的组件

```jsx
<Freeze exclude={[ComponentC]}>
  <Dynamic is={activeComponent} />
</Freeze>
```

### 限制最大缓存数量

```jsx
<Freeze max={3}>
  <Dynamic is={activeComponent} />
</Freeze>
```

## 工作原理

1. 监听视图切换事件（onViewSwitch）
2. 当视图切换时，将旧视图（prev）冻结并缓存
3. 当新视图（next）需要显示时，优先从缓存中复用
4. 组件销毁时，清理所有缓存的视图

## 注意事项

- `Freeze` 组件只对会发生切换的视图有效（即 `isSwitchView(view)` 为 true 的视图）
- 如果子视图运行时不发生视图结构切换，则 `Freeze` 组件不会产生任何效果
- 合理设置 `max` 属性可以防止缓存过多视图导致内存占用过高
- `exclude` 的优先级高于 `include`，即如果同一组件同时出现在两个列表中，它将不会被缓存
