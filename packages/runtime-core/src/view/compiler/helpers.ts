import { hasPropTrack, IS_REF, isRef, type Ref } from '@vitarx/responsive'
import type { CodeLocation, RenderUnit } from '../../types/index.js'
import { DynamicView } from '../implements/index.js'
import { DynamicViewSource, SwitchViewSource } from './source.js'

/**
 * 声明式动态视图，始终创建 DynamicView 实例。
 *
 * 用于在 JSX 或非编译上下文中声明一个依赖响应式数据的动态子树。
 * 无论构建函数是否包含响应式依赖，都会创建 DynamicView 以保证行为一致。
 *
 * 与 `Dynamic` 组件的区别：`Dynamic` 是结构级动态（根据 is 切换组件类型），
 * `dynamic` 是表达式级动态（根据表达式结果重建子树）。
 *
 * 与 `expr` 的区别：`dynamic` 始终创建 DynamicView（语义明确），
 * `expr` 在无依赖时直接返回原值（性能优化）。
 *
 * @template T - 构建函数返回值类型
 * @param build 构建子视图的函数，内部访问的响应式数据变化时会重新执行
 * @param [location] 代码位置信息，用于调试
 * @returns 始终返回 `DynamicView<T>` 实例
 * @example
 * ```jsx
 * function App() {
 *   const show = ref(true)
 *
 *   // 条件渲染：show 变化时自动切换子视图
 *   return dynamic(() => (show.value ? <A /> : <B />))
 *
 *   // 派生文本：count 变化时更新文本内容
 *   // dynamic(() => count.value + 1)
 * }
 * ```
 */
export function dynamic<T extends RenderUnit>(
  build: () => T,
  location?: CodeLocation
): DynamicView<T> {
  return new DynamicView(new DynamicViewSource(build), location)
}

/**
 * 分支动态视图，基于选择器结果执行对应分支函数。
 *
 * 与 `dynamic(() => cond ? <A /> : <B />)` 的区别：
 * 当 select 返回的索引不变时，不会重新执行对应分支函数，
 * 避免了依赖变化时重建未变更的分支视图，适合多条件场景。
 *
 * @param select 选择器函数，返回当前应执行的分支索引，无匹配时返回 null
 * @param branches 分支函数数组，每个函数返回对应的渲染结果
 * @param [location] 代码位置信息，用于调试
 * @returns 返回 `DynamicView` 实例
 * @example
 * ```jsx
 * // 编译插件将以下三元表达式转换为 branch 调用：
 * // {cond === 'a' ? <A /> : cond === 'b' ? <B /> : null}
 *
 * const cond = ref('a')
 * const view = branch(
 *   () => {
 *     if (cond.value === 'a') return 0
 *     if (cond.value === 'b') return 1
 *     return null
 *   },
 *   [() => <A />, () => <B />]
 * )
 * ```
 */
export function branch(
  select: () => number | null,
  branches: (() => unknown)[],
  location?: CodeLocation
): DynamicView {
  return new DynamicView(new SwitchViewSource(select, branches), location)
}

/**
 * 属性访问器，用于在编译时包装对象属性访问以保持响应性。
 *
 * 由编译插件将 `obj.key` 形式的属性访问转换为此调用。
 * 如果属性是响应式的则返回 DynamicView（同时实现了 Ref 接口），
 * 否则直接返回属性值。
 *
 * 与 `expr` 的区别：`accessor(obj, key)` 精确匹配属性访问，
 * 同一属性的多次引用可共享同一个响应式引用；
 * `expr(getter)` 包装任意表达式，每次调用独立追踪。
 *
 * @template T 目标对象类型
 * @template K 对象属性键类型
 * @param obj 要访问的对象
 * @param key 要访问的属性键
 * @param [location] 代码位置信息，用于调试
 * @returns 非响应式属性返回原始值，响应式属性返回 `DynamicView`
 * @example
 * ```jsx
 * // JSX: <div>{data.name}</div>
 * // 编译为: createView('div', null, accessor(data, 'name'))
 *
 * const data = reactive({ name: 'Alice' })
 * accessor(data, 'name')        // → DynamicView（响应式）
 * accessor({ name: 'Bob' }, 'name') // → 'Bob'（静态值）
 * ```
 */
export function accessor<T extends object, K extends keyof T>(
  obj: T,
  key: K,
  location?: CodeLocation
): T[K] | Ref<T[K], never> {
  if (key === 'value' && isRef(obj)) return new DynamicView(obj, location)
  const { value, isTrack } = hasPropTrack(obj, key)
  if (!isTrack) return value
  if (isRef(value)) return new DynamicView(value, location)
  return new DynamicView(
    {
      [IS_REF]: true,
      get value(): T[K] {
        return obj[key]
      }
    },
    location
  )
}

/**
 * 表达式包装器，运行时判断是否需要动态追踪。
 *
 * 由编译插件将无法静态确定是否包含响应式依赖的表达式
 * （函数调用、方法调用、逻辑运算等）转换为此调用。
 *
 * 核心优化：通过 `DynamicViewSource.isStatic` 在运行时判断 getter
 * 是否包含响应式依赖。无依赖时直接返回计算值（零开销），
 * 有依赖时返回 DynamicView 自动追踪更新。
 *
 * @template T getter 返回值类型
 * @param getter 包装表达式的求值函数
 * @param [location] 代码位置信息，用于调试
 * @returns 静态表达式返回原值，动态表达式返回 `DynamicView`
 * @example
 * ```jsx
 * // JSX: <div>{count.value + 1}</div>
 * // 编译为: createView('div', null, expr(() => count.value + 1))

 * // JSX: <span>{foo()}</span>
 * // 编译为: createView('span', null, expr(() => foo()))

 * // 静态表达式零开销
 * expr(() => 'hello')  // → 'hello'
 * expr(() => 42)       // → 42
 * expr(() => count.value)  // → DynamicView（包含响应式依赖）
 * ```
 */
export function expr<T>(getter: () => T, location?: CodeLocation): T | DynamicView {
  const source = new DynamicViewSource(getter)
  return source.isStatic ? source.value : new DynamicView(source, location)
}
