/**
 * 深拷贝函数
 *
 * 支持处理循环引用、内置对象和普通对象的深度克隆
 *
 * @param obj - 要克隆的对象
 * @param hash - 用于检测循环引用的WeakMap
 * @returns - 克隆后的对象
 */
export function deepClone<T>(obj: T, hash = new WeakMap<object, any>()): T {
  // 处理null和基本数据类型
  if (!obj || typeof obj !== 'object') return obj

  // 检测循环引用
  if (hash.has(obj as object)) {
    return hash.get(obj as object)
  }

  // 处理内置对象类型
  if (obj instanceof Date) {
    return new Date(obj.getTime()) as unknown as T
  }
  if (obj instanceof RegExp) {
    return new RegExp(obj.source, obj.flags) as unknown as T
  }
  if (obj instanceof Set) {
    const clonedSet = new Set()
    hash.set(obj as object, clonedSet)
    obj.forEach(item => clonedSet.add(deepClone(item, hash)))
    return clonedSet as unknown as T
  }
  if (obj instanceof Map) {
    const clonedMap = new Map()
    hash.set(obj as object, clonedMap)
    obj.forEach((value, key) => clonedMap.set(deepClone(key, hash), deepClone(value, hash)))
    return clonedMap as unknown as T
  }

  // 处理数组
  if (Array.isArray(obj)) {
    const clonedArr = [] as unknown[]
    hash.set(obj, clonedArr)
    obj.forEach((item, index) => {
      clonedArr[index] = deepClone(item, hash)
    })
    return clonedArr as unknown as T
  }

  // 处理普通对象
  const clonedObj = Object.create(Object.getPrototypeOf(obj))
  hash.set(obj as object, clonedObj)

  // 使用Reflect.ownKeys获取所有属性，包括Symbol类型的key
  Reflect.ownKeys(obj as object).forEach(key => {
    clonedObj[key] = deepClone((obj as any)[key], hash)
  })

  return clonedObj as T
}
