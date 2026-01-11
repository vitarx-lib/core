import { IS_RAW } from '@vitarx/responsive'
import { IS_VIEW, ViewFlag, ViewState } from '../../constants/index.js'
import type { CodeLocation, FragmentView, ValidChildren } from '../../types/index.js'
import { resolveChildren } from '../runtime/children.js'

export function createFragmentView(
  children: ValidChildren,
  key?: unknown,
  location?: CodeLocation
): FragmentView {
  return {
    [IS_RAW]: true,
    [IS_VIEW]: true,
    state: ViewState.CREATED,
    key,
    location,
    flag: ViewFlag.FRAGMENT,
    children: resolveChildren(children)
  }
}
