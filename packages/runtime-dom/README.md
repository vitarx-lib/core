# @vitarx/runtime-dom

Vitarx 框架的浏览器端 DOM 渲染适配器，负责将虚拟 DOM 渲染为真实 DOM，并提供 DOM 操作、事件绑定、样式管理等浏览器环境专属功能。

## 功能特性

- **浏览器 DOM 渲染**：完整实现虚拟 DOM 到真实 DOM 的渲染
- **事件系统**：灵活的事件绑定机制，支持事件修饰符
- **样式与类名管理**：提供便捷的 CSS 类和样式操作 API
- **属性处理**：智能的属性设置策略，支持多种特殊属性
- **TypeScript 类型支持**：完整的类型定义，提供优秀的开发体验

## 主要功能模块

### 1. DomRenderer

DomRenderer 是核心渲染器类，实现了 `HostRenderer` 接口，提供浏览器环境下的 DOM 操作能力。

#### 元素创建与管理

- `createElement`：创建 HTML 或 SVG 元素
- `createFragment`：创建文档片段节点
- `createText`：创建文本节点
- `createComment`：创建注释节点

#### DOM 树操作

- `insertBefore`：在指定节点前插入元素
- `replace`：替换现有节点
- `appendChild`：追加子节点
- `remove`：移除节点

#### 属性操作

- `setAttribute`：设置元素属性（智能处理事件、样式、命名空间等）
- `removeAttribute`：移除元素属性

#### 样式管理

- `addStyle`：添加或修改样式属性
- `removeStyle`：移除样式属性

#### CSS 类管理

- `addClass`：添加 CSS 类
- `removeClass`：移除 CSS 类
- `setClass`：设置完整的 CSS 类列表

#### 动画与过渡

- `getAnimationDuration`：获取动画持续时间
- `getTransitionDuration`：获取过渡持续时间
- `requestAnimationFrame`：请求动画帧
- `cancelAnimationFrame`：取消动画帧

#### 特殊功能

- **Fragment 处理**：自动处理 Fragment 节点的边界标记和子节点管理
- **SVG 支持**：完整支持 SVG 元素的创建和属性设置
- **Void 元素识别**：自动识别不支持子元素的自闭合标签

### 2. createApp

应用创建工厂函数，用于初始化 Vitarx 应用。

```typescript
import { createApp } from '@vitarx/runtime-dom'

createApp(YourApp)
```

功能：
- 自动设置 `DomRenderer` 为运行时渲染器
- 注册所有节点控制器（RegularElement、VoidElement、Fragment、Text、Comment、Widget）
- 返回 `App` 实例，可调用 `mount` 方法挂载到 DOM

### 3. 类型系统

runtime-dom 提供完整的 TypeScript 类型定义，确保在 JSX 中获得优秀的智能提示体验。

#### 核心类型

- **HTMLIntrinsicElement**：所有 HTML 和 SVG 元素的属性类型映射
- **HTMLElementProps**：元素属性类型，包含事件、样式、全局属性等
- **HTMLStyleRules**：CSS 样式规则类型，支持标准 CSS 属性和自定义 CSS 变量
- **HTMLElementEvents**：事件类型定义，支持小驼峰和小写事件名
- **HTMLEventOptions**：事件监听器配置选项

#### 类型系统特性

- **W3C 标准兼容**：所有属性遵循 W3C 标准命名
- **增强的 class 属性**：支持字符串、数组、对象三种形式
- **增强的 style 属性**：支持字符串和对象形式，对象形式提供完整的 CSS 属性类型提示
- **事件修饰符支持**：Capture、Once、Passive、OnceCapture
- **自定义属性支持**：data-* 属性、v-html 等框架专属属性
- **JSX 智能提示**：在 JSX 中编写元素时提供完整的属性和事件类型提示

## 安装

```bash
npm install @vitarx/runtime-dom
```

## 使用示例

### 基础应用创建与挂载

