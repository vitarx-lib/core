import {
  type Directive,
  type DirectiveBinding,
  type HostElement,
  viewEffect
} from '@vitarx/runtime-core'

const effect = Symbol('v-show')
const show: Directive = {
  created(el: HostElement, binding: DirectiveBinding): void {
    el.__raw_display = el.style.display
    el[effect] = viewEffect(() => {
      const value = binding.value
      if (value) {
        if (el.__raw_display) {
          el.style.display = el.__raw_display
        } else {
          el.style.removeProperty('display')
        }
      } else {
        el.style.display = 'none'
      }
    })
  },
  dispose(el: HostElement): void {
    el.style.display = el.__raw_display
    delete el.__raw_display
    if (el[effect]) {
      el[effect]?.dispose()
      delete el[effect]
    }
  },
  getSSRProps(binding: DirectiveBinding) {
    return binding.value ? void 0 : { style: { display: 'none' } }
  }
}

export default show
