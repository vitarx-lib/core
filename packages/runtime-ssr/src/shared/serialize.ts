import { flushSync } from '@vitarx/responsive'
import {
  type AnyProps,
  ComponentView,
  ElementView,
  FragmentView,
  ListView,
  type View,
  ViewKind
} from '@vitarx/runtime-core'
import { deepMergeObject, logger } from '@vitarx/utils'
import { escapeHTML, tagClose, tagOpen, tagSelfClosing, VOID_TAGS } from './html.js'
import type { Sink } from './sink.js'

/**
 * 应用指令样式到 props
 */
export function resolveDirectiveProps(view: ElementView, props: AnyProps): AnyProps {
  if (view.directives) {
    for (const [directive, binding] of view.directives.entries()) {
      const method = directive.getSSRProps
      if (typeof method === 'function') {
        try {
          const ssrProps = method(binding, view)
          if (ssrProps) props = deepMergeObject(props, ssrProps)
        } catch (e) {
          logger.error(
            `[applyDirective] Error in directive<v-${directive.name}>.getSSRProps: ${e}`,
            view.location
          )
        }
      }
    }
  }
  return props
}

/**
 * 序列化元素视图并将其写入输出流
 *
 * @param {ElementView} view - 要序列化的元素视图对象
 * @param {Sink} sink - 用于接收序列化结果的输出流
 * @returns {Promise<void>} 返回一个Promise，表示序列化操作完成
 *
 * @description
 * 该函数执行以下操作：
 * 1. 从视图对象中提取标签名、属性和子元素
 * 2. 解析指令属性
 * 3. 将开始标签写入输出流
 * 4. 如果存在v-html属性，则直接写入其值；否则递归序列化子元素
 * 5. 将结束标签写入输出流
 *
 * @example
 * ```typescript
 * const view = createElementView('div', { id: 'app' })
 * const sink = new Sink()
 * await serializeElement(view, sink, true)
 * ```
 */
async function serializeElement(view: ElementView, sink: Sink): Promise<void> {
  const { tag: tagName, props, children } = view
  const resolvedProps = resolveDirectiveProps(view, props ?? {})
  if (VOID_TAGS.has(tagName)) {
    sink.push(tagSelfClosing(tagName, resolvedProps))
    return void 0
  }
  sink.push(tagOpen(tagName, resolvedProps))

  const content = resolvedProps['v-html'] || resolvedProps['v-text']
  if (content) {
    sink.push(content)
  } else {
    for (const child of children) {
      await serializeViewToSink(child, sink)
    }
  }

  sink.push(tagClose(tagName))
}

/**
 * 将组视图（ListView 或 FragmentView）序列化为 HTML 字符串并推入 sink 中
 *
 * @param view - 要序列化的视图，可以是 ListView 或 FragmentView
 * @param sink - 用于接收序列化结果的 Sink 对象
 * @returns {Promise<void>} 异步操作完成后的 Promise
 */
async function serializeGroup(view: ListView | FragmentView, sink: Sink): Promise<void> {
  const type = view.kind === ViewKind.LIST ? 'List' : 'Fragment'

  sink.push(`<!--${type}:start-->`)
  for (const child of view.children) {
    await serializeViewToSink(child, sink)
  }
  sink.push(`<!--${type}:end-->`)
}

/**
 * 序列化组件视图及其子视图到指定的输出流中。
 *
 * @param view - 需要序列化的组件视图
 * @param sink - 序列化数据的输出目标
 * @returns Promise<void> - 表示序列化操作完成的Promise
 */
async function serializeComponent(view: ComponentView, sink: Sink): Promise<void> {
  await waitAsyncInit(view)
  const child = view.instance!.subView
  await serializeViewToSink(child, sink)
}

/**
 * 序列化视图对象的核心方法，根据视图的类型执行相应的序列化操作
 * @param view - 要序列化的视图对象
 * @param sink - 用于接收序列化结果的输出目标
 * @returns Promise<void> - 返回一个Promise，表示序列化操作完成
 * @remarks
 * 支持的视图类型包括：
 * - ELEMENT: 元素节点
 * - TEXT: 文本节点（会进行HTML转义）
 * - COMMENT: 注释节点
 * - LIST: 列表节点
 * - FRAGMENT: 片段节点
 * - DYNAMIC: 动态节点
 * - COMPONENT: 组件节点
 *
 * 序列化完成后会调用视图的dispose方法进行清理
 */
export async function serializeViewToSink(view: View, sink: Sink): Promise<void> {
  switch (view.kind) {
    case ViewKind.ELEMENT:
      await serializeElement(view, sink)
      break

    case ViewKind.TEXT:
      sink.push(escapeHTML(view.text))
      break

    case ViewKind.COMMENT:
      sink.push(`<!--${view.text}-->`)
      break

    case ViewKind.LIST:
    case ViewKind.FRAGMENT:
      await serializeGroup(view, sink)
      break

    case ViewKind.DYNAMIC:
      await serializeViewToSink(view.current!, sink)
      break

    case ViewKind.COMPONENT:
      await serializeComponent(view, sink)
      break
  }

  view.dispose()
}

/**
 * 异步等待组件视图初始化完成。
 *
 * @param view - 组件视图对象，包含需要等待初始化的实例。
 * @returns Promise<void> - 返回一个 Promise，在初始化完成后解析。
 *
 * @remarks
 * 该函数会检查视图实例的 initPromise 属性，如果存在则等待其完成。
 * 完成后会调用 flushSync() 确保所有同步更新被刷新。
 *
 * @example
 * ```typescript
 * const myView: ComponentView = { ... };
 * await waitAsyncInit(myView);
 * ```
 */
async function waitAsyncInit(view: ComponentView): Promise<void> {
  const initPromise = view.instance!.initPromise
  if (initPromise) {
    await initPromise
    flushSync()
  }
}
