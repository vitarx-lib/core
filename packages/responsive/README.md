# @vitarx/responsive

Vitarx 响应式系统的核心包，提供高性能、类型安全的响应式数据管理和依赖追踪功能。

## 概述

`@vitarx/responsive` 是 Vitarx 框架的响应式系统核心，借鉴 Vue 3 的响应式设计理念，提供了一套完整的响应式数据管理解决方案。

### 核心特性

| 特性                | 说明                                        |
|-------------------|-------------------------------------------|
| 🎯 **多种信号类型**     | 支持 `ref`、`reactive`、`computed` 等多种响应式数据类型 |
| ⚡ **细粒度响应**       | 精确追踪依赖,避免不必要的更新                           |
| 💤 **懒计算**        | 计算属性采用 Vue 风格的懒计算策略，按需执行                  |
| 🔄 **作用域管理**      | 自动清理资源，防止内存泄漏                             |
| 📅 **灵活调度**       | 支持 `sync`、`pre`、`post` 多种调度模式             |
| 🔌 **Vue 兼容**     | 提供与 Vue 3 兼容的 API 别名                      |
| 📘 **TypeScript** | 完整的类型定义和类型推导                              |

## 安装

```shell
npm install @vitarx/responsive
```

或使用其他包管理器：

```shell
# pnpm
pnpm add @vitarx/responsive

# yarn
yarn add @vitarx/responsive
```

## API 列表

| 模块              | 导出项                   | 类型 | 描述                          |
|-----------------|-----------------------|----|-----------------------------|
| depend          | getActiveEffect       | 函数 | 获取当前活动的副作用函数                |
| depend          | isTrackingPaused      | 函数 | 判断跟踪是否已暂停                   |
| depend          | withSuspendedTracking | 函数 | 暂停依赖追踪的辅助函数                 |
| depend          | peekSignal            | 函数 | 查看信号的当前值而不触发跟踪              |
| depend          | collectSignal         | 函数 | 收集信号函数，用于追踪函数执行期间的依赖关系      |
| depend          | trackSignal           | 函数 | 跟踪信号变化的函数                   |
| depend          | triggerSignal         | 函数 | 触发信号的处理函数                   |
| depend          | EffectHandle          | 接口 | 副作用句柄                       |
| depend          | DepLink               | 类  | 依赖关系中的双向链表节点类               |
| depend          | createDepLink         | 函数 | 创建 signal <-> effect 双向链表关联 |
| depend          | destroyDepLink        | 函数 | 销毁 signal <-> effect 链表关联   |
| depend          | clearEffectLinks      | 函数 | 移除 effect 关联的所有信号依赖         |
| depend          | clearSignalLinks      | 函数 | 移除 Signal 关联的 effect 依赖     |
| depend          | iterateLinkedEffects  | 函数 | 迭代一个 signal 关联的所有 effect    |
| depend          | iterateLinkedSignals  | 函数 | 迭代一个 effect 依赖的所有 signal    |
| depend          | hasLinkedSignal       | 函数 | 判断一个副作用对象是否连接了信号            |
| depend          | hasLinkedEffect       | 函数 | 判断一个信号对象是否连接了副作用            |
| effect          | Effect                | 类  | 通用型副作用基类                    |
| effect          | EffectScope           | 类  | EffectScope 作用域类            |
| effect          | DisposableEffect      | 接口 | 可处置的副作用效果接口                 |
| effect          | createScope           | 函数 | 创建一个新的作用域实例                 |
| effect          | getActiveScope        | 函数 | 获取当前活跃的作用域                  |
| effect          | getOwnerScope         | 函数 | 获取给定effect的作用域              |
| effect          | addToActiveScope      | 函数 | 向当前作用域添加一个副作用函数             |
| effect          | removeFromOwnerScope  | 函数 | 从当前作用域中移除指定的副作用函数           |
| effect          | reportEffectError     | 函数 | 处理effect错误的函数               |
| effect          | onScopeDispose        | 函数 | 在作用域销毁时注册回调函数               |
| effect          | onScopePause          | 函数 | 在作用域暂停时注册回调函数               |
| effect          | onScopeResume         | 函数 | 在作用域恢复时注册回调函数               |
| watcher         | watch                 | 函数 | 创建一个观察器，用于监听源数据变化并执行回调函数    |
| watcher         | watchEffect           | 函数 | EffectWatcher 观察器类的助手函数     |
| watcher         | Watcher               | 类  | 观察器基类                       |
| watcher         | EffectWatcher         | 类  | 副作用观察器类                     |
| watcher         | GetterWatcher         | 类  | 返回值观察器类                     |
| watcher         | RefSignalWatcher      | 类  | RefSignal观察器类               |
| signal.reactive | reactive              | 函数 | 将一个对象代理为响应式对象               |
| signal.reactive | shallowReactive       | 函数 | 创建浅层响应式对象                   |
| signal.readonly | readonly              | 函数 | 创建只读对象                      |
| signal.readonly | shallowReadonly       | 函数 | 创建浅层只读对象                    |
| signal.ref      | ref                   | 函数 | 创建响应式引用                     |
| signal.ref      | shallowRef            | 函数 | 创建浅层响应式引用                   |
| signal.ref      | propertyRef           | 函数 | 创建一个属性引用对象                  |
| signal.computed | computed              | 函数 | 创建一个计算属性                    |
| signal.computed | isComputed            | 函数 | 判断是否为计算属性对象                 |
| signal.computed | Computed              | 类  | 计算属性信号类                     |
| utils           | isCallableSignal      | 函数 | 检查给定的值是否为可调用信号              |
| utils           | isRefSignal           | 函数 | 判断是否为值信号                    |
| utils           | isRef                 | 函数 | 判断值是否实现Ref接口                |
| utils           | isReactive            | 函数 | 检查一个值是否为响应式对象               |
| utils           | isReadonly            | 函数 | 判断是否为只读对象                   |
| utils           | unref                 | 函数 | 解包 ref 包装，返回其 `.value` 值    |
| utils           | markRaw               | 函数 | 将一个对象标记为永远不会被转换为响应式信号       |
| utils           | isMakeRaw             | 函数 | 检查对象是否被标记为非信号类型             |
| utils           | toRaw                 | 函数 | 获取代理原始值                     |
| constants       | IS_SIGNAL             | 符号 | signal 标记                   |
| constants       | IS_READONLY           | 符号 | 只读代理标识                      |
| constants       | IS_REF                | 符号 | 引用信号标记                      |
| constants       | IS_REACTIVE           | 符号 | reactive 独有标识               |
| constants       | IS_RAW                | 符号 | 忽略响应性自动包装标记                 |

## 许可证

[MIT](LICENSE)
