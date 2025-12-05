# 响应式API

<cite>
**本文档中引用的文件**   
- [ref.ts](file://packages/responsive/src/signal/ref/ref.ts#L1-L473)
- [computed.ts](file://packages/responsive/src/signal/computed/computed.ts#L1-L367)
- [watch.ts](file://packages/responsive/src/signal/watch/watch.ts#L1-L432)
- [proxy-handler.ts](file://packages/responsive/src/signal/reactive/proxy-handler.ts#L1-L398)
- [base.ts](file://packages/responsive/src/signal/types/base.ts#L1-L89)
- [ref.ts](file://packages/responsive/src/signal/types/ref.ts#L1-L23)
- [proxy.ts](file://packages/responsive/src/signal/types/proxy.ts#L1-L19)
- [conversion.ts](file://packages/responsive/src/signal/utils/conversion.ts#L1-L49)
- [verify.ts](file://packages/responsive/src/signal/utils/verify.ts#L1-L85)
</cite>

## 目录
1. [引言](#引言)
2. [核心响应式API概览](#核心响应式api概览)
3. [ref函数详解](#ref函数详解)
4. [reactive函数详解](#reactive函数详解)
5. [computed函数详解](#computed函数详解)
6. [watch函数详解](#watch函数详解)
7. [类型定义与工具函数](#类型定义与工具函数)
8. [总结](#总结)

## 引言
响应式API是现代前端框架的核心，它允许开发者创建能够自动追踪依赖并在数据变化时自动更新的响应式系统。本文档深入解析`ref`、`reactive`、`computed`和`watch`等核心响应式函数的实现原理、类型定义和使用场景，为开发者提供全面的技术参考。

## 核心响应式API概览
响应式系统通过`ref`、`reactive`、`computed`和`watch`四个核心函数构建。`ref`用于创建基本类型的响应式引用，`reactive`用于创建对象的深度响应式代理，`computed`用于创建基于其他响应式数据计算得出的派生数据，而`watch`则用于监听响应式数据的变化并执行副作用。

**Section sources**
- [ref.ts](file://packages/responsive/src/signal/ref/ref.ts#L1-L473)
- [computed.ts](file://packages/responsive/src/signal/computed/computed.ts#L1-L367)
- [watch.ts](file://packages/responsive/src/signal/watch/watch.ts#L1-L432)
- [proxy-handler.ts](file://packages/responsive/src/signal/reactive/proxy-handler.ts#L1-L398)

## ref函数详解
`ref`函数是创建响应式引用的基础，它将一个值包装成一个响应式对象，使其`value`属性的变化能够被系统追踪。

### 类型定义与重载签名
`ref`函数提供了多个重载签名，支持不同场景的使用：
```typescript
// 无参数重载，返回any类型的Ref
function ref(): Ref<any>
// 泛型重载，返回指定类型的Ref
function ref<Value>(): Ref<Value | undefined>
// 主要重载，支持传入值和配置选项
function ref<Value, Deep extends boolean = true>(
  value: Value | Ref<Value, Deep>,
  options?: SignalOptions<Deep> | Deep
): Ref<Value, Deep>
```

### Ref对象的value属性
`Ref`类的`value`属性是响应式的核心，其getter和setter实现了依赖追踪和更新通知：
- **getter**: 当访问`value`时，会调用`Depend.track`进行依赖收集，如果值是对象且需要深度代理，则创建响应式代理。
- **setter**: 当设置新值时，会使用配置的比较函数判断是否需要触发更新，清理旧的响应式代理，更新内部值并通知订阅者。

### set和update方法
`Ref`类提供了`set`和`update`两个便捷方法，它们都等同于直接设置`value`属性，提供了更语义化的API：
```typescript
set = (value: T) => (this.value = value)
update = (value: T) => (this.value = value)
```

### shallowRef特殊用途
`shallowRef`函数创建一个浅层响应式引用，其`deep`选项被强制设置为`false`，这意味着即使值是对象，也不会被深度代理。这在处理大型对象或不需要深度响应的场景下非常有用，可以避免不必要的性能开销。

**Section sources**
- [ref.ts](file://packages/responsive/src/signal/ref/ref.ts#L70-L473)
- [types/base.ts](file://packages/responsive/src/signal/types/base.ts#L32-L47)
- [types/ref.ts](file://packages/responsive/src/signal/types/ref.ts#L10-L22)

## reactive函数详解
`reactive`函数通过ES6 Proxy创建一个深度响应式代理对象，使得对象的所有属性访问和修改都能被系统追踪。

### 深度响应式代理原理
`ReactiveProxyHandler`类实现了Proxy的处理器接口，通过拦截`get`、`set`、`deleteProperty`等操作来实现响应式：
- **get拦截**: 当访问属性时，会进行依赖收集（`track`），如果是对象且需要深度代理，则递归创建子代理。
- **set拦截**: 当设置属性时，会使用比较函数判断值是否变化，如果变化则通知订阅者（`notify`）。
- **惰性深度代理**: 子对象的代理是惰性创建的，只有在访问时才会创建，避免了不必要的代理开销。

### 数组和集合的特殊处理
对于数组和集合（Set、Map），`reactive`有特殊的处理逻辑：
- **数组**: 会监听`length`属性的变化，并在数组方法调用时触发更新。
- **集合**: 会监听`size`属性的变化，并在`add`、`delete`、`clear`等方法调用时触发更新。

**Section sources**
- [proxy-handler.ts](file://packages/responsive/src/signal/reactive/proxy-handler.ts#L83-L398)
- [types/proxy.ts](file://packages/responsive/src/signal/types/proxy.ts#L12-L19)

## computed函数详解
`computed`函数创建一个计算属性，其值由一个getter函数计算得出，并在依赖变化时自动重新计算。

### getter和setter配置
`computed`支持getter和setter两种配置：
- **getter**: 必需的函数，用于计算并返回派生值。系统会自动追踪getter内部访问的响应式数据作为依赖。
- **setter**: 可选的函数，用于处理对计算属性的赋值操作。通常用于反向更新依赖的数据。

### immediate和scope参数
`computed`函数支持两个重要的配置选项：
- **immediate**: 如果设置为`true`，则在创建时立即执行getter并计算结果，而不是采用懒计算模式。
- **scope**: 控制计算属性是否自动添加到当前的`EffectScope`中，便于统一管理生命周期。

### 懒计算与缓存
`computed`采用懒计算策略，只有在首次访问`value`时才会执行getter并缓存结果。后续访问时，如果依赖没有变化，则直接返回缓存的值，避免了重复计算。

**Section sources**
- [computed.ts](file://packages/responsive/src/signal/computed/computed.ts#L98-L367)
- [types/base.ts](file://packages/responsive/src/signal/types/base.ts#L32-L47)

## watch函数详解
`watch`函数用于监听响应式数据的变化并执行副作用函数。

### 监听源类型
`watch`支持多种监听源类型：
- **信号对象**: 直接监听`Ref`或`Reactive`对象的变化。
- **函数**: 监听函数内部依赖的响应式数据变化，若无依赖则监听函数返回值。
- **数组**: 监听多个信号对象或函数的变化。

### 回调函数签名
`watch`的回调函数接收三个参数：
- **newValue**: 变化后的新值。
- **oldValue**: 变化前的旧值。
- **onCleanup**: 用于注册清理函数的回调，清理函数会在下次回调触发前或监听被销毁时执行。

### clone和immediate选项
`watch`函数支持两个关键选项：
- **clone**: 如果设置为`true`，则会对新旧值进行深度克隆，解决对象引用无法辨别差异的问题，但会带来额外的性能开销。
- **immediate**: 如果设置为`true`，则在创建监听器时立即执行一次回调。

**Section sources**
- [watch.ts](file://packages/responsive/src/signal/watch/watch.ts#L192-L432)
- [types/base.ts](file://packages/responsive/src/signal/types/base.ts#L32-L47)

## 类型定义与工具函数
响应式系统依赖于一系列精心设计的类型定义和工具函数来保证类型安全和功能正确。

### 核心类型定义
- **BaseSignal**: 响应式信号的基础接口，定义了所有信号共有的标识符。
- **RefSignal**: 引用信号的接口，扩展了`BaseSignal`，定义了`value`属性的getter和setter。
- **ProxySignal**: 代理信号的类型，结合了`BaseSignal`和代理对象的特性。

### 工具函数
- **toRaw**: 将响应式信号转换为其原始值，常用于需要直接访问原始数据的场景。
- **isSignal/isRefSignal/isProxySignal**: 一系列类型守卫函数，用于检查值是否为特定类型的信号。

**Section sources**
- [types/base.ts](file://packages/responsive/src/signal/types/base.ts#L1-L89)
- [types/ref.ts](file://packages/responsive/src/signal/types/ref.ts#L1-L23)
- [types/proxy.ts](file://packages/responsive/src/signal/types/proxy.ts#L1-L19)
- [conversion.ts](file://packages/responsive/src/signal/utils/conversion.ts#L1-L49)
- [verify.ts](file://packages/responsive/src/signal/utils/verify.ts#L1-L85)

## 总结
本文档详细解析了响应式API的核心函数，包括`ref`、`reactive`、`computed`和`watch`的实现原理、类型定义和使用场景。这些API共同构建了一个强大而灵活的响应式系统，为开发者提供了声明式编程的能力。理解这些API的底层机制有助于更好地利用它们构建高效、可维护的应用程序。