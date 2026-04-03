# Transition 组件

`Transition` 组件用于控制子节点的进入/离开动画。它会自动应用进入/离开过渡效果，可以由 CSS 过渡或动画库控制，也可以通过 JavaScript 钩子手动控制。

## 基本用法

```tsx
import { Transition } from '@vitarx/runtime-dom'

function App() {
  const show = ref(true)

  return (
    <div>
      <button onClick={() => show.value = !show.value}>切换显示</button>
      <Transition name="fade">
        <div v-show={show.value}>内容</div>
      </Transition>
    </div>
  )
}
```

## Props

| 属性             | 类型                                          | 默认值       | 描述                                                                              |
|----------------|---------------------------------------------|-----------|---------------------------------------------------------------------------------|
| children       | View                                        | -         | 要应用过渡效果的子组件或节点                                                                  |
| name           | string                                      | 'v'       | 过渡名称前缀，用于生成 CSS 类名                                                              |
| appear         | boolean                                     | false     | 是否在初始渲染时触发过渡                                                                    |
| css            | boolean                                     | true      | 是否使用 CSS 过渡类                                                                    |
| type           | 'transition' \| 'animation' \| 'default'    | 'default' | 过渡类型，'transition' 使用 CSS transition，'animation' 使用 CSS animation，'default' 自动检测 |
| duration       | number \| { enter: number, leave: number }  | -         | 过渡持续时间（毫秒），可以是数字或对象分别指定进入和离开的持续时间                                               |
| mode           | 'default' \| 'in-out' \| 'out-in'           | 'default' | 过渡模式：default（同时进行）、out-in（先离开后进入）、in-out（先进入后离开）                                |
| onBeforeEnter  | (el: HTMLElement) => void                   | -         | 进入过渡前的钩子函数                                                                      |
| onEnter        | (el: HTMLElement, done: () => void) => void | -         | 进入过渡时的钩子函数，需要手动调用 done() 表示完成                                                   |
| onAfterEnter   | (el: HTMLElement) => void                   | -         | 进入过渡完成后的钩子函数                                                                    |
| onBeforeLeave  | (el: HTMLElement) => void                   | -         | 离开过渡前的钩子函数                                                                      |
| onLeave        | (el: HTMLElement, done: () => void) => void | -         | 离开过渡时的钩子函数，需要手动调用 done() 表示完成                                                   |
| onAfterLeave   | (el: HTMLElement) => void                   | -         | 离开过渡完成后的钩子函数                                                                    |
| onBeforeAppear | (el: HTMLElement) => void                   | -         | 初次渲染进入过渡前的钩子函数                                                                  |
| onAppear       | (el: HTMLElement, done: () => void) => void | -         | 初次渲染进入过渡时的钩子函数，需要手动调用 done() 表示完成                                               |
| onAfterAppear  | (el: HTMLElement) => void                   | -         | 初次渲染进入过渡完成后的钩子函数                                                                |

## 功能说明

### CSS 过渡

Transition 组件会自动应用以下 CSS 类名来实现过渡效果：

- `{name}-enter-from`：定义进入过渡的开始状态
- `{name}-enter-active`：定义进入过渡生效时的状态
- `{name}-enter-to`：定义进入过渡的结束状态
- `{name}-leave-from`：定义离开过渡的开始状态
- `{name}-leave-active`：定义离开过渡生效时的状态
- `{name}-leave-to`：定义离开过渡的结束状态
- `{name}-appear-from`：定义初次渲染时的进入过渡开始状态
- `{name}-appear-active`：定义初次渲染时的进入过渡生效时的状态
- `{name}-appear-to`：定义初次渲染时的进入过渡结束状态

其中 `{name}` 是 Transition 组件的 name 属性值，默认为 "v"。

```tsx
// 使用 CSS 过渡
<Transition name="fade">
  <div v-show={show}>内容</div>
</Transition>
```

```css
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.5s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
```

### JavaScript 钩子

可以通过 JavaScript 钩子函数完全控制过渡过程，这对于使用第三方动画库或需要复杂动画逻辑的场景非常有用。

```tsx
<Transition
  onBeforeEnter={(el) => console.log('进入前', el)}
  onEnter={(el, done) => {
    // 执行进入动画
    setTimeout(() => done(), 500)
  }}
  onAfterEnter={(el) => console.log('进入完成', el)}
  onBeforeLeave={(el) => console.log('离开前', el)}
  onLeave={(el, done) => {
    // 执行离开动画
    setTimeout(() => done(), 500)
  }}
  onAfterLeave={(el) => console.log('离开完成', el)}
>
  <div v-show={show}>内容</div>
</Transition>
```

### 过渡模式

Transition 组件支持三种过渡模式，用于控制进入和离开动画的执行顺序：

#### default 模式（默认）

进入和离开动画同时进行，这是默认行为。

```tsx
<Transition mode="default">
  <div v-show={show}>内容</div>
</Transition>
```

#### out-in 模式

