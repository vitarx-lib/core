import { runEffect } from '@vitarx/responsive'
import type { Component } from '../types/index.js'

/**
 * KeepAlive配置选项
 */
interface KeepAliveProps {
  is: Component
  /**
   * 需要缓存的节点类型
   *
   * 当为空时，将缓存所有类型的节点
   *
   * @default []
   */
  include: Component[]
  /**
   * 需要销毁状态的节点类型列表
   *
   * 优先级高于 include
   *
   * @default []
   */
  exclude: Component[]
  /**
   * 最大缓存数量
   *
   * 如果小于1，则不限制缓存的数量
   *
   * @default 10
   */
  max: number
}

export function KeepAlive(props: KeepAliveProps) {
  const stop = runEffect(() => {
    const widget = props.is
  })
}
