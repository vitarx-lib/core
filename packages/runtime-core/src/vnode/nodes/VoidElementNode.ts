import type {
  HostElementInstance,
  HostVoidElementNames,
  NodeNormalizedProps
} from '../../types/index.js'
import { HostNode } from '../base/HostNode.js'
import { normalizeStyle } from '../utils/normalizeProps.js'

export type VoidElementNodeType = HostVoidElementNames
export class VoidElementVNode<
  T extends VoidElementNodeType = VoidElementNodeType
> extends HostNode<T> {
  protected override normalizeProps(props: Record<string, any>): NodeNormalizedProps<T> {
    return normalizeStyle(super.normalizeProps(props))
  }
  protected render(): HostElementInstance<T> {
    return this.dom.createElement(this.type, this.props)
  }
}
