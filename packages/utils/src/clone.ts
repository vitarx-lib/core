type Cloneable = {
  [key: string]: any
  [index: number]: any
}

type WorkItem = {
  source: any
  parent: any
  key: string | number | symbol | 'set' | 'map'
  mapKey?: any
}

// 预定义的克隆处理函数
const cloneHandlers = {
  Date: (source: Date) => new Date(source.getTime()),
  RegExp: (source: RegExp) => new RegExp(source.source, source.flags),
  Set: () => new Set(),
  Map: () => new Map(),
  Array: () => [],
  Object: (source: Cloneable) => Object.create(Object.getPrototypeOf(source))
}

// 类型检查函数
const isPrimitive = (value: any): boolean => !value || typeof value !== 'object'

// 创建克隆对象
const createClone = (source: any): any => {
  if (source instanceof Date) return cloneHandlers.Date(source)
  if (source instanceof RegExp) return cloneHandlers.RegExp(source)
  if (source instanceof Set) return cloneHandlers.Set()
  if (source instanceof Map) return cloneHandlers.Map()
  if (Array.isArray(source)) return cloneHandlers.Array()
  return cloneHandlers.Object(source)
}

// 处理子元素入队
const enqueueChildren = (source: any, cloned: any, queue: WorkItem[]) => {
  if (source instanceof Set) {
    source.forEach(item => queue.push({ source: item, parent: cloned, key: 'set' }))
  } else if (source instanceof Map) {
    source.forEach((value, mapKey) =>
      queue.push({ source: value, parent: cloned, key: 'map', mapKey })
    )
  } else if (Array.isArray(source)) {
    source.forEach((item, index) => queue.push({ source: item, parent: cloned, key: index }))
  } else {
    Reflect.ownKeys(source).forEach(objKey =>
      queue.push({ source: source[objKey], parent: cloned, key: objKey })
    )
  }
}

// 添加值到父容器
const addToParent = (
  parent: any,
  key: string | number | symbol | 'set' | 'map',
  value: any,
  mapKey?: any
) => {
  if (key === 'set') {
    parent.add(value)
  } else if (key === 'map') {
    parent.set(mapKey, value)
  } else {
    parent[key] = value
  }
}

/**
 * 深度克隆函数
 *
 * 可以克隆任意类型的对象，包括循环引用
 *
 * @param obj 需要克隆的对象
 * @returns 克隆后的新对象
 */
export function deepClone<T>(obj: T): T {
  // 处理基本类型，直接返回
  if (isPrimitive(obj)) return obj

  // 使用 WeakMap 存储已克隆的对象，用于处理循环引用
  const hash = new WeakMap<object, any>()
  // 使用队列实现广度优先遍历
  const queue: WorkItem[] = []

  // 创建根对象克隆
  const root = createClone(obj)
  // 将原始对象和克隆对象的映射关系存入 WeakMap
  hash.set(obj as object, root)
  // 将根对象的子元素加入队列
  enqueueChildren(obj, root, queue)

  // 处理队列中的所有元素
  while (queue.length) {
    // 取出队列中的第一个元素
    const { source, parent, key, mapKey } = queue.shift()!

    // 处理基本类型
    if (isPrimitive(source)) {
      addToParent(parent, key, source, mapKey)
      continue
    }

    // 处理循环引用
    if (hash.has(source)) {
      addToParent(parent, key, hash.get(source), mapKey)
      continue
    }

    // 创建新克隆
    const cloned = createClone(source)
    hash.set(source, cloned)
    addToParent(parent, key, cloned, mapKey)

    // 跳过 Date 和 RegExp 的子元素处理
    if (source instanceof Date || source instanceof RegExp) continue

    // 处理子元素
    enqueueChildren(source, cloned, queue)
  }

  return root as T
}
