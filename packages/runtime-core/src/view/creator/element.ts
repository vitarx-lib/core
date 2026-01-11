import { IS_RAW } from '@vitarx/responsive'
import { popProperty } from '@vitarx/utils/src/index.js'
import { IS_VIEW, ViewFlag, ViewState } from '../../constants/index.js'
import type {
  CodeLocation,
  ElementView,
  HostElementTag,
  ResolvedChildren,
  ValidProps
} from '../../types/index.js'
import { resolveChildren } from '../runtime/children.js'
import { resolveProps } from '../runtime/props.js'

export function createElementView<T extends HostElementTag>(
  tag: T,
  props: ValidProps<T> | null = null,
  key?: unknown,
  location?: CodeLocation
): ElementView<T> {
  let resolvedChildren: ResolvedChildren
  if (props && 'children' in props) {
    const propChildren = popProperty(props, 'children')
    resolvedChildren = resolveChildren(propChildren)
  } else {
    resolvedChildren = []
  }
  return {
    [IS_RAW]: true,
    [IS_VIEW]: true,
    state: ViewState.CREATED,
    flag: ViewFlag.ELEMENT,
    key,
    location,
    type: tag,
    ...resolveProps(props),
    children: resolvedChildren
  }
}
