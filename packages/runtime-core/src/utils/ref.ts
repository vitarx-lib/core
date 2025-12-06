import { isRefSignal, Ref, shallowRef } from '@vitarx/responsive'
import type {
  ElementOf,
  HostNodeElements,
  HostNodeNames,
  ImpostWidget,
  StatelessWidget,
  WidgetTypes
} from '../types/index.js'

/**
 * 辅助计算出元素类型
 */
export type ComputedRefElType<T> = T extends HostNodeElements
  ? T
  : T extends HostNodeNames
    ? ElementOf<T>
    : T extends StatelessWidget
      ? null
      : T extends WidgetTypes
        ? ImpostWidget<T>
        : T
/** 引用元素类型 */
export type RefEl<T> = Ref<ComputedRefElType<T> | null>

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
 *  // vitarx@3.4.1 版本后使用 ref / shallowRef / refEl 都有效
 *  const refDiv = refEl<HTMLDivElement>()
 *  onMounted(() => {
 *    console.log(refDiv?.textContent === '测试') // true
 *  })
 *  return <div ref={refDiv}>测试</div>
 * }
 * ```
 */
export function refEl<T>(): RefEl<T> {
  return shallowRef(null) as unknown as RefEl<T>
}

/**
 * 判断是否为引用元素
 *
 * vitarx@3.4.1 以上版本后等同于 `isRefSignal`
 *
 * @param obj
 */
export function isRefEl(obj: any): obj is RefEl<any> {
  return isRefSignal(obj)
}
