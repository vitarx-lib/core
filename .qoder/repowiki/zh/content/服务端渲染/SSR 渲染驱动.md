# SSR 渲染驱动

<cite>
**本文档引用的文件**  
- [index.ts](file://packages/runtime-ssr/src/index.ts)
- [createSSRApp.ts](file://packages/runtime-ssr/src/app/createSSRApp.ts)
- [SSRApp.ts](file://packages/runtime-ssr/src/app/SSRApp.ts)
- [renderToString.ts](file://packages/runtime-ssr/src/server/string/renderToString.ts)
- [renderToStream.ts](file://packages/runtime-ssr/src/server/stream/renderToStream.ts)
- [SSRRenderDriver.ts](file://packages/runtime-ssr/src/server/drivers/SSRRenderDriver.ts)
- [HydrateDriver.ts](file://packages/runtime-ssr/src/client/drivers/HydrateDriver.ts)
- [context.ts](file://packages/runtime-ssr/src/shared/context.ts)
- [serialize.ts](file://packages/runtime-ssr/src/shared/serialize.ts)
- [sink.ts](file://packages/runtime-ssr/src/shared/sink.ts)
- [html.ts](file://packages/runtime-ssr/src/shared/html.ts)
- [factory.ts](file://packages/runtime-ssr/src/factory.ts)
- [api.ts](file://packages/runtime-core/src/renderer/api.ts)
- [driver.ts](file://packages/runtime-core/src/vnode/core/driver.ts)
</cite>

## 目录
1. [简介](#简介)
2. [项目结构](#项目结构)
3. [核心组件](#核心组件)
4. [架构概述](#架构概述)
5. [详细组件分析](#详细组件分析)
6. [依赖分析](#依赖分析)
7. [性能考虑](#性能考虑)
8. [故障排除指南](#故障排除指南)
9. [结论](#结论)

## 简介
Vitarx 的 SSR 渲染驱动模块提供了完整的服务端渲染解决方案，支持同步字符串渲染和流式渲染两种模式。该系统通过虚拟节点树的构建、渲染和序列化，实现了高效的服务器端 HTML 生成，并通过水合机制在客户端恢复交互性。本文档详细分析了 SSR 驱动的核心架构、关键组件和工作流程。

## 项目结构
SSR 渲染驱动位于 `packages/runtime-ssr` 目录下，采用模块化设计，分为服务端渲染、客户端水合和共享模块三个主要部分。

```mermaid
graph TB
subgraph "SSR 渲染驱动"
A[入口 index.ts]
B[应用层 app/]
C[服务端 server/]
D[客户端 client/]
E[共享模块 shared/]
F[工厂 factory.ts]
end
A --> B
A --> C
A --> D
A --> E
A --> F
B --> |创建| SSRApp
B --> |创建| createSSRApp
C --> |字符串渲染| renderToString
C --> |流式渲染| renderToStream
C --> |驱动| SSRRenderDriver
D --> |水合| hydrate
D --> |驱动| HydrateDriver
E --> |上下文| context.ts
E --> |序列化| serialize.ts
E --> |输出| sink.ts
E --> |HTML| html.ts
```

**图示来源**
- [index.ts](file://packages/runtime-ssr/src/index.ts)
- [app/](file://packages/runtime-ssr/src/app/)
- [server/](file://packages/runtime-ssr/src/server/)
- [client/](file://packages/runtime-ssr/src/client/)
- [shared/](file://packages/runtime-ssr/src/shared/)

**本节来源**
- [index.ts](file://packages/runtime-ssr/src/index.ts)

## 核心组件
SSR 渲染驱动的核心组件包括：SSR 应用实例、渲染驱动器、序列化器和上下文管理。这些组件协同工作，实现了从虚拟节点树到 HTML 字符串或流的转换过程。系统支持两种主要渲染模式：同步模式（等待所有异步任务完成后再输出）和流式模式（渐进式输出，遇到异步任务时阻塞等待）。

**本节来源**
- [index.ts](file://packages/runtime-ssr/src/index.ts)
- [createSSRApp.ts](file://packages/runtime-ssr/src/app/createSSRApp.ts)
- [SSRRenderDriver.ts](file://packages/runtime-ssr/src/server/drivers/SSRRenderDriver.ts)

## 架构概述
SSR 渲染驱动采用分层架构设计，各层职责分明，通过清晰的接口进行通信。系统核心是虚拟节点树的构建和渲染流程，结合特定的驱动器实现服务端和客户端的不同行为。

```mermaid
graph TD
subgraph "渲染流程"
A[创建 SSR 应用] --> B[设置渲染驱动]
B --> C[构建虚拟节点树]
C --> D{渲染模式}
D --> |同步| E[等待所有异步任务]
D --> |流式| F[逐节点阻塞等待]
E --> G[一次性序列化]
F --> H[渐进式序列化]
G --> I[输出 HTML]
H --> I
end
subgraph "核心组件"
J[SSRApp] --> K[SSRRenderDriver]
K --> L[serializeVNodeToSink]
L --> M[StringSink/StreamingSink]
M --> N[HTML 输出]
end
subgraph "客户端水合"
O[hydrate] --> P[HydrateDriver]
P --> Q[复用 DOM]
Q --> R[绑定事件]
R --> S[激活组件]
end
```

**图示来源**
- [renderToString.ts](file://packages/runtime-ssr/src/server/string/renderToString.ts)
- [renderToStream.ts](file://packages/runtime-ssr/src/server/stream/renderToStream.ts)
- [SSRRenderDriver.ts](file://packages/runtime-ssr/src/server/drivers/SSRRenderDriver.ts)
- [hydrate.ts](file://packages/runtime-ssr/src/client/hydrate.ts)

## 详细组件分析

### SSR 应用组件分析
SSR 应用组件负责创建和管理服务端渲染的应用实例，提供统一的 API 接口。

#### 类图
```mermaid
classDiagram
class SSRApp {
+mount(container) SSRApp
}
class App {
+mount(container) this
}
SSRApp --|> App : "继承"
```

**图示来源**
- [SSRApp.ts](file://packages/runtime-ssr/src/app/SSRApp.ts)
- [createSSRApp.ts](file://packages/runtime-ssr/src/app/createSSRApp.ts)

#### 创建流程
```mermaid
sequenceDiagram
participant 用户 as "用户代码"
participant createSSRApp as "createSSRApp"
participant SSRApp as "SSRApp"
participant setHostSchema as "setHostSchema"
用户->>createSSRApp : createSSRApp(root, config)
createSSRApp->>setHostSchema : 设置空元素模式
setHostSchema-->>createSSRApp : 完成
createSSRApp->>SSRApp : new SSRApp(root, config)
SSRApp-->>createSSRApp : 返回实例
createSSRApp-->>用户 : 返回 SSRApp 实例
```

**图示来源**
- [createSSRApp.ts](file://packages/runtime-ssr/src/app/createSSRApp.ts)

**本节来源**
- [SSRApp.ts](file://packages/runtime-ssr/src/app/SSRApp.ts)
- [createSSRApp.ts](file://packages/runtime-ssr/src/app/createSSRApp.ts)

### 服务端渲染组件分析
服务端渲染组件实现了两种主要的渲染模式：同步字符串渲染和流式渲染，通过不同的驱动器和序列化策略来处理虚拟节点树。

#### 同步渲染流程
```mermaid
flowchart TD
Start([开始 renderToString]) --> SetDriver["设置 SSRRenderDriver"]
SetDriver --> SetMode["设置渲染模式为 sync"]
SetMode --> InitTasks["初始化异步任务队列"]
InitTasks --> RenderTree["渲染虚拟节点树"]
RenderTree --> WaitTasks["等待所有异步任务完成"]
WaitTasks --> Serialize["序列化主树到 StringSink"]
Serialize --> Cleanup["清理内部状态"]
Cleanup --> Return["返回 HTML 字符串"]
Return --> End([结束])
```

**图示来源**
- [renderToString.ts](file://packages/runtime-ssr/src/server/string/renderToString.ts)

#### 流式渲染流程
```mermaid
flowchart TD
Start([开始 renderToStream]) --> SetDriver["设置 SSRRenderDriver"]
SetDriver --> SetMode["设置渲染模式为 stream"]
SetMode --> InitMap["初始化节点异步映射"]
InitMap --> RenderTree["渲染虚拟节点树"]
RenderTree --> StreamSerialize["流式序列化节点"]
StreamSerialize --> CheckAsync["检查节点异步任务"]
CheckAsync --> |有任务| WaitTask["等待任务完成"]
CheckAsync --> |无任务| Continue["继续序列化"]
WaitTask --> Continue
Continue --> Output["输出 HTML 片段"]
Output --> NextNode["下一个节点"]
NextNode --> StreamSerialize
StreamSerialize --> |完成| Cleanup["清理内部状态"]
Cleanup --> Close["关闭流"]
Close --> End([结束])
```

**图示来源**
- [renderToStream.ts](file://packages/runtime-ssr/src/server/stream/renderToStream.ts)

#### SSR 渲染驱动
```mermaid
classDiagram
class SSRRenderDriver {
+render(node) ElementOf<T>
+activate() void
+deactivate() void
+mount() void
+unmount() void
+updateProps() void
}
class NodeDriver {
<<interface>>
+render(node) ElementOf<T>
+activate() void
+deactivate() void
+mount() void
+unmount() void
+updateProps() void
}
SSRRenderDriver --|> NodeDriver : "实现"
```

**图示来源**
- [SSRRenderDriver.ts](file://packages/runtime-ssr/src/server/drivers/SSRRenderDriver.ts)

**本节来源**
- [renderToString.ts](file://packages/runtime-ssr/src/server/string/renderToString.ts)
- [renderToStream.ts](file://packages/runtime-ssr/src/server/stream/renderToStream.ts)
- [SSRRenderDriver.ts](file://packages/runtime-ssr/src/server/drivers/SSRRenderDriver.ts)

### 客户端水合组件分析
客户端水合组件负责将服务端渲染的静态 HTML 与客户端应用进行绑定，恢复交互性和状态。

#### 水合流程
```mermaid
sequenceDiagram
participant 用户 as "用户代码"
participant hydrate as "hydrate"
participant HydrateDriver as "HydrateDriver"
participant Context as "SSRContext"
用户->>hydrate : hydrate(root, container, context)
hydrate->>Context : 设置水合上下文
Context-->>hydrate : 完成
hydrate->>HydrateDriver : 设置为默认驱动
HydrateDriver-->>hydrate : 完成
hydrate->>hydrate : runInRenderContext
hydrate->>hydrate : renderNode(rootNode)
hydrate->>hydrate : mountNode(rootNode)
hydrate->>Context : 清理水合状态
Context-->>hydrate : 完成
hydrate-->>用户 : 完成水合
```

**图示来源**
- [hydrate.ts](file://packages/runtime-ssr/src/client/hydrate.ts)

#### 水合驱动器
```mermaid
classDiagram
class HydrateDriver {
+render(node) ElementOf<T>
+mount(node) void
+activate(node) void
+deactivate(node) void
+unmount(node) void
+updateProps(node) void
}
class NodeDriver {
<<interface>>
+render(node) ElementOf<T>
+activate() void
+deactivate() void
+mount() void
+unmount() void
+updateProps() void
}
HydrateDriver --|> NodeDriver : "实现"
```

**图示来源**
- [HydrateDriver.ts](file://packages/runtime-ssr/src/client/drivers/HydrateDriver.ts)

**本节来源**
- [hydrate.ts](file://packages/runtime-ssr/src/client/hydrate.ts)
- [HydrateDriver.ts](file://packages/runtime-ssr/src/client/drivers/HydrateDriver.ts)

### 共享模块分析
共享模块提供了 SSR 渲染过程中所需的通用功能和数据结构，包括上下文管理、序列化和 HTML 处理。

#### 上下文管理
```mermaid
classDiagram
class SSRContext {
+$renderMode? : SSRRenderMode
+$asyncTasks? : Promise<unknown>[]
+$nodeAsyncMap? : WeakMap<VNode, Promise<unknown>>
+$isHydrating? : boolean
+$hydrateContainer? : Element
+$hydratePathStack? : number[]
}
class SSRInternalContext {
+$renderMode? : SSRRenderMode
+$asyncTasks? : Promise<unknown>[]
+$nodeAsyncMap? : WeakMap<VNode, Promise<unknown>>
+$isHydrating? : boolean
+$hydrateContainer? : Element
+$hydratePathStack? : number[]
}
SSRContext --|> SSRInternalContext : "扩展"
class SSRRenderMode {
<<枚举>>
sync
stream
}
SSRContext --> SSRRenderMode : "引用"
```

**图示来源**
- [context.ts](file://packages/runtime-ssr/src/shared/context.ts)

#### 序列化流程
```mermaid
flowchart TD
Start([开始 serializeVNodeToSink]) --> CheckKind["检查节点类型"]
CheckKind --> |常规元素| SerializeRegular["序列化常规元素"]
CheckKind --> |空元素| SerializeVoid["序列化空元素"]
CheckKind --> |文本| SerializeText["序列化文本"]
CheckKind --> |注释| SerializeComment["序列化注释"]
CheckKind --> |片段| SerializeFragment["序列化片段"]
CheckKind --> |组件| SerializeWidget["序列化组件"]
SerializeRegular --> AddPath["添加 data-vx-path"]
AddPath --> OpenTag["生成开始标签"]
OpenTag --> CheckVHtml["检查 v-html"]
CheckVHtml --> |有| OutputHtml["输出 HTML 内容"]
CheckVHtml --> |无| SerializeChildren["序列化子节点"]
SerializeChildren --> CloseTag["生成结束标签"]
SerializeVoid --> AddPath
AddPath --> SelfClosing["生成自闭合标签"]
SerializeText --> Escape["转义 HTML"]
SerializeComment --> Wrap["包装为注释"]
SerializeFragment --> StartComment["输出开始注释"]
StartComment --> SerializeChildrenFragment["序列化子节点"]
SerializeChildrenFragment --> EndComment["输出结束注释"]
SerializeWidget --> GetChild["获取子节点"]
GetChild --> SerializeChild["序列化子节点"]
```

**图示来源**
- [serialize.ts](file://packages/runtime-ssr/src/shared/serialize.ts)
- [html.ts](file://packages/runtime-ssr/src/shared/html.ts)
- [sink.ts](file://packages/runtime-ssr/src/shared/sink.ts)

**本节来源**
- [context.ts](file://packages/runtime-ssr/src/shared/context.ts)
- [serialize.ts](file://packages/runtime-ssr/src/shared/serialize.ts)
- [sink.ts](file://packages/runtime-ssr/src/shared/sink.ts)
- [html.ts](file://packages/runtime-ssr/src/shared/html.ts)

## 依赖分析
SSR 渲染驱动与其他核心模块之间存在明确的依赖关系，通过接口和工厂模式实现解耦。

```mermaid
graph TD
subgraph "runtime-ssr"
A[SSRApp]
B[SSRRenderDriver]
C[HydrateDriver]
D[共享模块]
end
subgraph "runtime-core"
E[App]
F[NodeDriver]
G[renderNode]
H[getRenderer]
end
subgraph "runtime-dom"
I[DomRenderer]
J[VOID_ELEMENTS]
end
subgraph "utils"
K[isPromise]
end
A --> E
B --> G
B --> F
C --> G
C --> F
D --> H
A --> J
B --> K
subgraph "初始化"
L[factory.ts]
L --> |服务端| M[空渲染器代理]
L --> |客户端| N[DomRenderer]
L --> H
end
```

**图示来源**
- [factory.ts](file://packages/runtime-ssr/src/factory.ts)
- [api.ts](file://packages/runtime-core/src/renderer/api.ts)
- [driver.ts](file://packages/runtime-core/src/vnode/core/driver.ts)

**本节来源**
- [factory.ts](file://packages/runtime-ssr/src/factory.ts)
- [api.ts](file://packages/runtime-core/src/renderer/api.ts)
- [driver.ts](file://packages/runtime-core/src/vnode/core/driver.ts)

## 性能考虑
SSR 渲染驱动在设计时充分考虑了性能因素，提供了两种渲染模式以适应不同的应用场景。同步模式适合需要完整内容的场景，而流式模式可以实现渐进式加载，提高首屏渲染速度。系统通过异步任务队列和节点映射机制，有效管理异步组件的解析过程，避免阻塞主线程。此外，序列化过程采用缓冲区和流式输出，减少了内存占用和延迟。

## 故障排除指南
在使用 SSR 渲染驱动时，可能会遇到一些常见问题。以下是故障排除建议：

1. **渲染模式未设置**：确保在调用渲染函数前正确设置了渲染模式，否则可能导致行为异常。
2. **异步任务未完成**：在同步模式下，确保所有异步任务都已正确添加到任务队列中。
3. **水合失败**：检查服务端和客户端的虚拟节点树是否一致，路径栈是否正确匹配。
4. **事件绑定问题**：确认水合驱动正确绑定了事件处理程序，特别是在动态内容场景下。
5. **样式丢失**：检查 class 和 style 属性的序列化是否正确处理了对象和数组格式。

**本节来源**
- [context.ts](file://packages/runtime-ssr/src/shared/context.ts)
- [SSRRenderDriver.ts](file://packages/runtime-ssr/src/server/drivers/SSRRenderDriver.ts)
- [HydrateDriver.ts](file://packages/runtime-ssr/src/client/drivers/HydrateDriver.ts)

## 结论
Vitarx 的 SSR 渲染驱动提供了一套完整且高效的服务端渲染解决方案。通过模块化设计和清晰的架构分层，系统实现了同步和流式两种渲染模式的支持，满足了不同应用场景的需求。驱动器模式的设计使得服务端和客户端的行为可以灵活切换，而共享的虚拟节点树确保了渲染结果的一致性。水合机制有效地连接了服务端和客户端，实现了无缝的用户体验过渡。整体设计注重性能和可维护性，为构建高性能的 SSR 应用提供了坚实的基础。