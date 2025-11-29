# API参考

<cite>
**本文档中引用的文件**  
- [index.ts](file://packages/vitarx/src/index.ts)
- [jsx-runtime.ts](file://packages/vitarx/src/jsx-runtime.ts)
- [ref.ts](file://packages/responsive/src/signal/ref/ref.ts)
- [computed.ts](file://packages/responsive/src/signal/computed/computed.ts)
- [watch.ts](file://packages/responsive/src/signal/watch/watch.ts)
- [App.ts](file://packages/runtime-core/src/app/App.ts)
- [hook.ts](file://packages/runtime-core/src/runtime/hook.ts)
</cite>

## 目录
1. [响应式API](#响应式api)
   - [ref](#ref)
   - [reactive](#reactive)
   - [computed](#computed)
   - [watch](#watch)
2. [组件API](#组件api)
   - [createApp](#createapp)
   - [defineComponent](#definecomponent)
3. [生命周期钩子](#生命周期钩子)
   - [onMounted](#onmounted)
   - [onUnmounted](#onunmounted)
   - [其他生命周期钩子](#其他生命周期钩子)
4. [JSX运行时函数](#jsx运行时函数)
   - [jsx](#jsx)
   - [jsxs](#jsxs)
5. [渲染API](#渲染api)

## 响应式API

### ref
创建一个可响应的引用对象，用于包装基本类型值。

**函数签名**  
```ts
function ref<T>(value: T): Ref<T>
```

**参数说明**  
- `value`: 初始值，可以是任意类型

**返回值**  
返回一个带有 `.value` 属性的响应式对象

**所属模块**  
@vitarx/responsive

**实现文件**  
[ref.ts](file://packages/responsive/src/signal/ref/ref.ts)

**Section sources**
- [ref.ts](file://packages/responsive/src/signal/ref/ref.ts#L1-L200)

### reactive
创建一个响应式对象，对对象的所有嵌套属性进行深度响应式处理。

**函数签名**  
```ts
function reactive<T extends object>(target: T): T
```

**参数说明**  
- `target`: 要转换为响应式的对象

**返回值**  
返回一个响应式代理对象，保持原始对象的类型

**所属模块**  
@vitarx/responsive

**实现文件**  
[reactive.ts](file://packages/responsive/src/signal/reactive/index.ts)

**Section sources**
- [reactive/index.ts](file://packages/responsive/src/signal/reactive/index.ts#L1-L5)

### computed
创建一个计算属性，基于其他响应式数据派生出新的值。

**函数签名**  
```ts
function computed<T>(getter: () => T): ComputedRef<T>
```

**参数说明**  
- `getter`: 计算属性的获取函数，返回派生值

**返回值**  
返回一个只读的计算属性引用对象

**所属模块**  
@vitarx/responsive

**实现文件**  
[computed.ts](file://packages/responsive/src/signal/computed/computed.ts)

**Section sources**
- [computed.ts](file://packages/responsive/src/signal/computed/computed.ts#L1-L150)

### watch
观察一个或多个响应式数据源，并在数据变化时执行回调函数。

**函数签名**  
```ts
function watch<T>(
  source: WatchSource<T> | WatchSource<T>[],
  callback: WatchCallback<T>,
  options?: WatchOptions
): WatchStopHandle
```

**参数说明**  
- `source`: 要观察的数据源，可以是 ref、reactive 对象或 getter 函数
- `callback`: 数据变化时执行的回调函数
- `options`: 可选配置项，如立即执行、深度观察等

**返回值**  
返回一个函数，调用该函数可以停止监听

**所属模块**  
@vitarx/responsive

**实现文件**  
[watch.ts](file://packages/responsive/src/signal/watch/watch.ts)

**Section sources**
- [watch.ts](file://packages/responsive/src/signal/watch/watch.ts#L1-L300)

## 组件API

### createApp
创建一个应用实例，用于挂载根组件。

**函数签名**  
```ts
function createApp(rootComponent: Component, rootProps?: Record<string, any>): App
```

**参数说明**  
- `rootComponent`: 根组件定义
- `rootProps`: 根组件的初始属性

**返回值**  
返回一个 App 实例，提供 mount、use 等方法

**所属模块**  
@vitarx/runtime-core

**实现文件**  
[App.ts](file://packages/runtime-core/src/app/App.ts)

**Section sources**
- [App.ts](file://packages/runtime-core/src/app/App.ts#L107-L393)

### defineComponent
定义一个组件，提供类型推断支持。

**函数签名**  
```ts
function defineComponent<Component>(options: ComponentOptions): Component
```

**参数说明**  
- `options`: 组件选项对象，包含 props、emits、setup 等

**返回值**  
返回一个组件构造函数

**所属模块**  
@vitarx/runtime-core

**实现文件**  
[widget.ts](file://packages/runtime-core/src/widget/index.ts)

**Section sources**
- [widget/index.ts](file://packages/runtime-core/src/widget/index.ts#L1-L10)

## 生命周期钩子

### onMounted
在组件挂载完成后执行的钩子函数。

**函数签名**  
```ts
function onMounted(callback: () => void): void
```

**参数说明**  
- `callback`: 组件挂载完成后要执行的回调函数

**所属模块**  
@vitarx/runtime-core

**实现文件**  
[hook.ts](file://packages/runtime-core/src/runtime/hook.ts)

**Section sources**
- [hook.ts](file://packages/runtime-core/src/runtime/hook.ts#L158-L159)

### onUnmounted
在组件卸载完成后执行的钩子函数。

**函数签名**  
```ts
function onUnmounted(callback: () => void): void
```

**参数说明**  
- `callback`: 组件卸载完成后要执行的回调函数

**所属模块**  
@vitarx/runtime-core

**实现文件**  
[hook.ts](file://packages/runtime-core/src/runtime/hook.ts)

**Section sources**
- [hook.ts](file://packages/runtime-core/src/runtime/hook.ts#L184-L185)

### 其他生命周期钩子
框架还提供了其他生命周期钩子：

- `onBeforeMount`: 挂载前
- `onBeforeUpdate`: 更新前
- `onUpdated`: 更新后
- `onBeforeUnmount`: 卸载前
- `onActivated`: 激活时（配合 KeepAlive）
- `onDeactivated`: 停用时（配合 KeepAlive）
- `onError`: 错误捕获

**所属模块**  
@vitarx/runtime-core

**实现文件**  
[hook.ts](file://packages/runtime-core/src/runtime/hook.ts)

**Section sources**
- [hook.ts](file://packages/runtime-core/src/runtime/hook.ts#L144-L265)

## JSX运行时函数

### jsx
JSX 转换为虚拟节点的核心函数。

**函数签名**  
```ts
function jsx<T extends ValidNodeType>(
  type: T,
  props: VNodeInputProps<T> | null,
  key?: UniqueKey
): VNodeInstanceType<T>
```

**参数说明**  
- `type`: 节点类型，可以是 HTML 标签名或组件
- `props`: 节点属性和事件
- `key`: 节点的唯一标识符

**返回值**  
返回一个虚拟节点对象

**所属模块**  
@vitarx/vitarx

**实现文件**  
[jsx-runtime.ts](file://packages/vitarx/src/jsx-runtime.ts)

**Section sources**
- [jsx-runtime.ts](file://packages/vitarx/src/jsx-runtime.ts#L15-L27)

### jsxs
与 jsx 相同，用于多个子节点的场景。

**函数签名**  
```ts
function jsxs<T extends ValidNodeType>(
  type: T,
  props: VNodeInputProps<T> | null,
  key?: UniqueKey
): VNodeInstanceType<T>
```

**参数说明**  
与 jsx 相同

**返回值**  
返回一个虚拟节点对象

**所属模块**  
@vitarx/vitarx

**实现文件**  
[jsx-runtime.ts](file://packages/vitarx/src/jsx-runtime.ts)

**Section sources**
- [jsx-runtime.ts](file://packages/vitarx/src/jsx-runtime.ts#L30-L31)

## 渲染API

### render
将虚拟节点渲染到 DOM 容器中。

**函数签名**  
```ts
function render(vnode: VNode, container: HostParentElement): void
```

**参数说明**  
- `vnode`: 要渲染的虚拟节点
- `container`: DOM 容器元素

**所属模块**  
@vitarx/runtime-core

**实现文件**  
[vnode/index.ts](file://packages/runtime-core/src/vnode/index.ts)

**Section sources**
- [vnode/index.ts](file://packages/runtime-core/src/vnode/index.ts#L1-L20)