import type { ClassProperties, InstanceRef, RenderChildren } from '@vitarx/runtime-core'
import type { Properties } from 'csstype'

import type { GlobalEventAttributes, VitarxEventHandler, WithEventAttributes } from './event.js'

/**
 * 用于表示DOM API，用户可以在其中传递
 * true或false作为布尔值或其等效字符串。
 */
type Booleanish = boolean | 'true' | 'false'
type AriaRole =
  | 'alert'
  | 'alertdialog'
  | 'application'
  | 'article'
  | 'banner'
  | 'button'
  | 'cell'
  | 'checkbox'
  | 'columnheader'
  | 'combobox'
  | 'complementary'
  | 'contentinfo'
  | 'definition'
  | 'dialog'
  | 'directory'
  | 'document'
  | 'feed'
  | 'figure'
  | 'form'
  | 'grid'
  | 'gridcell'
  | 'group'
  | 'heading'
  | 'img'
  | 'link'
  | 'list'
  | 'listbox'
  | 'listitem'
  | 'log'
  | 'main'
  | 'marquee'
  | 'math'
  | 'menu'
  | 'menubar'
  | 'menuitem'
  | 'menuitemcheckbox'
  | 'menuitemradio'
  | 'navigation'
  | 'none'
  | 'note'
  | 'option'
  | 'presentation'
  | 'progressbar'
  | 'radio'
  | 'radiogroup'
  | 'region'
  | 'row'
  | 'rowgroup'
  | 'rowheader'
  | 'scrollbar'
  | 'search'
  | 'searchbox'
  | 'separator'
  | 'slider'
  | 'spinbutton'
  | 'status'
  | 'switch'
  | 'tab'
  | 'table'
  | 'tablist'
  | 'tabpanel'
  | 'term'
  | 'textbox'
  | 'timer'
  | 'toolbar'
  | 'tooltip'
  | 'tree'
  | 'treegrid'
  | 'treeitem'
  | (string & {})
type HTMLAttributeReferrerPolicy =
  | ''
  | 'no-referrer'
  | 'no-referrer-when-downgrade'
  | 'origin'
  | 'origin-when-cross-origin'
  | 'same-origin'
  | 'strict-origin'
  | 'strict-origin-when-cross-origin'
  | 'unsafe-url'
/**
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/crossorigin MDN}
 */
type CrossOrigin = 'anonymous' | 'use-credentials' | '' | undefined

