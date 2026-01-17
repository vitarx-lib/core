import type { AnchorView } from '../../types/index.js'
import { createAnchorView } from '../creator/index.js'
import { builder, type ViewBuilder } from './factory.js'

export interface AnchorProps {
  text: string
}
/**
 * AnchorView 组件化构建器
 *
 * 用于创建 Anchor 视图节点。
 *
 * @param props - Anchor 节点的属性对象
 * @param [props.text] - 静态的锚点提示内容
 * @return {AnchorView} AnchorView
 */
export const Anchor = builder((props: AnchorProps, key, location): AnchorView => {
  return createAnchorView(String(props.text), key, location)
})

export type Anchor = ViewBuilder<AnchorProps, AnchorView> & { __is_comment: true }
