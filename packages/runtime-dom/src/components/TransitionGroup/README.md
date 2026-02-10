# TransitionGroup 组件

TransitionGroup 组件用于处理一组元素的进入、离开、移动过渡动画。

## 概述

TransitionGroup 是一个高级组件，专门用于处理列表中元素的过渡效果，包括进入、离开和移动动画。它结合了 For 组件的功能，能够智能地追踪列表项的变化并应用相应的过渡效果。

## Props

| 属性               | 类型                                           | 默认值            | 描述                |
|------------------|----------------------------------------------|----------------|-------------------|
| each             | `T[]`                                        | -              | 要渲染的元素数组          |
| children         | `(item: T,index:Ref<number>) => View`        | -              | 渲染函数，接收当前元素返回视图   |
| key              | `string \| ((item: T) => string)`            | -              | 用于唯一标识元素的键值函数或属性名 |
| tag              | `ContainerTag`                               | -              | 包裹子节点的标签名         |
| name             | `string`                                     | `'v'`          | 过渡名称前缀            |
| moveClass        | `string`                                     | `${name}-move` | 元素移动时使用的类名        |
| bindProps        | `WithProps<Tag>`                             | -              | 传递给包裹元素的属性        |
| css              | `boolean`                                    | `true`         | 是否使用 CSS 过渡类      |
| type             | `'transition' \| 'animation'`                | `'transition'` | 过渡类型              |
| duration         | `number \| { enter: number; leave: number }` | -              | 过渡持续时间            |
| onBeforeEnter    | `VoidCallback`                               | -              | 进入过渡前的钩子函数        |
| onEnter          | `HookFn`                                     | -              | 进入过渡时的钩子函数        |
| onAfterEnter     | `HookFn`                                     | -              | 进入过渡完成后的钩子函数      |
| onBeforeLeave    | `HookFn`                                     | -              | 离开过渡前的钩子函数        |
| onLeave          | `HookFn`                                     | -              | 离开过渡时的钩子函数        |
| onAfterLeave     | `HookFn`                                     | -              | 离开过渡完成后的钩子函数      |
| onEnterCancelled | `HookFn`                                     | -              | 进入动画被取消时的钩子函数     |
| onLeaveCancelled | `HookFn`                                     | -              | 离开动画被取消时的钩子函数     |

## 使用示例

```jsx
import { ref } from '@vitarx/reactivity'
import { TransitionGroup } from '@vitarx/runtime-dom'

const list = ref([
  { id: 1, name: 'Apple' },
  { id: 2, name: 'Banana' },
  { id: 3, name: 'Cherry' }
])

// 添加项目
const addItem = () => {
  const newItem = { id: Date.now(), name: `Item ${Date.now()}` }
  list.value.push(newItem)
}

// 删除项目
const removeItem = (id) => {
  list.value = list.value.filter(item => item.id !== id)
}

// 渲染带有过渡效果的列表
const App = () => (
  <div>
    <button onClick={addItem}>添加项目</button>
    <TransitionGroup 
      each={list.value} 
      key={item => item.id} 
      name="list" 
      tag="ul"
    >
      {(item) => (
        <li onClick={() => removeItem(item.id)}>
          {item.name}
        </li>
      )}
    </TransitionGroup>
  </div>
)
```

## CSS 样式示例

```css
.list-move,
.list-enter-active,
.list-leave-active {
  transition: all 0.5s ease;
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

.list-leave-active {
  position: absolute;
}
```

## 注意事项

1. **Key 属性**：虽然 `key` 属性不是强制性的，但强烈建议提供。这有助于优化列表渲染性能，并确保在列表更新期间正确保留组件状态。

2. **标签选择**：`tag` 属性用于指定包裹子节点的标签名，如果未指定，则直接返回列表视图而不添加额外的包装元素。

3. **移动动画**：TransitionGroup 通过比较元素位置变化来实现移动动画，需要 CSS 样式配合才能看到效果。

4. **性能考虑**：由于需要追踪每个元素的位置变化，当列表非常大时可能会影响性能。

5. **过渡钩子**：可以使用各种过渡钩子函数来控制动画过程，如 `onBeforeEnter`、`onEnter`、`onAfterEnter` 等。

## 相关组件

- [Transition](../Transition/README.md) - 单个元素的过渡组件
- [For](../../../../runtime-core/src/components/For/README.md) - 列表渲染组件
