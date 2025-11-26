/**
 * 过渡组件测试辅助工具
 *
 * 提供过渡动画测试所需的 Mock 函数和辅助工具
 */

import { vi } from 'vitest'
import type { HostElements } from '../../src/index.js'

/**
 * Mock CSS transition 持续时间
 *
 * @param element - 目标元素
 * @param duration - 持续时间（毫秒）
 */
export function mockTransitionDuration(element: HostElements, duration: number): void {
  const style = window.getComputedStyle(element as Element)
  vi.spyOn(style, 'transitionDuration', 'get').mockReturnValue(`${duration}ms`)
  vi.spyOn(style, 'transitionDelay', 'get').mockReturnValue('0ms')
}

/**
 * Mock CSS animation 持续时间
 *
 * @param element - 目标元素
 * @param duration - 持续时间（毫秒）
 */
export function mockAnimationDuration(element: HostElements, duration: number): void {
  const style = window.getComputedStyle(element as Element)
  vi.spyOn(style, 'animationDuration', 'get').mockReturnValue(`${duration}ms`)
  vi.spyOn(style, 'animationDelay', 'get').mockReturnValue('0ms')
}

/**
 * 等待过渡完成
 *
 * @param duration - 过渡持续时间（毫秒）
 */
export async function waitForTransition(duration: number): Promise<void> {
  vi.advanceTimersByTime(duration + 20)
  await Promise.resolve()
}

/**
 * 获取元素当前应用的类名列表
 *
 * @param element - 目标元素
 * @returns 类名数组
 */
export function getAppliedClasses(element: HostElements): string[] {
  if (element instanceof Element) {
    return Array.from(element.classList)
  }
  return []
}

/**
 * Mock getBoundingClientRect
 *
 * @param element - 目标元素
 * @param rect - 矩形配置
 */
export function mockBoundingRect(
  element: HostElements,
  rect: { left: number; top: number; width: number; height: number }
): void {
  if (element instanceof Element) {
    vi.spyOn(element, 'getBoundingClientRect').mockReturnValue({
      ...rect,
      right: rect.left + rect.width,
      bottom: rect.top + rect.height,
      x: rect.left,
      y: rect.top,
      toJSON: () => ({})
    } as DOMRect)
  }
}

/**
 * 获取计算后的 transform 值
 *
 * @param element - 目标元素
 * @returns transform 值
 */
export function getComputedTransform(element: HostElements): string {
  if (element instanceof HTMLElement) {
    return window.getComputedStyle(element).transform || ''
  }
  return ''
}

/**
 * Mock requestAnimationFrame 为同步执行
 */
export function mockRAFSync(): void {
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback: FrameRequestCallback) => {
    callback(Date.now())
    return 0
  })
}

/**
 * 检查元素是否有指定类名
 *
 * @param element - 目标元素
 * @param className - 类名
 * @returns 是否包含该类名
 */
export function hasClass(element: HostElements, className: string): boolean {
  if (element instanceof Element) {
    return element.classList.contains(className)
  }
  return false
}
