import {
  clearEffectLinks,
  collectSignal,
  hasLinkedSignal,
  IS_READONLY,
  IS_REF,
  IS_SIGNAL,
  onScopeDispose,
  type RefSignal,
  trackSignal,
  triggerSignal
} from '@vitarx/responsive'
import { type AnyPrimitive } from '@vitarx/utils/src/index.js'
import { IS_VIEW_REF } from '../../constants/index.js'
import type { View } from '../../types/index.js'
import { isBlock } from '../../utils/index.js'
import { createCommentView } from '../creator/comment.js'
import { createTextView } from '../creator/text.js'

const valueToView = (value: View | AnyPrimitive): View => {
  if (isBlock(value)) return value
  if (value == null || typeof value === 'boolean') {
    return createCommentView('v-if')
  }
  return createTextView(String(value))
}

/**
 * ViewRef 类是一个泛型类，实现了 RefSignal 接口，用于表示视图引用
 *
 * @template T - 泛型参数，默认类型为 View
 */
export class ViewRef<T extends View = View> implements RefSignal<T> {
  // 标识这是一个信号对象
  readonly [IS_SIGNAL]: true = true
  // 标识这是一个引用对象
  readonly [IS_REF]: true = true
  // 标识这是一个视图引用
  readonly [IS_VIEW_REF]: true = true
  // 标识这是一个只读引用
  readonly [IS_READONLY]: true = true
  // 标识是否包含动态内容
  public readonly hasDynamic: boolean = false
  // 标记是否需要重新构建
  private dirty: boolean = true
  // 副作用处理函数
  private readonly effectHandle: () => void
  // 缓存的视图值
  private cached: T
  /**
   * 构造函数
   * @param getter - 获取视图值的函数
   */
  constructor(private getter: () => T | AnyPrimitive) {
    // 初始化副作用处理函数，用于标记需要重新构建
    this.effectHandle = () => {
      this.dirty = true
      triggerSignal(this)
    }
    // 初始化 prev，收集信号并转换为视图值
    this.cached = valueToView(collectSignal(getter, this.effectHandle)) as T
    // 检查是否有链接的信号，如果有则标记为动态并处理清理
    if (hasLinkedSignal(this.effectHandle)) {
      this.hasDynamic = true
      onScopeDispose(() => clearEffectLinks(this.effectHandle))
    }
  }
  /**
   * 获取视图值
   * 如果不是动态内容，直接返回缓存值
   * 如果是动态内容且需要重新构建，则先重建再返回
   */
  get value(): T {
    if (!this.hasDynamic) return this.cached
    if (this.dirty) this.reBuild()
    trackSignal(this)
    return this.cached
  }
  /**
   * 重建视图值
   * 首先标记为不需要重建
   * 然后获取新的视图值
   * 检查是否可以复用，如果不能则直接替换
   */
  protected reBuild(): void {
    this.dirty = false
    const result = valueToView(collectSignal(this.getter, this.effectHandle))
    // 类型与 key 相同，尝试复用
    if (
      this.cached.flag === result.flag &&
      this.cached.key === result.key &&
      (('text' in this.cached && this.cached.text === (result as typeof this.cached).text) ||
        ('type' in this.cached && this.cached.type === (result as typeof this.cached).type))
    ) {
      return
    }
    // 不可复用，直接替换
    this.cached = result as T
  }
}

/**
 * 判断给定的值是否为ViewRef类型
 *
 * @param val 需要判断的值
 * @returns {boolean} 如果值是ViewRef类型则返回true，否则返回false
 */
export function isViewRef(val: any): val is ViewRef {
  return val?.[IS_VIEW_REF]
}

/**
 * `viewRef` 用于创建动态视图引用。
 *
 * 开发者通常无需使用此 api ，jsx children 中的表达式在编译时会自动转换为 `ViewRef`。
 *
 * @example
 * ```tsx
 * const App = () => {
 *   const show = ref(true)
 *   const child = viewRef(() => show.value ? <div>test<div> : null)
 *   return <div>{child}</div>
 * }
 * // 等效 jsx 表达式
 * // return <div>{show.value ? <div>test<div> : null}</div>
 * ```
 *
 * @remarks
 * ⚠️ 注意： computed 也能实现类似效果，但在JSX模板编译时时会被二次包装为 `ViewRef`，
 * 所以推荐使用 `viewRef` api 实现动态视图。
 *
 * @template T - 视图类型
 * @param getter - 获取视图的函数
 * @returns {T | ViewRef<T>} 返回一个视图引用或者原始值
 */
export function viewRef<T extends View>(getter: () => T | AnyPrimitive): ViewRef<T> {
  return new ViewRef<T>(getter) // 使用getter函数创建并返回一个新的ViewRef实例
}
