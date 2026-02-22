import {
  Component,
  ComponentView,
  createCommentView,
  EffectScope,
  getRenderer,
  runComponent,
  ValidChild
} from 'vitarx'
import { diffComponentChange } from './utils.js'

/**
 * 处理组件更新函数
 * @param view - 组件视图对象，包含当前组件的实例和节点信息
 * @param newComponent - 新的组件定义，用于替换现有组件
 */
export function processUpdate(view: ComponentView, newComponent: Component): void {
  // 获取渲染器实例
  const renderer = getRenderer()
  // 创建一个占位符注释节点
  const placeholder = renderer.createComment('')
  // 获取旧组件的DOM元素
  const oldElement = view.node
  // 将占位符插入到旧元素的位置
  renderer.insert(placeholder, oldElement)
  // 获取组件实例
  const instance = view.instance!
  // 比较新旧组件的差异，检查逻辑是否有变化
  const { logic } = diffComponentChange(view.component.toString(), newComponent.toString())
  // 更新视图中的组件引用
  ;(view as any).component = newComponent
  // 如果逻辑有变化，则完全重新挂载组件
  if (logic) {
    view.dispose()
    view.mount(placeholder, 'replace')
    return
  }
  // 销毁旧作用域
  instance.scope.dispose()
  // 重新创建新的作用域
  ;(instance as any).scope = new EffectScope({
    name: view.name,
    errorHandler: (error, source) => {
      instance.reportError(error, `effect:${source}`)
    }
  })
  // 销毁旧的子树
  instance.subView.dispose()
  // 创建新的子树
  let subView: ValidChild
  try {
    subView = runComponent(instance, () => newComponent(view.props))
  } catch (e) {
    instance.reportError(e, 'component:run')
    subView = createCommentView(`Component<${view.name}>:failed`)
  }
  ;(instance as any).subView = instance['normalizeView'](subView)
  // 初始化新的子树
  instance.subView.init(instance.subViewContext)
  // 挂载新的子树
  instance.subView.mount(placeholder, 'replace')
}
