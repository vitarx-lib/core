import {
  App,
  type AppConfig,
  CommentController,
  FragmentController,
  NodeKind,
  registerController,
  RegularElementController,
  setRenderer,
  StatefulWidgetController,
  StatelessWidgetController,
  TextController,
  type VNode,
  VoidElementController,
  type WidgetTypes
} from '@vitarx/runtime-core'
import { DomRenderer } from './DomRenderer.js'

// 设置运行时渲染器
setRenderer(new DomRenderer())
// 注册节点控制器
registerController(NodeKind.REGULAR_ELEMENT, new RegularElementController())
registerController(NodeKind.VOID_ELEMENT, new VoidElementController())
registerController(NodeKind.FRAGMENT, new FragmentController())
registerController(NodeKind.TEXT, new TextController())
registerController(NodeKind.COMMENT, new CommentController())
registerController(NodeKind.STATELESS_WIDGET, new StatelessWidgetController())
registerController(NodeKind.STATEFUL_WIDGET, new StatefulWidgetController())
/**
 * 创建一个新的应用实例
 *
 * @param root - 应用的根节点，可以是虚拟节点(VNode)或小部件类型(WidgetTypes)
 * @param config - 可选的应用配置参数，用于定制应用的行为
 * @returns {App} 返回一个新的App实例
 */
export function createApp(root: VNode | WidgetTypes, config?: AppConfig): App {
  return new App(root, config)
}
