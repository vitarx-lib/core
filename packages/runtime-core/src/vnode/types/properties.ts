import type { RefSignal } from '@vitarx/responsive'
import type { RefEl } from '../ref.js'
import type { EventHumpMap, EventLowerMap, EventLowerNames, EventModifierMap } from './event.js'
import type { ClassProperties, StyleProperties } from './style.js'
import type { AnyChildren } from './vnode.js'

/**
 * 唯一键
 */
export type UniqueKey = any

/**
 * 绑定属性
 *
 * 可选值：
 *   - 对象Record<string, any>：要绑定给元素的属性，`style`|`class`|`className`，会和原有值进行合并。
 *   - 数组[props: Record<string, any>, exclude?: string[]]：第一个元素为要绑定给节点的属性对象，第二个元素可以指定哪些属性不需要绑定。
 */
export type VBind = Record<string, any> | [props: Record<string, any>, exclude?: string[]]
/**
 * 父元素
 */
export type VParent =
  | string
  | ParentNode
  | Element
  | null
  | undefined
  | (() => string | ParentNode | Element | null | undefined)

/**
 * 全局固有属性
 */
export interface IntrinsicProperties {
  /**
   * 控制一个 `Widget` 如何替换树中的另一个 `Widget`。
   *
   * 在运行时，如果两个Widget的`key`相同，则会更新已渲染的Widget，否则会移除旧Widget，然后插入新Widget。
   *
   * 这在某些情况下很有用，例如，当您想重新排序列表时。
   *
   * 通常，作为另一个 Widget 的唯一子项的 Widget 不需要显式键。
   */
  key?: UniqueKey
  /**
   * 引用组件/元素实例
   */
  ref?: RefEl<any>
  /**
   * 绑定属性
   *
   * 可选值：
   *  - 对象Record<string, any>：要绑定给元素的属性，`style`|`class`|`className`，会和原有值进行合并。
   *  - 数组[props: Record<string, any>, exclude?: string[]]：第一个元素为要绑定给节点的属性对象，
   *  第二个元素可以指定哪些属性不需要绑定。
   */
  'v-bind'?: VBind
  /**
   * 条件渲染指令
   * 如果是v-if为false，则会使用 CommonVNode 代替原始节点，
   * CommonVNode节点的开销非常小，视觉效果上也看不见该节点。
   */
  'v-if'?: boolean
  /**
   * 缓存节点的指令
   *
   * 该指令接收一个固定引用(在生命周期中保持引用不变)的数组，内部会将虚拟节点与该数组进行绑定。
   * 当重新创建该节点时会判断数组内容是否相同，如果相同则会复用缓存的节点，如果不同则会创建新的节点，并刷新缓存。
   *
   * 示例：
   * ```tsx
   * function App() {
   *  const memo = [1, 2, 3]
   *  return <div v-memo={memo}>
   *    此div节点会被缓存，只到memo的数组内容改变时才会重新创建新的节点，这样做能够在重绘时减少不必要的新节点创建。
   *  </div>
   * }
   * ```
   */
  'v-memo'?: any[]
  /**
   * 静态节点的指令
   *
   * 该指令将节点标记为静态节点，只会被渲染一次，并跳过之后的更新。
   * 这可以用来优化更新时的性能
   */
  'v-static'?: boolean
  /**
   * 父元素 - 支持选择器或 `HTMLElement` 实例
   *
   * ```tsx
   * // 在html元素中使用
   * <div v-parent="#container">此div将会挂载到id为#container的容器中</div>
   * // 在组件上使用，使组件的内容挂载到body中，如果组件内部通过`onBeforeMount`钩子指定了父元素，`v-parent`将无效
   * <YourWidget v-parent={document.body}></YourWidget>
   * // 使用getter做为查询器
   * <div v-parent={() => document.querySelector('#container')}></div>
   * ```
   */
  'v-parent'?: VParent
  /**
   * 透传属性
   */
  [key: string]: any
}

/**
 * 从W3C文档中提取到的合法标签属性，用于生成类型
 *
 * `data-*` 需要单独定义，因为 `data-*` 是自定义属性，不是 W3C 规范中的属性。
 *
 * 包含了所有html标签可以直接赋值的属性，以及所有合法的事件属性。
 *
 * @see https://www.w3schools.com/tags/ref_standardattributes.asp
 */
