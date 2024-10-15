export type Children = Array<VElement | string>
export type Props = Record<string, any>
export default class VElement {
  tag: string
  props: Props | null
  children: Children

  constructor(tag: string, props: Props | null, children: Children) {
    this.tag = tag
    this.props = props
    this.children = children
  }
}
