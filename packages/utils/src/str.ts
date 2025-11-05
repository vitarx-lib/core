/**
 * 将字符串转换为驼峰命名格式
 *
 * @param str - 输入的字符串，通常为短横线分隔的格式
 * @returns {string} 转换后的驼峰命名格式字符串
 * @example
 * ```js
 * toCamelCase('hello-world') // 输出：'helloWorld'
 * ```
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
 * @example
 * ```js
 * toKebabCase('helloWorld') // 输出：'hello-world'
 * ```
 */
export function toKebabCase(str: string): string {
  // 使用正则表达式匹配所有大写字母，并在前面添加短横线，然后转换为小写
  return str.replace(/[A-Z]/g, match => `-${match.toLowerCase()}`)
}

/**
 * 将字符串首字母大写
 * @param str 需要处理的字符串
 * @returns {string} 返回首字母大写后的字符串
 * @example
 * ```js
 * toCapitalize('hello world') // 输出：'Hello world'
 * ```
 */
export function toCapitalize<T extends string>(str: T): Capitalize<T> {
  // 获取字符串的第一个字符并将其转换为大写
  // 然后将其与字符串的其余部分（从第二个字符开始）拼接
  return (str.charAt(0).toUpperCase() + str.slice(1)) as Capitalize<T>
}
