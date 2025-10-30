import type {
  HostElementInstance,
  HostParentElement,
  MountType,
  NodeNormalizedProps,
  SimpleWidget
} from '../../types/index.js'
import { VNode, WaitNormalizedProps } from '../base/index.js'

// TODO  待实现
export class SimpleWidgetNode<T extends SimpleWidget = SimpleWidget> extends VNode<T> {
  override mount(target?: HostParentElement, type?: MountType): void {
    throw new Error('Method not implemented.')
  }
  override activate(root: boolean): void {
    throw new Error('Method not implemented.')
  }
  override unmount(root?: boolean): void {
    throw new Error('Method not implemented.')
  }
  override deactivate(root: boolean): void {
    throw new Error('Method not implemented.')
  }
  protected override handleShowState(is: boolean): void {
    throw new Error('Method not implemented.')
  }
  protected override normalizeProps(props: WaitNormalizedProps<T>): NodeNormalizedProps<T> {
    throw new Error('Method not implemented.')
  }
  protected override render(): HostElementInstance<T> {
    throw new Error('Method not implemented.')
  }
}
