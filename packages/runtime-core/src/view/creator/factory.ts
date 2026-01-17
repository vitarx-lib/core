import { isViewResolver } from '../../shared/utils/is.js'
import type {
  AnyProps,
  CodeLocation,
  CreatableType,
  ElementView,
  HostElementTag,
  ValidProps,
  View,
  Widget,
  WidgetView
} from '../../types/index.js'
import { type ViewBuilder } from '../builder/factory.js'
import { createElementView } from './element.js'
import { createWidgetView } from './widget.js'

export function createView<P extends AnyProps, B extends View>(
  type: ViewBuilder<P, B>,
  props?: P | null,
  key?: unknown,
  location?: CodeLocation
): B
export function createView<T extends Widget>(
  type: T,
  props?: ValidProps<T> | null,
  key?: unknown,
  location?: CodeLocation
): WidgetView<T>
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
  if (isViewResolver(type)) {
    return type(props, key, location)
  }
  if (typeof type === 'string') {
    return createElementView(type, props, key, location)
  }
  if (typeof type === 'function') {
    return createWidgetView(type, props, key, location)
  }
  throw new Error(`[Vitarx] Invalid block type: ${type}`)
}
