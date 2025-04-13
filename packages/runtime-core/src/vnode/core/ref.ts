// 辅助计算出元素类型
import type {
  IntrinsicElementNames,
  RuntimeContainerElement,
  RuntimeElement
} from '../../renderer/index'
import type { ExcludeWidgetIntrinsicKeywords } from '../../widget/core/constant'
import { type Fragment, RefElSymbol } from './constant'

type ComputedRefElType<T> = T extends IntrinsicElementNames
  ? RuntimeElement<T>
  : T extends Fragment
    ? RuntimeContainerElement
    : ExcludeWidgetIntrinsicKeywords<T>

/** 引用元素类型 */
export type RefEl<T> = {
  value: ComputedRefElType<T> | null
  readonly [RefElSymbol]: true
}

/**
 * 引用节点元素
 *
 * 会在`Widget`或`HTML标签`挂载到dom树后自动赋值给`value`属性字段
 *
 * 如果是引用的是组件，value则是组件实例，其他则是元素实例
 *
 * @example
 * ```tsx
 * function App() {
 *  const refDiv = refEl<HTMLDivElement>()
 *  onMounted(() => {
 *    console.log(refDiv?.textContent === '测试') // true
 *  })
 *  return <div ref={refDiv}>测试</div>
 * }
 * ```
 */
export function refEl<T>(): RefEl<T> {
  const obj = { value: null } as RefEl<T>
  Object.defineProperty(obj, RefElSymbol, { value: true })
  return obj
}

/**
 * 判断是否为引用元素
 *
 * @param obj
 */
export function isRefEl(obj: any): obj is RefEl<any> {
  return obj?.[RefElSymbol] === true
}
