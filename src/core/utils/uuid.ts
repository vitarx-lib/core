/**
 * 唯一id生成器，单线程唯一！
 */
class UniqueIDGenerator {
  // 计数器
  static #counter: number = 0
  static #lock: boolean = false

  /**
   * 生成id
   *
   * @param length
   */
  public static get(length: number = 10): string {
    // 简单的锁机制来保证线程安全
    while (this.#lock) {
      // 等待锁释放
    }
    this.#lock = true
    try {
      // 增加计数器
      this.#counter++
      // 计数器转为字符串，保证至少有一位
      const counterStr = this.#counter.toString().padStart(3, '0')
      // 计算随机字符串的长度
      const randomLength = length - counterStr.length
      length = Math.max(randomLength, 1)
      // 生成随机字符串
      const randomStr = this.generateRandomString(length)
      // 拼接成最终的ID
      return `${counterStr}${randomStr}`
    } finally {
      // 释放锁
      this.#lock = false
    }
  }

  /**
   * 生成固定长度的随机字符串
   *
   * @param length
   * @private
   */
  private static generateRandomString(length: number): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length))
    }
    return result
  }
}

/**
 * 利用计数器生成唯一id，线程安全
 *
 * @param length
 */
export function unique_id(length: number = 10): string {
  return UniqueIDGenerator.get(length)
}
