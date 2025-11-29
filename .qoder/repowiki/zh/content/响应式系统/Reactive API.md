# Reactive API

<cite>
**本文档引用的文件**
- [proxy-handler.ts](file://packages/responsive/src/signal/reactive/proxy-handler.ts)
- [helpers.ts](file://packages/responsive/src/signal/reactive/helpers.ts)
- [ref.ts](file://packages/responsive/src/signal/ref/ref.ts)
- [readonly.ts](file://packages/responsive/src/signal/readonly/readonly.ts)
- [readonly-helpers.ts](file://packages/responsive/src/signal/readonly/helpers.ts)
- [proxy.ts](file://packages/responsive/src/signal/types/proxy.ts)
- [base.ts](file://packages/responsive/src/signal/types/base.ts)
- [depend.ts](file://packages/responsive/src/depend/depend.ts)
- [constants.ts](file://packages/responsive/src/signal/constants.ts)
</cite>

## 目录
1. [引言](#引言)
2. [Reactive API 核心架构](#reactive-api-核心架构)
3. [深层响应式追踪实现原理](#深层响应式追踪实现原理)
4. [Proxy处理器陷阱函数实现](#proxy处理器陷阱函数实现)
5. [readonly与shallowReactive行为差异](#readonly与shallowreactive行为差异)
6. [状态管理中的典型用法](#状态管理中的典型用法)
7. [与ref的互操作性](#与ref的互操作性)
8. [Proxy局限性及特殊处理策略](#proxy局限性及特殊处理策略)

## 引言
Reactive API是vitarx框架中实现响应式系统的核心机制，通过ES6 Proxy代理对象实现深层响应式追踪。该系统能够自动追踪对象属性的访问和修改，当数据发生变化时自动通知依赖的观察者进行更新。本文档将深入解析其内部实现原理，重点说明如何利用Proxy实现深层响应式追踪，以及不同响应式深度场景下的行为差异。

## Reactive API 核心架构

```mermaid
graph TD
A[Reactive] --> B[ReactiveProxyHandler]
C[ref] --> D[Ref]
E[readonly] --> F[ReadonlyHandler]
B --> G[ProxyHandler]
D --> H[RefSignal]
F --> I[ProxyHandler]
B --> J[Depend.track]
D --> J
K[SignalManager] --> L[notifySubscribers]
M[SubManager] --> N[subscribeProperties]
J --> M
L --> N
```

**图示来源**
- [proxy-handler.ts](file://packages/responsive/src/signal/reactive/proxy-handler.ts#L83-L156)
- [ref.ts](file://packages/responsive/src/signal/ref/ref.ts#L70-L287)
- [readonly.ts](file://packages/responsive/src/signal/readonly/readonly.ts#L39-L109)
- [depend.ts](file://packages/responsive/src/depend/depend.ts#L41-L152)

## 深层响应式追踪实现原理

Reactive API通过`ReactiveProxyHandler`类实现深层响应式追踪，其核心机制是利用ES6 Proxy拦截对象的属性访问和修改操作。当创建一个响应式对象时，系统会递归地为嵌套对象创建代理，从而实现深层响应式追踪。

深层响应式追踪的关键在于惰性代理机制：只有当访问某个嵌套属性时，才会为其创建代理对象。这种延迟创建的方式既保证了响应式能力，又避免了不必要的性能开销。

```mermaid
classDiagram
class ReactiveProxyHandler {
+target : AnyObject
+options : Required<SignalOptions>
+childSignalMap? : Map<AnyKey, BaseSignal>
+isArray : boolean
-_proxy : Reactive<T, Deep> | null
+constructor(target : T, options? : SignalOptions<Deep>)
+get proxy() : Reactive<T, Deep>
+get(target : T, prop : AnyKey, receiver : any) : any
+set(target : T, prop : AnyKey, newValue : any, receiver : any) : boolean
+has(target : T, prop : AnyKey) : boolean
+deleteProperty(target : T, prop : AnyKey) : boolean
-removeChildSignal(prop : AnyKey) : void
-notify(prop : AnyKey) : void
-track(prop : AnyKey) : void
}
class SignalManager {
+notifySubscribers(proxy : any, prop : any) : void
+bindParent(child : BaseSignal, parent : any, prop : any) : void
+unbindParent(child : BaseSignal, parent : any, prop : any, prop : any) : void
}
class Depend {
+static track(target : object, property : keyof any) : void
+static collect<T>(fn : () => T) : CollectionResult<T>
+static subscribe<R>(tracker : () => R, callback? : () => void, options? : SubscriberOptions) : DependSubscribeResult<R>
}
ReactiveProxyHandler --> SignalManager : "使用"
ReactiveProxyHandler --> Depend : "使用"
Depend --> SubManager : "使用"
```

**图示来源**
- [proxy-handler.ts](file://packages/responsive/src/signal/reactive/proxy-handler.ts#L83-L300)
- [manager.ts](file://packages/responsive/src/signal/manager.ts)
- [depend.ts](file://packages/responsive/src/depend/depend.ts#L41-L152)

**本节来源**
- [proxy-handler.ts](file://packages/responsive/src/signal/reactive/proxy-handler.ts#L83-L300)
- [helpers.ts](file://packages/responsive/src/signal/reactive/helpers.ts#L35-L43)

## Proxy处理器陷阱函数实现

### get陷阱函数实现

`get`陷阱函数是实现响应式追踪的核心，它负责拦截属性访问操作并收集依赖。当访问一个属性时，系统会记录这个访问行为，建立属性与观察者之间的依赖关系。

```mermaid
flowchart TD
Start([访问属性]) --> CheckSymbol["检查是否为内部符号属性"]
CheckSymbol --> |是| ReturnTrue["返回true"]
CheckSymbol --> |否| GetValue["获取属性值"]
GetValue --> CheckArray["是否为数组且访问函数"]
CheckArray --> |是| TrackLength["追踪length属性"] --> ReturnFunction["返回函数"]
CheckArray --> |否| CheckObject["是否为对象且需要深度代理"]
CheckObject --> |是| CheckChildMap["检查子代理映射"]
CheckChildMap --> |已存在| ReturnChildProxy["返回已存在的子代理"]
CheckChildMap --> |不存在| CreateChildProxy["创建子代理"] --> MapParent["建立父子关系映射"] --> ReturnChildProxy
CheckObject --> |否| TrackProperty["追踪属性访问"] --> ReturnValue["返回属性值"]
```

**图示来源**
- [proxy-handler.ts](file://packages/responsive/src/signal/reactive/proxy-handler.ts#L171-L214)

### set陷阱函数实现

`set`陷阱函数负责拦截属性设置操作，当属性值发生变化时通知所有依赖的观察者。系统会先比较新旧值，只有当值真正发生变化时才会触发更新。

```mermaid
flowchart TD
Start([设置属性]) --> GetOldValue["获取旧值"]
GetOldValue --> CompareValues["比较新旧值"]
CompareValues --> |相等| ReturnTrue["返回true，不触发更新"]
CompareValues --> |不等| RemoveChildSignal["移除子代理"]
RemoveChildSignal --> CheckRefSignal["检查是否为RefSignal"]
CheckRefSignal --> |是| UpdateRefValue["更新RefSignal的value"]
CheckRefSignal --> |否| SetTargetValue["设置目标对象值"]
SetTargetValue --> NotifyChange["通知属性变化"] --> ReturnTrue
```

**图示来源**
- [proxy-handler.ts](file://packages/responsive/src/signal/reactive/proxy-handler.ts#L251-L263)

### has和ownKeys陷阱函数实现

`has`陷阱函数用于拦截`in`操作符和`hasOwnProperty`方法调用，而`ownKeys`陷阱函数拦截`Object.keys`、`Object.getOwnPropertyNames`等操作。这些陷阱函数确保在访问对象元信息时也能正确收集依赖。

```mermaid
sequenceDiagram
participant Code as "用户代码"
participant Proxy as "ReactiveProxyHandler"
participant Depend as "Depend"
participant SubManager as "SubManager"
Code->>Proxy : prop in reactiveObj
Proxy->>Depend : track(prop)
Proxy->>Proxy : Reflect.has(target, prop)
Proxy-->>Code : 返回结果
Code->>Proxy : Object.keys(reactiveObj)
Proxy->>Depend : track(prop) for each key
Proxy->>Proxy : Reflect.ownKeys(target)
Proxy-->>Code : 返回键数组
```

**图示来源**
- [proxy-handler.ts](file://packages/responsive/src/signal/reactive/proxy-handler.ts#L237-L240)
- [proxy-handler.ts](file://packages/responsive/src/signal/reactive/proxy-handler.ts#L251-L263)

**本节来源**
- [proxy-handler.ts](file://packages/responsive/src/signal/reactive/proxy-handler.ts#L171-L263)

## readonly与shallowReactive行为差异

### readonly实现原理

`readonly`函数创建一个只读的代理对象，阻止对对象属性的修改和删除操作。它通过`ReadonlyHandler`类实现，该类拦截`set`和`deleteProperty`操作并根据配置采取不同的处理策略。

```mermaid
classDiagram
class ReadonlyHandler {
+create<T>(target : T, options? : ReadonlyOptions) : DeepReadonly<T>
+set(target : any, prop : any, value : any) : boolean
+deleteProperty(target : any, prop : any) : boolean
+get(target : T, prop : any, receiver : any) : any
-createMessage(prop : any) : string
}
class ReadonlyOptions {
+deep : boolean
+write : WriteHandleMode
+message : string
}
enum WriteHandleMode {
error
warning
warningAndWrite
}
ReadonlyHandler --> ReadonlyOptions
ReadonlyHandler --> WriteHandleMode
```

**图示来源**
- [readonly.ts](file://packages/responsive/src/signal/readonly/readonly.ts#L39-L109)
- [helpers.ts](file://packages/responsive/src/signal/readonly/helpers.ts#L28-L36)

### shallowReactive实现原理

`shallowReactive`函数创建一个浅层响应式对象，只对对象的直接属性进行响应式处理，而不递归处理嵌套对象。这与`reactive`函数的深层响应式形成对比。

```mermaid
flowchart TD
subgraph DeepReactive["深层响应式 (reactive)"]
DR_Start([访问嵌套属性])
DR_Check["检查是否为对象"]
DR_CreateProxy["为嵌套对象创建代理"]
DR_Track["追踪嵌套属性变化"]
end
subgraph ShallowReactive["浅层响应式 (shallowReactive)"]
SR_Start([访问嵌套属性])
SR_Return["直接返回原始值"]
SR_NoTrack["不追踪嵌套属性变化"]
end
DR_Start --> DR_Check --> DR_CreateProxy --> DR_Track
SR_Start --> SR_Return --> SR_NoTrack
```

**图示来源**
- [helpers.ts](file://packages/responsive/src/signal/reactive/helpers.ts#L56-L61)
- [helpers.ts](file://packages/responsive/src/signal/readonly/helpers.ts#L61-L66)

**本节来源**
- [readonly.ts](file://packages/responsive/src/signal/readonly/readonly.ts#L39-L136)
- [helpers.ts](file://packages/responsive/src/signal/readonly/helpers.ts#L28-L67)
- [helpers.ts](file://packages/responsive/src/signal/reactive/helpers.ts#L56-L61)

## 状态管理中的典型用法

### 基本响应式对象创建

使用`reactive`函数可以创建一个深层响应式对象，所有嵌套属性都会被自动转换为响应式。

```mermaid
flowchart TD
Start([创建响应式对象]) --> CallReactive["调用reactive函数"]
CallReactive --> CreateHandler["创建ReactiveProxyHandler实例"]
CreateHandler --> CheckOptions["检查代理配置"]
CheckOptions --> CreateProxy["创建Proxy代理"]
CreateProxy --> ReturnProxy["返回响应式代理对象"]
ReturnProxy --> TrackAccess["访问属性时自动追踪"]
TrackAccess --> NotifyChange["属性变化时自动通知"]
```

**图示来源**
- [helpers.ts](file://packages/responsive/src/signal/reactive/helpers.ts#L35-L43)
- [proxy-handler.ts](file://packages/responsive/src/signal/reactive/proxy-handler.ts#L378-L397)

### 数组响应式处理

对于数组类型，Reactive API有特殊的处理策略，特别是对`length`属性的追踪和数组方法的代理。

```mermaid
flowchart TD
ArrayStart([数组操作]) --> CheckLength["检查是否修改length属性"]
CheckLength --> |修改length| UpdateLength["更新length值"]
UpdateLength --> NotifyLength["通知length属性变化"]
CheckLength --> |其他操作| CheckMethod["检查是否调用数组方法"]
CheckMethod --> |是| TrackLength["追踪length属性"]
CheckMethod --> |否| NormalSet["正常设置值"]
NormalSet --> CheckLengthChange["检查length是否变化"]
CheckLengthChange --> |变化| NotifyLength
CheckLengthChange --> |不变| End
```

**图示来源**
- [proxy-handler.ts](file://packages/responsive/src/signal/reactive/proxy-handler.ts#L119-L138)

**本节来源**
- [helpers.ts](file://packages/responsive/src/signal/reactive/helpers.ts#L35-L43)
- [proxy-handler.ts](file://packages/responsive/src/signal/reactive/proxy-handler.ts#L119-L138)

## 与ref的互操作性

### ref与reactive的集成

`ref`和`reactive`是Reactive API的两个核心函数，它们可以无缝集成使用。当`ref`包装一个对象时，如果配置为深度响应式，该对象会被自动转换为`reactive`对象。

```mermaid
classDiagram
class Ref {
+_value : T
+_reactiveValue? : RefValue<T, Deep>
+_shouldProxyValue : boolean
+_options : Required<SignalOptions<Deep>>
+value : RefValue<T, Deep>
+constructor(value : T, options? : SignalOptions<Deep>)
+evaluateProxyNeeded() : void
+forceUpdate() : void
}
class ReactiveProxyHandler {
+target : AnyObject
+childSignalMap? : Map<AnyKey, BaseSignal>
}
Ref --> ReactiveProxyHandler : "使用"
SignalManager --> Ref : "管理父子关系"
SignalManager --> ReactiveProxyHandler : "管理父子关系"
```

**图示来源**
- [ref.ts](file://packages/responsive/src/signal/ref/ref.ts#L70-L287)
- [proxy-handler.ts](file://packages/responsive/src/signal/reactive/proxy-handler.ts#L83-L156)

### 自动解包机制

Reactive API实现了自动解包机制，当`reactive`对象包含`ref`时，访问这些属性会自动解包`ref`的`value`。

```mermaid
sequenceDiagram
participant Code as "用户代码"
participant Reactive as "ReactiveProxyHandler"
participant Ref as "Ref"
Code->>Reactive : 访问reactiveObj.refProp
Reactive->>Reactive : get陷阱函数执行
Reactive->>Reactive : 检查值是否为RefSignal
Reactive->>Ref : 是RefSignal，返回value值
Reactive-->>Code : 返回解包后的值
Code->>Reactive : 修改reactiveObj.refProp
Reactive->>Reactive : set陷阱函数执行
Reactive->>Reactive : 检查旧值是否为RefSignal
Reactive->>Ref : 是RefSignal，设置其value
Reactive-->>Code : 完成修改
```

**图示来源**
- [proxy-handler.ts](file://packages/responsive/src/signal/reactive/proxy-handler.ts#L193-L197)
- [proxy-handler.ts](file://packages/responsive/src/signal/reactive/proxy-handler.ts#L256-L258)

**本节来源**
- [ref.ts](file://packages/responsive/src/signal/ref/ref.ts#L70-L287)
- [proxy-handler.ts](file://packages/responsive/src/signal/reactive/proxy-handler.ts#L193-L197)

## Proxy局限性及特殊处理策略

### 数组特殊处理

由于Proxy无法直接监听数组索引的变化，Reactive API采用了特殊的策略来处理数组响应式。

```mermaid
flowchart TD
ArrayStart([数组操作]) --> CheckOperation["检查操作类型"]
CheckOperation --> |length修改| HandleLength["特殊处理length属性"]
CheckOperation --> |索引赋值| HandleIndex["正常代理，但追踪length"]
CheckOperation --> |数组方法| HandleMethod["代理数组方法，追踪length"]
HandleLength --> NotifyLength["通知length属性变化"]
HandleIndex --> CheckLengthChange["检查length是否变化"]
CheckLengthChange --> |变化| NotifyLength
CheckLengthChange --> |不变| End
HandleMethod --> CallOriginal["调用原生数组方法"]
CallOriginal --> CheckLengthChange
```

**图示来源**
- [proxy-handler.ts](file://packages/responsive/src/signal/reactive/proxy-handler.ts#L119-L138)

### 集合类型处理

对于Set和Map等集合类型，Reactive API通过创建特殊的代理来处理`size`属性的响应式追踪。

```mermaid
classDiagram
class CollectionProxy {
+target : Set|Map
+get(target : any, prop : string | symbol, receiver : any) : any
}
class Set {
+add()
+delete()
+clear()
+size
}
class Map {
+set()
+delete()
+clear()
+size
}
CollectionProxy --> Set : "代理"
CollectionProxy --> Map : "代理"
CollectionProxy --> Depend : "使用track"
CollectionProxy --> SignalManager : "使用notifySubscribers"
```

**图示来源**
- [proxy-handler.ts](file://packages/responsive/src/signal/reactive/proxy-handler.ts#L307-L343)

### 性能优化策略

Reactive API采用了多种性能优化策略，包括惰性代理、缓存机制和避免重复代理。

```mermaid
flowchart TD
Start([创建响应式对象]) --> CheckProxy["检查是否已是代理对象"]
CheckProxy --> |是| ReturnOriginal["直接返回原代理"]
CheckProxy --> |否| CheckFrozen["检查是否冻结对象"]
CheckFrozen --> |是| ThrowError["抛出错误"]
CheckFrozen --> |否| CheckRef["检查是否为ref"]
CheckRef --> |是| ThrowError
CheckRef --> |否| CreateNew["创建新代理"]
CreateNew --> Cache["缓存代理对象"]
Cache --> ReturnNew["返回新代理"]
```

**图示来源**
- [proxy-handler.ts](file://packages/responsive/src/signal/reactive/proxy-handler.ts#L388-L392)
- [readonly.ts](file://packages/responsive/src/signal/readonly/readonly.ts#L61-L64)

**本节来源**
- [proxy-handler.ts](file://packages/responsive/src/signal/reactive/proxy-handler.ts#L307-L397)
- [readonly.ts](file://packages/responsive/src/signal/readonly/readonly.ts#L61-L64)