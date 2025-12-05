# ref API

<cite>
**本文档中引用的文件**  
- [ref.ts](file://packages/responsive/src/signal/ref/ref.ts)
- [helpers.ts](file://packages/responsive/src/signal/ref/helpers.ts)
- [property.ts](file://packages/responsive/src/signal/ref/property.ts)
- [readonly.ts](file://packages/responsive/src/signal/ref/readonly.ts)
- [ref.test.ts](file://packages/responsive/__tests__/signal/ref.test.ts)
- [types/ref.ts](file://packages/responsive/src/signal/types/ref.ts)
- [base.ts](file://packages/responsive/src/signal/types/base.ts)
- [constants.ts](file://packages/responsive/src/signal/constants.ts)
- [conversion.ts](file://packages/responsive/src/signal/utils/conversion.ts)
- [verify.ts](file://packages/responsive/src/signal/utils/verify.ts)
</cite>

## 目录
1. [简介](#简介)
2. [核心组件](#核心组件)
3. [RefSignal类结构](#refsignal类结构)
4. [shallowRef浅层响应式](#shallowref浅层响应式)
5. [TypeScript类型定义](#typescript类型定义)
6. [辅助函数](#辅助函数)
7. [使用示例](#使用示例)

## 简介
`ref` API 是响应式系统的核心组成部分，用于创建包装原始值的响应式引用对象。通过 `.value` 属性访问和修改值，当值发生变化时会自动触发依赖更新。该API支持深度响应式和浅层响应式两种模式，适用于不同场景的性能优化需求。

## 核心组件

`ref` API 的核心实现位于 `packages/responsive/src/signal/ref/` 目录下，主要包括 `Ref` 类、`ref` 工厂函数以及相关的类型定义和工具函数。`Ref` 类实现了 `RefSignal` 接口，通过内部的 `_value` 存储原始值，并在访问 `.value` 时进行依赖追踪和响应式代理。

**本节来源**
- [ref.ts](file://packages/responsive/src/signal/ref/ref.ts#L70-L287)
- [types/ref.ts](file://packages/responsive/src/signal/types/ref.ts#L10-L22)

## RefSignal类结构

`Ref` 类是 `ref` API 的核心实现，其结构设计遵循响应式系统的基本原则：

```mermaid
classDiagram
class Ref {
+readonly [SIGNAL_SYMBOL] : true
+readonly [REF_SIGNAL_SYMBOL] : true
-_options : Required<SignalOptions<Deep>>
-_shouldProxyValue : boolean
-_reactiveValue? : RefValue<T, Deep>
-_value : T
+get value() : RefValue<T, Deep>
+set value(newValue : T)
+get [DEEP_SIGNAL_SYMBOL]() : Deep
+[Symbol.toPrimitive](hint : string) : any
+toString() : string
+forceUpdate() : void
+set(value : T) : void
+update(value : T) : void
}
class RefSignal {
<<interface>>
+readonly [REF_SIGNAL_SYMBOL] : true
+get value() : Value
+set value(newValue : Raw)
}
Ref --> RefSignal : "实现"
```

**图示来源**
- [ref.ts](file://packages/responsive/src/signal/ref/ref.ts#L70-L287)
- [types/ref.ts](file://packages/responsive/src/signal/types/ref.ts#L10-L22)

### 属性与方法说明

- **`[SIGNAL_SYMBOL]`**: 响应式信号标识符，用于标记对象为响应式信号
- **`[REF_SIGNAL_SYMBOL]`**: 值引用信号标识符，用于标记对象为引用类型信号
- **`_value`**: 私有属性，存储原始值
- **`_reactiveValue`**: 私有属性，存储代理后的响应式对象（当需要深度响应式时）
- **`value` getter**: 获取响应式值，同时追踪依赖
- **`value` setter**: 设置新值并触发更新通知
- **`forceUpdate()`**: 强制触发更新事件，即使值未改变
- **`set()` 和 `update()`**: 便捷方法，等同于直接设置 `value` 属性

**本节来源**
- [ref.ts](file://packages/responsive/src/signal/ref/ref.ts#L70-L287)
- [constants.ts](file://packages/responsive/src/signal/constants.ts#L1-L25)

## shallowRef浅层响应式

`shallowRef` 函数创建浅层响应式引用，只对顶层属性进行响应式处理，而不会递归代理嵌套对象。这种模式在处理大型数据结构或第三方不可变对象时能显著提升性能。

```mermaid
flowchart TD
Start([创建shallowRef]) --> CheckDeep["deep = false"]
CheckDeep --> CreateRef["创建Ref实例"]
CreateRef --> SetOptions["设置options.deep = false"]
SetOptions --> ReturnRef["返回浅层响应式引用"]
subgraph "值访问"
AccessValue["访问.value"] --> CheckProxy["是否需要代理?"]
CheckProxy --> |否| ReturnOriginal["返回原始值"]
CheckProxy --> |是| CreateReactive["创建响应式代理"]
CreateReactive --> ReturnProxy["返回代理对象"]
end
subgraph "值设置"
SetValue["设置.value"] --> CompareValues["比较新旧值"]
CompareValues --> |不同| UpdateValue["更新_value"]
UpdateValue --> Notify["通知订阅者"]
CompareValues --> |相同| End
end
```

**图示来源**
- [ref.ts](file://packages/responsive/src/signal/ref/ref.ts#L413-L472)
- [ref.test.ts](file://packages/responsive/__tests__/signal/ref.test.ts#L64-L70)

### 适用场景

- 大型数据结构：避免深度代理带来的性能开销
- 第三方不可变对象：保持对象的不可变性
- 频繁更新的复杂对象：减少不必要的响应式转换

**本节来源**
- [ref.ts](file://packages/responsive/src/signal/ref/ref.ts#L413-L472)
- [ref.test.ts](file://packages/responsive/__tests__/signal/ref.test.ts#L64-L70)

## TypeScript类型定义

`ref` API 提供了完整的 TypeScript 类型支持，确保类型安全和开发体验。

```mermaid
classDiagram
class RefSignal {
<<interface>>
+readonly [REF_SIGNAL_SYMBOL] : true
+get value() : Value
+set value(newValue : Raw)
}
class BaseSignal {
<<interface>>
+readonly [SIGNAL_SYMBOL] : true
+readonly [SIGNAL_RAW_VALUE_SYMBOL] : Raw
+readonly [DEEP_SIGNAL_SYMBOL]? : Deep
}
class SignalOptions {
+deep? : Deep
+compare? : CompareFunction
}
class Ref {
+constructor(value : T, options? : SignalOptions<Deep>)
+get value() : RefValue<T, Deep>
+set value(newValue : T)
}
RefSignal <-- BaseSignal : "扩展"
RefSignal <-- Ref : "实现"
Ref <-- ref : "工厂函数"
SignalOptions <-- Ref : "使用"
```

**图示来源**
- [types/ref.ts](file://packages/responsive/src/signal/types/ref.ts#L10-L22)
- [base.ts](file://packages/responsive/src/signal/types/base.ts#L55-L88)
- [ref.ts](file://packages/responsive/src/signal/ref/ref.ts#L70-L287)

### 主要类型

- **`RefSignal<T, R>`**: 引用信号接口，定义了 `value` 属性的 getter 和 setter
- **`BaseSignal<R, D>`**: 基础信号接口，包含信号标识符和原始值访问
- **`SignalOptions<D>`**: 信号配置选项，支持 `deep` 和 `compare` 参数
- **`UnwrapNestedRefs<T>`**: 递归解包嵌套响应式信号值的工具类型

**本节来源**
- [types/ref.ts](file://packages/responsive/src/signal/types/ref.ts#L10-L22)
- [base.ts](file://packages/responsive/src/signal/types/base.ts#L55-L88)
- [ref.ts](file://packages/responsive/src/signal/ref/ref.ts#L39-L54)

## 辅助函数

`ref` API 提供了一系列辅助函数来增强使用体验和灵活性。

### toRef 和 toRefs

```mermaid
flowchart TD
toRefStart["toRef(arg1, arg2?, arg3?)"] --> CheckArgs["参数数量 >= 2?"]
CheckArgs --> |是| ObjectProperty["对象属性重载"]
CheckArgs --> |否| CheckValue["检查arg1"]
ObjectProperty --> CheckRef["isRefSignal(arg1[arg2])?"]
CheckRef --> |是| ReturnOriginal["返回原Ref"]
CheckRef --> |否| CreatePropertyRef["创建PropertyRef实例"]
CreatePropertyRef --> ReturnPropertyRef["返回PropertyRef"]
CheckValue --> IsRef["isRefSignal(arg1)?"]
IsRef --> |是| ReturnRef["返回原Ref"]
IsRef --> |否| IsFunction["typeof arg1 === 'function'?"]
IsFunction --> |是| CreateReadonlyRef["创建ReadonlyRef"]
IsFunction --> |否| CreateRef["创建Ref"]
```

**图示来源**
- [helpers.ts](file://packages/responsive/src/signal/ref/helpers.ts#L141-L164)
- [property.ts](file://packages/responsive/src/signal/ref/property.ts#L36-L54)
- [readonly.ts](file://packages/responsive/src/signal/ref/readonly.ts#L33-L73)

### unref 和 toRaw

- **`unref<T>(ref)`**: 如果输入是 `RefSignal` 对象，则返回其 `.value`；否则原样返回
- **`toRaw<T>(signal)`**: 将响应式信号对象转换为其原始值，不会触发依赖收集

**本节来源**
- [helpers.ts](file://packages/responsive/src/signal/ref/helpers.ts#L38-L40)
- [conversion.ts](file://packages/responsive/src/signal/utils/conversion.ts#L43-L48)
- [verify.ts](file://packages/responsive/src/signal/utils/verify.ts#L24-L25)

## 使用示例

### 基本用法

```mermaid
sequenceDiagram
participant Component
participant Ref
participant Depend
participant Watcher
Component->>Ref : ref(0)
Ref->>Ref : 创建Ref实例
Ref-->>Component : 返回ref对象
Component->>Ref : count.value++
Ref->>Depend : track(this, 'value')
Ref->>Watcher : notifySubscribers(this, 'value')
Watcher->>Component : 执行副作用函数
```

**图示来源**
- [ref.test.ts](file://packages/responsive/__tests__/signal/ref.test.ts#L17-L28)
- [ref.ts](file://packages/responsive/src/signal/ref/ref.ts#L136-L147)

### 组件中使用

- 创建响应式变量
- 绑定DOM引用
- 与 `computed` 和 `watch` 集成使用

**本节来源**
- [ref.test.ts](file://packages/responsive/__tests__/signal/ref.test.ts#L15-L187)
- [ref.ts](file://packages/responsive/src/signal/ref/ref.ts#L70-L287)