import { IS_RAW } from '@vitarx/responsive'
import { IS_VIEW, ViewFlag, ViewState } from '../../constants/index.js'
import type { CodeLocation, TextView } from '../../types/index.js'

export function createTextView(text: string, key?: unknown, location?: CodeLocation): TextView {
  return {
    [IS_RAW]: true,
    [IS_VIEW]: true,
    state: ViewState.CREATED,
    flag: ViewFlag.TEXT,
    location,
    text: text,
    key
  }
}
