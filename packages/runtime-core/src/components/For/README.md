# For 组件

`For` 是一个用于渲染动态列表视图的组件，它可以根据数据数组动态生成相应的视图列表，支持高效的列表更新和渲染。

## 概述

在前端开发中，经常需要根据数据数组渲染列表项。`For` 组件提供了一种声明式的方式来处理这种常见的需求。它不仅能够高效地渲染列表，还能在数据变化时智能地更新列表项，实现最优的渲染性能。

## API

### Props

| 属性       | 类型                | 必填 | 默认值 | 描述                              |
|----------|-------------------|----|-----|---------------------------------|
| each     | `readonly T[]`    | 是  | -   | 要遍历的数据数组                        |
| children | `ViewFactory<T>`  | 是  | -   | 视图工厂函数，用于创建新视图，接收数据项和索引作为参数     |
| key      | `KeyExtractor<T>` | 否  | -   | 键提取函数，用于从数据中提取出唯一键，接收数据项和索引作为参数 |

## 使用示例

### 基础用法：渲染简单列表

```jsx
// 基本用法
const items = ["apple", "banana", "cherry"];

function App() {
  return (
    <For
      each={items}
      key={(item, index) => item}
      children={(item, index) => <div>{item}</div>}
    />
  );
}
```

### 使用对象数组

```jsx
const users = [
  { id: 1, name: "Alice", age: 25 },
  { id: 2, name: "Bob", age: 30 },
  { id: 3, name: "Charlie", age: 35 }
];

function UserList() {
  return (
    <For
      each={users}
      key={(user) => user.id}
      children={(user, index) => (
        <div>
          <span>{index + 1}. {user.name} ({user.age} years old)</span>
        </div>
      )}
    />
  );
}
```

### 在JSX中使用

```jsx
function TodoList({ todos }) {
  return (
    <ul>
      <For
        each={todos}
        key={(todo) => todo.id}
        children={(todo) => (
          <li className={todo.completed ? 'completed' : ''}>
            <input type="checkbox" checked={todo.completed} />
            <span>{todo.text}</span>
          </li>
        )}
      />
    </ul>
  );
}
```

### 使用索引参数

```jsx
const items = ["first", "second", "third"];

function NumberedList() {
  return (
    <ol>
      <For
        each={items}
        key={(item, index) => index}
        children={(item, index) => (
          <li>
            {index + 1}. {item}
          </li>
        )}
      />
    </ol>
  );
}
```

## 工作原理

1. `For` 组件接收一个数据数组 `each`
2. 使用 `key` 函数为每个数据项生成唯一键值
3. 使用 `children` 工厂函数为每个数据项创建对应的视图
4. 当数据发生变化时，`For` 组件会根据键值智能地更新、添加或删除列表项
5. 通过键值匹配，实现高效的列表更新算法

## 注意事项

- `key` 函数生成的键值必须是唯一的，这样才能保证列表更新的正确性
- `children` 函数接收两个参数：数据项和索引
- `key` 函数也接收两个参数：数据项和索引
- 对于大型列表，合理使用 `key` 函数可以显著提升渲染性能
- 当数据数组为空时，`For` 组件不会渲染任何内容
