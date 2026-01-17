import { logger } from '@vitarx/utils'
import { App } from '../app/index.js'
import { ViewFlag } from '../shared/constants/viewFlag.js'
import { ViewState } from '../shared/constants/viewState.js'
import type {
  HostContainer,
  HostNode,
  MountType,
  ParentView,
  View,
  ViewDriver,
  ViewRuntime
} from '../types/index.js'
import { WidgetInstance } from '../view/index.js'
import { createViewInstance } from '../view/instance/factory.js'

let override: ViewDriver | null = null

type DriverMap = Partial<{
  [Flag in ViewFlag]: ViewDriver<Flag>
}>
const drivers: DriverMap = Object.create(null)

/**
 * 注册视图驱动
 *
 * 将特定类型的视图驱动注册到驱动映射表中，用于处理不同类型的视图渲染、挂载和销毁操作。
 * 每种 ViewFlag 都应该有对应的驱动实现，以确保框架能够正确处理各种视图类型。
 *
 * @param flag 视图标志，用于标识视图类型
 * @param driver 对应的视图驱动实现，提供渲染、挂载和销毁功能
 */
export function registerDriver<Flag extends ViewFlag>(flag: Flag, driver: ViewDriver<Flag>): void {
  drivers[flag] = driver as DriverMap[Flag]
}

/**
 * 覆盖所有视图驱动
 *
 * 提供全局替换所有视图驱动的能力，主要用于以下场景：
 * - SSR（服务器端渲染）：替换为服务端渲染驱动
 * - 测试环境：使用模拟驱动进行单元测试
 * - 自定义渲染：实现特殊的渲染逻辑
 *
 * @param driver 全局视图驱动，设置为 null 可恢复为默认驱动
 */
export function overrideDriver(driver: ViewDriver | null): void {
  override = driver
}

/**
 * 获取视图驱动
 *
 * 根据视图标志获取对应的驱动实现。优先返回全局覆盖驱动，
 * 如果没有设置覆盖驱动，则从驱动映射表中查找对应的驱动。
 *
 * @param flag 视图标志，用于标识视图类型
 * @returns {ViewDriver} 对应的视图驱动实例
 * @throws {Error} 当没有找到对应的驱动实现时抛出错误
 */
export function getDriver<Flag extends ViewFlag>(flag: Flag): ViewDriver<Flag> {
  if (override) return override as ViewDriver<Flag>
  const driver = drivers[flag]
  if (!driver) {
    throw new Error(`No ViewDriver registered for flag: ${flag}`)
  }
  return driver
}

/**
 * 渲染视图
 *
 * 创建视图的内部数据结构并建立响应式副作用，但不涉及将视图插入到宿主环境中的操作。
 * 此阶段主要是准备视图的渲染数据和响应式依赖关系，为后续的挂载操作做准备。
 *
 * @internal 视图驱动核心方法，开发者谨慎使用！
 * @param view 要渲染的视图对象
 * @param [parent] 父视图对象
 * @param [owner] 组件上下文
 * @param [app] 应用上下文
 */
export function renderView(
  view: View,
  parent: ParentView | null = null,
  owner: WidgetInstance | null = null,
  app: App | null = null
): void {
  if (view.instance) {
    throw new Error('[renderView]: view has already been rendered')
  }
  const instance = createViewInstance(view, parent, owner, app)
  const driver = getDriver(view.flag)
  driver.render(instance)
}

/**
 * 挂载视图到宿主环境
 *
 * 将已渲染的视图插入到宿主环境中，如 DOM 树或其他渲染目标。
 * 支持多种挂载方式：
 * - append：作为容器的子元素追加
 * - insert：在指定锚点前插入
 * - replace：替换指定锚点
 *
 * @internal 视图驱动核心方法，开发者谨慎使用！
 * @param view 要挂载的视图对象
 * @param containerOrAnchor 容器节点或锚点节点
 * @param type 挂载类型，默认为 'append'
 */
export function mountView(
  view: View,
  containerOrAnchor: HostContainer | HostNode,
  type: MountType = 'append'
): void {
  if (!view.instance) {
    renderView(view)
  } else if (view.instance.state === ViewState.MOUNTED) {
    throw new Error('[mountView]: view mounted cannot be mounted repeatedly')
  }
  const driver = getDriver(view.flag)
  driver.mount(view as ViewRuntime, containerOrAnchor, type)
}

/**
 * 销毁视图
 *
 * 清理视图的所有副作用，从宿主环境中卸载节点，并释放相关资源。
 * 此操作会断开视图与其数据之间的响应式连接，并移除视图在宿主环境中的表示。
 *
 * @internal 视图驱动核心方法，开发者谨慎使用！
 * @param view - 要销毁的视图对象
 * @param [failSilently=false] - 如果视图没有渲染则会打印警告信息，设置为 true 可忽略警告。
 * @returns {void}
 */
export function disposeView(view: View, failSilently: boolean = false): void {
  if (!view.instance) {
    if (!failSilently) {
      logger.warn(
        `[disposeView]: view has not yet been rendered, and this operation is invalid`,
        view
      )
    }
    return void 0
  }
  const driver = getDriver(view.flag)
  driver.dispose(view as ViewRuntime)
  // 清空视图运行时快照
  delete view.instance
}

/**
 * 渲染视图
 *
 * @internal 视图驱动核心方法，开发者谨慎使用！
 * @param oldView - 旧的视图对象
 * @param newView - 新的视图对象
 * @returns {void}
 */
export function replaceView(oldView: View, newView: View): View {
  if (!oldView.instance) return newView
  if (newView.instance) {
    throw new Error('[replaceView]: new view has already been rendered')
  }
  if (oldView.instance.state === ViewState.DISPOSED) {
    throw new Error('[replaceView]: old view has been disposed')
  }
  if (oldView.instance.state === ViewState.READY) {
    // 仅初始化新视图
    renderView(newView, oldView.instance.parent, oldView.instance.owner, oldView.instance.app)
  } else {
    // 挂载新视图
    mountView(newView, oldView.instance.hostNode, 'insert')
  }
  // 销毁旧视图
  disposeView(oldView)
  return newView
}
