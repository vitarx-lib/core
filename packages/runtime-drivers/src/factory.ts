import { NodeKind, registerDriver } from '@vitarx/runtime-core'
import {
  CommentDriver,
  FragmentDriver,
  RegularElementDriver,
  StatefulWidgetDriver,
  StatelessWidgetDriver,
  TextDriver,
  VoidElementDriver
} from './drivers/index.js'

/**
 * 注册所有默认节点驱动程序
 *
 * 该函数将各种节点类型（元素、文本、组件等）的默认驱动实例注册到运行时系统中，
 * 以便框架能够正确渲染和处理不同类型的虚拟节点。
 *
 * 注册的驱动包括：
 * - 元素驱动：RegularElement、VoidElement、Fragment
 * - 特殊节点驱动：Text、Comment
 * - 组件驱动：StatelessWidget、StatefulWidget
 */
export function setupDefaultDrivers(): void {
  // 注册常规元素驱动程序，用于处理常规DOM元素
  registerDriver(NodeKind.REGULAR_ELEMENT, new RegularElementDriver())
  // 注册空元素驱动程序，用于处理自闭合标签元素
  registerDriver(NodeKind.VOID_ELEMENT, new VoidElementDriver())
  // 注册片段驱动程序，用于处理无实际DOM元素的片段节点
  registerDriver(NodeKind.FRAGMENT, new FragmentDriver())
  // 注册文本驱动程序，用于处理纯文本节点
  registerDriver(NodeKind.TEXT, new TextDriver())
  // 注册注释驱动程序，用于处理注释节点
  registerDriver(NodeKind.COMMENT, new CommentDriver())
  // 注册无状态组件驱动程序，用于处理无状态组件
  registerDriver(NodeKind.STATELESS_WIDGET, new StatelessWidgetDriver())
  // 注册有状态组件驱动程序，用于处理有状态组件
  registerDriver(NodeKind.STATEFUL_WIDGET, new StatefulWidgetDriver())
}
