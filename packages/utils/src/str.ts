/**
 * 将字符串转换为驼峰命名格式
 *
 * @param str - 输入的字符串，通常为短横线分隔的格式
 * @returns {string} 转换后的驼峰命名格式字符串
 */
export function toCamelCase(str: string): string {
  // 使用正则表达式匹配短横线后的字母，并将其转换为大写
  return str.replace(/-([a-z])/g, (_match, group1) => group1.toUpperCase())
}

/**
 * 将驼峰命名法的字符串转换为短横线命名法
 *
 * @param str - 需要转换的驼峰命名字符串
 * @returns {string} 转换后的短横线命名字符串
 */
export function toKebabCase(str: string): string {
  // 使用正则表达式匹配所有大写字母，并在前面添加短横线，然后转换为小写
  return str.replace(/[A-Z]/g, match => `-${match.toLowerCase()}`)
}
