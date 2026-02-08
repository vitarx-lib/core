import type { HostElement, HostNode } from '@vitarx/runtime-core'
import { isPlainObject, toCapitalize } from '@vitarx/utils'
import type { BaseTransitionProps, TransitionDuration, TransitionType } from './Transition.types.js'

const activeTransitions = new WeakMap<HostElement, () => void>()

/**
 * 解析时间字符串为毫秒数
 * @param time 时间字符串，可以是毫秒(ms)、秒(s)或纯数字
 * @return - 返回转换后的毫秒数，如果转换失败则返回0
 */
function parseTime(time: string): number {
  time = time.trim() // 去除字符串两端的空格
  if (time.endsWith('ms')) {
    // 判断是否为毫秒单位
    return parseFloat(time) // 直接返回数值部分
  } else if (time.endsWith('s')) {
    // 判断是否为秒单位
    return parseFloat(time) * 1000 // 转换为毫秒
  }
  return parseFloat(time) || 0 // 尝试转换为数字，失败则返回0
}

/**
 * 计算元素上过渡或动画的总持续时间
 * @param el - 要计算持续时间的DOM元素
 * @param type - 'transition'或'animation'，指定要计算的动画类型
 * @returns - 返回过渡或动画的总持续时间（毫秒），如果无效则返回0
 */
function computedDuration(el: HostElement, type: 'transition' | 'animation'): number {
  // 获取元素的计算样式
  const styles = getComputedStyle(el)
  // 获取并解析所有延迟时间
  const delays = styles[`${type}Delay`].split(',').map(s => parseTime(s))
  // 获取并解析所有持续时间
  const durations = styles[`${type}Duration`].split(',').map(s => parseTime(s))
  // 计算每个动画的总持续时间（持续时间+延迟）
  const times = durations.map((d, i) => d + (delays[i] || 0))
  // 返回所有动画中的最大持续时间，如果为负数则返回0
  return Math.max(...times, 0)
}

/**
 * 获取过渡动画的持续时间
 * @param el - DOM 元素
 * @param mode - 过渡模式，'enter' 进入或 'leave' 离开
 * @param duration - 过渡持续时间，可以是数字或对象
 * @param type - 过渡类型，'transition' 或 'animation' 或两者
 * @returns - 过渡动画的持续时间（毫秒）
 */
export function getDuration(
  el: HostElement,
  mode: 'enter' | 'leave',
  duration: TransitionDuration | undefined,
  type: TransitionType
): number {
  // 如果 duration 是数字，直接返回
  if (typeof duration === 'number') return duration
  // 如果 duration 是对象，根据 type 返回对应的值
  if (isPlainObject(duration)) return duration[mode] || 0
  // 否则从元素的 CSS 中计算持续时间
  switch (type) {
    case 'transition':
      return computedDuration(el, 'transition')
    case 'animation':
      return computedDuration(el, 'animation')
    default:
      const td = computedDuration(el, 'transition')
      const ad = computedDuration(el, 'animation')
      return Math.max(td, ad)
  }
}

/**
 * 取消元素的过渡动画
 * @param el - 需要取消过渡动画的宿主元素
 */
export function cancelTransition(el: HostElement): void {
  activeTransitions.get(el)?.()
}

/**
 * 检查给定的节点是否为元素节点
 * @param node - 需要检查的DOM节点
 * @returns 如果节点是元素节点则返回true，否则返回false
 */
export function isElement(node: HostNode): node is HostElement {
  // 通过比较节点的nodeType与Node.ELEMENT_NODE常量来判断是否为元素节点
  return node.nodeType === Node.ELEMENT_NODE
}

/**
 * 执行过渡动画函数
 *
 * @param el - 目标DOM元素
 * @param type - 过渡类型：进入、离开或初始出现
 * @param props - 过渡属性配置
 * @param doneCallback - 动画完成后的回调函数
 */
