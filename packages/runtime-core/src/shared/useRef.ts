import { ShallowRef, shallowRef } from '@vitarx/responsive'
import type {
  Component,
  ComponentPublicInstance,
  HostElement,
  HostElementTag
} from '../types/index.js'

/**
 * 辅助计算出元素类型
 */
type InstanceOf<T> = ShallowRef<
  | (T extends HostElement
      ? T
      : T extends HostElementTag
        ? HostElement<T>
        : T extends Component
          ? ComponentPublicInstance
          : T)
  | null
>
/**
 * 引用元素/组件实例
 *
 * 仅组件/元素支持引用，当引用组件时 `.value` 为组件实例。
 *
 * @example
 * ```tsx
 * function App() {
 *  const refDiv = useRef<HTMLDivElement>()
 *  // 假设 FooPublicInstance 是 Foo 组件暴露的公开实例类型
 *  const refFoo = useRef<FooPublicInstance>()
 *  onMounted(() => {
 *    console.log(refDiv.value?.textContent === '测试') // true
 *    console.log(refFoo.value !== null) // true
 *  })
 *  return <>
 *    <div ref={refDiv}>测试</div>
 *    <Foo ref={refFoo} />
 *  </>
 * }
 * ```
 */
export function useRef<T>(): InstanceOf<T> {
  return shallowRef(null) as unknown as InstanceOf<T>
}
