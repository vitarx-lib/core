import { ListView } from '../../../core/index.js'
import { viewEffect } from '../../../runtime/effect.js'
import { getInstance, getRenderer, onDispose, onHide, onShow } from '../../../runtime/index.js'
import type { CodeLocation } from '../../../types/index.js'
import {
  buildDiff,
  initChildren,
  type KeyedViewMap,
  type KeyExtractor,
  planMinimalMove,
  type ViewFactory
} from './common.js'

interface ForProps<T> {
  each: readonly T[]
  children: ViewFactory<T>
  key: KeyExtractor<T>
}

/** 更新 children */
function updateChildren<T>(
  listView: ListView,
  oldKeyedMap: KeyedViewMap,
  each: readonly T[],
  build: ViewFactory<T>,
  getKey: KeyExtractor<T>,
  location?: CodeLocation
): KeyedViewMap {
  const { newChildren, sourceIndex, keyedMap, removedChildren } = buildDiff(
    oldKeyedMap,
    each,
    build,
    getKey,
    location
  )
  const plans = planMinimalMove(newChildren, sourceIndex)
  const renderer = getRenderer()
  for (const plan of plans) {
    const { view, type, anchor } = plan

    // 先操作链表，再操作 DOM
    if (type === 'move') {
      if (anchor) listView.insert(view, anchor)
      else listView.append(view)

      if (anchor?.isActivated) renderer.insert(view.node, anchor.node)
    } else if (type === 'mount') {
      if (anchor) listView.insert(view, anchor)
      else listView.append(view)

      if (!listView.isUnused) {
        view.init(listView.ctx)
        if (listView.isActivated) {
          if (anchor) view.mount(anchor.node, 'insert')
          else view.mount(listView.node, 'append')
        }
      }
    }
  }
  // 清理旧节点
  for (const view of removedChildren) {
    listView.remove(view)
    view.dispose()
  }

  return keyedMap
}

/**
 * For组件函数，用于渲染列表视图
 * @template T - 列表项的数据类型
 * @param {ForProps<T>} props - 组件的属性对象
 * @returns {ListView} 返回列表视图实例
 */
function For<T>(props: ForProps<T>): ListView {
  // 获取当前实例
  const instance = getInstance()!
  // 获取实例视图的位置信息
  const location = instance.view.location
  // 初始化键值映射表，用于跟踪列表项
  let keyedMap: KeyedViewMap = new Map()
  // 创建新的列表视图实例
  const listView = new ListView()

  // 初始化子项渲染器
  let runner = initChildren
  // 创建视图效果，用于处理列表更新
  const effectHandle = viewEffect(() => {
    // 运行子项更新逻辑，更新键值映射和列表视图
    keyedMap = runner(listView, keyedMap, props.each, props.children, props.key, location)
  })

  // 如果存在效果句柄，则处理组件的生命周期
  if (effectHandle) {
    // 更新子项渲染器为更新模式
    runner = updateChildren
    // 组件卸载时，释放效果句柄
    onDispose(() => effectHandle.dispose())
    // 组件隐藏时，暂停效果句柄
    onHide(() => effectHandle.pause())
    // 组件显示时，恢复效果句柄
    onShow(() => effectHandle.resume())
  }

  // 返回列表视图实例
  return listView
}