```tsx
import { createApp } from '@vitarx/runtime-dom'
import { ref } from '@vitarx/responsive'

// 创建函数组件
function App() {
  const count = ref(0)

  return (
    <div>
      <h1>Count: {count.value}</h1>
      <button onClick={() => count.value++}>增加</button>
    </div>
  )
}

// 创建应用并挂载到 DOM
const app = createApp(SSRApp)
app.mount('#app')
```

### 属性绑定

#### class 属性的多种形式

```tsx
// 字符串形式
<div class="container active"></div>

// 数组形式
<div class={['container', 'active']}></div>

// 对象形式（key 为类名，value 为布尔值）
<div class={{ container: true, active: isActive, hidden: false }}></div>
```

#### style 属性的多种形式

```tsx
// 字符串形式
<div style="color: red; font-size: 14px"></div>

// 对象形式（提供完整的类型提示）
<div style={{ color: 'red', fontSize: '14px', '--custom-var': '10px' }}></div>
```

### 事件绑定

#### 基础事件绑定

```tsx
// 小驼峰形式（推荐）
<button onClick={(e) => console.log('clicked')}>点击</button>

// 小写形式
<button onclick={(e) => console.log('clicked')}>点击</button>
```

#### 事件修饰符

```tsx
// 捕获阶段触发
<div onClickCapture={(e) => console.log('capture phase')}>
  <button onClick={(e) => console.log('bubble phase')}>点击</button>
</div>

// 只触发一次
<button onClickOnce={(e) => console.log('只触发一次')}>点击</button>

// Passive 模式（提升滚动性能）
<div onScrollPassive={(e) => console.log('passive scroll')}>滚动区域</div>

// 组合修饰符
<button onClickCaptureOnce={(e) => console.log('捕获阶段只触发一次')}>点击</button>
```

### SVG 渲染

```tsx
function SvgIcon() {
  return (
    <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="40" fill="blue" />
      <text x="50" y="55" textAnchor="middle" fill="white">SVG</text>
    </svg>
  )
}
```

## 特性说明

### 事件系统

runtime-dom 的事件系统具有高度的灵活性：

- **多种命名风格**：支持小驼峰（`onClick`）和小写（`onclick`）两种事件名
- **事件修饰符**：通过在事件名后添加修饰符控制事件行为
  - `Capture`：在捕获阶段触发
  - `Once`：只触发一次后自动移除
  - `Passive`：声明不会调用 `preventDefault()`，提升性能
  - `OnceCapture`：组合修饰符
- **自动提取配置**：从事件名自动提取配置选项，无需手动传递

### 属性处理策略

`setAttribute` 采用智能处理策略，根据属性类型自动选择最佳的设置方式：

1. **事件属性**：检测到函数值时，直接绑定事件监听器
2. **data-* 属性**：使用 `dataset` API 设置
3. **命名空间属性**：`xmlns:xlink` 和 `xlink:*` 使用命名空间 API
4. **v-html 属性**：直接设置元素的 `innerHTML`
5. **Property 优先**：优先尝试直接设置元素的 property
6. **降级处理**：无法直接设置时，降级使用 `setAttribute`

### Fragment 节点处理

Fragment 是一种特殊的容器节点，不会在 DOM 中产生实际元素。runtime-dom 通过以下机制处理 Fragment：

- **边界标记**：使用 `$startAnchor` 和 `$endAnchor` 两个注释节点标记 Fragment 的边界
- **插入逻辑**：插入 Fragment 时，将其所有子节点插入到目标位置
- **移除逻辑**：移除 Fragment 时，删除两个边界标记之间的所有内容
- **动态恢复**：当 Fragment 的子节点被移除后，可以根据 VNode 信息动态恢复

### Void 元素识别

runtime-dom 自动识别以下不支持子元素的自闭合标签（Void Elements）：

- `area`、`base`、`br`、`col`、`embed`
- `hr`、`img`、`input`、`link`、`meta`
- `source`、`track`、`wbr`

这些元素在渲染时不会尝试添加子节点，避免不必要的 DOM 操作。

## 许可证

[MIT](LICENSE)
