# @vitarx/responsive

Vitarx 响应式系统，提供高性能的响应式数据管理和依赖追踪功能。

## 功能模块

### 1. 信号系统 (Signal)

信号系统是响应式数据管理的核心，提供多种响应式数据实现：

#### ref

创建原始类型的响应式引用：

```javascript
// 创建响应式数据
const count = ref(0)
console.log(count.value) // 0

// 修改值会触发更新
count.value = 1

// 支持复杂数据类型
const state = ref({ count: 0 })
state.value.count++ // 深度响应式
```

#### reactive

创建对象的响应式代理：

```javascript
// 创建响应式对象
const state = reactive({
  count: 0,
  items: ['a', 'b']
})

// 直接修改属性
state.count++
state.items.push('c')

// 支持集合类型
const map = reactive(new Map())
map.set('key', 'value')
```

#### computed

创建计算属性：

```javascript
const count = ref(0)
const double = computed(() => count.value * 2)

// 自动追踪依赖并缓存结果
console.log(double.value) // 0
count.value = 2
console.log(double.value) // 4

// 支持setter
const number = computed({
  get: () => count.value,
  set: (val) => count.value = val
})
```

#### watch

观察数据变化：

```javascript
// 监听单个数据源
const count = ref(0)
watch(count, (newVal, oldVal) => {
  console.log(`Count changed from ${oldVal} to ${newVal}`)
})

// 监听多个数据源
const name = ref('vitarx')
watch([count, name], ([newCount, newName], [oldCount, oldName]) => {
  console.log('Values changed')
})
```

### 2. 副作用系统 (Effect)

提供生命周期管理和事件监听能力的副作用系统：

```javascript
import { Effect, createScope } from '@vitarx/responsive'

// 创建副作用实例
const effect = new Effect()

// 监听生命周期事件
effect.onDispose(() => {
  console.log('Effect has been disposed')
})

effect.onPause(() => {
  console.log('Effect has been paused')
})

effect.onResume(() => {
  console.log('Effect has been resumed')
})

// 错误处理
effect.onError((error, source) => {
  console.error(`Error occurred during ${source}:`, error)
})

// 检查状态
console.log(effect.isActive)    // true
console.log(effect.isPaused)    // false
console.log(effect.isDeprecated) // false

// 暂停和恢复
effect.pause()
console.log(effect.state) // 'paused'

effect.resume()
console.log(effect.state) // 'active'

// 创建作用域管理多个副作用
const scope = createScope({
  name: 'myScope',
  errorHandler: (error) => console.error('Scope error:', error)
})

// 将副作用添加到作用域
scope.addEffect(effect)

// 销毁作用域会同时清理所有副作用
scope.dispose()
console.log(effect.state) // 'deprecated'
```

### 3. 依赖系统 (Depend)

提供底层的依赖收集和追踪：

```javascript
import { Depend } from '@vitarx/responsive'

// 收集依赖
const deps = Depend.collect(() => {
  // 在这里访问响应式数据
  console.log(count.value)
})

// 检查依赖关系
console.log(deps.has(count)) // true
```

### 4. 上下文管理 (Context)

管理响应式上下文：

```javascript
import { createContext, getContext, runInContext } from '@vitarx/responsive'

// 创建上下文
const restore = createContext('user', { id: 123 })

// 获取上下文
const userCtx = getContext('user')
console.log(userCtx?.id) // 123

// 在上下文中运行代码
runInContext('user', () => {
  // 这里的代码可以访问用户上下文
})

// 恢复上下文
restore()
```

### 5. 观察者系统 (Observer)

提供高性能的数据变更监听和订阅管理：

```javascript
import { subscribe, subscribeProperty, subscribeProperties, notify } from '@vitarx/responsive'

const user = { name: 'John', age: 30 }

// 订阅整个对象的变更
const subscriber = subscribe(user, (properties, target) => {
  console.log(`变更的属性: ${properties.join(', ')}`)
}, {
  batch: true, // 批处理模式：合并短时间内的多次通知
  limit: 0,    // 触发次数限制：0表示不限制
  scope: true  // 自动添加到当前作用域
})

// 订阅单个属性
subscribeProperty(user, 'name', (properties, target) => {
  console.log(`name属性已更新: ${target.name}`)
})

// 订阅多个属性
subscribeProperties(user, ['name', 'age'], (properties, target) => {
  console.log(`属性${properties.join(',')}已更新`)
})

// 手动触发变更通知
notify(user, 'name')

// 取消订阅
subscriber.dispose()
```

观察者系统的主要特性：

- **批处理模式**：合并短时间内的多次变更通知，提高性能
- **作用域管理**：自动跟随作用域生命周期，避免内存泄漏
- **生命周期钩子**：支持暂停/恢复/销毁等操作
- **触发次数限制**：可设置最大触发次数，到达后自动销毁
- **错误处理**：内置错误捕获和处理机制

开发者一般不直接使用该模块，而是使用Signal系统的watch模块，它对响应式信号的监听逻辑进行了封装，提供了更便捷的API。

## 安装

```bash
npm install @vitarx/responsive
```

## 许可证

[MIT](LICENSE)
