import { hasPropTrack, IS_REF, type Ref } from '@vitarx/responsive'
import { isFunction } from '@vitarx/utils'
import type { CodeLocation, ValidChild } from '../../types/index.js'
import { DynamicView } from '../view/index.js'
import { DynamicViewSource, SwitchViewSource } from './source.js'

const readonlyPropCache = new WeakMap<object, Map<PropertyKey, Ref>>()
/**
 * 创建一个只读的响应式引用对象
 *
 * @param obj - 源对象
 * @param key - 源对象上的键
 * @returns {Ref} 返回一个只读的引用对象
 */
export function readonlyProp<T extends object, K extends keyof T>(obj: T, key: K): Ref<T[K]> {
  let map = readonlyPropCache.get(obj)
  if (!map) {
    map = new Map()
    readonlyPropCache.set(obj, map)
  }
  let cached = map.get(key)
  if (!cached) {
    cached = {
      [IS_REF]: true,
      get value(): T[K] {
        return obj[key]
      }
    }
    map.set(key, cached)
  }
  return cached as Ref<T[K]>
}

/**
 * 处理条件渲染表达式
 *
 * @internal
 * @param select - 选择器函数，用于决定执行哪个分支
 * @param branches - 分支函数数组，每个函数返回一个计算值
 * @param location - 代码位置
 * @returns {DynamicView} - 切换视图
 */
export function switchExpressions(
  select: () => number,
  branches: (() => unknown)[],
  location?: CodeLocation
): DynamicView {
  return new DynamicView(new SwitchViewSource(select, branches), location)
}

/**
 * 处理成员表达式，根据对象的属性返回相应的值或视图
 *
 * @internal
 * @param obj - 要处理的对象，必须是 object 类型
 * @param key - 对象的属性键，必须是 obj 的键之一
 * @returns 返回属性值或 DynamicView 视图对象
 */
export function memberExpressions<T extends object, K extends keyof T>(
  obj: T,
  key: K
): T[K] | DynamicView<T[K]> {
  // 检查对象是否有属性跟踪
  const { value, isTrack } = hasPropTrack(obj, key)
  // 如果值是函数，则直接返回该函数
  if (isFunction(value)) return value
  // 如果需要跟踪，则返回 SwitchView 视图对象；否则直接返回值
  return isTrack ? new DynamicView<T[K]>(readonlyProp(obj, key)) : value
}

/**
 * 构建视图的辅助函数
 *
 * 因为编译器只针对 jsx 模板代码进行编译转换，组件返回三元表达式无法更新视图，
 * 所以需要使用 build 辅助构建出一个 DynamicView 来更新视图。
 *
 * @example
 * ```ts
 * function App() {
 *   const show = ref(true)
 *   return build(() => show.value ? 'show' : 'hide')
 * }
 * ```
 *
 * @param build - 一个无参数返回View的函数，用于构建视图。
 * @returns { View } 返回构建好的视图，可能是静态视图也可能是动态视图
 */
export function build<T extends ValidChild>(build: () => T): DynamicView<T> {
  // 判断如果是静态视图，直接返回计算值；否则创建动态视图
  return new DynamicView(new DynamicViewSource(build))
}
