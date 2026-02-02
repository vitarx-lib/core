import { isFunction } from '@vitarx/utils'
import { viewEffect } from '../../../runtime/effect.js'
import { defineValidate, getInstance, onDispose, onHide, onShow } from '../../../runtime/index.js'
import { ListView } from '../../../view/index.js'
import {
  initListChildren,
  type KeyedViewMap,
  type KeyExtractor,
  updateListChildren,
  type ViewFactory
} from './For.utils.js'

/**
 * For 组件属性
 */
interface ForProps<T> {
  /**
   * 要遍历的数据数组
   */
  each: readonly T[]
  /**
   * 视图工厂函数
   *
   * 用于创建新视图
   */
  children: ViewFactory<T>
  /**
   * 键提取函数
   *
   * 用于从数据中提取出唯一键
   *
   * 如果数据是不重复内容，可以不指定key提取函数，也能保证性能和效率。
   *
   * 如果数据行中有重复数据的情况下不指定 key 提取函数，会存在key重复的警告信息！
   *
   * 最佳实践：手动指定 key 提取函数，用数据中的唯一属性值做为 key。
   *
   * @default `( item ) => item`
   */
  key?: KeyExtractor<T>
}

/**
 * For组件函数，用于渲染动态列表视图
 *
 * @template T - 列表项的数据类型
 * @param {ForProps<T>} props - 组件的属性对象
 * @returns {ListView} 返回列表视图实例
 *
 * @example
 * ```ts
 * // 基本用法
 * const items = ["apple", "banana", "cherry"];
 *
 * const ItemList = () => {
 *   return For({
 *     each: items,
 *     key: (item, index) => item,
 *     children: (item, index) => <div>{item}</div>
 *   });
 * };
 *
 * // 在JSX中使用
 * function App() {
 *   return (
 *     <For
 *       each={items}
 *       key={(item, index) => item}
 *       children={(item, index) => <div>{item}</div>}
 *     />
 *   );
 * }
 * ```
 */
function For<T>(props: ForProps<T>): ListView {
  // 获取当前实例
  const instance = getInstance()!
  // 获取实例视图的位置信息
  const location = instance.view.location
  // 获取视图构建工厂
  const build = props.children
  // 获取键提取函数
  const keyExtractor = props.key ?? ((item: T): T => item)
  // 初始化键值映射表，用于跟踪列表项
  let keyedMap: KeyedViewMap = new Map()
  // 创建新的列表视图实例
  const listView = new ListView()

  // 初始化子项渲染器
  let runner = initListChildren
  // 创建视图效果，用于处理列表更新
  const effectHandle = viewEffect(() => {
    // 运行子项更新逻辑，更新键值映射和列表视图
    keyedMap = runner(listView, keyedMap, props.each, build, keyExtractor, location)
  })

  // 如果存在效果句柄，则处理组件的生命周期
  if (effectHandle) {
    // 更新子项渲染器为更新模式
    runner = updateListChildren
    // 组件卸载时，释放效果句柄
    onDispose(() => effectHandle.dispose())
    // 组件隐藏时，暂停效果句柄
    onHide(() => effectHandle.pause())
    // 组件显示时，恢复效果句柄
    onShow(() => effectHandle.resume())
  }

  // 返回列表视图实例
  return listView
}
defineValidate(For, (props): void => {
  if (!Array.isArray(props.each)) {
    throw new TypeError(`[For]: each expects an array, received ${typeof props.each}`)
  }
  if (!isFunction(props.children)) {
    throw new TypeError(`[For]: children expects a function, received ${typeof props.children}`)
  }
  if (props.key && !isFunction(props.key)) {
    throw new TypeError(`[For]: key expects a function, received ${typeof props.key}`)
  }
})
export { For, type ForProps }