// All the WAI-ARIA 1.1 attributes from https://www.w3.org/TR/wai-aria-1.1/
interface AriaAttributes {
  /** Identifies the currently active element when DOM focus is on a composite widget, textbox, group, or application. */
  'aria-activedescendant'?: string | undefined
  /** Indicates whether assistive technologies will present all, or only parts of, the changed region based on the change notifications defined by the aria-relevant attribute. */
  'aria-atomic'?: Booleanish | undefined
  /**
   * Indicates whether inputting text could trigger display of one or more predictions of the user's intended value for an input and specifies how predictions would be
   * presented if they are made.
   */
  'aria-autocomplete'?: 'none' | 'inline' | 'list' | 'both' | undefined
  /** Indicates an element is being modified and that assistive technologies MAY want to wait until the modifications are complete before exposing them to the user. */
  /**
   * Defines a string value that labels the current element, which is intended to be converted into Braille.
   * @see aria-label.
   */
  'aria-braillelabel'?: string | undefined
  /**
   * Defines a human-readable, author-localized abbreviated description for the role of an element, which is intended to be converted into Braille.
   * @see aria-roledescription.
   */
  'aria-brailleroledescription'?: string | undefined
  'aria-busy'?: Booleanish | undefined
  /**
   * Indicates the current "checked" state of checkboxes, radio buttons, and other widgets.
   * @see aria-pressed @see aria-selected.
   */
  'aria-checked'?: boolean | 'false' | 'mixed' | 'true' | undefined
  /**
   * Defines the total number of columns in a table, grid, or treegrid.
   * @see aria-colindex.
   */
  'aria-colcount'?: number | undefined
  /**
   * Defines an element's column index or position with respect to the total number of columns within a table, grid, or treegrid.
   * @see aria-colcount @see aria-colspan.
   */
  'aria-colindex'?: number | undefined
  /**
   * Defines a human readable text alternative of aria-colindex.
   * @see aria-rowindextext.
   */
  'aria-colindextext'?: string | undefined
  /**
   * Defines the number of columns spanned by a cell or gridcell within a table, grid, or treegrid.
   * @see aria-colindex @see aria-rowspan.
   */
  'aria-colspan'?: number | undefined
  /**
   * Identifies the element (or elements) whose contents or presence are controlled by the current element.
   * @see aria-owns.
   */
  'aria-controls'?: string | undefined
  /** Indicates the element that represents the current item within a container or set of related elements. */
  'aria-current'?:
    | boolean
    | 'false'
    | 'true'
    | 'page'
    | 'step'
    | 'location'
    | 'date'
    | 'time'
    | undefined
  /**
   * Identifies the element (or elements) that describes the object.
   * @see aria-labelledby
   */
  'aria-describedby'?: string | undefined
  /**
   * Defines a string value that describes or annotates the current element.
   * @see related aria-describedby.
   */
  'aria-description'?: string | undefined
  /**
   * Identifies the element that provides a detailed, extended description for the object.
   * @see aria-describedby.
   */
  'aria-details'?: string | undefined
  /**
   * Indicates that the element is perceivable but disabled, so it is not editable or otherwise operable.
   * @see aria-hidden @see aria-readonly.
   */
  'aria-disabled'?: Booleanish | undefined
  /**
   * Indicates what functions can be performed when a dragged object is released on the drop target.
   * @deprecated in ARIA 1.1
   */
  'aria-dropeffect'?: 'none' | 'copy' | 'execute' | 'link' | 'move' | 'popup' | undefined
  /**
   * Identifies the element that provides an error message for the object.
   * @see aria-invalid @see aria-describedby.
   */
  'aria-errormessage'?: string | undefined
  /** Indicates whether the element, or another grouping element it controls, is currently expanded or collapsed. */
  'aria-expanded'?: Booleanish | undefined
  /**
   * Identifies the next element (or elements) in an alternate reading order of content which, at the user's discretion,
   * allows assistive technology to override the general default of reading in document source order.
   */
  'aria-flowto'?: string | undefined
  /**
   * Indicates an element's "grabbed" state in a drag-and-drop operation.
   * @deprecated in ARIA 1.1
   */
  'aria-grabbed'?: Booleanish | undefined
  /** Indicates the availability and type of interactive popup element, such as menu or dialog, that can be triggered by an element. */
  'aria-haspopup'?:
    | boolean
    | 'false'
    | 'true'
    | 'menu'
    | 'listbox'
    | 'tree'
    | 'grid'
    | 'dialog'
    | undefined
  /**
   * Indicates whether the element is exposed to an accessibility API.
   * @see aria-disabled.
   */
  'aria-hidden'?: Booleanish | undefined
  /**
   * Indicates the entered value does not conform to the format expected by the application.
   * @see aria-errormessage.
   */
  'aria-invalid'?: boolean | 'false' | 'true' | 'grammar' | 'spelling' | undefined
  /** Indicates keyboard shortcuts that an author has implemented to activate or give focus to an element. */
  'aria-keyshortcuts'?: string | undefined
  /**
   * Defines a string value that labels the current element.
   * @see aria-labelledby.
   */
  'aria-label'?: string | undefined
  /**
   * Identifies the element (or elements) that labels the current element.
   * @see aria-describedby.
   */
  'aria-labelledby'?: string | undefined
  /** Defines the hierarchical level of an element within a structure. */
  'aria-level'?: number | undefined
  /** Indicates that an element will be updated, and describes the types of updates the user agents, assistive technologies, and user can expect from the live region. */
  'aria-live'?: 'off' | 'assertive' | 'polite' | undefined
  /** Indicates whether an element is modal when displayed. */
  'aria-modal'?: Booleanish | undefined
  /** Indicates whether a text box accepts multiple lines of input or only a single line. */
  'aria-multiline'?: Booleanish | undefined
  /** Indicates that the user may select more than one item from the current selectable descendants. */
  'aria-multiselectable'?: Booleanish | undefined
  /** Indicates whether the element's orientation is horizontal, vertical, or unknown/ambiguous. */
  'aria-orientation'?: 'horizontal' | 'vertical' | undefined
  /**
   * Identifies an element (or elements) in order to define a visual, functional, or contextual parent/child relationship
   * between DOM elements where the DOM hierarchy cannot be used to represent the relationship.
   * @see aria-controls.
   */
  'aria-owns'?: string | undefined
  /**
   * Defines a short hint (a word or short phrase) intended to aid the user with data entry when the control has no value.
   * A hint could be a sample value or a brief description of the expected format.
   */
  'aria-placeholder'?: string | undefined
  /**
   * Defines an element's number or position in the current set of listitems or treeitems. Not required if all elements in the set are present in the DOM.
   * @see aria-setsize.
   */
  'aria-posinset'?: number | undefined
  /**
   * Indicates the current "pressed" state of toggle buttons.
   * @see aria-checked @see aria-selected.
   */
  'aria-pressed'?: boolean | 'false' | 'mixed' | 'true' | undefined
  /**
   * Indicates that the element is not editable, but is otherwise operable.
   * @see aria-disabled.
   */
  'aria-readonly'?: Booleanish | undefined
  /**
   * Indicates what notifications the user agent will trigger when the accessibility tree within a live region is modified.
   * @see aria-atomic.
   */
  'aria-relevant'?:
    | 'additions'
    | 'additions removals'
    | 'additions text'
    | 'all'
    | 'removals'
    | 'removals additions'
    | 'removals text'
    | 'text'
    | 'text additions'
    | 'text removals'
    | undefined
  /** Indicates that user input is required on the element before a form may be submitted. */
  'aria-required'?: Booleanish | undefined
  /** Defines a human-readable, author-localized description for the role of an element. */
  'aria-roledescription'?: string | undefined
  /**
   * Defines the total number of rows in a table, grid, or treegrid.
   * @see aria-rowindex.
   */
  'aria-rowcount'?: number | undefined
  /**
   * Defines an element's row index or position with respect to the total number of rows within a table, grid, or treegrid.
   * @see aria-rowcount @see aria-rowspan.
   */
  'aria-rowindex'?: number | undefined
  /**
   * Defines a human readable text alternative of aria-rowindex.
   * @see aria-colindextext.
   */
  'aria-rowindextext'?: string | undefined
  /**
   * Defines the number of rows spanned by a cell or gridcell within a table, grid, or treegrid.
   * @see aria-rowindex @see aria-colspan.
   */
  'aria-rowspan'?: number | undefined
  /**
   * Indicates the current "selected" state of various widgets.
   * @see aria-checked @see aria-pressed.
   */
  'aria-selected'?: Booleanish | undefined
  /**
   * Defines the number of items in the current set of listitems or treeitems. Not required if all elements in the set are present in the DOM.
   * @see aria-posinset.
   */
  'aria-setsize'?: number | undefined
  /** Indicates if items in a table or grid are sorted in ascending or descending order. */
  'aria-sort'?: 'none' | 'ascending' | 'descending' | 'other' | undefined
  /** Defines the maximum allowed value for a range widget. */
  'aria-valuemax'?: number | undefined
  /** Defines the minimum allowed value for a range widget. */
  'aria-valuemin'?: number | undefined
  /**
   * Defines the current value for a range widget.
   * @see aria-valuetext.
   */
  'aria-valuenow'?: number | undefined
  /** Defines the human readable text alternative of aria-valuenow for a range widget. */
  'aria-valuetext'?: string | undefined
}

