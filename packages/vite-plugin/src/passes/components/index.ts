/**
 * 编译宏组件处理模块
 * 包含 Switch、IfBlock 等纯编译组件的转换
 * @module passes/components
 */
import type { NodePath } from '@babel/traverse'
import * as t from '@babel/types'
import { TransformContext } from '../../context.js'
import { getJSXElementName, isPureCompileComponent } from '../../utils/index.js'
import { processIfBlock } from './ifBlock.js'
import { processSwitch } from './switch.js'

/**
 * 处理纯编译组件
 * 根据组件名称分发到对应的处理器
 * @param path - JSX 元素路径
 * @param ctx - 转换上下文
 */
export function processPureCompileComponent(
  path: NodePath<t.JSXElement>,
  ctx: TransformContext
): void {
  const name = getJSXElementName(path.node)
  if (!name || !isPureCompileComponent(name)) return

  switch (name) {
    case 'Switch':
      processSwitch(path, ctx)
      break
    case 'IfBlock':
      processIfBlock(path, ctx)
      break
  }
}

export { processSwitch } from './switch.js'
export { processIfBlock } from './ifBlock.js'
