/**
 * 生成唯一的别名
 * 从 $1 开始递增，直到找到不冲突的名称
 */
export function generateUniqueAlias(baseName: string, existingNames: Set<string>): string {
  let index = 1
  while (existingNames.has(`${baseName}$${index}`)) {
    index++
  }
  return `${baseName}$${index}`
}
