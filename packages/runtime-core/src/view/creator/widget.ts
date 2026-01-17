import { IS_RAW } from '@vitarx/responsive'
import { IS_VIEW } from '../../shared/constants/symbol.js'
import { ViewFlag } from '../../shared/constants/viewFlag.js'
import type { CodeLocation, Widget, WidgetPropsType, WidgetView } from '../../types/index.js'
import { resolveProps } from './utils.js'

export function createWidgetView<T extends Widget>(
  type: T,
  props: WidgetPropsType<T> | null = null,
  key?: unknown,
  location?: CodeLocation
): WidgetView<T> {
  return {
    [IS_VIEW]: true,
    [IS_RAW]: true,
    flag: ViewFlag.WIDGET,
    key,
    location,
    type,
    ...resolveProps(props)
  }
}
