import { Component, ComponentView, isReactive, isRef } from 'vitarx'
import type { ModuleNamespace } from 'vite/types/hot.js'
import { HMR } from '../constants/index.js'
import { processUpdate } from './update.js'

declare global {
  interface Window {
    [HMR.manager]: HMRManager
  }
}
declare module 'vitarx' {
  interface ComponentView {
    [HMR.state]?: Record<string, any>
  }
}
export default class HMRManager {
  /**
   * id模块映射到组件虚拟节点集合
   *
   * 模块id -> 组件虚拟节点
   */
  #idMapToView: Map<string, Set<ComponentView>> = new Map()
  /**
   * id映射到组件构造函数
   */
  #idMapToComponent = new Map<string, Component>()
  /**
   * 获取单实例
   */
  static get instance(): HMRManager {
    if (!window[HMR.manager]) {
      window[HMR.manager] = new HMRManager()
    }
    return window[HMR.manager]
  }
  /**
   * 给组件绑定唯一id
   *
   * @param component
   * @param id
   */
  bindId(component: Function, id: string) {
    if (typeof component === 'function') {
      Object.defineProperty(component, HMR.id, { value: id })
    }
  }
  /**
   * 置换新模块
   *
   * 此方法提供给`jsxDev`函数调用，保持每次创建组件实例都是最新的模块！
   * @param component
   */
  resolveComponent(component: Component): Component {
    const id = this.getId(component)
    return id ? (this.#idMapToComponent.get(id) ?? component) : component
  }
  /**
   * 恢复状态
   *
   * @param {ComponentView} view - 组件视图
   * @param {string} name - 变量名称
   * @example
   * const state = __$VITARX_HMR$__.instance.memo(__$VITARX_HMR_VIEW_NODE$__, 'state') ?? ref(0)
   */
  memo(view: ComponentView, name: string): any {
    const state = view[HMR.state]?.[name]
    // 如果是副作用，则丢弃。
    if (!isRef(state) && !isReactive(state)) return undefined
    return state
  }
  /**
   * 注册节点
   *
   * @param view - 组件视图节点
   */
  register(view: ComponentView) {
    if (!view) return
    const component = view.component
    const id = this.getId(component)
    if (this.#idMapToView.has(id)) {
      this.#idMapToView.get(id)!.add(view)
    } else {
      this.#idMapToView.set(id, new Set([view]))
    }
  }
  /**
   * 获取模块id
   *
   * @param component
   */
  getId(component: Component): string {
    return Reflect.get(component, HMR.id)
  }
  update(mod: ModuleNamespace): void {
    if (!mod) return
    try {
      for (const modKey in mod) {
        // 新模块
        const newComponent = mod[modKey]
        // 模块id
        const moduleId = this.getId(newComponent)
        // 模块ID不存在，跳过
        if (!moduleId) continue
        // 模块活跃的虚拟节点集合
        const nodes = this.#idMapToView.get(moduleId)
        // 模块不存在，跳过
        if (!nodes) continue
        for (const node of nodes) {
          // 更新模块
          const id = this.getId(newComponent)
          if (id) this.#idMapToComponent.set(id, newComponent)
          // 更新节点视图
          if (node.active && node.isMounted) {
            processUpdate(node, newComponent)
          }
        }
      }
    } catch (e) {
      if (import.meta.hot) {
        import.meta.hot.invalidate(`[VitarxHMR]: ${e}`)
      } else {
        throw e
      }
    }
  }
}
