import type { Ref } from '@vitarx/responsive'
import { isViewBuilder } from '../../shared/index.js'
import type {
  AnyProps,
  CodeLocation,
  Component,
  HostElementTag,
  JSXElementType,
  ValidChildren,
  ValidProps,
  View
} from '../../types/index.js'
import type { ViewBuilder } from '../builder/index.js'
import { CommentView, TextView } from './atomic.js'
import { ComponentView } from './component.js'
import { ElementView } from './element.js'
import { FragmentView } from './fragment.js'
import { SwitchView } from './switch.js'

export function createView<P extends AnyProps, B extends View>(
  type: ViewBuilder<P, B>,
  props?: P | null,
  location?: CodeLocation
): B
export function createView<T extends Component>(
  type: T,
  props?: ValidProps<T> | null,
  location?: CodeLocation
): ComponentView<T>
export function createView<T extends HostElementTag>(
  type: T,
  props?: ValidProps<T> | null,
  location?: CodeLocation
): ElementView<T>
export function createView<T extends JSXElementType>(
  type: T,
  props?: ValidProps<T> | null,
  location?: CodeLocation
): View
export function createView<T extends JSXElementType>(
  type: T,
  props: ValidProps<T> | null = null,
  location?: CodeLocation
): View {
  let view: View

  if (typeof type === 'string') {
    view = new ElementView(type, props)
  } else if (typeof type === 'function') {
    view = isViewBuilder(type) ? type(props, location) : new ComponentView(type, props)
  } else {
    throw new Error(`[Vitarx] Invalid block type: ${type}`)
  }
  view.location = location
  return view
}

export function createTextView(text: string, location?: CodeLocation): TextView {
  return new TextView(text, location)
}

export function createCommentView(
  text: string,
  key?: unknown,
  location?: CodeLocation
): CommentView {
  return new CommentView(text, location)
}

export function createComponentView<T extends Component>(
  component: T,
  props: ValidProps<T> | null = null,
  location?: CodeLocation
): ComponentView<T> {
  return new ComponentView(component, props, location)
}

export function createFragmentView(children: ValidChildren, location?: CodeLocation): FragmentView {
  return new FragmentView(children, location)
}

export function createSwitchView<T = any>(source: Ref<T>, location?: CodeLocation): SwitchView<T> {
  return new SwitchView(source, location)
}

export function createElementView<T extends HostElementTag>(
  tag: T,
  props: ValidProps<T> | null,
  location?: CodeLocation
): ElementView<T> {
  return new ElementView(tag, props, location)
}
