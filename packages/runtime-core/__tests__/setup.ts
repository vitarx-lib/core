// noinspection ES6PreferShortImport
import { DomRenderer, VOID_ELEMENTS } from '../../runtime-dom/dist/DomRenderer.js'
// noinspection ES6PreferShortImport
import {
  CommentDriver,
  FragmentDriver,
  RegularElementDriver,
  StatefulWidgetDriver,
  StatelessWidgetDriver,
  TextDriver,
  VoidElementDriver
} from '../../runtime-drivers/dist/drivers/index.js'
import { NodeKind, registerDriver, setHostSchema, setRenderer } from '../src/index.js'

setRenderer(new DomRenderer() as any)
setHostSchema({ voidElements: VOID_ELEMENTS })
// 注册节点控制器
registerDriver(NodeKind.REGULAR_ELEMENT, new RegularElementDriver() as any)
registerDriver(NodeKind.VOID_ELEMENT, new VoidElementDriver() as any)
registerDriver(NodeKind.FRAGMENT, new FragmentDriver() as any)
registerDriver(NodeKind.TEXT, new TextDriver() as any)
registerDriver(NodeKind.COMMENT, new CommentDriver() as any)
registerDriver(NodeKind.STATELESS_WIDGET, new StatelessWidgetDriver() as any)
registerDriver(NodeKind.STATEFUL_WIDGET, new StatefulWidgetDriver() as any)
