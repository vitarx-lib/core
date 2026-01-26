import type { ValidChildren } from '@vitarx/runtime-core'
import type { Properties as CssProperties } from 'csstype'
import { type HTMLElementEvents } from './event.js'

/**
 * 从W3C文档中提取到的合法标签属性，用于生成类型
 *
 * `data-*` 需要单独定义，因为 `data-*` 是自定义属性，不是 W3C 规范中的属性。
 *
 * 包含了所有html标签可以直接赋值的属性，以及所有合法的事件属性。
 *
 * @see https://www.w3schools.com/tags/ref_standardattributes.asp
 */
type AttributeNames =
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
  | 'children'

/**
 * 判断一个属性P是否存在于W3C标准属性中
 */
type IsW3CHtmlProperties<P extends string> = Lowercase<P> extends AttributeNames ? P : never

type BoolType = 'true' | 'false' | boolean
/**
 * 局部属性
 */
interface PartAttributes {
  /**
   * 子元素
   */
  children?: ValidChildren
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
 * CSS 样式规则类型
 */
export type HTMLStyleRules = {
  [K in keyof CssProperties]: CssProperties[K]
} & {
  [key: `--${string}`]: string | 0
}
/**
 * 全局属性
 */
interface GlobalAttributes {
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
  style?: string | HTMLStyleRules
  /**
   * 全局HTML属性`className`接受字符串、数组和`Record<string, boolean>`类型的对象。
   *
   * 和`class`作用相同
   */
  className?: string | string[] | Record<string, boolean>
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
 * 要覆盖的HTML属性，并返回一个新对象接口。
 */
type CoverAttributes = GlobalAttributes & PartAttributes

/**
 * 要覆盖HTML属性的键
 */
type CoverPropertiesNames = keyof CoverAttributes

/**
 * 自定义全局HTML属性
 */
interface CustomHTMLAttributes {
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
  class?: string | string[] | Record<string, boolean>
  /**
   * `v-html` 是框架的自定义属性，用于在元素中插入 HTML 代码。
   */
  'v-html'?: string
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
type ExtractElementAttributes<T extends Element> = {
  [K in keyof T as K extends string
    ? IsW3CHtmlProperties<K>
    : never]?: K extends CoverPropertiesNames ? CoverAttributes[K] : T[K]
} & HTMLElementEvents<T> &
  GlobalAttributes

/**
 * 生成HTML标签可选属性，包括事件和自定义数据属性
 *
 * @template T - 元素类型
 */
export type HTMLElementProps<T extends Element> = ExtractElementAttributes<T> & CustomHTMLAttributes
