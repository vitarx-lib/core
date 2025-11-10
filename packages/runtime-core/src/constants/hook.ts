/** 生命周期钩子枚举 */
export enum LifecycleHooks {
  create = 'onCreate',
  beforeMount = 'onBeforeMount',
  render = 'onRender',
  mounted = 'onMounted',
  deactivated = 'onDeactivated',
  activated = 'onActivated',
  beforeUpdate = 'onBeforeUpdate',
  updated = 'onUpdated',
  error = 'onError',
  unmounted = 'onUnmounted',
  beforeUnmount = 'onBeforeUnmount'
}