export function runTransition(
  el: HostNode,
  type: 'enter' | 'leave' | 'appear',
  props: BaseTransitionProps,
  doneCallback?: () => void
): void {
  // 如果不是元素节点，不执行动画，但离开时需要删除元素
  if (!isElement(el)) return doneCallback?.()
  // 取消已有动画
  cancelTransition(el)
  // 将类型字符串首字母大写，用于拼接钩子函数名
  const capitalizeType = toCapitalize(type)
  const useCss = props.css ?? true
  // 获取钩子
  const beforeHookRaw = props[`onBefore${capitalizeType}`]
  const hookRaw = props[`on${capitalizeType}`]
  const afterHookRaw = props[`onAfter${capitalizeType}`]
  const cancelledHookRaw = props[`on${capitalizeType}Cancelled`]
  // 类型守卫，确保都是函数
  const beforeHook = typeof beforeHookRaw === 'function' ? beforeHookRaw : undefined
  const onStart = typeof hookRaw === 'function' ? hookRaw : undefined
  const afterHook = typeof afterHookRaw === 'function' ? afterHookRaw : undefined
  const cancelledHook = typeof cancelledHookRaw === 'function' ? cancelledHookRaw : undefined
  // 执行动画开始前的钩子
  beforeHook?.(el)
  let ended = false
  if (useCss) {
    const name = props.name || 'v'
    // CSS 过渡模式
    const cssPrefix = name.endsWith('-') ? `${name}${type}` : `${name}-${type}`
    const from = props[`${type}FromClass`] || `${cssPrefix}-from`
    const active = props[`${type}ActiveClass`] || `${cssPrefix}-active`
    const to = props[`${type}ToClass`] || `${cssPrefix}-to`

    // 添加开始和进行中的类
    el.classList.add(from)
    el.classList.add(active)

    // 获取动画持续时间
    const duration = getDuration(
      el,
      type === 'appear' ? 'enter' : type,
      props.duration,
      props.type || 'auto'
    )
    // 💡 强制（浏览器）重排，确保动画触发
    if ('offsetWidth' in el) void el.offsetWidth
    // 下一帧切换到结束状态
    requestAnimationFrame(() => {
      el.classList.remove(from)
      el.classList.add(to)
      onStart?.(el, (): void => void 0)
    })
    // 设置定时器，在动画完成后清理
    const timer = setTimeout(() => {
      if (ended) return
      ended = true
      activeTransitions.delete(el)
      el.classList.remove(to)
      el.classList.remove(active)
      try {
        afterHook?.(el)
      } finally {
        doneCallback?.()
      }
    }, duration + 16)
    // 记录定时器以便取消
    activeTransitions.set(el, () => {
      if (ended) return
      ended = true
      clearTimeout(timer)
      activeTransitions.delete(el)
      el.classList.remove(to)
      el.classList.remove(active)
      cancelledHook?.(el)
    })
  } else {
    // JavaScript-only 模式，钩子自行控制 done
    const end = () => {
      if (ended) return
      ended = true
      activeTransitions.delete(el)
      try {
        afterHook?.(el)
      } finally {
        doneCallback?.()
      }
    }
    activeTransitions.set(el, () => {
      if (ended) return
      ended = true
      activeTransitions.delete(el)
      cancelledHook?.(el)
    })
    requestAnimationFrame(() => {
      if (onStart) onStart(el, end)
      else end()
    })
  }
}

/**
 * 创建一个文本节点作为锚点，并将其插入到指定节点的位置
 * @param child - 目标主机节点，将在该节点处插入锚点
 * @returns - 返回创建的文本节点锚点
 */
export function createAnchor(child: HostNode): Comment {
  // 创建一个空的文本节点作为锚点
  const anchor = document.createComment('')
  // 检查目标节点是否有下一个兄弟节点
  if (child.nextSibling) {
    // 如果有，则将锚点插入到目标节点和它的下一个兄弟节点之间
    child.parentNode?.insertBefore(anchor, child.nextSibling)
  } else {
    // 如果没有，则将锚点作为目标节点的最后一个子节点添加
    child.parentNode?.appendChild(anchor)
  }
  // 返回创建的锚点
  return anchor
}
