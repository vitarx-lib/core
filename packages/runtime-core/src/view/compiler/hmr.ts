/**
 * HMR 组件解析模块
 *
 * 在开发模式下，当 plugin-vite 注入的 HMR 客户端已注册到 window 时，
 * 将组件引用置换为热更新后的最新实现，保证每次创建视图都使用最新版本的组件。
 *
 * 与 plugin-vite 的 hmr-client 形成"软耦合"：
 * - 运行时通过 window.__$VITARX_HMR$__.resolveComponent 间接调用，无硬依赖；
 * - 生产环境因 __VITARX_DEV__ 为 false，整段逻辑成为死代码被构建工具消除；
 * - 无 HMR 客户端时（SSR、单元测试、生产）原样返回传入的组件。
 *
 * @module view/compiler/hmr
 */

/**
 * HMR 管理器的最小类型约束
 *
 * 仅声明 runtime-core 依赖的 resolveComponent 方法，
 * 避免在此处引入 plugin-vite 的完整 HMRManager 类型（那会形成反向依赖）。
 */
interface VitarxHMRRuntime {
  /**
   * 置换组件为新版本
   * @param component - 旧组件引用
   * @returns 最新的组件引用（无映射时原样返回）
   */
  resolveComponent: (component: Function) => Function
}

/**
 * 带 HMR 管理器的 Window 类型
 *
 * 仅用于本模块内部访问，不做全局 declare 合并，
 * 以免与 plugin-vite 的 Window 增强产生重复声明冲突。
 */
type WindowWithHMR = Window & {
  __$VITARX_HMR$__?: VitarxHMRRuntime
}

/**
 * HMR 管理器在 window 上的全局键名
 *
 * 必须与 plugin-vite 的 HMR.manager 常量（'__$VITARX_HMR$__'）保持一致，
 * 否则运行时无法找到 HMR 客户端。
 */
const HMR_MANAGER_KEY = '__$VITARX_HMR$__'

/**
 * 获取已注册的 HMR 管理器
 *
 * 仅在浏览器环境且 plugin-vite 已注入 HMR 客户端时返回管理器实例；
 * SSR（无 window）或未注入时返回 undefined。
 *
 * @returns HMR 管理器实例或 undefined
 */
function getHMRManager(): VitarxHMRRuntime | undefined {
  // SSR 环境下 window 不存在，直接返回 undefined
  if (typeof window === 'undefined') return undefined
  return (window as WindowWithHMR)[HMR_MANAGER_KEY]
}

/**
 * 解析 HMR 组件
 *
 * 开发模式下若 HMR 客户端已注册，将传入的组件函数置换为热更新后的最新实现；
 * 否则原样返回。生产环境因 __VITARX_DEV__ 门控而被消除。
 *
 * 该函数对所有 function 类型的视图描述符均可安全调用：
 * - Component 与 ViewBuilder 均为 function，HMR 管理器内部按组件 id 查找，
 *   未注册 id 的函数会原样返回；
 * - 字符串标签不应传入，由调用方通过 typeof 守卫过滤。
 *
 * @param component - 原始组件构造函数
 * @returns 解析后的组件（无 HMR 客户端或非开发环境时原样返回）
 */
export function resolveHMRComponent<T extends Function>(component: T): T {
  if (__VITARX_DEV__) {
    const manager = getHMRManager()
    // 双重校验：管理器存在且 resolveComponent 是函数（防御部分注入场景）
    if (manager && typeof manager.resolveComponent === 'function') {
      // HMR 管理器返回的是等价的组件实现，类型保持不变
      return manager.resolveComponent(component) as T
    }
  }
  return component
}