/**
 * CSS 样式规则类型
 */
export type CSSProperties = {
  [K in keyof Properties]: Properties[K]
} & {
  [key: `--${string}`]: string | 0
}

interface GlobalAttributed {
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
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Global_attributes/class MDN
   */
  class?: ClassProperties | undefined
  /**
   * 使用 className 必须启用编译器的 `classNameTransformClass` 选项。
   */
  className?: ClassProperties | undefined
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
  style?: string | CSSProperties | undefined
  /**
   * accesskey 全局属性 提供了为当前元素生成快捷键的方式。
   *
   * 属性值必须包含一个可打印字符。
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Global_attributes/accesskey MDN
   */
  accessKey?: string | undefined
  /**
   * 全局属性 `anchor` 定义锚点。
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Global_attributes/anchor MDN
   */
  anchor?: string | undefined
  /**
   * 全局属性 `autocapitalize` 定义输入字段中输入文本的首字母是否大写。
   * 默认情况下，浏览器会根据当前语言环境自动将首字母大写。
   */
  autocapitalize?:
    | 'off'
    | 'none'
    | 'on'
    | 'sentences'
    | 'words'
    | 'characters'
    | (string & {})
    | undefined
  /**
   * 全局属性 `autofocus` 定义元素是否应该自动获得焦点。
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Global_attributes/autofocus MDN
   */
  autofocus?: boolean | undefined
  /**
   * 全局属性 `contenteditable` 定义元素是否应该可编辑。
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Global_attributes/contenteditable MDN
   */
  contentEditable?: Booleanish | 'plaintext-only' | undefined
  /**
   * 全局属性 `dir` 定义元素文本的方向。
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Global_attributes/dir MDN
   */
  dir?: 'auto' | 'ltr' | 'rtl' | undefined
  /**
   * 全局属性 `draggable` 定义元素是否可以拖动。
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Global_attributes/draggable MDN
   */
  draggable?: Booleanish | undefined
  /**
   * 全局属性 `enterkeyhint` 定义在 `<input>` 元素中，当用户按下回车键时，浏览器应执行的操作。
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Global_attributes/enterkeyhint MDN
   */
  enterKeyHint?: 'enter' | 'done' | 'go' | 'next' | 'previous' | 'search' | 'send' | undefined
  /**
   * 全局属性 `hidden` 定义元素是否应该被隐藏。
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Global_attributes/hidden MDN
   */
  hidden?: boolean | 'hidden' | 'until-found' | '' | undefined
  /**
   * 全局属性 `id` 定义元素的唯一标识符。
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Global_attributes/id MDN
   */
  id?: string | undefined
  /**
   * 全局属性 `inert` 定义元素是否应该被禁用。
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Global_attributes/inert MDN
   */
  inert?: boolean | undefined
  /**
   * 全局属性 `inputMode` 定义元素应该如何获取焦点并显示键盘。
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Global_attributes/inputmode MDN
   */
  inputMode?:
    | 'none'
    | 'text'
    | 'decimal'
    | 'numeric'
    | 'tel'
    | 'search'
    | 'email'
    | 'url'
    | undefined
  /**
   * 全局属性 `is` 定义元素的自定义元素名称。
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Global_attributes/is MDN
   */
  is?: string | undefined
  /**
   * 全局属性 `itemid` 定义元素的标识符。
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Global_attributes/itemid MDN
   */
  itemId?: string
  itemid?: string
  /**
   * 全局属性 `itemprop` 定义元素的属性。
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Global_attributes/itemprop MDN
   */
  itemProp?: string
  itemprop?: string
  /**
   * 全局属性 `itemref` 定义元素的属性。
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Global_attributes/itemref MDN
   */
  itemRef?: string
  itemref?: string
  /**
   * 全局属性 `itemscope` 定义元素的作用域。
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Global_attributes/itemscope MDN
   */
  itemScope?: string
  itemscope?: string
  /**
   * 全局属性 `itemtype` 定义元素的类型。
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Global_attributes/itemtype MDN
   */
  itemType?: string
  itemtype?: string
  /**
   * 全局属性 `lang` 定义元素的语言。
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Global_attributes/lang MDN
   */
  lang?: string | undefined
  /**
   * 全局属性 `nonce` 是定义密码学 nonce（"只使用一次的数字"）的内容属性，
   * 内容安全策略可以使用它来确定是否允许对给定元素进行获取。
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Global_attributes/nonce MDN
   */
  nonce?: string | undefined
  /**
   * 全局属性 `part` 包含一个以元素中 part 属性名称组成的列表，该列表以空格分隔。
   * 通过 Part 的名称，可以使用 CSS 伪元素"::part"来选择 shadow 树中指定元素并设置其样式。
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Global_attributes/part MDN
   */
  part?: string | undefined
  /**
   * 全局属性 `popover` 将元素做为一个弹出窗口。
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Global_attributes/popover MDN
   */
  popover?: 'auto' | 'manual' | undefined
  /**
   * 全局属性 `slot` 定义元素的插槽名称。
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Global_attributes/slot MDN
   */
  slot?: string | undefined
  /**
   * 全局属性 `spellcheck` 定义元素是否应该被检查拼写。
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Global_attributes/spellcheck MDN
   */
  spellcheck?: Booleanish | '' | undefined
  /**
   * 全局属性 `tabindex` 定义元素在文档中的访问顺序。
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Global_attributes/tabindex MDN
   */
  tabIndex?: string | number | undefined
  /**
   * 全局属性 `title` 定义元素的标题。
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Global_attributes/title MDN
   */
  title?: string | undefined
  /**
   * 全局属性 `translate` 定义元素是否应该被翻译。
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Global_attributes/translate MDN
   */
  translate?: 'yes' | 'no' | undefined
  /**
   * 全局属性 `virtualkeyboardpolicy` 定义虚拟键盘的显示策略。
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Global_attributes/virtualkeyboardpolicy MDN
   */
  virtualkeyboardpolicy?: 'auto' | 'manual' | undefined
  /**
   * 全局属性 `writingsuggestions` 定义是否显示自动完成建议。
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Global_attributes/writingsuggestions MDN
   */
  writingsuggestions?: Booleanish | undefined
  /**
   * 全局属性 `exportparts` 定义元素可以导出的 CSS 样式部分。
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Global_attributes/exportparts MDN
   */
  exportparts?: string | undefined
  /**
   * 全局属性 `role` 定义元素的角色 - WAI-ARIA。
   */
  role?: AriaRole | null | undefined
  /**
   * autocorrect 全局属性是一种枚举属性，控制是否针对拼写和/或标点符号错误启用可编辑文本的自动更正特性。
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Global_attributes/autocorrect MDN
   */
  autocorrect?: string | undefined