type PropertyNames =
  | 'classname'
  | 'accept'
  | 'acceptcharset'
  | 'accesskey'
  | 'action'
  | 'align'
  | 'alt'
  | 'async'
  | 'autocomplete'
  | 'autofocus'
  | 'autoplay'
  | 'bgcolor'
  | 'border'
  | 'charset'
  | 'checked'
  | 'cite'
  | 'class'
  | 'color'
  | 'cols'
  | 'colspan'
  | 'content'
  | 'contenteditable'
  | 'controls'
  | 'coords'
  | 'data'
  | 'datetime'
  | 'default'
  | 'defer'
  | 'dir'
  | 'dirname'
  | 'disabled'
  | 'download'
  | 'draggable'
  | 'enctype'
  | 'enterkeyhint'
  | 'for'
  | 'form'
  | 'formaction'
  | 'headers'
  | 'height'
  | 'hidden'
  | 'high'
  | 'href'
  | 'hreflang'
  | 'httpequiv'
  | 'id'
  | 'inert'
  | 'inputmode'
  | 'ismap'
  | 'kind'
  | 'label'
  | 'lang'
  | 'list'
  | 'loop'
  | 'low'
  | 'max'
  | 'maxlength'
  | 'media'
  | 'method'
  | 'min'
  | 'multiple'
  | 'muted'
  | 'name'
  | 'novalidate'
  | 'onabort'
  | 'onafterprint'
  | 'onbeforeprint'
  | 'onbeforeunload'
  | 'onblur'
  | 'oncanplay'
  | 'oncanplaythrough'
  | 'onchange'
  | 'onclick'
  | 'oncontextmenu'
  | 'oncopy'
  | 'oncuechange'
  | 'oncut'
  | 'ondblclick'
  | 'ondrag'
  | 'ondragend'
  | 'ondragenter'
  | 'ondragleave'
  | 'ondragover'
  | 'ondragstart'
  | 'ondrop'
  | 'ondurationchange'
  | 'onemptied'
  | 'onended'
  | 'onerror'
  | 'onfocus'
  | 'onhashchange'
  | 'oninput'
  | 'oninvalid'
  | 'onkeydown'
  | 'onkeypress'
  | 'onkeyup'
  | 'onload'
  | 'onloadeddata'
  | 'onloadedmetadata'
  | 'onloadstart'
  | 'onmousedown'
  | 'onmousemove'
  | 'onmouseout'
  | 'onmouseover'
  | 'onmouseup'
  | 'onmousewheel'
  | 'onoffline'
  | 'ononline'
  | 'onpagehide'
  | 'onpageshow'
  | 'onpaste'
  | 'onpause'
  | 'onplay'
  | 'onplaying'
  | 'onpopstate'
  | 'onprogress'
  | 'onratechange'
  | 'onreset'
  | 'onresize'
  | 'onscroll'
  | 'onsearch'
  | 'onseeked'
  | 'onseeking'
  | 'onselect'
  | 'onstalled'
  | 'onstorage'
  | 'onsubmit'
  | 'onsuspend'
  | 'ontimeupdate'
  | 'ontoggle'
  | 'onunload'
  | 'onvolumechange'
  | 'onwaiting'
  | 'onwheel'
  | 'open'
  | 'optimum'
  | 'pattern'
  | 'placeholder'
  | 'popover'
  | 'popovertarget'
  | 'popovertargetaction'
  | 'poster'
  | 'preload'
  | 'readonly'
  | 'rel'
  | 'required'
  | 'reversed'
  | 'rows'
  | 'rowspan'
  | 'sandbox'
  | 'scope'
  | 'selected'
  | 'shape'
  | 'size'
  | 'sizes'
  | 'span'
  | 'spellcheck'
  | 'src'
  | 'srcdoc'
  | 'srclang'
  | 'srcset'
  | 'start'
  | 'step'
  | 'style'
  | 'tabindex'
  | 'target'
  | 'title'
  | 'translate'
  | 'type'
  | 'usemap'
  | 'value'
  | 'width'
  | 'wrap'

/**
 * 判断一个属性P是否存在于W3C标准属性中
 */
type IsW3CHtmlProperties<P extends string> = Lowercase<P> extends PropertyNames ? P : never
/**
 * 将对象的所有属性转换为可选的响应式信号类型
 *
 * @template T - 目标对象类型，必须是一个对象类型
 * @remarks
 * 该类型用于将对象的所有属性转换为可选的响应式信号类型。
 * 转换后的每个属性可以是原始类型，也可以是 `RefSignal` 类型。
 */
