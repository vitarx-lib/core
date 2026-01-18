import { ShallowRef, shallowRef } from '@vitarx/responsive'
import type {
  HostElement,
  HostElementTag,
  Widget,
  WidgetPublicInstance
} from '../../types/index.js'

/**
 * 辅助计算出元素类型
 */
type InstanceOf<T> = ShallowRef<
  | (T extends HostElement
      ? T
      : T extends HostElementTag
        ? HostElement<T>
        : T extends Widget
          ? WidgetPublicInstance
          : T)
  | null
>
/** 引用元素类型 */
/**
 * 引用元素/组件实例
 *
 * 仅组件/元素支持引用，当引用组件时 `.value` 为组件实例。
 *
 * @example
 * ```tsx
 * function App() {
 *  const refDiv = refEl<HTMLDivElement>()
 *  const refFoo = refEl<YourWidget>()
 *  onMounted(() => {
 *    console.log(refDiv.value?.textContent === '测试') // true
 *    // YourWidget 是类组件下面的示例才会是true，函数组件的实例可能是一个普通对象
 *    console.log(refFoo.value !== null) // true
 *  })
 *  return <>
 *    <div ref={refDiv}>测试</div>
 *    <YourWidget ref={refFoo} />
 *  </>
 * }
 * ```
 */
export function useRef<T>(): InstanceOf<T> {
  return shallowRef(null) as unknown as InstanceOf<T>
}
