import { unref } from '@vitarx/responsive'
import { hasOwnProperty, isRecordObject } from '@vitarx/utils'
import { INTRINSIC_ATTRIBUTES } from '../../constants/index.js'
import { getRenderer } from '../../runtime/index.js'
import type { AnyProps, View } from '../../types/index.js'
import { SPECIAL_PROP_MERGERS } from './resolve.js'

/**
 * 合并多个对象属性的工具函数
 *
 * @template T - 泛型参数，表示对象的类型，必须为Record<string, any>的子类型
 * @returns {T} 返回合并后的新对象
 * @param sources - 属性源对象列表
 */
export function mergeProps<T extends AnyProps>(...sources: AnyProps[]): AnyProps {
  // 初始化一个空对象作为合并结果
  const result: Record<string, any> = {}

  // 过滤非法 props
  const propsList = sources.filter(isRecordObject)
  if (!propsList.length) return result as T

  // ---------- 收集所有 key ----------
  const keys = new Set<string>()
  for (const props of propsList) {
    for (const key in props) {
      if (INTRINSIC_ATTRIBUTES.has(key) || key.startsWith('v-')) continue
      keys.add(key)
    }
  }
  // ---------- 定义 getter ----------
  for (const key of keys) {
    const merger = SPECIAL_PROP_MERGERS[key as keyof typeof SPECIAL_PROP_MERGERS]

    Object.defineProperty(result, key, {
      enumerable: true,
      get() {
        let mergedValue: any
        let hasValue = false
        // 倒序遍历：后面的 props 优先
        for (let i = propsList.length - 1; i >= 0; i--) {
          const props = propsList[i]
          if (!hasOwnProperty(props, key)) continue
          const value = unref(props[key])
          if (!hasValue) {
            mergedValue = value
            hasValue = true
            continue
          }

          // ---- class / style 合并 ----
          if (merger) {
            mergedValue = merger(value, mergedValue)
          } else {
            // 普通属性：直接覆盖（高优先级已生效）
            break
          }
        }
        return mergedValue
      }
    })
  }
  return result as T
}

/**
 * 替换视图函数，用于处理视图的切换和生命周期管理
 * @param prev - 前一个视图实例
 * @param next - 即将显示的新视图实例
 */
export function replaceView(prev: View, next: View): void {
  // 检查前一个视图是否已激活，如果未激活则直接返回
  if (!prev.isUnused) return
  // 检查新视图是否已经激活，如果已激活则抛出错误
  if (next.isActivated) {
    getRenderer().insert(prev.$node!, next.$node!)
  }
  // 根据前一个视图的初始化状态决定如何处理新视图
  if (prev.isInitialized) {
    // 如果前一个视图已初始化，则使用相同的上下文初始化新视图
    next.init(prev.ctx)
  } else {
    // 如果前一个视图未初始化，则直接挂载新视图到指定节点
    next.mount(prev.$node!, 'insert')
  }
  // 处理完新视图后，销毁前一个视图
  prev.dispose()
}
