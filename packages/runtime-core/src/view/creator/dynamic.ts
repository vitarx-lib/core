import { IS_RAW } from '@vitarx/responsive'
import { IS_VIEW, ViewFlag, ViewState } from '../../constants/index.js'
import type { CodeLocation, DynamicView, View, ViewRef } from '../../types/index.js'

export function createDynamicView<T extends View>(
  ref: ViewRef<T>,
  location?: CodeLocation
): DynamicView<T> {
  return {
    [IS_RAW]: true,
    [IS_VIEW]: true,
    state: ViewState.CREATED,
    flag: ViewFlag.DYNAMIC,
    child: ref,
    location
  }
}