type SupportRefSignal<T extends {}> = {
  [key in keyof T]: T[key] | RefSignal<T[key]>
}

type BoolType = 'true' | 'false' | boolean

/**
 * 局部属性
 */
interface PartProperties {
  /**
   * 表单控件的类型
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/input/button 详细文档
   */
  type?:
    | 'button'
    | 'checkbox'
    | 'color'
    | 'date'
    | 'datetime-local'
    | 'email'
    | 'file'
    | 'hidden'
    | 'image'
    | 'month'
    | 'number'
    | 'password'
    | 'radio'
    | 'range'
    | 'reset'
    | 'search'
    | 'submit'
    | 'tel'
    | 'text'
    | 'time'
    | 'url'
    | 'week'
  /**
   * 定义可接受的文件类型。
   *
   * 适用于 `<input type="file">` 元素。
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Attributes/accept 详细文档
   */
  accept?: string
  /**
   * 指定输入控件的自动完成功能。
   *
   * 适用于所有 `<input>` 元素。
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Attributes/autocomplete 详细文档
   */
  autocomplete?: string
  /**
   * 指定媒体输入的来源，用户或环境。
   *
   * 适用于 `<input>` 元素。
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Attributes/capture 详细文档
   */
  capture?: 'user' | 'environment'
  /**
   * 指定跨域请求的凭证要求。
   *
   * 适用于 `<link>` 和 `<script>` 元素。
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Attributes/crossorigin 详细文档
   */
  crossorigin?: 'anonymous' | 'use-credentials' | string
  /**
   * 定义输入控件的文本方向。
   *
   * 适用于所有 `<input>`|`<textarea>` 元素。
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Attributes/dirname 详细文档
   */
  dirname?: string
  /**
   * 指定输入控件是否被禁用。
   *
   * 适用于所有表单元素。
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Attributes/disabled 详细文档
   */
  disabled?: boolean
  /**
   * 表示元素已被标记，以便 PerformanceObserver 对象使用 "element" 类型进行跟踪
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Attributes/elementtiming 详细文档
   */
  elementTiming?: string
  /**
   * 定义与标签关联的表单元素的 ID。
   *
   * 适用于 `<label>` 元素。
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Attributes/for 详细文档
   */
  for?: string
  /**
   * 定义输入控件的最大值。
   *
   * 适用于 `<input>` 元素。
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Attributes/max 详细文档
   */
  max?: string | number
  /**
   * 定义输入控件的最大长度。
   *
   * 适用于 `<input>`|`<textarea>` 元素。
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Attributes/maxlength 详细文档
   */
  maxlength?: number | string
  /**
   * 定义输入控件的最小值。
   *
   * 适用于 `<input>` 元素。
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Attributes/min 详细文档
   */
  min?: string | number
  /**
   * 指定输入控件是否允许选择多个文件。
   *
   * 适用于 `<input type="file">` 元素。
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Attributes/multiple 详细文档
   */
  multiple?: boolean
  /**
   * 定义输入控件的模式。
   *
   * 适用于 `<input>` 元素。
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Attributes/pattern 详细文档
   */
  pattern?: string
  /**
   * 定义输入控件的占位符文本。
   *
   * 适用于所有 `<input>`|`<textarea>` 元素。
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Attributes/placeholder 详细文档
   */
  placeholder?: string
  /**
   * 指定输入控件是否为只读。
   *
   * 适用于所有 `<input>`|`<textarea>` 元素。
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Attributes/readonly 详细文档
   */
  readonly?: boolean
  /**
   * 定义与链接相关的关系。
   * 适用于 `<a>` 元素。
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Attributes/rel 详细文档
   */
  rel?: string
  /**
   * 指定输入控件是否为必填项。
   *
   * 适用于所有 `<input>`|`<textarea>` 元素。
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Attributes/required 详细文档
   */
  required?: boolean
  /**
   * 定义输入控件的大小。
   *
   * 适用于所有 `<input>`|`<select>` 元素。
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Attributes/size 详细文档
   */
  size?: number | string
  /**
   * 定义输入控件的步长。
   *
   * 适用于 `<input>` 元素。
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Attributes/step 详细文档
   */
  step?: number | string
}

/**
 * 全局属性
 */
