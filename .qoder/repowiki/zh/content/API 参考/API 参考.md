# API 参考

<cite>
**本文档中引用的文件**  
- [App.ts](file://packages/runtime-core/src/app/App.ts#L107-L393)
- [ref.ts](file://packages/responsive/src/signal/ref/ref.ts#L70-L472)
- [computed.ts](file://packages/responsive/src/signal/computed/computed.ts#L98-L366)
- [watch.ts](file://packages/responsive/src/signal/watch/watch.ts#L192-L431)
- [base.ts](file://packages/runtime-core/src/vnode/creator/base.ts#L22-L117)
- [clone.ts](file://packages/utils/src/clone.ts#L77-L123)
- [delay.ts](file://packages/utils/src/delay.ts#L72-L144)
- [index.ts](file://packages/vitarx/src/index.ts#L1-L8)
- [factory.ts](file://packages/runtime-dom/src/factory.ts#L21-L23)
</cite>

## 目录
1. [createApp 函数](#createapp-函数)
2. [App 实例方法](#app-实例方法)
3. [响应式 API](#响应式-api)
4. [虚拟 DOM 创建函数](#虚拟-dom-创建函数)
5. [工具函数](#工具函数)

## createApp 函数

`createApp` 函数用于创建一个新的应用实例，是 Vitarx 应用的入口点。该函数封装了 `App` 类的实例化过程，并自动设置 DOM 渲染器和默认驱动器。

**TypeScript 类型定义**
```typescript
function createApp(root: VNode | WidgetTypes, config?: AppConfig): App
```

**参数说明**
- `root`: 应用的根节点，可以是虚拟节点(VNode)或小部件类型(WidgetTypes)
- `config`: 可选的应用配置参数，用于定制应用的行为

**返回值**
- 返回一个新的 `App` 实例

**使用示例**
```typescript
// 创建应用实例
const app = createApp(YourRootWidget, {
  errorHandler: customErrorHandler,
  idPrefix: 'my-app'
});

// 挂载到DOM
app.mount('#app');
```

**边界情况处理**
- 当传入的容器选择器不存在时，会抛出错误
- 如果插件为空，会抛出错误
- 如果插件没有 install 方法，会抛出错误

**性能注意事项**
- `createApp` 函数在调用时会自动设置渲染器和驱动器，这些操作只执行一次
- 应用实例的创建是轻量级的，但建议在应用生命周期内复用实例

**Section sources**
- [factory.ts](file://packages/runtime-dom/src/factory.ts#L21-L23)
- [App.ts](file://packages/runtime-core/src/app/App.ts#L107-L393)

## App 实例方法

`App` 类提供了管理应用生命周期和核心功能的方法。

### mount 方法

将组件挂载到指定的DOM容器中。

**TypeScript 类型定义**
```typescript
mount(container: HostParentElement | string): this
```

**参数说明**
- `container`: 可以是DOM元素节点或选择器字符串

**返回值**
- 返回当前App实例，支持链式调用

**使用示例**
```typescript
// 挂载到id为#app的元素
app.mount('#app');
```

**边界情况处理**
- 如果传入的是字符串选择器但找不到对应元素，会抛出错误
- 如果容器不是有效的DOM元素，会抛出错误

**性能注意事项**
- 挂载操作会触发组件树的渲染，建议在DOM准备好后再调用
- 频繁的挂载和卸载会影响性能，建议复用应用实例

### unmount 方法

卸载应用并清理相关资源。

**TypeScript 类型定义**
```typescript
unmount(): void
```

**使用示例**
```typescript
// 卸载应用
app.unmount();
```

**性能注意事项**
- 卸载操作会清理所有相关资源，包括事件监听器和定时器
- 建议在应用销毁时调用此方法以避免内存泄漏

### provide 方法

在应用级别提供数据，供所有子组件注入使用。

**TypeScript 类型定义**
```typescript
provide(name: string | symbol, value: any): this
```

**参数说明**
- `name`: 注入名称
- `value`: 注入值

**返回值**
- 返回当前App实例，支持链式调用

**使用示例**
```typescript
// 提供全局数据
app.provide('apiClient', apiClient);
```

### directive 方法

注册或获取全局指令。

**TypeScript 类型定义**
```typescript
directive(name: string): Directive | undefined
directive(name: string, directive: DirectiveOptions | DirectiveOptions['mounted'] | DirectiveOptions['updated']): this
```

**参数说明**
- `name`: 指令名称
- `directive`: 指令选项（可选）

**返回值**
- 当只传入名称时，返回已注册的指令或 undefined
- 当传入指令时，返回当前App实例，支持链式调用

**使用示例**
```typescript
// 注册指令
app.directive('focus', {
  mounted(el) {
    el.focus();
  }
});

// 获取指令
const focusDirective = app.directive('focus');
```

**边界情况处理**
- 如果指令名称为空，会抛出类型错误
- 指令名称会自动去除前后空格

**Section sources**
- [App.ts](file://packages/runtime-core/src/app/App.ts#L187-L316)

## 响应式 API

Vitarx 提供了一套完整的响应式 API，包括 ref、reactive、computed 和 watch。

### ref 函数

创建一个响应式引用信号。

**TypeScript 类型定义**
```typescript
function ref(): Ref<any>
function ref<Value>(): Ref<Value | undefined>
function ref<Value, Deep extends boolean = true>(value: Value | Ref<Value, Deep>, options?: SignalOptions<Deep> | Deep): Ref<Value, Deep>
```

**参数说明**
- `value`: 要包装的初始值，可以是普通值或已有的引用
- `options`: 信号的选项配置，支持直接传入 boolean 指定 deep 配置
  - `deep`: 是否深度代理嵌套对象，默认为 true
  - `compare`: 值比较函数，用于决定是否触发更新，默认使用 Object.is 进行比较

**返回值**
- 返回一个响应式引用对象

**使用示例**
```typescript
// 创建基本类型的ref
const count = ref(0);
console.log(count.value); // 0
count.value++;
console.log(count.value); // 1

// 创建对象ref
const user = ref({ name: 'Zhang', age: 25 });
```

**边界情况处理**
- 如果尝试将 Ref 对象设置为 Ref 的值，会抛出错误
- 如果传入的 options 是 boolean，则作为 deep 配置

**性能注意事项**
- 深度代理会对对象的所有嵌套属性进行代理，可能影响性能
- 对于大型对象，考虑使用 shallowRef

### computed 函数

创建一个计算属性。

**TypeScript 类型定义**
```typescript
class Computed<T> implements RefSignal<T>
```

**参数说明**
- `getter`: 计算属性的 getter 函数
- `options`: 计算属性的配置选项
  - `setter`: 计算属性的 setter 函数
  - `immediate`: 是否立即计算，默认为 false
  - `scope`: 是否自动添加到当前作用域

**使用示例**
```typescript
const count = ref(0);
const double = computed(() => count.value * 2);
console.log(double.value); // 0
count.value = 2;
console.log(double.value); // 4
```

**性能注意事项**
- 计算属性采用懒计算策略，只在访问时计算
- 依赖的响应式数据变化时会自动重新计算

### watch 函数

监听信号变化并响应其更新。

**TypeScript 类型定义**
```typescript
function watch<T extends AnyObject | AnyFunction, C extends WatchCallback<T extends AnyFunction ? ReturnType<T> : T>>(source: T, callback: C, options?: WatchOptions): Subscriber<VoidCallback>
```

**参数说明**
- `source`: 监听源对象或函数
- `callback`: 变化时触发的回调函数
- `options`: 监听器配置选项
  - `flush`: 执行模式
  - `limit`: 触发次数限制
  - `scope`: 是否自动添加到当前作用域
  - `clone`: 是否深度克隆新旧值
  - `immediate`: 立即执行一次回调

**使用示例**
```typescript
const count = ref(0);
const unwatch = watch(count, (newVal, oldVal) => {
  console.log(`Count changed from ${oldVal} to ${newVal}`);
});
```

**性能注意事项**
- 深度克隆新旧值存在额外的性能开销
- 频繁触发的监听器可能影响性能

**Section sources**
- [ref.ts](file://packages/responsive/src/signal/ref/ref.ts#L70-L472)
- [computed.ts](file://packages/responsive/src/signal/computed/computed.ts#L98-L366)
- [watch.ts](file://packages/responsive/src/signal/watch/watch.ts#L192-L431)

## 虚拟 DOM 创建函数

Vitarx 提供了创建虚拟 DOM 节点的函数。

### createBaseVNode 函数

创建基础的虚拟节点。

**TypeScript 类型定义**
```typescript
function createBaseVNode(type: VNodeTypes, kind: NodeKind, props: AnyProps): VNode
```

**参数说明**
- `type`: 节点类型
- `kind`: 节点种类
- `props`: 节点属性

**返回值**
- 返回创建的虚拟节点

**使用示例**
```typescript
const vnode = createBaseVNode('div', NodeKind.RegularElement, { id: 'app' });
```

**性能注意事项**
- 虚拟节点的创建是轻量级的，但建议复用节点以提高性能

**Section sources**
- [base.ts](file://packages/runtime-core/src/vnode/creator/base.ts#L22-L117)

## 工具函数

Vitarx 提供了一些实用的工具函数。

### deepClone 函数

深度克隆对象，支持循环引用。

**TypeScript 类型定义**
```typescript
function deepClone<T>(obj: T): T
```

**参数说明**
- `obj`: 需要克隆的对象

**返回值**
- 返回克隆后的新对象

**使用示例**
```typescript
const original = { a: 1, b: { c: 2 } };
const cloned = deepClone(original);
```

**性能注意事项**
- 深度克隆对于大型对象可能影响性能
- 使用 WeakMap 处理循环引用，避免无限递归

### withDelayAndTimeout 函数

延迟和超时控制包装函数。

**TypeScript 类型定义**
```typescript
function withDelayAndTimeout<T>(task: Promise<T> | (() => Promise<T>), options: DelayTimeoutOptions<T>): Promise<T> & { cancel: () => void }
```

**参数说明**
- `task`: 需要被包装的Promise任务
- `options`: 配置选项
  - `delay`: 延迟触发的毫秒数
  - `timeout`: 超时时间（毫秒）
  - `onDelay`: 延迟触发回调
  - `onTimeout`: 超时回调
  - `onResolve`: 成功时执行
  - `onReject`: 失败时执行
  - `signal`: 判断任务是否还有效

**返回值**
- 返回一个带有取消功能的Promise

**使用示例**
```typescript
const wrappedTask = withDelayAndTimeout(fetchData(), {
  delay: 200,
  timeout: 5000,
  onDelay: () => console.log('开始加载...')
});

// 手动取消任务
wrappedTask.cancel();
```

**性能注意事项**
- 使用定时器进行延迟和超时控制
- 提供了手动取消功能，避免不必要的资源消耗

**Section sources**
- [clone.ts](file://packages/utils/src/clone.ts#L77-L123)
- [delay.ts](file://packages/utils/src/delay.ts#L72-L144)