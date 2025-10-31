import { unref } from '@vitarx/responsive'
import type { AnyProps } from '../../types/index.js'

/**
 * 解包ref属性函数
 * 该函数会遍历传入的对象的所有属性，并将每个属性通过unref函数进行解包
 * @param props - 需要解包的属性对象，类型为AnyProps
 */
export function unwrapRefProps<T extends AnyProps>(props: T): T {
  // 检查props对象是否包含属性
  if (Object.keys(props).length) {
    // 解包ref
    for (const prop in props) {
      props[prop] = unref(props[prop])
    }
  }
  return props
}
