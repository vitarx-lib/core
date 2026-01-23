import { isViewResolver } from '../../shared/index.js'
import type {
  AnyProps,
  CodeLocation,
  Component,
  CreatableType,
  HostElementTag,
  ValidProps,
  View
} from '../../types/index.js'
import type { ViewBuilder } from '../builder/index.js'
import { ComponentView } from './component.js'
import { ElementView } from './element.js'

export function createView<P extends AnyProps, B extends View>(
  type: ViewBuilder<P, B>,
  props?: P | null,
  key?: unknown,
  location?: CodeLocation
): B
export function createView<T extends Component>(
  type: T,
  props?: ValidProps<T> | null,
  key?: unknown,
  location?: CodeLocation
): ComponentView<T>
export function createView<T extends HostElementTag>(
  type: T,
  props?: ValidProps<T> | null,
  key?: unknown,
  location?: CodeLocation
): ElementView<T>
export function createView<T extends CreatableType>(
  type: T,
  props?: ValidProps<T> | null,
  key?: unknown,
  location?: CodeLocation
): View
export function createView<T extends CreatableType>(
  type: T,
  props: ValidProps<T> | null = null,
  key?: unknown,
  location?: CodeLocation
): View {
  let view: View

  if (typeof type === 'string') {
    view = new ElementView(type, props)
  } else if (typeof type === 'function') {
    view = isViewResolver(type) ? type(props, key, location) : new ComponentView(type, props)
  } else {
    throw new Error(`[Vitarx] Invalid block type: ${type}`)
  }
  view.key = key
  view.location = location
  return view
}
