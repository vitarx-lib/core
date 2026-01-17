import { IS_RAW } from '@vitarx/responsive'
import { IS_VIEW } from '../../shared/constants/symbol.js'
import { ViewFlag } from '../../shared/constants/viewFlag.js'
import type { CodeLocation, FragmentView, ValidChildren } from '../../types/index.js'
import { resolveChildren } from './utils.js'

export function createFragmentView(
  children: ValidChildren,
  key?: unknown,
  location?: CodeLocation
): FragmentView {
  return {
    [IS_RAW]: true,
    [IS_VIEW]: true,
    flag: ViewFlag.FRAGMENT,
    key,
    location,
    children: resolveChildren(children)
  }
}
