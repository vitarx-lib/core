import {
  type Directive,
  type DirectiveBinding,
  type HostElement,
  viewEffect
} from '@vitarx/runtime-core'
import { isString, logger } from '@vitarx/utils'

const effect = Symbol('v-text')
const text: Directive = {
  created(el: HostElement, binding: DirectiveBinding, view): void {
    if (view.children.length) {
      logger.warn(
        '[v-text] directive should not be used on an element with children',
        el,
        view.location
      )
      return
    }
    el[effect] = viewEffect(() => {
      const value = binding.value
      if (value && isString(value) && el.textContent !== value) {
        el.textContent = value
      }
    })
  },
  dispose(el: HostElement): void {
    el[effect]?.dispose()
  },
  getSSRProps(binding: DirectiveBinding, view) {
    if (view.children.length) return void 0
    const value = binding.value
    return value && isString(value) ? { 'v-text': value } : void 0
  }
}

export default text