  /**
   * 全局属性 `data-*` 定义元素的自定义数据属性。
   */
  [name: `data-${string}`]: string | number | undefined
}

interface DOMAttributed<T> extends GlobalEventAttributes<T> {
  children?: RenderChildren
}

interface VitarxRuntimeAttributes<T> {
  ref?: InstanceRef<T>
}

/**
 * 全局属性
 */
export interface HTMLAttributes<T>
  extends GlobalAttributed, AriaAttributes, DOMAttributed<T>, VitarxRuntimeAttributes<T> {
  // Standard HTML Attributes
  autoCapitalize?:
    | 'off'
    | 'none'
    | 'on'
    | 'sentences'
    | 'words'
    | 'characters'
    | undefined
    | (string & {})
  autoFocus?: boolean | undefined
  contextMenu?: string | undefined
  spellCheck?: Booleanish | undefined

  // Unknown
  radioGroup?: string | undefined // <command>, <menuitem>

  // RDFa Attributes
  about?: string | undefined
  content?: string | undefined
  datatype?: string | undefined
  inlist?: any
  prefix?: string | undefined
  property?: string | undefined
  rel?: string | undefined
  resource?: string | undefined
  rev?: string | undefined
  typeof?: string | undefined
  vocab?: string | undefined

  // Non-standard Attributes
  autoCorrect?: string | undefined
  autoSave?: string | undefined
  color?: string | undefined
  itemID?: string | undefined
  results?: number | undefined
  security?: string | undefined
  unselectable?: 'on' | 'off' | undefined
}

export interface SVGAttributes<T> extends HTMLAttributes<T> {
  max?: number | string | undefined
  media?: string | undefined
  method?: string | undefined
  min?: number | string | undefined
  name?: string | undefined
  target?: string | undefined
  type?: string | undefined
  width?: number | string | undefined
  height?: number | string | undefined

  // Other HTML properties supported by SVG elements in browsers
  crossOrigin?: CrossOrigin

