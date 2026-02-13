/**
 * 测试辅助工具函数
 */
import { type Component, createView, onInit } from '@vitarx/runtime-core'
import type { SSRContext } from '../src/index.js'

/**
 * 创建测试用的函数组件
 */
export function createMockComponent(content: string) {
  return function TestComponent() {
    return createView('div', { children: content })
  }
}

/**
 * 创建延迟解析的异步组件
 */
export function createMockAsyncComponent(content: string, delay: number = 10): Component {
  return function TestComponent() {
    onInit(async () => {
      await new Promise(resolve => setTimeout(resolve, delay))
    })
    return createView('div', { children: content })
  }
}

/**
 * 创建测试用的 SSR 上下文对象
 */
export function createMockSSRContext(): SSRContext {
  return {}
}

/**
 * 创建测试用的挂载容器
 */
export function createContainer(html?: string): HTMLElement {
  const container = document.createElement('div')
  container.id = 'app'
  if (html) {
    container.innerHTML = normalizeHTML(html)
  }
  document.body.appendChild(container)
  return container
}

/**
 * 等待指定时间
 */
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * 获取元素的 HTML（去除空白符，便于比较）
 */
export function normalizeHTML(html: string): string {
  return html.replace(/\s+/g, ' ').replace(/>\s+</g, '><').trim()
}
