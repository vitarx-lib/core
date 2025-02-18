import { isObject, isRecordObject } from './detect.js'

type IndexPath = (string | number | symbol)[]

// 辅助函数，用于获取对象的所有键（包括字符串键和符号键）
function getAllKeys(obj: any, symbol: boolean = false): (string | symbol)[] {
  if (symbol) {
    return ([] as Array<string | symbol>).concat(
      Object.getOwnPropertyNames(obj),
      Object.getOwnPropertySymbols(obj)
    )
  } else {
    return Object.getOwnPropertyNames(obj)
  }
}

/**
 * 比较两个变量的变化，并返回一个二维数组，表示对象或数组中发生变化的属性或索引。
 *
 * 示例：
 * ```
 * diffVal({ a: 1, b: 2 }, { a: 2, b: 3 }) // => [['a'], ['b']]
 * diffVal([1, 2, 3], [2, 3, 4]) // => [[0], [1], [2]]
 * diffVal([1, 2, 3], [1, 2, 3, 4]) // => [[3]]
 * diffVal(1,1) // => []
 * diffVal(1,2) // => [[]]
 * ```
 * @template T - 泛型类型，表示要比较的对象的类型。
 * @param {T} oldVal - 旧的值
 * @param {T} newVal - 新的值
 * @param {IndexPath} path 该path递归计算使用，用于记录路径
 * @param symbol
 * @returns {IndexPath[]} - 返回一个二维数组，数组中的每个元素都是一个路径，表示对象或数组中发生变化的属性或索引。
 */
export function diffVal(
  oldVal: any,
  newVal: any,
  path: IndexPath = [],
  symbol: boolean = false
): IndexPath[] {
  let changes: IndexPath[] = []

  // 检查两个变量是否为同一类型
  if (typeof oldVal !== typeof newVal) {
    changes.push([...path])
    return changes
  }

  // 处理对象的情况
  if (isRecordObject(oldVal) && isRecordObject(newVal)) {
    const oldKeys = getAllKeys(oldVal, symbol)
    const newKeys = getAllKeys(newVal, symbol)
    // 检查旧对象中的键
    for (const key of oldKeys) {
      if (newKeys.includes(key)) {
        // 递归检查子对象或数组
        changes = changes.concat(
          diffVal((oldVal as any)[key], (newVal as any)[key], [...path, key])
        )
      } else {
        // @ts-ignore
        if (isObject(oldVal[key])) {
          const curr = [...path, key]
          // @ts-ignore
          diffVal(oldVal[key], {}).forEach(item => {
            changes.push([...curr, ...item])
          })
        } else {
          // 如果新对象中不存在该属性，认为该属性被删除了
          changes.push([...path, key])
        }
      }
    }

    // 检查新对象中的新增键
    for (const key of newKeys) {
      if (!oldKeys.includes(key)) {
        changes.push([...path, key])
      }
    }
  }
  // 处理数组的情况
  else if (Array.isArray(oldVal) && Array.isArray(newVal)) {
    const maxLength = Math.max(oldVal.length, newVal.length)
    for (let i = 0; i < maxLength; i++) {
      if (i < oldVal.length && i < newVal.length) {
        changes = changes.concat(diffVal(oldVal[i], newVal[i], [...path, i]))
      } else {
        // 如果数组长度不同，超出的部分认为是新增或删除
        changes.push([...path, i])
      }
    }
  }
  // 处理基本类型的情况
  else if (oldVal !== newVal) {
    changes.push([...path])
  }

  return changes
}

/**
 * 根据索引路径获取对象的值
 *
 * @template T - 泛型类型，表示要获取的对象的类型。
 * @param {T} obj - 起始对象或数组。
 * @param {IndexPath} index - 索引路径，表示要获取的对象的属性或索引。
 */
export function getIndexValue<T>(obj: T, index: IndexPath): any {
  let current = obj
  for (const key of index) {
    if (current === undefined || current === null) {
      return undefined
    }
    if (Array.isArray(current) && typeof key === 'number') {
      current = current[key]
    } else if (isRecordObject(current) && current.hasOwnProperty(key)) {
      current = (current as any)[key]
    } else {
      return undefined
    }
  }
  return current
}
