# vitarx

Vitarx 框架主包，整合了所有核心功能，提供完整的前端框架能力。

## 简介

Vitarx 是一个现代化的前端框架，融合了 React 的 JSX 语法和 Vue 的响应式系统，旨在提供简洁、高效的开发体验。该包是 Vitarx
框架的主入口，整合了所有核心模块，包括响应式系统、运行时核心和工具函数。

## 功能特性

| 特性                | 说明                                                             |
|-------------------|----------------------------------------------------------------|
| 🚀 **JSX 语法支持**   | 使用熟悉的 JSX 语法构建用户界面，提供完整的类型支持                                   |
| 🔧 **响应式系统**      | 集成强大的响应式数据管理，支持 `ref`、`reactive`、`computed`、`watch` 等响应式api    |
| ⚡ **细粒度响应**       | 精确追踪依赖，避免不必要的更新，提供高性能的响应式体验                                    |
| 🎯 **组件化开发**      | 支持函数组件和类组件，提供完整的生命周期钩子                                         |
| 🔄 **虚拟 DOM**     | 高效的虚拟 DOM 实现和 Diff 算法，支持 7 种节点类型                               |
| 🎨 **渲染机制**       | 灵活的渲染器接口，支持多平台渲染适配，浏览器环境下提供完整的 DOM 操作能力                        |
| 💉 **依赖注入**       | 应用级和组件级的依赖注入机制 (provide/inject)                                |
| 📦 **内置组件**       | 提供 `Suspense`、`Transition`、`KeepAlive`、`Lazy`、`Teleport` 等内置组件 |
| 🎯 **指令系统**       | 内置 `v-show` 等指令，支持自定义指令扩展                                      |
| 📘 **TypeScript** | 完整的类型定义和类型推导，提供优秀的开发体验                                         |
| 🔌 **工具函数库**      | 提供深拷贝、类型检测、防抖节流等常用工具函数                                         |

## 完全开发文档