interface GlobalProperties {
  /**
   * 全局属性 `style` 包含应用到元素的 CSS 样式声明。
   *
   * 这个属性以及 `<style>` 元素的主要目的是快速装饰。例如用于测试目的。
   *
   * > **备注**：这个属性不能用于传递语义信息。即使所有样式都移除了，页面也应该保留正确语义。
   * 通常它不应用于隐藏不相关的信息；这应该使用 `hidden` 属性来实现。
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Global_attributes/style 完整文档
   */
  style?: string | StyleProperties
  /**
   * 全局HTML属性`className`接受字符串、数组和`Record<string, boolean>`类型的对象。
   *
   * 和`class`作用相同
   */
  className?: ClassProperties
  /**
   * 定义元素宽度。
   */
  width?: string | number
  /**
   * 定义元素的高度。
   */
  height?: string | number
  /**
   * accesskey 全局属性 提供了为当前元素生成快捷键的方式。
   *
   * 属性值必须包含一个可打印字符。
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Global_attributes/accesskey 详细文档
   */
  accesskey?: string
  /**
   * 全局属性 `anchor` 定义锚点。
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Global_attributes/anchor 详细文档
   */
  anchor?: string
  /**
   * 全局属性 `autocapitalize` 定义输入字段中输入文本的首字母是否大写。
   * 默认情况下，浏览器会根据当前语言环境自动将首字母大写。
   */
  autocapitalize?: 'off' | 'none' | 'on' | 'sentences' | 'words' | 'characters'
  /**
   * 全局属性 `autofocus` 定义元素是否应该自动获得焦点。
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Global_attributes/autofocus 详细文档
   */
  autofocus?: boolean
  /**
   * 全局属性 `contenteditable` 定义元素是否应该可编辑。
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Global_attributes/contenteditable 详细文档
   */
  contentEditable?: BoolType | 'plaintext-only'
  /**
   * 全局属性 `dir` 定义元素文本的方向。
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Global_attributes/dir 详细文档
   */
  dir?: 'auto' | 'ltr' | 'rtl'
  /**
   * 全局属性 `draggable` 定义元素是否可以拖动。
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Global_attributes/draggable 详细文档
   */
  draggable?: BoolType
  /**
   * 全局属性 `enterkeyhint` 定义在 `<input>` 元素中，当用户按下回车键时，浏览器应执行的操作。
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Global_attributes/enterkeyhint 详细文档
   */
  enterKeyHint?: 'enter' | 'done' | 'go' | 'next' | 'previous' | 'search' | 'send'
  /**
   * 全局属性 `hidden` 定义元素是否应该被隐藏。
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Global_attributes/hidden 详细文档
   */
  hidden?: boolean | 'hidden' | 'until-found' | ''
  /**
   * 全局属性 `id` 定义元素的唯一标识符。
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Global_attributes/id 详细文档
   */
  id?: string
  /**
   * 全局属性 `inert` 定义元素是否应该被禁用。
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Global_attributes/inert 详细文档
   */
  inert?: boolean
  /**
   * 全局属性 `inputMode` 定义元素应该如何获取焦点并显示键盘。
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Global_attributes/inputmode 详细文档
   */
  inputMode?: 'none' | 'text' | 'decimal' | 'numeric' | 'tel' | 'search' | 'email' | 'url'
  /**
   * 全局属性 `is` 定义元素的自定义元素名称。
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Global_attributes/is 详细文档
   */
  is?: string
  /**
   * 全局属性 `itemid` 定义元素的标识符。
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Global_attributes/itemid 详细文档
   */
  itemId?: string
  /**
   * 全局属性 `itemprop` 定义元素的属性。
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Global_attributes/itemprop 详细文档
   */
  itemProp?: string
  /**
   * 全局属性 `itemref` 定义元素的属性。
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Global_attributes/itemref 详细文档
   */
  itemRef?: string
  /**
   * 全局属性 `itemscope` 定义元素的作用域。
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Global_attributes/itemscope 详细文档
   */
  itemScope?: string
  /**
   * 全局属性 `itemtype` 定义元素的类型。
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Global_attributes/itemtype 详细文档
   */
  itemType?: string
  /**
   * 全局属性 `lang` 定义元素的语言。
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Global_attributes/lang 详细文档
   */
  lang?: string
  /**
   * 全局属性 `nonce` 是定义密码学 nonce（"只使用一次的数字"）的内容属性，
   * 内容安全策略可以使用它来确定是否允许对给定元素进行获取。
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Global_attributes/nonce 详细文档
   */
  nonce?: string
  /**
   * 全局属性 `part` 包含一个以元素中 part 属性名称组成的列表，该列表以空格分隔。通过 Part 的名称，可以使用 CSS 伪元素"::part"来选择 shadow 树中指定元素并设置其样式。
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Global_attributes/part 详细文档
   */
  part?: string
  /**
   * 全局属性 `popover` 将元素做为一个弹出窗口。
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Global_attributes/popover 详细文档
   */
  popover?: 'auto' | 'manual'
  slot?: string
  spellcheck?: BoolType | ''
  /**
   * 全局属性 `tabindex` 定义元素在文档中的访问顺序。
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Global_attributes/tabindex 详细文档
   */
  tabIndex?: string | number
  /**
   * 全局属性 `title` 定义元素的标题。
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Global_attributes/title 详细文档
   */
  title?: string
  /**
   * 全局属性 `translate` 定义元素是否应该被翻译。
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Global_attributes/translate 详细文档
   */
  translate?: 'yes' | 'no'
  /**
   * 全局属性 `virtualkeyboardpolicy` 定义虚拟键盘的显示策略。
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Global_attributes/virtualkeyboardpolicy 详细文档
   */
  virtualkeyboardpolicy?: 'auto' | 'manual'
  /**
   * 全局属性 `writingsuggestions` 定义是否显示自动完成建议。
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Global_attributes/writingsuggestions 详细文档
   */
  writingsuggestions?: BoolType
  /**
   * 全局属性 `exportparts` 定义元素可以导出的 CSS 样式部分。
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Global_attributes/exportparts 详细文档
   */
  exportparts?: string
}

