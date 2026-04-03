# Head 组件

`Head` 组件用于将子元素添加到文档的 `<head>` 部分，提供声明式的方式管理页面的 head 元素内容。

## 安装

```bash
npm install @vitarx/runtime-dom
```

## 基本用法

```tsx
import { Head } from '@vitarx/runtime-dom'

function App() {
  return (
    <>
      <Head>
        <title>我的页面</title>
        <meta name="description" content="页面描述" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div>页面内容</div>
    </>
  )
}
```

## 核心特性

### 1. Title 特殊处理

`<title>` 元素不会直接插入到 DOM，而是使用 `document.title` API 设置标题，避免不必要的 DOM 操作。

```tsx
<Head>
  <title>页面标题</title>
</Head>
```

组件卸载时会恢复之前的标题（如果当前标题未被其他地方修改）。

### 2. 其他元素处理

`<meta>`、`<link>`、`<style>`、`<script>` 等元素直接插入到 `document.head`：

```tsx
<Head>
  <meta name="description" content="页面描述" />
  <link rel="icon" href="/favicon.ico" />
  <style>{`body { margin: 0; }`}</style>
  <script src="https://example.com/analytics.js" async></script>
</Head>
```

组件卸载时自动清理自己添加的元素。

### 3. 动态内容

支持动态内容：

```tsx
function DynamicTitle({ pageName }: { pageName: string }) {
  return (
    <Head>
      <title>{pageName} - 我的网站</title>
      <meta name="description" content={`${pageName}的描述`} />
    </Head>
  )
}
```

### 4. 多个元素

可以同时添加多个 head 元素：

```tsx
<Head>
  <title>多个元素</title>
  <meta name="description" content="页面描述" />
  <meta name="keywords" content="关键词1,关键词2" />
  <link rel="icon" href="/favicon.ico" />
  <link rel="stylesheet" href="/styles.css" />
</Head>
```

## API

### Props

```tsx
interface HeadProps {
  /**
   * 要添加到 head 的子元素
   * 可以是单个元素或元素数组
   */
  children: View | View[]
}
```

### 返回值

返回一个注释节点（CommentView）作为占位符，不会渲染实际的 DOM 元素。

## 注意事项

1. **Title 恢复机制**: 组件卸载时只有在当前标题与设置的标题一致时才会恢复原标题
2. **SSR 兼容**: 在服务端渲染环境下，组件会返回占位符而不执行 DOM 操作
3. **元素过滤**: 非元素视图（如文本节点）会被自动过滤
4. **内存管理**: 组件销毁时会自动清理添加的元素，防止内存泄漏

## 示例

### 基本页面设置

```tsx
function MyPage() {
  return (
    <>
      <Head>
        <title>我的应用 - 首页</title>
        <meta name="description" content="这是我的应用首页" />
        <meta name="keywords" content="应用,首页,React" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main>
        <h1>欢迎来到我的应用</h1>
      </main>
    </>
  )
}
```

### 添加样式和脚本

```tsx
function WithAssets() {
  return (
    <>
      <Head>
        <title>带资源的页面</title>
        <style>{`
          body {
            margin: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
          }
          .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
          }
        `}</style>
        <script src="https://example.com/analytics.js" async></script>
      </Head>
      <div className="container">
        <h1>页面内容</h1>
      </div>
    </>
  )
}
```

## 相关链接

- [document.title API](https://developer.mozilla.org/en-US/docs/Web/API/Document/title)
- [HTML head 元素](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/head)

## License

MIT
