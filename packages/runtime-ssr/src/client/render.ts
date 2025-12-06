import {
  type CommentNode,
  createWidgetRuntime,
  type FragmentNode,
  getRenderer,
  type HostFragmentElement,
  type HostRegularElements,
  invokeDirHook,
  NodeKind,
  type RegularElementNode,
  type TextNode,
  type VNode,
  type VoidElementNode,
  type WidgetNode
} from '@vitarx/runtime-core'

export function normalRender(node: VNode): void {
  switch (node.kind) {
    case NodeKind.REGULAR_ELEMENT:
      renderRegularElement(node as RegularElementNode)
      break
    case NodeKind.VOID_ELEMENT:
      renderVoidElement(node as VoidElementNode)
      break
    case NodeKind.TEXT:
      renderTextNode(node as TextNode)
      break
    case NodeKind.COMMENT:
      renderCommentNode(node as CommentNode)
      break
    case NodeKind.FRAGMENT:
      renderFragmentNode(node as FragmentNode)
      break
    case NodeKind.STATELESS_WIDGET:
    case NodeKind.STATEFUL_WIDGET:
      renderWidgetNode(node as WidgetNode)
      break
    default:
      throw new Error(`Unknown node kind: ${node.kind}`)
  }
}

export function renderRegularElement(node: RegularElementNode): void {
  node.el = getRenderer().createElement(node)
  renderChildren(node.children, node.el)
  invokeDirHook(node, 'created')
}

export function renderVoidElement(node: VoidElementNode): void {
  node.el = getRenderer().createElement(node)
  invokeDirHook(node, 'created')
}

export function renderTextNode(node: TextNode): void {
  node.el = getRenderer().createText(node.props.text)
  invokeDirHook(node, 'created')
}

export function renderCommentNode(node: CommentNode): void {
  node.el = getRenderer().createComment(node.props.text)
  invokeDirHook(node, 'created')
}

export function renderFragmentNode(node: FragmentNode): void {
  node.el = getRenderer().createFragment(node)
  renderChildren(node.children, node.el)
  invokeDirHook(node, 'created')
}

export function renderWidgetNode(node: WidgetNode): void {
  const instance = createWidgetRuntime(node)
  normalRender(instance.child)
  invokeDirHook(node, 'created')
}

export function renderChildren(
  children: VNode[],
  parent: HostRegularElements | HostFragmentElement
) {
  const renderer = getRenderer()
  for (const child of children) {
    normalRender(child)
    renderer.appendChild(child.el!, parent)
  }
}