  // SVG Specific attributes
  color?: string | undefined
  accentHeight?: number | string | undefined
  accumulate?: 'none' | 'sum' | undefined
  additive?: 'replace' | 'sum' | undefined
  alignmentBaseline?:
    | 'auto'
    | 'baseline'
    | 'before-edge'
    | 'text-before-edge'
    | 'middle'
    | 'central'
    | 'after-edge'
    | 'text-after-edge'
    | 'ideographic'
    | 'alphabetic'
    | 'hanging'
    | 'mathematical'
    | 'inherit'
    | undefined
  allowReorder?: 'no' | 'yes' | undefined
  alphabetic?: number | string | undefined
  amplitude?: number | string | undefined
  arabicForm?: 'initial' | 'medial' | 'terminal' | 'isolated' | undefined
  ascent?: number | string | undefined
  attributeName?: string | undefined
  attributeType?: string | undefined
  autoReverse?: Booleanish | undefined
  azimuth?: number | string | undefined
  baseFrequency?: number | string | undefined
  baselineShift?: number | string | undefined
  baseProfile?: number | string | undefined
  bbox?: number | string | undefined
  begin?: number | string | undefined
  bias?: number | string | undefined
  by?: number | string | undefined
  calcMode?: number | string | undefined
  capHeight?: number | string | undefined
  clip?: number | string | undefined
  clipPath?: string | undefined
  clipPathUnits?: number | string | undefined
  clipRule?: number | string | undefined
  colorInterpolation?: number | string | undefined
  colorInterpolationFilters?: 'auto' | 'sRGB' | 'linearRGB' | 'inherit' | undefined
  colorProfile?: number | string | undefined
  colorRendering?: number | string | undefined
  contentScriptType?: number | string | undefined
  contentStyleType?: number | string | undefined
  cursor?: number | string | undefined
  cx?: number | string | undefined
  cy?: number | string | undefined
  d?: string | undefined
  decelerate?: number | string | undefined
  descent?: number | string | undefined
  diffuseConstant?: number | string | undefined
  direction?: number | string | undefined
  display?: number | string | undefined
  divisor?: number | string | undefined
  dominantBaseline?: number | string | undefined
  dur?: number | string | undefined
  dx?: number | string | undefined
  dy?: number | string | undefined
  edgeMode?: number | string | undefined
  elevation?: number | string | undefined
  enableBackground?: number | string | undefined
  end?: number | string | undefined
  exponent?: number | string | undefined
  externalResourcesRequired?: Booleanish | undefined
  fill?: string | undefined
  fillOpacity?: number | string | undefined
  fillRule?: 'nonzero' | 'evenodd' | 'inherit' | undefined
  filter?: string | undefined
  filterRes?: number | string | undefined
  filterUnits?: number | string | undefined
  floodColor?: number | string | undefined
  floodOpacity?: number | string | undefined
  focusable?: Booleanish | 'auto' | undefined
  fontFamily?: string | undefined
  fontSize?: number | string | undefined
  fontSizeAdjust?: number | string | undefined
  fontStretch?: number | string | undefined
  fontStyle?: number | string | undefined
  fontVariant?: number | string | undefined
  fontWeight?: number | string | undefined
  format?: number | string | undefined
  fr?: number | string | undefined
  from?: number | string | undefined
  fx?: number | string | undefined
  fy?: number | string | undefined
  g1?: number | string | undefined
  g2?: number | string | undefined
  glyphName?: number | string | undefined
  glyphOrientationHorizontal?: number | string | undefined
  glyphOrientationVertical?: number | string | undefined
  glyphRef?: number | string | undefined
  gradientTransform?: string | undefined
  gradientUnits?: string | undefined
  hanging?: number | string | undefined
  horizAdvX?: number | string | undefined
  horizOriginX?: number | string | undefined
  href?: string | undefined
  ideographic?: number | string | undefined
  imageRendering?: number | string | undefined
  in2?: number | string | undefined
  in?: string | undefined
  intercept?: number | string | undefined
  k1?: number | string | undefined
  k2?: number | string | undefined
  k3?: number | string | undefined
  k4?: number | string | undefined
  k?: number | string | undefined
  kernelMatrix?: number | string | undefined
  kernelUnitLength?: number | string | undefined
  kerning?: number | string | undefined
  keyPoints?: number | string | undefined
  keySplines?: number | string | undefined
  keyTimes?: number | string | undefined
  lengthAdjust?: number | string | undefined
  letterSpacing?: number | string | undefined
  lightingColor?: number | string | undefined
  limitingConeAngle?: number | string | undefined
  local?: number | string | undefined
  markerEnd?: string | undefined
  markerHeight?: number | string | undefined
  markerMid?: string | undefined
  markerStart?: string | undefined
  markerUnits?: number | string | undefined
  markerWidth?: number | string | undefined
  mask?: string | undefined
  maskContentUnits?: number | string | undefined
  maskUnits?: number | string | undefined
  mathematical?: number | string | undefined
  mode?: number | string | undefined
  numOctaves?: number | string | undefined
  offset?: number | string | undefined
  opacity?: number | string | undefined
  operator?: number | string | undefined
  order?: number | string | undefined
  orient?: number | string | undefined
  orientation?: number | string | undefined
  origin?: number | string | undefined
  overflow?: number | string | undefined
  overlinePosition?: number | string | undefined
  overlineThickness?: number | string | undefined
  paintOrder?: number | string | undefined
  panose1?: number | string | undefined
  path?: string | undefined
  pathLength?: number | string | undefined
  patternContentUnits?: string | undefined
  patternTransform?: number | string | undefined
  patternUnits?: string | undefined
  pointerEvents?: number | string | undefined
  points?: string | undefined
  pointsAtX?: number | string | undefined
  pointsAtY?: number | string | undefined
  pointsAtZ?: number | string | undefined
  preserveAlpha?: Booleanish | undefined
  preserveAspectRatio?: string | undefined
  primitiveUnits?: number | string | undefined
  r?: number | string | undefined
  radius?: number | string | undefined
  refX?: number | string | undefined
  refY?: number | string | undefined
  renderingIntent?: number | string | undefined
  repeatCount?: number | string | undefined
  repeatDur?: number | string | undefined
  requiredExtensions?: number | string | undefined
  requiredFeatures?: number | string | undefined
  restart?: number | string | undefined
  result?: string | undefined
  rotate?: number | string | undefined
  rx?: number | string | undefined
  ry?: number | string | undefined
  scale?: number | string | undefined
  seed?: number | string | undefined
  shapeRendering?: number | string | undefined
  slope?: number | string | undefined
  spacing?: number | string | undefined
  specularConstant?: number | string | undefined
  specularExponent?: number | string | undefined
  speed?: number | string | undefined
  spreadMethod?: string | undefined
  startOffset?: number | string | undefined
  stdDeviation?: number | string | undefined
  stemh?: number | string | undefined
  stemv?: number | string | undefined
  stitchTiles?: number | string | undefined
  stopColor?: string | undefined
  stopOpacity?: number | string | undefined
  strikethroughPosition?: number | string | undefined
  strikethroughThickness?: number | string | undefined
  string?: number | string | undefined
  stroke?: string | undefined
  strokeDasharray?: string | number | undefined
  strokeDashoffset?: string | number | undefined
  strokeLinecap?: 'butt' | 'round' | 'square' | 'inherit' | undefined
  strokeLinejoin?: 'miter' | 'round' | 'bevel' | 'inherit' | undefined
  strokeMiterlimit?: number | string | undefined
  strokeOpacity?: number | string | undefined
  strokeWidth?: number | string | undefined
  surfaceScale?: number | string | undefined
  systemLanguage?: number | string | undefined
  tableValues?: number | string | undefined
  targetX?: number | string | undefined
  targetY?: number | string | undefined
  textAnchor?: string | undefined
  textDecoration?: number | string | undefined
  textLength?: number | string | undefined
  textRendering?: number | string | undefined
  to?: number | string | undefined
  transform?: string | undefined
  u1?: number | string | undefined
  u2?: number | string | undefined
  underlinePosition?: number | string | undefined
  underlineThickness?: number | string | undefined
  unicode?: number | string | undefined
  unicodeBidi?: number | string | undefined
  unicodeRange?: number | string | undefined
  unitsPerEm?: number | string | undefined
  vAlphabetic?: number | string | undefined
  values?: string | undefined
  vectorEffect?: number | string | undefined
  version?: string | undefined
  vertAdvY?: number | string | undefined
  vertOriginX?: number | string | undefined
  vertOriginY?: number | string | undefined
  vHanging?: number | string | undefined
  vIdeographic?: number | string | undefined
  viewBox?: string | undefined
  viewTarget?: number | string | undefined
  visibility?: number | string | undefined
  vMathematical?: number | string | undefined
  widths?: number | string | undefined
  wordSpacing?: number | string | undefined
  writingMode?: number | string | undefined
  x1?: number | string | undefined
  x2?: number | string | undefined
  x?: number | string | undefined
  xChannelSelector?: string | undefined
  xHeight?: number | string | undefined
  xlinkActuate?: string | undefined
  xlinkArcrole?: string | undefined
  xlinkHref?: string | undefined
  xlinkRole?: string | undefined
  xlinkShow?: string | undefined
  xlinkTitle?: string | undefined
  xlinkType?: string | undefined
  xmlBase?: string | undefined
  xmlLang?: string | undefined
  xmlns?: string | undefined
  xmlnsXlink?: string | undefined
  xmlSpace?: string | undefined
  y1?: number | string | undefined
  y2?: number | string | undefined
  y?: number | string | undefined
  yChannelSelector?: string | undefined
  z?: number | string | undefined
  zoomAndPan?: string | undefined
}

