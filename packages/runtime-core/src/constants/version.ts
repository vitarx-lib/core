export let __VITARX_VERSION__ = 'NOT_INITIALIZED'
/**
 * 设置版本号
 *
 * 版本号由 vitarx 主包自动设置，无需外部调用
 *
 * @param v - 版本号
 */
export const setVitarxVersion = (v: string) => (__VITARX_VERSION__ = v)
