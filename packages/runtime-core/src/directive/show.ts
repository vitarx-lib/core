import { getRenderer } from '../renderer/index.js'
import type { Directive, DirectiveBinding, HostElements, VNode } from '../types/index.js'

export const show: Directive = {
  name: 'show',
  created(el: HostElements, binding: DirectiveBinding, _node: VNode) {
    if (!binding.value) {
      getRenderer().addStyle(el, 'display', 'none')
    }
  },
  updated(el: HostElements, binding: DirectiveBinding, node: VNode) {
    if (!binding.value) {
      getRenderer().addStyle(el, 'display', 'none')
    } else {
      const rawDisplay = node.props.style?.display
      if (rawDisplay) {
        getRenderer().addStyle(el, 'display', rawDisplay)
      } else {
        getRenderer().removeStyle(el, 'display')
      }
    }
  },
  unmounted(el: HostElements, binding: DirectiveBinding, node: VNode) {
    if (binding.value) {
      // 移除 display 样式，防止残留
      const rawDisplay = node.props.style?.display
      if (rawDisplay) {
        getRenderer().addStyle(el, 'display', rawDisplay)
      } else {
        getRenderer().removeStyle(el, 'display')
      }
    }
  },
  getSSRProps(binding: DirectiveBinding, node: VNode): Record<string, any> {
    return binding.value ? {} : { style: { display: 'none' } }
  }
}