export interface WebViewHTMLAttributes<T> extends HTMLAttributes<T> {
  allowFullScreen?: boolean | undefined
  allowpopups?: boolean | undefined
  autosize?: boolean | undefined
  blinkfeatures?: string | undefined
  disableblinkfeatures?: string | undefined
  disableguestresize?: boolean | undefined
  disablewebsecurity?: boolean | undefined
  guestinstance?: string | undefined
  httpreferrer?: string | undefined
  nodeintegration?: boolean | undefined
  partition?: string | undefined
  plugins?: boolean | undefined
  preload?: string | undefined
  src?: string | undefined
  useragent?: string | undefined
  webpreferences?: string | undefined
}

export interface AnchorHTMLAttributes<T> extends HTMLAttributes<T> {
  download?: any
  href?: string | undefined
  hrefLang?: string | undefined
  media?: string | undefined
  ping?: string | undefined
  target?: '_self' | '_blank' | '_parent' | '_top' | '_unfencedTop' | (string & {}) | undefined
  type?: string | undefined
  referrerPolicy?: HTMLAttributeReferrerPolicy | undefined
}

export interface AreaHTMLAttributes<T> extends HTMLAttributes<T> {
  alt?: string | undefined
  coords?: string | undefined
  download?: any
  href?: string | undefined
  hrefLang?: string | undefined
  media?: string | undefined
  referrerPolicy?: HTMLAttributeReferrerPolicy | undefined
  shape?: string | undefined
  target?: string | undefined
}

export interface AudioHTMLAttributes<T> extends MediaHTMLAttributes<T> {}

export interface BaseHTMLAttributes<T> extends HTMLAttributes<T> {
  href?: string | undefined
  target?: string | undefined
}

export interface BlockquoteHTMLAttributes<T> extends HTMLAttributes<T> {
  cite?: string | undefined
}

export interface ButtonHTMLAttributes<T> extends HTMLAttributes<T> {
  disabled?: boolean | undefined
  form?: string | undefined
  formAction?: string | undefined
  formEncType?: string | undefined
  formMethod?: string | undefined
  formNoValidate?: boolean | undefined
  formTarget?: string | undefined
  name?: string | undefined
  type?: 'submit' | 'reset' | 'button' | undefined
  value?: string | number | undefined
}

export interface CanvasHTMLAttributes<T> extends HTMLAttributes<T> {
  height?: number | string | undefined
  width?: number | string | undefined
}

export interface ColHTMLAttributes<T> extends HTMLAttributes<T> {
  span?: number | undefined
  width?: number | string | undefined
}

export interface ColgroupHTMLAttributes<T> extends HTMLAttributes<T> {
  span?: number | undefined
}

export interface DataHTMLAttributes<T> extends HTMLAttributes<T> {
  value?: string | number | undefined
}

export interface DetailsHTMLAttributes<T>
  extends HTMLAttributes<T>, WithEventAttributes<'onToggle', T> {
  open?: boolean | undefined
  name?: string | undefined
}

export interface DelHTMLAttributes<T> extends HTMLAttributes<T> {
  cite?: string | undefined
  dateTime?: string | undefined
}

export interface DialogHTMLAttributes<T>
  extends HTMLAttributes<T>, WithEventAttributes<'onToggle' | 'onCancel' | 'onClose', T> {
  open?: boolean | undefined
}

export interface EmbedHTMLAttributes<T> extends HTMLAttributes<T> {
  height?: number | string | undefined
  src?: string | undefined
  type?: string | undefined
  width?: number | string | undefined
}

export interface FieldsetHTMLAttributes<T> extends HTMLAttributes<T> {
  disabled?: boolean | undefined
  form?: string | undefined
  name?: string | undefined
}

export interface FormHTMLAttributes<T> extends HTMLAttributes<T> {
  acceptCharset?: string | undefined
  action?: string | undefined
  autoComplete?: string | undefined
  encType?: string | undefined
  method?: string | undefined
  name?: string | undefined
  noValidate?: boolean | undefined
  target?: string | undefined
}

export interface HtmlHTMLAttributes<T> extends HTMLAttributes<T> {
  manifest?: string | undefined
}

export interface IframeHTMLAttributes<T> extends HTMLAttributes<T> {
  allow?: string | undefined
  allowFullScreen?: boolean | undefined
  allowTransparency?: boolean | undefined
  /** @deprecated */
  frameBorder?: number | string | undefined
  height?: number | string | undefined
  loading?: 'eager' | 'lazy' | undefined
  /** @deprecated */
  marginHeight?: number | undefined
  /** @deprecated */
  marginWidth?: number | undefined
  name?: string | undefined
  referrerPolicy?: HTMLAttributeReferrerPolicy | undefined
  sandbox?: string | undefined
  /** @deprecated */
  scrolling?: string | undefined
  seamless?: boolean | undefined
  src?: string | undefined
  srcDoc?: string | undefined
  width?: number | string | undefined
}

