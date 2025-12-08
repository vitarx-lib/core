/**
 * 生命周期钩子枚举
 */
export enum LifecycleHook {
  error = 'onError',
  create = 'onCreate',
  render = 'onRender',
  beforeMount = 'onBeforeMount',
  mounted = 'onMounted',
  activated = 'onActivated',
  deactivated = 'onDeactivated',
  beforeUpdate = 'onBeforeUpdate',
  updated = 'onUpdated',
  beforeUnmount = 'onBeforeUnmount',
  unmounted = 'onUnmounted',
  destroy = 'onDestroy'
}
