/**
 * 是否处于开发模式
 */
export let __DEV__: boolean = import.meta?.env?.DEV === true

/**
 * 设置开发模式
 *
 * @param isDev
 */
const setDev = (isDev: boolean) => {
  __DEV__ = isDev
}
