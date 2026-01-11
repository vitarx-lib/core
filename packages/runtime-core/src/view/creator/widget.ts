import { IS_RAW } from '@vitarx/responsive'
import { IS_VIEW, ViewFlag, ViewState } from '../../constants/index.js'
import type { CodeLocation, ValidProps, WidgetType, WidgetView } from '../../types/index.js'
import { resolveProps } from '../runtime/props.js'

export function createWidgetView<T extends WidgetType>(
  type: T,
  props: ValidProps<T> | null = null,
  key?: unknown,
  location?: CodeLocation
): WidgetView<T> {
  return {
    [IS_VIEW]: true,
    [IS_RAW]: true,
    state: ViewState.CREATED,
    flag: ViewFlag.WIDGET,
    key,
    location,
    type,
    ...resolveProps(props)
  }
}