[查看文档](https://vitarx.cn)

## 安装

```bash
# 使用 npm
npm install vitarx

# 使用 yarn
yarn add vitarx

# 使用 pnpm
pnpm add vitarx
```

## 快速开始

```typescript
import { createApp } from 'vitarx'
import App from './app'
// 创建应用实例
const app = createApp(App)

// 挂载到 DOM 元素
app.mount('#app')
```

## 核心 API

### 应用管理 API

#### createApp

创建 Vitarx 应用实例的入口函数。

```typescript
import { createApp } from 'vitarx'

const app = createApp(RootWidget, config)
```

#### App 实例方法

| 方法           | 说明                |
|--------------|-------------------|
| `mount`      | 将应用挂载到指定的 DOM 容器中 |
| `unmount`    | 卸载应用，清理相关资源       |
| `provide`    | 提供应用级依赖注入数据       |
| `getProvide` | 获取应用级依赖注入数据       |
| `use`        | 安装插件              |
| `directive`  | 注册/获取全局指令         |

```typescript
// 提供数据
app.provide('key', value)

// 获取数据
const value = app.getProvide('key', defaultValue)

// 注册指令
app.directive('focus', { mounted: (el) => el.focus() })

// 使用插件
app.use(plugin, options)
```

### 响应式 API

#### ref

创建一个响应式引用信号，用于包装基本类型或对象，通过 `.value` 访问和修改值。

```typescript
const count = ref(0)
console.log(count.value) // 0
count.value++ // 1
```

#### reactive

创建对象的响应式代理，支持对象、数组、Map、Set 等类型。

```typescript
const state = reactive({ count: 0, user: { name: 'John' } })
state.count++ // 1
state.user.name = 'Jane' // 更新嵌套属性
```

#### computed

创建一个计算属性，值由 getter 函数计算得出，自动追踪依赖并缓存结果。

```typescript
const doubleCount = computed(() => count.value * 2)
console.log(doubleCount.value) // 0
count.value = 10
console.log(doubleCount.value) // 20
```

#### watch

监听响应式数据的变化，当数据改变时执行回调函数。

```typescript
watch(count, (newVal, oldVal) => {
  console.log(`count 从 ${oldVal} 变为 ${newVal}`)
})

// 监听多个源
watch([count, state], ([newCount, newState], [oldCount, oldState]) => {
  console.log('Multiple sources changed')
})
```

### 组件 API

#### 函数组件

函数组件是接收 props 并返回 VNode 的简单函数：

```tsx
import { defineStatelessWidget } from 'vitarx'

// 定义无状态函数组件
const Welcome = defineStatelessWidget((props: { name: string }) => {
  return <div>欢迎, {props.name}!</div>
})

// 带状态的函数组件
function Counter(props: { initialCount?: number }) {
  const count = ref(props.initialCount || 0)
  return <button onClick={() => count.value++}>计数: {count.value}</button>
}
```

#### 类组件

类组件通过继承 Widget 类来实现，提供更多功能：

```tsx
import { Widget } from 'vitarx'

class TodoList extends Widget<{ title: string }> {
  todos = ref<string[]>([])
  newTodo = ref('')

  // 生命周期钩子
  onMounted() {
    console.log('组件已挂载')
  }

  addTodo() {
    if (this.newTodo.value.trim()) {
      this.todos.value.push(this.newTodo.value)
      this.newTodo.value = ''
    }
  }

  build() {
    return (
      <div>
        <h2>{this.props.title}</h2>
        <input 
          value={this.newTodo.value}
          onInput={(e) => this.newTodo.value = e.target.value}
        />
        <button onClick={() => this.addTodo()}>添加</button>
        <ul>
          {this.todos.value.map(todo => <li>{todo}</li>)}
        </ul>
      </div>
    )
  }
}
```

#### 生命周期钩子

| 钩子名称              | 触发时机           | 可访问 DOM  | 适用场景           |
|-------------------|----------------|----------|----------------|
| `onCreate`        | 组件实例创建时        | 否        | 初始化状态、访问 props |
| `onRender`        | 渲染前（SSR + CSR） | 否        | SSR 数据准备       |
| `onBeforeMount`   | 挂载前            | 否        | 挂载前的准备工作       |
| `onMounted`       | 挂载完成后          | 是        | 访问 DOM、初始化第三方库 |
| `onActivated`     | 组件激活时          | 是        | KeepAlive 激活恢复 |
| `onDeactivated`   | 组件停用时          | 是        | KeepAlive 停用清理 |
| `onBeforeUpdate`  | 更新前            | 是（旧 DOM） | 更新前的状态记录       |
| `onUpdated`       | 更新完成后          | 是（新 DOM） | 操作更新后的 DOM     |
| `onBeforeUnmount` | 卸载前            | 是        | 清理定时器、事件监听器    |
| `onUnmounted`     | 卸载完成后          | 否        | 最终清理工作         |
| `onError`         | 捕获异常时          | 视情况      | 错误边界、降级展示      |

### 虚拟 DOM API

#### createVNode

创建虚拟节点，用于描述 UI 结构。

```typescript
import { createVNode } from 'vitarx'

// 创建元素节点
const div = createVNode('div', { class: 'container' }, 'Hello')

// 创建组件节点
const widget = createVNode(MyComponent, { name: 'John' })
```

### 依赖注入 API

#### provide / inject

组件间的依赖注入机制，支持跨层级通信。

```tsx
// 父组件提供数据
function Parent() {
  provide('theme', { mode: 'dark' })
  return <Child />}

// 子组件注入数据
function Child() {
  const theme = inject('theme', { mode: 'light' })
  return <div style={{ color: theme.color }}>...</div>
}
```

### JSX 支持

Vitarx 支持 JSX 语法，需要配置相应的编译选项。

```typescript
// 引入 JSX 运行时
import { jsx, jsxs, Fragment } from 'vitarx/jsx-runtime'

// 或者在开发模式下使用
import { jsxDEV, Fragment } from 'vitarx/jsx-dev-runtime'
```

### 工具函数 API

#### 深拷贝

创建对象的深度拷贝，支持循环引用和多种内置类型。

```typescript
import { deepClone } from 'vitarx'

const obj = { a: 1, b: { c: 2 } }
const cloned = deepClone(obj)
```

#### 类型检测

提供多种类型检测函数：

```typescript
import { isObject, isArray, isString, isNumber } from 'vitarx'

console.log(isObject({})) // true
console.log(isArray([])) // true
```

#### 防抖与节流

提供常用的防抖和节流函数：

```typescript
import { debounce, throttle } from 'vitarx'

const debouncedFn = debounce(() => {
  console.log('Debounced!')
}, 300)

const throttledFn = throttle(() => {
  console.log('Throttled!')
}, 300)
```

## 导出内容

该包整合了以下模块的所有功能：

- [@vitarx/utils](../utils/README.md) - 工具函数集合
- [@vitarx/responsive](../responsive/README.md) - 响应式系统
- [@vitarx/runtime-core](../runtime-core/README.md) - 运行时核心
- [@vitarx/runtime-dom](../runtime-dom/README.md) - 浏览器端 DOM 渲染适配器

## 使用示例

### 基础示例

```tsx
import { createApp, ref, reactive } from 'vitarx'

function App() {
  const count = ref(0)
  const state = reactive({ name: 'Vitarx' })

  const increment = () => {
    count.value++
  }

  return (
    <div>
      <h1>{state.name}</h1>
      <p>Count: {count.value}</p>
      <button onClick={increment}>Increment</button>
    </div>
  )
}

createApp(SSRApp).mount('#app')
```

### 组件示例

```tsx
import { createApp, ref, defineStatelessWidget, Widget, onMounted, onUnmounted } from 'vitarx'

// 函数组件
const CounterDisplay = defineStatelessWidget(({ count }: { count: number }) => {
  return <div>当前计数: {count}</div>
})

// 带生命周期的函数组件
function Timer() {
  const seconds = ref(0)
  let timerId: number

  // 挂载后启动计时器
  onMounted(() => {
    console.log('Timer 组件已挂载')
    timerId = setInterval(() => {
      seconds.value++
    }, 1000)
  })

  // 卸载前清理计时器
  onUnmounted(() => {
    console.log('Timer 组件将卸载')
    clearInterval(timerId)
  })

  return <div>运行时间: {seconds.value} 秒</div>
}

// 类组件
class TodoList extends Widget {
  todos = ref<string[]>([])
  newTodo = ref('')

  addTodo() {
    if (this.newTodo.value.trim()) {
      this.todos.value.push(this.newTodo.value)
      this.newTodo.value = ''
    }
  }

  build() {
    return (
      <div>
        <h2>待办事项</h2>
        <input
          value={this.newTodo.value}
          onInput={(e) => this.newTodo.value = (e.target as HTMLInputElement).value}
          placeholder="添加新待办"
        />
        <button onClick={() => this.addTodo()}>添加</button>
        <ul>
          {this.todos.value.map((todo, index) => (
            <li key={index}>{todo}</li>
          ))}
        </ul>
      </div>
    )
  }
}

// 根组件
function App() {
  const count = ref(0)

  return (
    <div>
      <h1>Vitarx 组件示例</h1>
      <button onClick={() => count.value++}>增加计数</button>
      <CounterDisplay count={count.value} />
      <Timer />
      <TodoList />
    </div>
  )
}

createApp(SSRApp).mount('#app')
```

### 响应式示例

```tsx
import { createApp, ref, reactive, computed, watch } from 'vitarx'

function App() {
  // 基本类型响应式
  const count = ref(0)

  // 对象响应式
  const user = reactive({
    name: 'John',
    age: 30,
    address: {
      city: 'New York',
      country: 'USA'
    }
  })

  // 计算属性
  const doubleCount = computed(() => count.value * 2)
  const fullAddress = computed(() => {
    return `${user.address.city}, ${user.address.country}`
  })

  // 监听
  watch(count, (newVal, oldVal) => {
    console.log(`count 从 ${oldVal} 变为 ${newVal}`)
  })

  // 监听对象属性变化
  watch(
    () => user.age,
    (newAge) => {
      console.log(`年龄变为 ${newAge}`)
    }
  )

  // 监听多个源
  watch(
    [count, user],
    ([newCount, newUser]) => {
      console.log(`count: ${newCount}, name: ${newName}`)
    }
  )

  return (
    <div>
      <h1>响应式示例</h1>

      <div>
        <h2>基本类型响应式</h2>
        <p>Count: {count.value}</p>
        <p>Double Count: {doubleCount.value}</p>
        <button onClick={() => count.value++}>增加</button>
      </div>

      <div>
        <h2>对象响应式</h2>
        <p>Name: {user.name}</p>
        <p>Age: {user.age}</p>
        <p>Full Address: {fullAddress.value}</p>
        <button onClick={() => user.age++}>增加年龄</button>
        <button onClick={() => user.address.city = 'Los Angeles'}>更改城市</button>
      </div>
    </div>
  )
}

createApp(SSRApp).mount('#app')
```

### 内置组件示例

```tsx
import { createApp, ref, Suspense, KeepAlive, Lazy } from 'vitarx'

// 懒加载组件
const HeavyComponent = Lazy(() => import('./HeavyComponent'))

function App() {
  const activeTab = ref('home')
  const count = ref(0)

  return (
    <div>
      <h1>内置组件示例</h1>

      <div>
        <button onClick={() => activeTab.value = 'home'}>首页</button>
        <button onClick={() => activeTab.value = 'profile'}>个人资料</button>
        <button onClick={() => activeTab.value = 'settings'}>设置</button>
      </div>

      <KeepAlive>
        {activeTab.value === 'home' && (
          <div>
            <h2>首页</h2>
            <p>计数: {count.value}</p>
            <button onClick={() => count.value++}>增加</button>
          </div>
        )}

        {activeTab.value === 'profile' && (
          <div>
            <h2>个人资料</h2>
            <p>用户名: John Doe</p>
          </div>
        )}

        {activeTab.value === 'settings' && (
          <Suspense fallback={<div>加载中...</div>}>
            <HeavyComponent />
          </Suspense>
        )}
      </KeepAlive>
    </div>
  )
}

createApp(SSRApp).mount('#app')
```

### 依赖注入示例

```tsx
import { createApp, provide, inject, ref } from 'vitarx'

// 提供主题配置
function App() {
  const theme = ref({ mode: 'dark', color: '#3498db' })

  // 提供全局数据
  provide('theme', theme)
  provide('apiBaseUrl', 'https://api.example.com')

  return (
    <div>
      <h1>依赖注入示例</h1>
      <ThemeToggle />
      <UserProfile />
    </div>
  )
}

// 注入主题配置
function ThemeToggle() {
  const theme = inject('theme')

  const toggleMode = () => {
    theme.value.mode = theme.value.mode === 'dark' ? 'light' : 'dark'
    theme.value.color = theme.value.color === '#3498db' ? '#e74c3c' : '#3498db'
  }

  return (
    <div>
      <p>当前模式: {theme.value.mode}</p>
      <button onClick={toggleMode}>切换主题</button>
    </div>
  )
}

// 注入 API 配置
function UserProfile() {
  const apiBaseUrl = inject('apiBaseUrl')
  const user = ref({ name: 'John', email: 'john@example.com' })

  return (
    <div>
      <h2>用户资料</h2>
      <p>用户名: {user.value.name}</p>
      <p>邮箱: {user.value.email}</p>
      <p>API 地址: {apiBaseUrl}</p>
    </div>
  )
}

createApp(SSRApp).mount('#app')
```

## 许可证

[MIT](../../LICENSE)
