import { IS_RAW, type Ref } from '@vitarx/responsive'
import { IS_VIEW } from '../../shared/constants/symbol.js'
import { ViewFlag } from '../../shared/constants/viewFlag.js'
import type { CodeLocation, DynamicView } from '../../types/index.js'

export function createDynamicView<T extends any>(
  ref: Ref<T>,
  key?: unknown,
  location?: CodeLocation
): DynamicView<T> {
  return {
    [IS_RAW]: true,
    [IS_VIEW]: true,
    flag: ViewFlag.DYNAMIC,
    key,
    child: ref,
    location
  }
}
