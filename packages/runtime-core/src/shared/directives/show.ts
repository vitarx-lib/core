import { runEffect } from '@vitarx/responsive'
import type { Directive, DirectiveBinding, HostElement } from '../../types/index.js'

export const show: Directive = {
  created(el: HostElement, binding: DirectiveBinding) {
    const originalDisplay = el.style.display
    el.__effect = runEffect(
      () => {
        const value = binding.value
        el.style.display = value ? originalDisplay : 'none'
      },
      { track: 'once' }
    )
  },
  dispose(el: HostElement) {
    el.__effect?.()
  },
  getSSRProps(binding: DirectiveBinding): Record<string, any> {
    return binding.value ? {} : { style: { display: 'none' } }
  }
}
