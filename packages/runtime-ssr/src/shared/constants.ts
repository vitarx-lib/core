/**
 * 检测是否在服务端环境
 */
export const __IS_SERVER__ = typeof process !== 'undefined' && !!process.versions?.node

/**
 * 异步任务队列的上下文键名
 */
export const ASYNC_TASKS_KEY = '__asyncTasks'
