/**
 * 检测是否在浏览器环境
 */
export const __IS_BROWSER__ = typeof window !== 'undefined' && typeof document !== 'undefined'