export interface ImgHTMLAttributes<T> extends HTMLAttributes<T> {
  alt?: string | undefined
  crossOrigin?: CrossOrigin
  decoding?: 'async' | 'auto' | 'sync' | undefined
  fetchPriority?: 'high' | 'low' | 'auto'
  height?: number | string | undefined
  loading?: 'eager' | 'lazy' | undefined
  referrerPolicy?: HTMLAttributeReferrerPolicy | undefined
  sizes?: string | undefined
  src?: string | undefined
  srcSet?: string | undefined
  useMap?: string | undefined
  width?: number | string | undefined
}

export interface InsHTMLAttributes<T> extends HTMLAttributes<T> {
  cite?: string | undefined
  dateTime?: string | undefined
}

type HTMLInputTypeAttribute =
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
  | (string & {})

type AutoFillAddressKind = 'billing' | 'shipping'
type AutoFillBase = '' | 'off' | 'on'
type AutoFillContactField =
  | 'email'
  | 'tel'
  | 'tel-area-code'
  | 'tel-country-code'
  | 'tel-extension'
  | 'tel-local'
  | 'tel-local-prefix'
  | 'tel-local-suffix'
  | 'tel-national'
type AutoFillContactKind = 'home' | 'mobile' | 'work'
type AutoFillCredentialField = 'webauthn'
type AutoFillNormalField =
  | 'additional-name'
  | 'address-level1'
  | 'address-level2'
  | 'address-level3'
  | 'address-level4'
  | 'address-line1'
  | 'address-line2'
  | 'address-line3'
  | 'bday-day'
  | 'bday-month'
  | 'bday-year'
  | 'cc-csc'
  | 'cc-exp'
  | 'cc-exp-month'
  | 'cc-exp-year'
  | 'cc-family-name'
  | 'cc-given-name'
  | 'cc-name'
  | 'cc-number'
  | 'cc-type'
  | 'country'
  | 'country-name'
  | 'current-password'
  | 'family-name'
  | 'given-name'
  | 'honorific-prefix'
  | 'honorific-suffix'
  | 'name'
  | 'new-password'
  | 'one-time-code'
  | 'organization'
  | 'postal-code'
  | 'street-address'
  | 'transaction-amount'
  | 'transaction-currency'
  | 'username'
type OptionalPrefixToken<T extends string> = `${T} ` | ''
type OptionalPostfixToken<T extends string> = ` ${T}` | ''
type AutoFillField =
  | AutoFillNormalField
  | `${OptionalPrefixToken<AutoFillContactKind>}${AutoFillContactField}`
type AutoFillSection = `section-${string}`
type AutoFill =
  | AutoFillBase
  | `${OptionalPrefixToken<AutoFillSection>}${OptionalPrefixToken<AutoFillAddressKind>}${AutoFillField}${OptionalPostfixToken<AutoFillCredentialField>}`
type HTMLInputAutoCompleteAttribute = AutoFill | (string & {})

export interface InputHTMLAttributes<T>
  extends HTMLAttributes<T>, WithEventAttributes<'onChange', T> {
  accept?: string | undefined
  alt?: string | undefined
  autoComplete?: HTMLInputAutoCompleteAttribute | undefined
  capture?: boolean | 'user' | 'environment' | undefined // https://www.w3.org/TR/html-media-capture/#the-capture-attribute
  checked?: boolean | undefined
  disabled?: boolean | undefined
  form?: string | undefined
  formAction?: string | undefined
  formEncType?: string | undefined
  formMethod?: string | undefined
  formNoValidate?: boolean | undefined
  formTarget?: string | undefined
  height?: number | string | undefined
  list?: string | undefined
  max?: number | string | undefined
  maxLength?: number | undefined
  min?: number | string | undefined
  minLength?: number | undefined
  multiple?: boolean | undefined
  name?: string | undefined
  pattern?: string | undefined
  placeholder?: string | undefined
  readOnly?: boolean | undefined
  required?: boolean | undefined
  size?: number | undefined
  src?: string | undefined
  step?: number | string | undefined
  type?: HTMLInputTypeAttribute | undefined
  value?: string | number | undefined
  width?: number | string | undefined
}

export interface KeygenHTMLAttributes<T> extends HTMLAttributes<T> {
  challenge?: string | undefined
  disabled?: boolean | undefined
  form?: string | undefined
  keyType?: string | undefined
  keyParams?: string | undefined
  name?: string | undefined
}

export interface LabelHTMLAttributes<T> extends HTMLAttributes<T> {
  form?: string | undefined
  htmlFor?: string | undefined
}

export interface LiHTMLAttributes<T> extends HTMLAttributes<T> {
  value?: string | number | undefined
}

export interface LinkHTMLAttributes<T> extends HTMLAttributes<T> {
  as?: string | undefined
  crossOrigin?: CrossOrigin
  fetchPriority?: 'high' | 'low' | 'auto'
  href?: string | undefined
  hrefLang?: string | undefined
  integrity?: string | undefined
  media?: string | undefined
  imageSrcSet?: string | undefined
  imageSizes?: string | undefined
  referrerPolicy?: HTMLAttributeReferrerPolicy | undefined
  sizes?: string | undefined
  type?: string | undefined
  charSet?: string | undefined
}

export interface MapHTMLAttributes<T> extends HTMLAttributes<T> {
  name?: string | undefined
}

export interface MenuHTMLAttributes<T> extends HTMLAttributes<T> {
  type?: string | undefined
}

export interface MediaHTMLAttributes<T> extends HTMLAttributes<T> {
  autoPlay?: boolean | undefined
  controls?: boolean | undefined
  controlsList?: string | undefined
  crossOrigin?: CrossOrigin
  loop?: boolean | undefined
  mediaGroup?: string | undefined
  muted?: boolean | undefined
  playsInline?: boolean | undefined
  preload?: string | undefined
  src?: string | undefined
}

export interface MetaHTMLAttributes<T> extends HTMLAttributes<T> {
  charSet?: string | undefined
  content?: string | undefined
  httpEquiv?: string | undefined
  media?: string | undefined
  name?: string | undefined
}

