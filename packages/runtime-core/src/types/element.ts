export type IntrinsicElements = Vitarx.IntrinsicElements
/**
 * 平台宿主元素标签类型
 * 表示所有支持的宿主元素标签的联合类型
 */
export type HostElementTag = keyof Vitarx.HostElementTagMap
/**
 * 平台宿主元素类型
 * 表示平台特定的元素节点实例
 */
export type HostElement<T extends HostElementTag = HostElementTag> = Vitarx.HostElementTagMap[T] & {
  [key: string]: any
}

/**
 * 平台宿主文本节点类型
 * 表示平台特定的文本节点实例
 */
export type HostText = Vitarx.HostTextNode

/**
 * 平台宿主注释节点类型
 * 表示平台特定的注释节点实例
 */
export type HostComment = Vitarx.HostCommentNode

/**
 * 平台宿主片段节点类型
 * 表示平台特定的片段节点实例
 */
export type HostFragment = Vitarx.HostFragmentNode

/**
 * 平台宿主节点联合类型
 * 表示所有可能的宿主节点类型
 */
export type HostNode = HostElement | HostText | HostComment | HostFragment

/**
 * 平台宿主容器节点类型
 * 表示可以包含其他节点的宿主容器
 */
export type HostContainer = Vitarx.HostContainerNode

export type ElementProps<T extends HostElementTag> = Omit<IntrinsicElements[T], 'children'>
