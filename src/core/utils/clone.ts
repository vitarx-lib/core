/**
 * 深拷贝
 *
 * @param obj
 */
export function deepClone<T>(obj: T): T {
  // 如果是 null 或者基本数据类型，直接返回
  if (obj === null || typeof obj !== 'object') {
    return obj
  }
  // 处理数组
  if (Array.isArray(obj)) {
    return obj.map((item) => deepClone(item)) as unknown as T // 使用类型断言
  }
  // 处理对象
  const clonedObj = {} as Record<string, any> // 定义一个新的对象
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      clonedObj[key] = deepClone(obj[key]) // 递归调用
    }
  }
  return clonedObj as T // 返回克隆的对象，使用类型断言
}
