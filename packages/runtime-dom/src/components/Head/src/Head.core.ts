import { unref } from '@vitarx/responsive'
import {
  CommentView,
  ElementView,
  getInstance,
  isElementView,
  isTextView,
  onDispose,
  onInit,
  onMounted,
  type View
} from '@vitarx/runtime-core'

interface HeadProps {
  /**
   * 头部的子元素
   *
   * @example
   * ```jsx
   * <Head>
   *   <title>Document</title>
   *   <meta name="description" content="This is a description" />
   *   <link rel="icon" href="/favicon.ico" />
   *   <script src="path/to/your/script.js"></script>
   *   <style>body { background-color: blue; }</style>
   * </Head>
   * ```
   */
  children: View | View[]
}

/**
 * Head 特殊组件 - 用于将子元素添加到文档的 `<head>` 部分
 *
 * @description
 * 该组件提供了一种声明式的方式来管理文档的 `<head>` 元素内容。
 * 它会自动处理不同类型的 head 元素，并确保在组件卸载时正确清理资源。
 *
 * ## 核心特性
 *
 * ### 1. Title 特殊处理
 * - `<title>` 元素不会直接插入到 DOM
 * - 使用 `document.title` API 设置标题，避免不必要的 DOM 操作
 * - 组件卸载时会恢复之前的标题（如果当前标题未被其他地方修改）
 *
 * ### 2. 其他元素处理
 * - `<meta>`、`<link>`、`<style>`、`<script>` 等元素直接插入到 `document.head`
 * - 不会删除或修改页面原有的 head 元素
 * - 组件卸载时自动清理自己添加的元素
 *
 * ### 3. 生命周期管理
 * - **初始化阶段**: 初始化子元素的视图上下文（title 元素除外）
 * - **挂载阶段**: 将元素添加到 document.head 或设置 document.title
 * - **销毁阶段**: 清理添加的元素并恢复原标题
 *
 * ## 使用示例
 *
 * ```tsx
 * // 基本用法
 * function MyPage() {
 *   return (
 *     <>
 *       <Head>
 *         <title>我的页面</title>
 *         <meta name="description" content="页面描述" />
 *         <link rel="icon" href="/favicon.ico" />
 *       </Head>
 *       <div>页面内容</div>
 *     </>
 *   )
 * }
 *
 * // 动态标题
 * function DynamicTitle({ pageName }: { pageName: string }) {
 *   return (
 *     <Head>
 *       <title>{pageName} - 我的网站</title>
 *     </Head>
 *   )
 * }
 *
 * // 添加样式和脚本
 * function WithAssets() {
 *   return (
 *     <Head>
 *       <style>{`
 *         body { margin: 0; }
 *         .container { max-width: 1200px; }
 *       `}</style>
 *       <script src="https://example.com/analytics.js" async></script>
 *     </Head>
 *   )
 * }
 * ```
 *
 * ## 注意事项
 *
 * 1. **Title 恢复机制**: 组件卸载时只有在当前标题与设置的标题一致时才会恢复原标题
 * 2. **SSR 兼容**: 在服务端渲染环境下，组件会返回占位符而不执行 DOM 操作
 * 3. **元素过滤**: 非元素视图（如文本节点）会被自动过滤
 * 4. **内存管理**: 组件销毁时会自动清理添加的元素，防止内存泄漏
 *
 * @param props - 组件属性
 * @param props.children - 要添加到 head 的子元素，可以是单个元素或元素数组
 * @returns 返回一个注释节点作为占位符
 */
function Head(props: HeadProps): CommentView {
  const placeholder = new CommentView(`teleport:head`)
  const children = unref(props.children)
  if (__VITARX_SSR__ || !children) return placeholder

  const instance = getInstance()!
  const childArray = (Array.isArray(children) ? children : [children]).filter(isElementView)
  const oldTitle: string = document.title
  let currentTitle: string | null = null
  onInit(() => {
    for (const child of childArray) {
      if (isElementView(child) && child.tag !== 'title') {
        child.init(instance.subViewContext)
      }
    }
  })

  onMounted(() => {
    const head = document.head
    for (const child of childArray) {
      if (isElementView(child)) {
        const tag = child.tag
        if (tag === 'title') {
          currentTitle = setTitleFromElement(child)
        } else {
          child.mount(head, 'append')
        }
      }
    }
  })

  onDispose(() => {
    for (const child of childArray) {
      if (child.isRuntime) child.dispose()
    }
    if (currentTitle && document.title === currentTitle) {
      document.title = oldTitle
    }
  })

  return placeholder
}

/**
 * 从 title 元素中提取文本并设置 document.title
 *
 * @param titleElement - title 元素视图
 * @returns 设置的标题内容
 */
function setTitleFromElement(titleElement: ElementView): string | null {
  const children = titleElement.children
  if (children.length > 0 && isTextView(children[0])) {
    const title = children[0].text
    document.title = children[0].text
    return title
  }
  return null
}

export { Head, type HeadProps }