当前元素先执行离开动画，完成后再执行新元素的进入动画。这可以避免两个元素同时存在于 DOM 中。

```tsx
<Transition mode="out-in">
  {currentTab === 'home' ? <Home /> : <About />}
</Transition>
```

#### in-out 模式

新元素先执行进入动画，完成后再执行当前元素的离开动画。这可以让新元素在旧元素离开前就已经可见。

```tsx
<Transition mode="in-out">
  {currentTab === 'home' ? <Home /> : <About />}
</Transition>
```

### 自定义持续时间

可以通过 duration 属性自定义过渡的持续时间：

```tsx
// 使用数字指定持续时间（毫秒）
<Transition duration={300}>
  <div v-show={show}>内容</div>
</Transition>

// 使用对象分别指定进入和离开的持续时间
<Transition duration={{ enter: 500, leave: 800 }}>
  <div v-show={show}>内容</div>
</Transition>
```

### 初始渲染过渡

默认情况下，Transition 组件不会在初始渲染时触发过渡。如果需要在组件首次挂载时也显示过渡效果，可以设置 appear 属性为 true。

```tsx
<Transition name="fade" appear>
  <div>初始渲染时也会显示过渡效果</div>
</Transition>
```

## 注意事项

1. **单个子元素限制**：Transition 组件只能包裹单个子元素或组件。如果需要过渡多个元素，请使用 TransitionGroup 组件。
2. **CSS 定义要求**：当使用 CSS 过渡时，确保在 CSS 中正确定义了过渡或动画属性，否则过渡效果可能不会显示。
3. **v-show 兼容性**：Transition 组件完全兼容 v-show 指令，可以响应 v-show 的值变化来触发过渡。
4. **条件渲染兼容性**：Transition 组件也支持条件渲染（v-if），会自动处理视图切换时的过渡效果。
5. **取消过渡**：当快速切换状态时，Transition 会自动取消未完成的过渡，避免动画冲突。

## 示例

### 基础淡入淡出示例

```tsx
function FadeExample() {
  const show = ref(true)

  return (
    <div>
      <button onClick={() => show.value = !show.value}>切换显示</button>
      <Transition name="fade">
        <div v-show={show.value} className="box">
          淡入淡出效果
        </div>
      </Transition>
    </div>
  )
}
```

```css
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
```

### 滑动效果示例

```tsx
function SlideExample() {
  const show = ref(true)

  return (
    <div>
      <button onClick={() => show.value = !show.value}>切换显示</button>
      <Transition name="slide">
        <div v-show={show.value} className="panel">
          滑动效果
        </div>
      </Transition>
    </div>
  )
}
```

```css
.slide-enter-active, .slide-leave-active {
  transition: all 0.3s ease-out;
}
.slide-enter-from {
  transform: translateX(-100%);
  opacity: 0;
}
.slide-leave-to {
  transform: translateX(100%);
  opacity: 0;
}
```

### 模态框切换示例

```tsx
function ModalExample() {
  const currentModal = ref<'login' | 'register' | null>(null)

  return (
    <div>
      <button onClick={() => currentModal.value = 'login'}>登录</button>
      <button onClick={() => currentModal.value = 'register'}>注册</button>

      <Transition mode="out-in">
        {currentModal.value === 'login' && (
          <LoginForm key="login" />
        )}
        {currentModal.value === 'register' && (
          <RegisterForm key="register" />
        )}
      </Transition>
    </div>
  )
}
```

### 使用第三方动画库

```tsx
import gsap from 'gsap'

function GSAPExample() {
  const show = ref(true)

  return (
    <div>
      <button onClick={() => show.value = !show.value}>切换显示</button>
      <Transition
        css={false}
        onEnter={(el, done) => {
          gsap.fromTo(el, 
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.5, onComplete: done }
          )
        }}
        onLeave={(el, done) => {
          gsap.to(el, 
            { opacity: 0, y: -20, duration: 0.5, onComplete: done }
          )
        }}
      >
        <div v-show={show.value}>使用 GSAP 动画</div>
      </Transition>
    </div>
  )
}
```

## 错误处理

Transition 组件会在以下情况下输出警告或错误：

1. **多个子元素**：当 Transition 包裹多个子元素时，会输出警告信息。
2. **无效的 CSS 选择器**：当 name 属性包含无效字符时，可能会影响 CSS 类名的生成。
3. **钩子函数未调用 done()**：当使用 JavaScript 钩子时，如果忘记调用 done()，过渡可能无法正常完成。

## 与 v-show 和 v-if 的兼容性

Transition 组件完全兼容 v-show 和 v-if 指令：

- **v-show**：当使用 v-show 切换显示状态时，Transition 会自动触发进入/离开过渡
- **v-if**：当使用 v-if 进行条件渲染时，Transition 会在视图切换时执行过渡效果

```tsx
// 使用 v-show
<Transition name="fade">
  <div v-show={show}>内容</div>
</Transition>

// 使用 v-if
<Transition name="fade">
  {show && <div>内容</div>}
</Transition>
```