export interface MeterHTMLAttributes<T> extends HTMLAttributes<T> {
  form?: string | undefined
  high?: number | undefined
  low?: number | undefined
  max?: number | string | undefined
  min?: number | string | undefined
  optimum?: number | undefined
  value?: string | number | undefined
}

export interface QuoteHTMLAttributes<T> extends HTMLAttributes<T> {
  cite?: string | undefined
}

export interface ObjectHTMLAttributes<T> extends HTMLAttributes<T> {
  classID?: string | undefined
  data?: string | undefined
  form?: string | undefined
  height?: number | string | undefined
  name?: string | undefined
  type?: string | undefined
  useMap?: string | undefined
  width?: number | string | undefined
  wmode?: string | undefined
}

export interface OlHTMLAttributes<T> extends HTMLAttributes<T> {
  reversed?: boolean | undefined
  start?: number | undefined
  type?: '1' | 'a' | 'A' | 'i' | 'I' | undefined
}

export interface OptgroupHTMLAttributes<T> extends HTMLAttributes<T> {
  disabled?: boolean | undefined
  label?: string | undefined
}

export interface OptionHTMLAttributes<T> extends HTMLAttributes<T> {
  disabled?: boolean | undefined
  label?: string | undefined
  selected?: boolean | undefined
  value?: string | number | undefined
}

export interface OutputHTMLAttributes<T> extends HTMLAttributes<T> {
  form?: string | undefined
  htmlFor?: string | undefined
  name?: string | undefined
}

export interface ParamHTMLAttributes<T> extends HTMLAttributes<T> {
  name?: string | undefined
  value?: string | number | undefined
}

export interface ProgressHTMLAttributes<T> extends HTMLAttributes<T> {
  max?: number | string | undefined
  value?: string | number | undefined
}

export interface SlotHTMLAttributes<T> extends HTMLAttributes<T> {
  name?: string | undefined
}

export interface ScriptHTMLAttributes<T> extends HTMLAttributes<T> {
  async?: boolean | undefined
  /** @deprecated */
  charSet?: string | undefined
  crossOrigin?: CrossOrigin
  defer?: boolean | undefined
  integrity?: string | undefined
  noModule?: boolean | undefined
  referrerPolicy?: HTMLAttributeReferrerPolicy | undefined
  src?: string | undefined
  type?: string | undefined
}

export interface SelectHTMLAttributes<T>
  extends HTMLAttributes<T>, WithEventAttributes<'onChange', T> {
  autoComplete?: string | undefined
  disabled?: boolean | undefined
  form?: string | undefined
  multiple?: boolean | undefined
  name?: string | undefined
  required?: boolean | undefined
  size?: number | undefined
}

export interface SourceHTMLAttributes<T> extends HTMLAttributes<T> {
  height?: number | string | undefined
  media?: string | undefined
  sizes?: string | undefined
  src?: string | undefined
  srcSet?: string | undefined
  type?: string | undefined
  width?: number | string | undefined
}

export interface StyleHTMLAttributes<T> extends HTMLAttributes<T> {
  media?: string | undefined
  scoped?: boolean | undefined
  type?: string | undefined
}

export interface TableHTMLAttributes<T> extends HTMLAttributes<T> {
  align?: 'left' | 'center' | 'right' | undefined
  bgcolor?: string | undefined
  border?: number | undefined
  cellPadding?: number | string | undefined
  cellSpacing?: number | string | undefined
  frame?: boolean | undefined
  rules?: 'none' | 'groups' | 'rows' | 'columns' | 'all' | undefined
  summary?: string | undefined
  width?: number | string | undefined
}

export interface TextareaHTMLAttributes<T> extends HTMLAttributes<T> {
  autoComplete?: string | undefined
  cols?: number | undefined
  dirName?: string | undefined
  disabled?: boolean | undefined
  form?: string | undefined
  maxLength?: number | undefined
  minLength?: number | undefined
  name?: string | undefined
  placeholder?: string | undefined
  readOnly?: boolean | undefined
  required?: boolean | undefined
  rows?: number | undefined
  value?: string | number | undefined
  wrap?: string | undefined

  onChange?: VitarxEventHandler<T> | undefined
}

export interface TdHTMLAttributes<T> extends HTMLAttributes<T> {
  align?: 'left' | 'center' | 'right' | 'justify' | 'char' | undefined
  colSpan?: number | undefined
  headers?: string | undefined
  rowSpan?: number | undefined
  scope?: string | undefined
  abbr?: string | undefined
  height?: number | string | undefined
  width?: number | string | undefined
  valign?: 'top' | 'middle' | 'bottom' | 'baseline' | undefined
}

export interface ThHTMLAttributes<T> extends HTMLAttributes<T> {
  align?: 'left' | 'center' | 'right' | 'justify' | 'char' | undefined
  colSpan?: number | undefined
  headers?: string | undefined
  rowSpan?: number | undefined
  scope?: string | undefined
  abbr?: string | undefined
}

export interface TimeHTMLAttributes<T> extends HTMLAttributes<T> {
  dateTime?: string | undefined
}

export interface TrackHTMLAttributes<T> extends HTMLAttributes<T> {
  default?: boolean | undefined
  kind?: string | undefined
  label?: string | undefined
  src?: string | undefined
  srcLang?: string | undefined
}

export interface VideoHTMLAttributes<T> extends MediaHTMLAttributes<T> {
  height?: number | string | undefined
  playsInline?: boolean | undefined
  poster?: string | undefined
  width?: number | string | undefined
  disablePictureInPicture?: boolean | undefined
  disableRemotePlayback?: boolean | undefined
}

export interface MathMLElementAttributes<T> extends HTMLAttributes<T> {}

export interface MathElementAttributes<T> extends HTMLAttributes<T> {
  display?: 'block' | 'normal' | 'inline' | 'compact' | undefined
}

export interface AnnotationXmlAttributes<T> extends MathMLElementAttributes<T> {
  encoding?: string | undefined
}