/**
 * HTML全局属性接口
 */
export type HTMLGlobalProperties = SupportRefSignal<GlobalProperties & CustomProperties>

/**
 * 要覆盖的HTML属性，并返回一个新对象接口。
 */
type CoverProperties = SupportRefSignal<GlobalProperties & PartProperties>

/**
 * 要覆盖HTML属性的键
 */
type CoverPropertiesNames = keyof CoverProperties

/**
 * 自定义全局HTML属性
 */
interface CustomProperties {
  /**
   * 全局HTML属性`class`接受字符串、数组和`Record<string, boolean>`类型的对象。
   *
   * 当为对象时`Key`为类名，`Value` 应该为布尔值，决定是否为元素添加该类。
   *
   * ```jsx
   * // 对象类型
   * <div class={{ active: true, hidden: false,'my-class': true }}></div>
   * // 数组类型
   * <div class={['active', 'my-class']}></div>
   * // `W3C`标准语法
   * <div class="active my-class"></div>
   * ```
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Global_attributes/class 详细文档
   */
  class?: ClassProperties
  /**
   * `v-html` 是框架的自定义属性，用于在元素中插入 HTML 代码。
   */
  'v-html'?: RefSignal<string> | string
  /**
   * 子元素
   *
   * ```jsx
   * <div>
   *   <span>hello</span>
   * </div>
   * ```
   */
  children?: AnyChildren
  /**
   * 未知属性
   *
   * 支持任意自定义属性
   */
  [key: string]: any
}

/**
 * 从对象接口中提取出符合W3C标准的属性，并返回一个新对象接口。
 */
type ExtractElementProperties<T extends Element> = {
  [K in keyof T as K extends string ? IsW3CHtmlProperties<K> : never]?: K extends EventLowerNames
    ? EventLowerMap<T>[K]
    : K extends CoverPropertiesNames
      ? CoverProperties[K]
      : RefSignal<T[K]> | T[K]
}

/**
 * 生成HTML标签可选属性，包括事件和自定义数据属性
 *
 * @template T - 元素类型
 */
export type ElementProperties<T extends Element> = ExtractElementProperties<T> &
  EventHumpMap<T> &
  EventModifierMap<T> &
  CustomProperties &
  IntrinsicProperties

/**
 * 推导出HTML属性
 *
 * @example
 * ```tsx
 * // 继承HTML属性，可以使组件能够接收任意div元素的属性
 * interface Props extends HTMLProperties<HTMLDivElement> {
 *   children?: string
 * }
 *
 * function MyComponent(props: Props) {
 *  return <div v-bind={props}>{props.children}</div>
 * }
 *
 * <MyComponent onClick={()=>console.log('hello')}>hello</MyComponent>
 * ```
 *
 * @template T - 元素类型
 */
export type HTMLProperties<T extends Element> = Omit<ElementProperties<T>, 'children'>
