import { IS_RAW } from '@vitarx/responsive'
import { IS_VIEW } from '../../shared/constants/symbol.js'
import { ViewFlag } from '../../shared/constants/viewFlag.js'
import type { AnchorView, CodeLocation } from '../../types/index.js'

export function createAnchorView(text: string, key?: unknown, location?: CodeLocation): AnchorView {
  return {
    [IS_RAW]: true,
    [IS_VIEW]: true,
    flag: ViewFlag.ANCHOR,
    key,
    location,
    text
  }
}
