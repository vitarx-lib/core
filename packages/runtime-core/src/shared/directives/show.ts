import { type ViewEffect, viewEffect } from '../../runtime/effect.js'
import type { Directive, DirectiveBinding, HostElement } from '../../types/index.js'

export const show: Directive = {
  created(el: HostElement, binding: DirectiveBinding) {
    const originalDisplay = el.style.display
    el.__effect = viewEffect(() => {
      const value = binding.value
      el.style.display = value ? originalDisplay : 'none'
    })
  },
  dispose(el: HostElement) {
    ;(el.__effect as ViewEffect)?.dispose()
  },
  getSSRProps(binding: DirectiveBinding): Record<string, any> {
    return binding.value ? {} : { style: { display: 'none' } }
  }
}
