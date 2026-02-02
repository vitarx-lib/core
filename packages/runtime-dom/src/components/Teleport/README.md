# Teleport 组件

`Teleport` 组件用于将其子组件渲染到 DOM 树的其他位置。它提供了一种简单的方法来将内容移动到 DOM 树中不同的位置，这对于模态框、弹窗、工具提示等场景非常有用。

## 基本用法

```tsx
import { Teleport } from '@vitarx/runtime-dom'

function App() {
  return (
    <div>
      <p>这里是原始位置的内容</p>
      <Teleport to="#modal-container">
        <div>这段内容将被传送到 #modal-container 元素中</div>
      </Teleport>
    </div>
  )
}
```

## Props

| 属性       | 类型      | 默认值   | 描述                          |
|----------|---------|-------|-----------------------------|
| children | View    | -     | 要被传送的子组件或节点                 |
| to       | string  | -     | 目标位置的 CSS 选择器，内容将被传送到匹配的元素中 |
| defer    | boolean | false | 是否延迟挂载，在 mounted 阶段挂载内容     |
| disabled | boolean | false | 是否禁用传送功能，如果为 true 则直接渲染子组件  |

## 功能说明

### 基础传送功能

Teleport 组件最基本的功能是将子元素渲染到 DOM 树的其他位置。这在需要将内容放置在 DOM 结构的特定位置时非常有用。

### 延迟挂载

当 `defer` 属性设置为 `true` 时，Teleport 会在组件挂载到 DOM 后再将内容传送到目标位置。这对于需要在目标元素完全准备就绪后再传送内容的场景很有用。

```tsx
<Teleport to="#modal" defer>
  <ModalContent />
</Teleport>
```

### 禁用传送

当 `disabled` 属性设置为 `true` 时，Teleport 组件会直接返回子组件，不会执行传送操作。这在需要条件性地启用或禁用传送功能时很有用。

```tsx
<Teleport to="#tooltip" disabled={disableTooltip}>
  <TooltipContent />
</Teleport>
```

## 注意事项

1. **目标元素必须存在**：目标选择器必须能匹配到实际存在的 DOM 元素，否则会输出警告信息。
2. **CSS 选择器有效性**：`to` 属性必须是有效的 CSS 选择器，否则会抛出错误。
3. **SSR 支持**：在服务端渲染模式下，Teleport 会返回注释节点，不会执行传送操作。
4. **生命周期兼容**：Teleport 支持停用/恢复操作，当传送的内容被停用时，会相应地激活/停用子组件。

## 错误处理

当目标元素不存在时，Teleport 会输出警告信息：
```
[WARN] Teleport target element not found: selector 'xxx' does not match any element in the DOM
```

当目标选择器无效时，Teleport 会输出警告信息：
```
[WARN] Teleport target selector invalid: 'xxx' is not a valid CSS selector - [error details]
```

## 示例

### 基本模态框示例

```tsx
function Modal({ isOpen, onClose, children }) {
  if (!isOpen) return null

  return (
    <Teleport to="body">
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          {children}
          <button onClick={onClose}>关闭</button>
        </div>
      </div>
    </Teleport>
  )
}
```

### 工具提示示例

```tsx
function Tooltip({ targetId, content }) {
  return (
    <Teleport to={`#${targetId}`}>
      <div className="tooltip">{content}</div>
    </Teleport>
  )
}
```

## SSR 注意事项

在服务端渲染（SSR）环境中，Teleport 组件不会执行传送操作，而是返回一个注释节点，以确保服务端渲染的一致性。
