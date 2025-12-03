# @vitarx/runtime-drivers

Vitarx 运行时默认驱动器包，提供虚拟节点的默认驱动实现。

## 简介

该包提供了 Vitarx 框架中各种虚拟节点类型的默认驱动器实现，负责虚拟节点的渲染、挂载、更新和卸载等生命周期操作。

## 驱动器类型

### 元素驱动器
- **RegularElementDriver** - 常规元素（支持子节点的元素）
- **VoidElementDriver** - 空元素（自闭合标签）
- **FragmentDriver** - 片段节点（不渲染实际 DOM）

### 特殊节点驱动器
- **TextDriver** - 文本节点
- **CommentDriver** - 注释节点

### 组件驱动器
- **StatelessWidgetDriver** - 无状态组件
- **StatefulWidgetDriver** - 有状态组件

## 使用方式

```typescript
import { registerDefaultDrivers } from '@vitarx/runtime-drivers'

// 注册所有默认驱动器
registerDefaultDrivers()
```

## 注意事项

- 这些驱动器提供平台无关的基础实现
- 特定平台（如 DOM、SSR）可能需要自定义驱动器来覆盖默认行为
- 必须在使用虚拟节点之前注册驱动器

## License

MIT
