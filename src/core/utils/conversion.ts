/**
 * 将纯数字字符串转换为数字
 *
 * @param str
 * @param radix
 *
 * @returns {number | string} 如果是纯数字字符串，则返回number；否则返回原字符串。
 */
export function numStrToNum(str: string, radix: number = 10): number | string {
  // 使用正则表达式检查字符串是否为整数
  const integerRegex = /\d+$/
  if (integerRegex.test(str)) {
    // 使用 parseInt 或一元加号将字符串转换为数字
    return parseInt(str, radix)
  }
  return str
}
