import { Scheduler } from '@vitarx/responsive'
import type {
  StatefulWidgetNode,
  StatefulWidgetNodeType,
  StatelessWidgetNode,
  WidgetNode
} from '../../types/index.js'
import { isStatelessWidget } from '../../utils/index.js'
import { getCurrentInstance } from './context.js'
import { type StatefulManagerOptions, StatefulWidgetRuntime } from './Stateful.js'
import { StatelessWidgetRuntime } from './Stateless.js'
import type { WidgetRuntime } from './WidgetRuntime.js'

/**
 * 获取或创建无状态组件运行时实例
 *
 * 这是一个工厂函数，用于获取节点关联的运行时实例
 * 如果节点还没有管理器，则创建一个新的管理器并关联到节点
 *
 * @param node - 无状态组件节点
 * @returns 管理器实例
 */
export function createWidgetRuntime(node: StatelessWidgetNode): StatelessWidgetRuntime
/**
 * 获取或创建组件运行时实例
 *
 * @param node
 */
export function createWidgetRuntime<T extends StatefulWidgetNodeType>(
  node: StatefulWidgetNode<T>
): StatefulWidgetRuntime<T>
/**
 * 获取或创建有状态组件运行时实例
 *
 * 这是一个工厂函数，用于获取节点关联的运行时实例
 * 如果节点还没有管理器，则创建一个新的管理器并关联到节点
 *
 * @param node - 有状态组件节点
 * @param options - 运行时实例配置选项
 * @returns 运行时实例
 */
export function createWidgetRuntime<T extends StatefulWidgetNodeType>(
  node: StatefulWidgetNode<T>,
  options: StatefulManagerOptions
): StatefulWidgetRuntime<T>
/**
 * 获取或创建组件运行时实例
 * @param node - 组件节点
 * @param options - 运行时实例配置选项
 */
export function createWidgetRuntime(
  node: WidgetNode,
  options?: StatefulManagerOptions
): WidgetRuntime {
  if (!node.instance) {
    if (isStatelessWidget(node.type)) {
      new StatelessWidgetRuntime(node as StatelessWidgetNode)
    } else {
      new StatefulWidgetRuntime(node as StatefulWidgetNode, options)
    }
  }
  return node.instance!
}

/**
 * 获取视图强制更新器
 *
 * 此函数返回的是一个用于更新视图的函数，通常你不需要强制更新视图，响应式数据改变会自动更新视图。
 *
 * 使用场景：
 * 如果函数式组件返回的视图虚拟节点中未包含任何响应式数据，系统不会自动更新视图，可以手动调用此函数来更新视图。
 *
 * @returns {(newChildVNode?: VNode) => void} - 视图更新器
 * @throws {Error} - 非组件上下文中使用会抛出错误
 * @example
 * ```tsx
 * function FuncWidget() {
 *   let show = true
 *   const forceUpdate = useForceUpdate()
 *   const toggle = () => {
 *     show = !show
 *     forceUpdate()
 *   }
 *   return <div>
 *     {show && <div>Hello World</div>}
 *     <button onClick={toggle}>Toggle</button>
 *   </div>
 * }
 * ```
 */
export function useForceUpdater(): (sync?: boolean) => void {
  const instance = getCurrentInstance()
  if (instance) {
    return sync => {
      instance.update()
      if (sync) {
        Scheduler.flushSync()
      }
    }
  }
  throw new Error('useForceUpdate must be used in widget context')
}
