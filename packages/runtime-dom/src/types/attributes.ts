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
  /**
   * 标识当 DOM 焦点位于复合组件、文本框、组或应用程序上时，当前活动的元素
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/Accessibility/ARIA/Attributes/aria-activedescendant MDN
   */
  'aria-activedescendant'?: string | undefined
  /**
   * 指示辅助技术是基于 aria-relevant 属性定义的更改通知，呈现更改区域的全部内容还是仅呈现部分内容
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/Accessibility/ARIA/Attributes/aria-atomic MDN
   */
  'aria-atomic'?: Booleanish | undefined
  /**
   * 指示输入文本是否会触发显示用户预期值的一个或多个预测，并指定如果做出预测将如何呈现
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/Accessibility/ARIA/Attributes/aria-autocomplete MDN
   */
  'aria-autocomplete'?: 'none' | 'inline' | 'list' | 'both' | undefined
  /**
   * 定义一个字符串值，用于标记当前元素，该值旨在转换为盲文
   * @see aria-label
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/Accessibility/ARIA/Attributes/aria-braillelabel MDN
   */
  'aria-braillelabel'?: string | undefined
  /**
   * 定义元素角色的简短、作者本地化的描述，该描述旨在转换为盲文
   * @see aria-roledescription
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/Accessibility/ARIA/Attributes/aria-brailleroledescription MDN
   */
  'aria-brailleroledescription'?: string | undefined
  /**
   * 指示元素正在被修改，辅助技术可以在修改完成后再向用户展示更改
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/Accessibility/ARIA/Attributes/aria-busy MDN
   */
  'aria-busy'?: Booleanish | undefined
  /**
   * 指示复选框、单选按钮和其他组件的当前"选中"状态
   * @see aria-pressed @see aria-selected
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/Accessibility/ARIA/Attributes/aria-checked MDN
   */
  'aria-checked'?: boolean | 'false' | 'mixed' | 'true' | undefined
  /**
   * 定义表格、网格或树网格中的总列数
   * @see aria-colindex
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/Accessibility/ARIA/Attributes/aria-colcount MDN
   */
  'aria-colcount'?: number | undefined
  /**
   * 定义元素相对于表格、网格或树网格中总列数的列索引或位置
   * @see aria-colcount @see aria-colspan
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/Accessibility/ARIA/Attributes/aria-colindex MDN
   */
  'aria-colindex'?: number | undefined
  /**
   * 定义 aria-colindex 的人类可读文本替代
   * @see aria-rowindextext
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/Accessibility/ARIA/Attributes/aria-colindextext MDN
   */
  'aria-colindextext'?: string | undefined
  /**
   * 定义表格、网格或树网格中单元格或网格单元格所跨的列数
   * @see aria-colindex @see aria-rowspan
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/Accessibility/ARIA/Attributes/aria-colspan MDN
   */
  'aria-colspan'?: number | undefined
  /**
   * 标识其内容或存在受当前元素控制的元素
   * @see aria-owns
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/Accessibility/ARIA/Attributes/aria-controls MDN
   */
  'aria-controls'?: string | undefined
  /**
   * 指示容器或相关元素集合中表示当前项的元素
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/Accessibility/ARIA/Attributes/aria-current MDN
   */
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
   * 标识描述对象的元素
   * @see aria-labelledby
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/Accessibility/ARIA/Attributes/aria-describedby MDN
   */
  'aria-describedby'?: string | undefined
  /**
   * 定义描述或注释当前元素的字符串值
   * @see related aria-describedby
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/Accessibility/ARIA/Attributes/aria-description MDN
   */
  'aria-description'?: string | undefined
  /**
   * 标识为对象提供详细扩展描述的元素
   * @see aria-describedby
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/Accessibility/ARIA/Attributes/aria-details MDN
   */
  'aria-details'?: string | undefined
  /**
   * 指示元素可感知但已禁用，因此不可编辑或不可操作
   * @see aria-hidden @see aria-readonly
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/Accessibility/ARIA/Attributes/aria-disabled MDN
   */
  'aria-disabled'?: Booleanish | undefined
  /**
   * 指示当拖拽对象释放在放置目标上时可以执行的功能
   * @deprecated in ARIA 1.1
   */
  'aria-dropeffect'?: 'none' | 'copy' | 'execute' | 'link' | 'move' | 'popup' | undefined
  /**
   * 标识为对象提供错误消息的元素
   * @see aria-invalid @see aria-describedby
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/Accessibility/ARIA/Attributes/aria-errormessage MDN
   */
  'aria-errormessage'?: string | undefined
  /**
   * 指示元素或其控制的分组元素当前是展开还是折叠状态
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/Accessibility/ARIA/Attributes/aria-expanded MDN
   */
  'aria-expanded'?: Booleanish | undefined
  /**
   * 标识替代阅读顺序中的下一个元素，允许辅助技术覆盖默认的文档源顺序阅读
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/Accessibility/ARIA/Attributes/aria-flowto MDN
   */
  'aria-flowto'?: string | undefined
  /**
   * 指示元素在拖放操作中的"被抓取"状态
   * @deprecated in ARIA 1.1
   */
  'aria-grabbed'?: Booleanish | undefined
  /**
   * 指示可由元素触发的交互式弹出元素（如菜单或对话框）的可用性和类型
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/Accessibility/ARIA/Attributes/aria-haspopup MDN
   */
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
   * 指示元素是否对无障碍 API 可见
   * @see aria-disabled
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/Accessibility/ARIA/Attributes/aria-hidden MDN
   */
  'aria-hidden'?: Booleanish | undefined
  /**
   * 指示输入的值不符合应用程序预期的格式
   * @see aria-errormessage
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/Accessibility/ARIA/Attributes/aria-invalid MDN
   */
  'aria-invalid'?: boolean | 'false' | 'true' | 'grammar' | 'spelling' | undefined
  /**
   * 指示作者实现的用于激活或聚焦元素的键盘快捷键
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/Accessibility/ARIA/Attributes/aria-keyshortcuts MDN
   */
  'aria-keyshortcuts'?: string | undefined
  /**
   * 定义标记当前元素的字符串值
   * @see aria-labelledby
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/Accessibility/ARIA/Attributes/aria-label MDN
   */
  'aria-label'?: string | undefined
  /**
   * 标识标记当前元素的元素
   * @see aria-describedby
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/Accessibility/ARIA/Attributes/aria-labelledby MDN
   */
  'aria-labelledby'?: string | undefined
  /**
   * 定义元素在结构中的层级
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/Accessibility/ARIA/Attributes/aria-level MDN
   */
  'aria-level'?: number | undefined
  /**
   * 指示元素将被更新，并描述用户代理、辅助技术和用户可以从实时区域期望的更新类型
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/Accessibility/ARIA/Attributes/aria-live MDN
   */
  'aria-live'?: 'off' | 'assertive' | 'polite' | undefined
  /**
   * 指示元素在显示时是否为模态
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/Accessibility/ARIA/Attributes/aria-modal MDN
   */
  'aria-modal'?: Booleanish | undefined
  /**
   * 指示文本框是接受多行输入还是仅接受单行输入
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/Accessibility/ARIA/Attributes/aria-multiline MDN
   */
  'aria-multiline'?: Booleanish | undefined
  /**
   * 指示用户可以从当前可选后代中选择多个项
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/Accessibility/ARIA/Attributes/aria-multiselectable MDN
   */
  'aria-multiselectable'?: Booleanish | undefined
  /**
   * 指示元素的方向是水平、垂直还是未知/不确定
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/Accessibility/ARIA/Attributes/aria-orientation MDN
   */
  'aria-orientation'?: 'horizontal' | 'vertical' | undefined
  /**
   * 标识一个元素以定义 DOM 元素之间的视觉、功能或上下文父子关系，当 DOM 层次结构无法表示该关系时使用
   * @see aria-controls
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/Accessibility/ARIA/Attributes/aria-owns MDN
   */
  'aria-owns'?: string | undefined
  /**
   * 定义一个简短提示（一个词或短语），旨在帮助用户在控件没有值时进行数据输入。
   * 提示可以是示例值或预期格式的简要描述
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/Accessibility/ARIA/Attributes/aria-placeholder MDN
   */
  'aria-placeholder'?: string | undefined
  /**
   * 定义元素在当前列表项或树项集合中的编号或位置。如果集合中的所有元素都存在于 DOM 中，则不需要
   * @see aria-setsize
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/Accessibility/ARIA/Attributes/aria-posinset MDN
   */
  'aria-posinset'?: number | undefined
  /**
   * 指示切换按钮的当前"按下"状态
   * @see aria-checked @see aria-selected
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/Accessibility/ARIA/Attributes/aria-pressed MDN
   */
  'aria-pressed'?: boolean | 'false' | 'mixed' | 'true' | undefined
  /**
   * 指示元素不可编辑，但其他方面可操作
   * @see aria-disabled
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/Accessibility/ARIA/Attributes/aria-readonly MDN
   */
  'aria-readonly'?: Booleanish | undefined
  /**
   * 指示当实时区域内的无障碍树被修改时，用户代理将触发的通知类型
   * @see aria-atomic
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/Accessibility/ARIA/Attributes/aria-relevant MDN
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
  /**
   * 指示在提交表单之前元素上需要用户输入
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/Accessibility/ARIA/Attributes/aria-required MDN
   */
  'aria-required'?: Booleanish | undefined
  /**
   * 定义元素角色的人类可读、作者本地化的描述
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/Accessibility/ARIA/Attributes/aria-roledescription MDN
   */
  'aria-roledescription'?: string | undefined
  /**
   * 定义表格、网格或树网格中的总行数
   * @see aria-rowindex
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/Accessibility/ARIA/Attributes/aria-rowcount MDN
   */
  'aria-rowcount'?: number | undefined
  /**
   * 定义元素相对于表格、网格或树网格中总行数的行索引或位置
   * @see aria-rowcount @see aria-rowspan
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/Accessibility/ARIA/Attributes/aria-rowindex MDN
   */
  'aria-rowindex'?: number | undefined
  /**
   * 定义 aria-rowindex 的人类可读文本替代
   * @see aria-colindextext
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/Accessibility/ARIA/Attributes/aria-rowindextext MDN
   */
  'aria-rowindextext'?: string | undefined
  /**
   * 定义表格、网格或树网格中单元格或网格单元格所跨的行数
   * @see aria-rowindex @see aria-colspan
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/Accessibility/ARIA/Attributes/aria-rowspan MDN
   */
  'aria-rowspan'?: number | undefined
  /**
   * 指示各种组件的当前"选中"状态
   * @see aria-checked @see aria-pressed
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/Accessibility/ARIA/Attributes/aria-selected MDN
   */
  'aria-selected'?: Booleanish | undefined
  /**
   * 定义当前列表项或树项集合中的项数。如果集合中的所有元素都存在于 DOM 中，则不需要
   * @see aria-posinset
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/Accessibility/ARIA/Attributes/aria-setsize MDN
   */
  'aria-setsize'?: number | undefined
  /**
   * 指示表格或网格中的项是按升序还是降序排序
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/Accessibility/ARIA/Attributes/aria-sort MDN
   */
  'aria-sort'?: 'none' | 'ascending' | 'descending' | 'other' | undefined
  /**
   * 定义范围组件的最大允许值
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/Accessibility/ARIA/Attributes/aria-valuemax MDN
   */
  'aria-valuemax'?: number | undefined
  /**
   * 定义范围组件的最小允许值
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/Accessibility/ARIA/Attributes/aria-valuemin MDN
   */
  'aria-valuemin'?: number | undefined
  /**
   * 定义范围组件的当前值
   * @see aria-valuetext
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/Accessibility/ARIA/Attributes/aria-valuenow MDN
   */
  'aria-valuenow'?: number | undefined
  /**
   * 定义范围组件 aria-valuenow 的人类可读文本替代
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/Accessibility/ARIA/Attributes/aria-valuetext MDN
   */
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
   * 使用 className 必须启用编译插件（@vitarx/plugin-vite）的 `classNameTransformClass` 选项。
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
  /** 元素的子节点 */
  children?: RenderChildren
}

interface VitarxRuntimeAttributes<T> {
  /** 元素实例引用，用于获取底层 DOM 元素 */
  ref?: InstanceRef<T>
}

/**
 * 全局属性
 */
export interface HTMLAttributes<T>
  extends GlobalAttributed, AriaAttributes, DOMAttributed<T>, VitarxRuntimeAttributes<T> {
  // Standard HTML Attributes
  /** 控制输入文本的自动大写行为 */
  autoCapitalize?:
    | 'off'
    | 'none'
    | 'on'
    | 'sentences'
    | 'words'
    | 'characters'
    | undefined
    | (string & {})
  /** 页面加载时元素是否应自动获得焦点 */
  autoFocus?: boolean | undefined
  /** 指定元素的上下文菜单 ID */
  contextMenu?: string | undefined
  /** 指示元素是否应进行拼写检查 */
  spellCheck?: Booleanish | undefined

  // Unknown
  /** 命令或菜单项所属的单选按钮组 */
  radioGroup?: string | undefined // <command>, <menuitem>

  // RDFa Attributes
  /** RDFa 关于属性，指定关联数据的主题 */
  about?: string | undefined
  /** RDFa 内容属性，指定机器可读的值 */
  content?: string | undefined
  /** RDFa 数据类型属性，指定值的类型 */
  datatype?: string | undefined
  /** RDFa 列表属性，指示值为列表 */
  inlist?: any
  /** RDFa 前缀属性，声明 CURIE 前缀 */
  prefix?: string | undefined
  /** RDFa 属性属性，指定元素的属性关系 */
  property?: string | undefined
  /** 指定当前文档与链接目标之间的关系 */
  rel?: string | undefined
  /** RDFa 资源属性，指定关联数据的资源 URI */
  resource?: string | undefined
  /** 指定链接目标与当前文档之间的反向关系 */
  rev?: string | undefined
  /** RDFa 类型属性，指定资源的 RDF 类型 */
  typeof?: string | undefined
  /** RDFa 词汇表属性，指定默认词汇表 URI */
  vocab?: string | undefined

  // Non-standard Attributes
  /** 控制是否对可编辑文本启用自动更正（非标准） */
  autoCorrect?: string | undefined
  /** 指示浏览器是否应保存用户输入的值以供将来自动完成（非标准） */
  autoSave?: string | undefined
  /** 指定颜色值，主要用于 `<hr>` 元素（非标准） */
  color?: string | undefined
  /** 微数据项的全局唯一标识符（非标准） */
  itemID?: string | undefined
  /** 搜索结果数量（非标准，Safari） */
  results?: number | undefined
  /** 安全相关属性（非标准） */
  security?: string | undefined
  /** 控制元素文本是否可被选中（非标准，IE） */
  unselectable?: 'on' | 'off' | undefined
}

export interface SVGAttributes<T> extends HTMLAttributes<T> {
  /** 允许的最大值 */
  max?: number | string | undefined
  /** 指定媒体查询 */
  media?: string | undefined
  /** HTTP 请求方法 */
  method?: string | undefined
  /** 允许的最小值 */
  min?: number | string | undefined
  /** 元素名称 */
  name?: string | undefined
  /** 链接目标 */
  target?: string | undefined
  /** 元素类型 */
  type?: string | undefined
  /** 元素宽度 */
  width?: number | string | undefined
  /** 元素高度 */
  height?: number | string | undefined

  // Other HTML properties supported by SVG elements in browsers
  /** 跨域资源共享设置 */
  crossOrigin?: CrossOrigin

  // SVG Specific attributes
  /** 颜色值 */
  color?: string | undefined
  /** 强调高度，字体度量属性 */
  accentHeight?: number | string | undefined
  /** 动画累加方式 */
  accumulate?: 'none' | 'sum' | undefined
  /** 动画叠加方式 */
  additive?: 'replace' | 'sum' | undefined
  /** 对齐基线方式 */
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
  /** 是否允许重排序 */
  allowReorder?: 'no' | 'yes' | undefined
  /** 字母基线位置 */
  alphabetic?: number | string | undefined
  /** 振幅值，用于滤镜效果 */
  amplitude?: number | string | undefined
  /** 阿拉伯语形式 */
  arabicForm?: 'initial' | 'medial' | 'terminal' | 'isolated' | undefined
  /** 字体上升线 */
  ascent?: number | string | undefined
  /** 动画目标属性名称 */
  attributeName?: string | undefined
  /** 动画目标属性命名空间 */
  attributeType?: string | undefined
  /** 是否自动反转动画 */
  autoReverse?: Booleanish | undefined
  /** 方位角，用于光照效果 */
  azimuth?: number | string | undefined
  /** 基础频率，用于 feTurbulence */
  baseFrequency?: number | string | undefined
  /** 基线偏移量 */
  baselineShift?: number | string | undefined
  /** 基础配置文件 */
  baseProfile?: number | string | undefined
  /** 边界框 */
  bbox?: number | string | undefined
  /** 动画开始时间 */
  begin?: number | string | undefined
  /** 偏移量，用于滤镜效果 */
  bias?: number | string | undefined
  /** 动画相对偏移值 */
  by?: number | string | undefined
  /** 动画计算模式 */
  calcMode?: number | string | undefined
  /** 大写字母高度 */
  capHeight?: number | string | undefined
  /** 裁剪区域 */
  clip?: number | string | undefined
  /** 裁剪路径引用 */
  clipPath?: string | undefined
  /** 裁剪路径的坐标系单位 */
  clipPathUnits?: number | string | undefined
  /** 裁剪规则 */
  clipRule?: number | string | undefined
  /** 颜色插值方式 */
  colorInterpolation?: number | string | undefined
  /** 颜色插值滤镜方式 */
  colorInterpolationFilters?: 'auto' | 'sRGB' | 'linearRGB' | 'inherit' | undefined
  /** 颜色配置文件 */
  colorProfile?: number | string | undefined
  /** 颜色渲染方式 */
  colorRendering?: number | string | undefined
  /** 内容脚本类型 */
  contentScriptType?: number | string | undefined
  /** 内容样式类型 */
  contentStyleType?: number | string | undefined
  /** 光标样式 */
  cursor?: number | string | undefined
  /** 椭圆/圆的 x 轴中心坐标 */
  cx?: number | string | undefined
  /** 椭圆/圆的 y 轴中心坐标 */
  cy?: number | string | undefined
  /** 路径数据定义 */
  d?: string | undefined
  /** 减速值，用于动画 */
  decelerate?: number | string | undefined
  /** 字体下降线 */
  descent?: number | string | undefined
  /** 漫反射常量，用于光照滤镜 */
  diffuseConstant?: number | string | undefined
  /** 书写方向 */
  direction?: number | string | undefined
  /** 显示方式 */
  display?: number | string | undefined
  /** 除数，用于卷积滤镜 */
  divisor?: number | string | undefined
  /** 主导基线方式 */
  dominantBaseline?: number | string | undefined
  /** 动画持续时间 */
  dur?: number | string | undefined
  /** x 轴偏移量 */
  dx?: number | string | undefined
  /** y 轴偏移量 */
  dy?: number | string | undefined
  /** 边缘模式，用于卷积滤镜 */
  edgeMode?: number | string | undefined
  /** 高度角，用于光照效果 */
  elevation?: number | string | undefined
  /** 启用背景合成 */
  enableBackground?: number | string | undefined
  /** 动画结束时间 */
  end?: number | string | undefined
  /** 指数值 */
  exponent?: number | string | undefined
  /** 是否需要外部资源 */
  externalResourcesRequired?: Booleanish | undefined
  /** 填充颜色 */
  fill?: string | undefined
  /** 填充透明度 */
  fillOpacity?: number | string | undefined
  /** 填充规则 */
  fillRule?: 'nonzero' | 'evenodd' | 'inherit' | undefined
  /** 滤镜引用 */
  filter?: string | undefined
  /** 滤镜分辨率 */
  filterRes?: number | string | undefined
  /** 滤镜坐标系单位 */
  filterUnits?: number | string | undefined
  /** 泛洪颜色，用于 feFlood */
  floodColor?: number | string | undefined
  /** 泛洪透明度，用于 feFlood */
  floodOpacity?: number | string | undefined
  /** 元素是否可获取焦点 */
  focusable?: Booleanish | 'auto' | undefined
  /** 字体族 */
  fontFamily?: string | undefined
  /** 字体大小 */
  fontSize?: number | string | undefined
  /** 字体大小调整 */
  fontSizeAdjust?: number | string | undefined
  /** 字体拉伸 */
  fontStretch?: number | string | undefined
  /** 字体样式 */
  fontStyle?: number | string | undefined
  /** 字体变体 */
  fontVariant?: number | string | undefined
  /** 字体粗细 */
  fontWeight?: number | string | undefined
  /** 字体格式 */
  format?: number | string | undefined
  /** 径向渐变焦点半径 */
  fr?: number | string | undefined
  /** 动画起始值 */
  from?: number | string | undefined
  /** 径向渐变焦点 x 坐标 */
  fx?: number | string | undefined
  /** 径向渐变焦点 y 坐标 */
  fy?: number | string | undefined
  /** 字体度量 g1 */
  g1?: number | string | undefined
  /** 字体度量 g2 */
  g2?: number | string | undefined
  /** 字形名称 */
  glyphName?: number | string | undefined
  /** 水平字形方向 */
  glyphOrientationHorizontal?: number | string | undefined
  /** 垂直字形方向 */
  glyphOrientationVertical?: number | string | undefined
  /** 字形引用 */
  glyphRef?: number | string | undefined
  /** 渐变变换矩阵 */
  gradientTransform?: string | undefined
  /** 渐变坐标系单位 */
  gradientUnits?: string | undefined
  /** 悬挂基线位置 */
  hanging?: number | string | undefined
  /** 水平前进宽度 x */
  horizAdvX?: number | string | undefined
  /** 水平原点 x 坐标 */
  horizOriginX?: number | string | undefined
  /** 链接地址 */
  href?: string | undefined
  /** 表意文字基线位置 */
  ideographic?: number | string | undefined
  /** 图像渲染方式 */
  imageRendering?: number | string | undefined
  /** 滤镜第二个输入引用 */
  in2?: number | string | undefined
  /** 滤镜输入引用 */
  in?: string | undefined
  /** 截距值，用于分量转移 */
  intercept?: number | string | undefined
  /** 卷积核矩阵值 k1 */
  k1?: number | string | undefined
  /** 卷积核矩阵值 k2 */
  k2?: number | string | undefined
  /** 卷积核矩阵值 k3 */
  k3?: number | string | undefined
  /** 卷积核矩阵值 k4 */
  k4?: number | string | undefined
  /** 字距调整值 */
  k?: number | string | undefined
  /** 卷积核矩阵 */
  kernelMatrix?: number | string | undefined
  /** 卷积核单位长度 */
  kernelUnitLength?: number | string | undefined
  /** 字距 */
  kerning?: number | string | undefined
  /** 动画关键点 */
  keyPoints?: number | string | undefined
  /** 动画关键样条 */
  keySplines?: number | string | undefined
  /** 动画关键时间 */
  keyTimes?: number | string | undefined
  /** 长度调整方式 */
  lengthAdjust?: number | string | undefined
  /** 字间距 */
  letterSpacing?: number | string | undefined
  /** 光照颜色 */
  lightingColor?: number | string | undefined
  /** 限制锥角，用于聚光灯 */
  limitingConeAngle?: number | string | undefined
  /** 本地引用标识 */
  local?: number | string | undefined
  /** 结束标记引用 */
  markerEnd?: string | undefined
  /** 标记高度 */
  markerHeight?: number | string | undefined
  /** 中间标记引用 */
  markerMid?: string | undefined
  /** 起始标记引用 */
  markerStart?: string | undefined
  /** 标记坐标系单位 */
  markerUnits?: number | string | undefined
  /** 标记宽度 */
  markerWidth?: number | string | undefined
  /** 遮罩引用 */
  mask?: string | undefined
  /** 遮罩内容坐标系单位 */
  maskContentUnits?: number | string | undefined
  /** 遮罩坐标系单位 */
  maskUnits?: number | string | undefined
  /** 数学基线位置 */
  mathematical?: number | string | undefined
  /** 混合模式 */
  mode?: number | string | undefined
  /** 八度数，用于 feTurbulence */
  numOctaves?: number | string | undefined
  /** 偏移量 */
  offset?: number | string | undefined
  /** 透明度 */
  opacity?: number | string | undefined
  /** 合成操作符 */
  operator?: number | string | undefined
  /** 滤镜阶数 */
  order?: number | string | undefined
  /** 方向/朝向 */
  orient?: number | string | undefined
  /** 字形方向 */
  orientation?: number | string | undefined
  /** 动画原点 */
  origin?: number | string | undefined
  /** 溢出处理方式 */
  overflow?: number | string | undefined
  /** 上划线位置 */
  overlinePosition?: number | string | undefined
  /** 上划线粗细 */
  overlineThickness?: number | string | undefined
  /** 绘制顺序 */
  paintOrder?: number | string | undefined
  /** Panose-1 字体描述值 */
  panose1?: number | string | undefined
  /** 路径定义 */
  path?: string | undefined
  /** 路径长度 */
  pathLength?: number | string | undefined
  /** 图案内容坐标系单位 */
  patternContentUnits?: string | undefined
  /** 图案变换矩阵 */
  patternTransform?: number | string | undefined
  /** 图案坐标系单位 */
  patternUnits?: string | undefined
  /** 指针事件响应方式 */
  pointerEvents?: number | string | undefined
  /** 多边形/折线点列表 */
  points?: string | undefined
  /** 光照方向 x 坐标 */
  pointsAtX?: number | string | undefined
  /** 光照方向 y 坐标 */
  pointsAtY?: number | string | undefined
  /** 光照方向 z 坐标 */
  pointsAtZ?: number | string | undefined
  /** 是否保留 Alpha 通道 */
  preserveAlpha?: Booleanish | undefined
  /** 保持宽高比方式 */
  preserveAspectRatio?: string | undefined
  /** 原始坐标系单位 */
  primitiveUnits?: number | string | undefined
  /** 圆/径向渐变半径 */
  r?: number | string | undefined
  /** 半径值 */
  radius?: number | string | undefined
  /** 引用点 x 坐标 */
  refX?: number | string | undefined
  /** 引用点 y 坐标 */
  refY?: number | string | undefined
  /** 渲染意图 */
  renderingIntent?: number | string | undefined
  /** 动画重复次数 */
  repeatCount?: number | string | undefined
  /** 动画重复持续时间 */
  repeatDur?: number | string | undefined
  /** 所需扩展列表 */
  requiredExtensions?: number | string | undefined
  /** 所需特性列表 */
  requiredFeatures?: number | string | undefined
  /** 动画重启行为 */
  restart?: number | string | undefined
  /** 滤镜结果名称 */
  result?: string | undefined
  /** 旋转角度 */
  rotate?: number | string | undefined
  /** x 轴圆角半径 */
  rx?: number | string | undefined
  /** y 轴圆角半径 */
  ry?: number | string | undefined
  /** 缩放比例 */
  scale?: number | string | undefined
  /** 随机种子，用于 feTurbulence */
  seed?: number | string | undefined
  /** 形状渲染方式 */
  shapeRendering?: number | string | undefined
  /** 斜率值 */
  slope?: number | string | undefined
  /** 间距值 */
  spacing?: number | string | undefined
  /** 镜面反射常量 */
  specularConstant?: number | string | undefined
  /** 镜面反射指数 */
  specularExponent?: number | string | undefined
  /** 速度值 */
  speed?: number | string | undefined
  /** 渐变扩展方式 */
  spreadMethod?: string | undefined
  /** 文本路径起始偏移 */
  startOffset?: number | string | undefined
  /** 标准差，用于高斯模糊 */
  stdDeviation?: number | string | undefined
  /** 词干水平宽度 */
  stemh?: number | string | undefined
  /** 词干垂直宽度 */
  stemv?: number | string | undefined
  /** 平铺方式，用于 feTurbulence */
  stitchTiles?: number | string | undefined
  /** 渐变停止颜色 */
  stopColor?: string | undefined
  /** 渐变停止透明度 */
  stopOpacity?: number | string | undefined
  /** 删除线位置 */
  strikethroughPosition?: number | string | undefined
  /** 删除线粗细 */
  strikethroughThickness?: number | string | undefined
  /** 字符串值 */
  string?: number | string | undefined
  /** 描边颜色 */
  stroke?: string | undefined
  /** 描边虚线模式 */
  strokeDasharray?: string | number | undefined
  /** 描边虚线偏移 */
  strokeDashoffset?: string | number | undefined
  /** 描边线帽样式 */
  strokeLinecap?: 'butt' | 'round' | 'square' | 'inherit' | undefined
  /** 描边连接样式 */
  strokeLinejoin?: 'miter' | 'round' | 'bevel' | 'inherit' | undefined
  /** 描边斜接限制 */
  strokeMiterlimit?: number | string | undefined
  /** 描边透明度 */
  strokeOpacity?: number | string | undefined
  /** 描边宽度 */
  strokeWidth?: number | string | undefined
  /** 表面缩放因子 */
  surfaceScale?: number | string | undefined
  /** 系统语言列表 */
  systemLanguage?: number | string | undefined
  /** 查找表值列表 */
  tableValues?: number | string | undefined
  /** 卷积核目标 x 坐标 */
  targetX?: number | string | undefined
  /** 卷积核目标 y 坐标 */
  targetY?: number | string | undefined
  /** 文本锚点对齐方式 */
  textAnchor?: string | undefined
  /** 文本装饰 */
  textDecoration?: number | string | undefined
  /** 文本长度 */
  textLength?: number | string | undefined
  /** 文本渲染方式 */
  textRendering?: number | string | undefined
  /** 动画目标值 */
  to?: number | string | undefined
  /** 变换矩阵 */
  transform?: string | undefined
  /** 字体度量 u1 */
  u1?: number | string | undefined
  /** 字体度量 u2 */
  u2?: number | string | undefined
  /** 下划线位置 */
  underlinePosition?: number | string | undefined
  /** 下划线粗细 */
  underlineThickness?: number | string | undefined
  /** Unicode 码位 */
  unicode?: number | string | undefined
  /** Unicode 双向算法覆盖 */
  unicodeBidi?: number | string | undefined
  /** Unicode 范围 */
  unicodeRange?: number | string | undefined
  /** 每个单位的字体度量 */
  unitsPerEm?: number | string | undefined
  /** 字体度量 v-alphabetic */
  vAlphabetic?: number | string | undefined
  /** 动画/渐变值列表 */
  values?: string | undefined
  /** 矢量效果 */
  vectorEffect?: number | string | undefined
  /** SVG 版本 */
  version?: string | undefined
  /** 垂直前进宽度 y */
  vertAdvY?: number | string | undefined
  /** 垂直原点 x 坐标 */
  vertOriginX?: number | string | undefined
  /** 垂直原点 y 坐标 */
  vertOriginY?: number | string | undefined
  /** 字体度量 v-hanging */
  vHanging?: number | string | undefined
  /** 字体度量 v-ideographic */
  vIdeographic?: number | string | undefined
  /** 视图框定义 */
  viewBox?: string | undefined
  /** 视图目标 */
  viewTarget?: number | string | undefined
  /** 可见性 */
  visibility?: number | string | undefined
  /** 字体度量 v-mathematical */
  vMathematical?: number | string | undefined
  /** 宽度表 */
  widths?: number | string | undefined
  /** 词间距 */
  wordSpacing?: number | string | undefined
  /** 书写模式 */
  writingMode?: number | string | undefined
  /** 线段/渐变起始 x 坐标 */
  x1?: number | string | undefined
  /** 线段/渐变结束 x 坐标 */
  x2?: number | string | undefined
  /** x 坐标 */
  x?: number | string | undefined
  /** 颜色通道选择器 x */
  xChannelSelector?: string | undefined
  /** 字体 x 高度 */
  xHeight?: number | string | undefined
  /** XLink 激活属性 */
  xlinkActuate?: string | undefined
  /** XLink 弧角色 */
  xlinkArcrole?: string | undefined
  /** XLink 链接地址 */
  xlinkHref?: string | undefined
  /** XLink 角色 */
  xlinkRole?: string | undefined
  /** XLink 显示方式 */
  xlinkShow?: string | undefined
  /** XLink 标题 */
  xlinkTitle?: string | undefined
  /** XLink 类型 */
  xlinkType?: string | undefined
  /** XML 基础 URL */
  xmlBase?: string | undefined
  /** XML 语言 */
  xmlLang?: string | undefined
  /** XML 命名空间 */
  xmlns?: string | undefined
  /** XLink 命名空间 */
  xmlnsXlink?: string | undefined
  /** XML 空白处理 */
  xmlSpace?: string | undefined
  /** 线段/渐变起始 y 坐标 */
  y1?: number | string | undefined
  /** 线段/渐变结束 y 坐标 */
  y2?: number | string | undefined
  /** y 坐标 */
  y?: number | string | undefined
  /** 颜色通道选择器 y */
  yChannelSelector?: string | undefined
  /** z 坐标/深度值 */
  z?: number | string | undefined
  /** 缩放和平移方式 */
  zoomAndPan?: string | undefined
}

/** Electron WebView 元素属性 */
export interface WebViewHTMLAttributes<T> extends HTMLAttributes<T> {
  /** 是否允许全屏 */
  allowFullScreen?: boolean | undefined
  /** 是否允许弹出窗口 */
  allowpopups?: boolean | undefined
  /** 是否自动调整大小 */
  autosize?: boolean | undefined
  /** 启用的 Blink 特性列表 */
  blinkfeatures?: string | undefined
  /** 禁用的 Blink 特性列表 */
  disableblinkfeatures?: string | undefined
  /** 是否禁用访客调整大小 */
  disableguestresize?: boolean | undefined
  /** 是否禁用 Web 安全 */
  disablewebsecurity?: boolean | undefined
  /** 访客实例标识符 */
  guestinstance?: string | undefined
  /** HTTP 引用来源地址 */
  httpreferrer?: string | undefined
  /** 是否启用 Node.js 集成 */
  nodeintegration?: boolean | undefined
  /** 会话分区标识 */
  partition?: string | undefined
  /** 是否启用插件 */
  plugins?: boolean | undefined
  /** 预加载脚本路径 */
  preload?: string | undefined
  /** 页面源地址 */
  src?: string | undefined
  /** 用户代理字符串 */
  useragent?: string | undefined
  /** Web 偏好设置 */
  webpreferences?: string | undefined
}

/** `<a>` 锚点元素属性 */
export interface AnchorHTMLAttributes<T> extends HTMLAttributes<T> {
  /** 下载链接，指定浏览器将 URL 视为下载资源 */
  download?: any
  /**
   * 链接的目标 URL
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/a#href MDN
   */
  href?: string | undefined
  /**
   * 链接资源的语言
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/a#hreflang MDN
   */
  hrefLang?: string | undefined
  /** 链接适用的媒体查询 */
  media?: string | undefined
  /**
   * 点击链接时通知的 URL 列表，以空格分隔
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/a#ping MDN
   */
  ping?: string | undefined
  /**
   * 链接的显示位置
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/a#target MDN
   */
  target?: '_self' | '_blank' | '_parent' | '_top' | '_unfencedTop' | (string & {}) | undefined
  /**
   * 链接资源的 MIME 类型
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/a#type MDN
   */
  type?: string | undefined
  /**
   * 链接的引用策略
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/a#referrerpolicy MDN
   */
  referrerPolicy?: HTMLAttributeReferrerPolicy | undefined
}

/** `<area>` 图像映射区域属性 */
export interface AreaHTMLAttributes<T> extends HTMLAttributes<T> {
  /**
   * 替代文本，在图像无法显示时使用
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/area#alt MDN
   */
  alt?: string | undefined
  /**
   * 热区坐标列表
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/area#coords MDN
   */
  coords?: string | undefined
  /** 下载链接，指定浏览器将 URL 视为下载资源 */
  download?: any
  /**
   * 链接的目标 URL
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/area#href MDN
   */
  href?: string | undefined
  /**
   * 链接资源的语言
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/area#hreflang MDN
   */
  hrefLang?: string | undefined
  /** 链接适用的媒体查询 */
  media?: string | undefined
  /**
   * 链接的引用策略
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/area#referrerpolicy MDN
   */
  referrerPolicy?: HTMLAttributeReferrerPolicy | undefined
  /**
   * 热区形状
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/area#shape MDN
   */
  shape?: string | undefined
  /**
   * 链接的显示位置
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/area#target MDN
   */
  target?: string | undefined
}

/** `<audio>` 音频元素属性，继承自 MediaHTMLAttributes */
export interface AudioHTMLAttributes<T> extends MediaHTMLAttributes<T> {}

/** `<base>` 基础 URL 元素属性 */
export interface BaseHTMLAttributes<T> extends HTMLAttributes<T> {
  /**
   * 文档中所有相对 URL 的基础 URL
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/base#href MDN
   */
  href?: string | undefined
  /**
   * 默认目标上下文，指定链接在何处打开
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/base#target MDN
   */
  target?: string | undefined
}

/** `<blockquote>` 引用块元素属性 */
export interface BlockquoteHTMLAttributes<T> extends HTMLAttributes<T> {
  /**
   * 引用来源的 URL
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/blockquote#cite MDN
   */
  cite?: string | undefined
}

/** `<button>` 按钮元素属性 */
export interface ButtonHTMLAttributes<T> extends HTMLAttributes<T> {
  /**
   * 按钮是否禁用
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/button#disabled MDN
   */
  disabled?: boolean | undefined
  /**
   * 关联的表单元素 ID
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/button#form MDN
   */
  form?: string | undefined
  /**
   * 表单提交的 URL，覆盖 form 的 action
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/button#formaction MDN
   */
  formAction?: string | undefined
  /**
   * 表单提交的编码方式，覆盖 form 的 enctype
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/button#formenctype MDN
   */
  formEncType?: string | undefined
  /**
   * 表单提交的 HTTP 方法，覆盖 form 的 method
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/button#formmethod MDN
   */
  formMethod?: string | undefined
  /**
   * 提交表单时是否跳过验证，覆盖 form 的 novalidate
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/button#formnovalidate MDN
   */
  formNoValidate?: boolean | undefined
  /**
   * 表单提交的目标上下文，覆盖 form 的 target
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/button#formtarget MDN
   */
  formTarget?: string | undefined
  /**
   * 按钮名称，与值一起作为表单数据提交
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/button#name MDN
   */
  name?: string | undefined
  /**
   * 按钮类型
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/button#type MDN
   */
  type?: 'submit' | 'reset' | 'button' | undefined
  /**
   * 按钮的初始值，作为表单数据提交
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/button#value MDN
   */
  value?: string | number | undefined
}

/** `<canvas>` 画布元素属性 */
export interface CanvasHTMLAttributes<T> extends HTMLAttributes<T> {
  /**
   * 画布高度（以 CSS 像素为单位）
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/canvas#height MDN
   */
  height?: number | string | undefined
  /**
   * 画布宽度（以 CSS 像素为单位）
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/canvas#width MDN
   */
  width?: number | string | undefined
}

/** `<col>` 表格列元素属性 */
export interface ColHTMLAttributes<T> extends HTMLAttributes<T> {
  /**
   * 列跨越的列数
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/col#span MDN
   */
  span?: number | undefined
  /**
   * 列的默认宽度
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/col#width MDN
   */
  width?: number | string | undefined
}

/** `<colgroup>` 表格列组元素属性 */
export interface ColgroupHTMLAttributes<T> extends HTMLAttributes<T> {
  /**
   * 列组包含的列数
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/colgroup#span MDN
   */
  span?: number | undefined
}

/** `<data>` 数据元素属性 */
export interface DataHTMLAttributes<T> extends HTMLAttributes<T> {
  /**
   * 元素内容的机器可读值
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/data#value MDN
   */
  value?: string | number | undefined
}

/** `<details>` 详情折叠元素属性 */
export interface DetailsHTMLAttributes<T>
  extends HTMLAttributes<T>, WithEventAttributes<'onToggle', T> {
  /**
   * 详情内容是否初始可见
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/details#open MDN
   */
  open?: boolean | undefined
  /**
   * 用于分组多个 details 元素的名称
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/details#name MDN
   */
  name?: string | undefined
}

/** `<del>` 删除文本元素属性 */
export interface DelHTMLAttributes<T> extends HTMLAttributes<T> {
  /**
   * 解释删除原因的 URL
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/del#cite MDN
   */
  cite?: string | undefined
  /**
   * 删除的日期和时间
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/del#datetime MDN
   */
  dateTime?: string | undefined
}

/** `<dialog>` 对话框元素属性 */
export interface DialogHTMLAttributes<T>
  extends HTMLAttributes<T>, WithEventAttributes<'onToggle' | 'onCancel' | 'onClose', T> {
  /**
   * 对话框是否打开（显示）
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/dialog#open MDN
   */
  open?: boolean | undefined
}

/** `<embed>` 外部嵌入内容元素属性 */
export interface EmbedHTMLAttributes<T> extends HTMLAttributes<T> {
  /**
   * 嵌入内容的高度
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/embed#height MDN
   */
  height?: number | string | undefined
  /**
   * 嵌入资源的 URL
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/embed#src MDN
   */
  src?: string | undefined
  /**
   * 嵌入资源的 MIME 类型
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/embed#type MDN
   */
  type?: string | undefined
  /**
   * 嵌入内容的宽度
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/embed#width MDN
   */
  width?: number | string | undefined
}

/** `<fieldset>` 表单字段集元素属性 */
export interface FieldsetHTMLAttributes<T> extends HTMLAttributes<T> {
  /**
   * 是否禁用字段集中的所有表单控件
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/fieldset#disabled MDN
   */
  disabled?: boolean | undefined
  /**
   * 关联的表单元素 ID
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/fieldset#form MDN
   */
  form?: string | undefined
  /**
   * 字段集名称
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/fieldset#name MDN
   */
  name?: string | undefined
}

/** `<form>` 表单元素属性 */
export interface FormHTMLAttributes<T> extends HTMLAttributes<T> {
  /**
   * 服务器接受的字符编码列表
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/form#accept-charset MDN
   */
  acceptCharset?: string | undefined
  /**
   * 处理表单提交的 URL
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/form#action MDN
   */
  action?: string | undefined
  /**
   * 表单的自动完成行为
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/form#autocomplete MDN
   */
  autoComplete?: string | undefined
  /**
   * 提交表单数据的编码方式
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/form#enctype MDN
   */
  encType?: string | undefined
  /**
   * 提交表单的 HTTP 方法
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/form#method MDN
   */
  method?: string | undefined
  /**
   * 表单名称
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/form#name MDN
   */
  name?: string | undefined
  /**
   * 提交表单时是否跳过验证
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/form#novalidate MDN
   */
  noValidate?: boolean | undefined
  /**
   * 提交表单结果的显示位置
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/form#target MDN
   */
  target?: string | undefined
}

/** `<html>` 根元素属性 */
export interface HtmlHTMLAttributes<T> extends HTMLAttributes<T> {
  /**
   * 应用缓存清单的 URL（已弃用）
   *
   * @deprecated 请使用 Service Worker 和 Cache API 替代
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/html#manifest MDN
   */
  manifest?: string | undefined
}

/** `<iframe>` 内联框架元素属性 */
export interface IframeHTMLAttributes<T> extends HTMLAttributes<T> {
  /**
   * iframe 的权限策略
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/iframe#allow MDN
   */
  allow?: string | undefined
  /**
   * 是否允许全屏
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/iframe#allowfullscreen MDN
   */
  allowFullScreen?: boolean | undefined
  /**
   * 是否允许透明
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/iframe#allowtransparency MDN
   */
  allowTransparency?: boolean | undefined
  /**
   * 是否显示 iframe 边框（已弃用）
   *
   * @deprecated 请使用 CSS border 属性替代
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/iframe#frameborder MDN
   */
  frameBorder?: number | string | undefined
  /**
   * iframe 的高度
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/iframe#height MDN
   */
  height?: number | string | undefined
  /**
   * iframe 内容的懒加载策略
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/iframe#loading MDN
   */
  loading?: 'eager' | 'lazy' | undefined
  /**
   * iframe 内容的顶部和底部边距（已弃用）
   *
   * @deprecated 请使用 CSS margin 属性替代
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/iframe#marginheight MDN
   */
  marginHeight?: number | undefined
  /**
   * iframe 内容的左侧和右侧边距（已弃用）
   *
   * @deprecated 请使用 CSS margin 属性替代
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/iframe#marginwidth MDN
   */
  marginWidth?: number | undefined
  /**
   * iframe 的名称，作为链接目标和表单目标使用
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/iframe#name MDN
   */
  name?: string | undefined
  /**
   * iframe 的引用策略
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/iframe#referrerpolicy MDN
   */
  referrerPolicy?: HTMLAttributeReferrerPolicy | undefined
  /**
   * iframe 的沙箱安全策略
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/iframe#sandbox MDN
   */
  sandbox?: string | undefined
  /**
   * iframe 是否显示滚动条（已弃用）
   *
   * @deprecated 请使用 CSS overflow 属性替代
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/iframe#scrolling MDN
   */
  scrolling?: string | undefined
  /**
   * 是否让 iframe 看起来像包含文档的一部分
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/iframe#seamless MDN
   */
  seamless?: boolean | undefined
  /**
   * 嵌入页面的 URL
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/iframe#src MDN
   */
  src?: string | undefined
  /**
   * iframe 中要渲染的内联 HTML 内容
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/iframe#srcdoc MDN
   */
  srcDoc?: string | undefined
  /**
   * iframe 的宽度
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/iframe#width MDN
   */
  width?: number | string | undefined
}

/** `<img>` 图像元素属性 */
export interface ImgHTMLAttributes<T> extends HTMLAttributes<T> {
  /**
   * 图像的替代文本描述
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/img#alt MDN
   */
  alt?: string | undefined
  /**
   * 图像资源的跨域设置
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/img#crossorigin MDN
   */
  crossOrigin?: CrossOrigin
  /**
   * 图像的解码方式
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/img#decoding MDN
   */
  decoding?: 'async' | 'auto' | 'sync' | undefined
  /**
   * 图像的获取优先级
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/img#fetchpriority MDN
   */
  fetchPriority?: 'high' | 'low' | 'auto'
  /**
   * 图像的固有高度
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/img#height MDN
   */
  height?: number | string | undefined
  /**
   * 图像的懒加载策略
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/img#loading MDN
   */
  loading?: 'eager' | 'lazy' | undefined
  /**
   * 获取图像时的引用策略
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/img#referrerpolicy MDN
   */
  referrerPolicy?: HTMLAttributeReferrerPolicy | undefined
  /**
   * 响应式图像的尺寸列表
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/img#sizes MDN
   */
  sizes?: string | undefined
  /**
   * 图像的 URL
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/img#src MDN
   */
  src?: string | undefined
  /**
   * 响应式图像的候选 URL 列表
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/img#srcset MDN
   */
  srcSet?: string | undefined
  /**
   * 图像映射的名称
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/img#usemap MDN
   */
  useMap?: string | undefined
  /**
   * 图像的固有宽度
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/img#width MDN
   */
  width?: number | string | undefined
}

/** `<ins>` 插入文本元素属性 */
export interface InsHTMLAttributes<T> extends HTMLAttributes<T> {
  /**
   * 解释插入原因的 URL
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/ins#cite MDN
   */
  cite?: string | undefined
  /**
   * 插入的日期和时间
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/ins#datetime MDN
   */
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

/** `<input>` 输入元素属性 */
export interface InputHTMLAttributes<T>
  extends HTMLAttributes<T>, WithEventAttributes<'onChange', T> {
  /**
   * 文件上传控件接受的文件类型提示
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/input#accept MDN
   */
  accept?: string | undefined
  /**
   * 图像类型提交按钮的替代文本
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/input#alt MDN
   */
  alt?: string | undefined
  /**
   * 输入字段的自动完成行为
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/input#autocomplete MDN
   */
  autoComplete?: HTMLInputAutoCompleteAttribute | undefined
  /**
   * 文件上传控件的摄像头方向
   *
   * @see https://www.w3.org/TR/html-media-capture/#the-capture-attribute
   */
  capture?: boolean | 'user' | 'environment' | undefined // https://www.w3.org/TR/html-media-capture/#the-capture-attribute
  /**
   * 复选框或单选按钮是否被选中
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/input#checked MDN
   */
  checked?: boolean | undefined
  /**
   * 输入控件是否禁用
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/input#disabled MDN
   */
  disabled?: boolean | undefined
  /**
   * 关联的表单元素 ID
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/input#form MDN
   */
  form?: string | undefined
  /**
   * 表单提交的 URL，覆盖 form 的 action
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/input#formaction MDN
   */
  formAction?: string | undefined
  /**
   * 表单提交的编码方式，覆盖 form 的 enctype
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/input#formenctype MDN
   */
  formEncType?: string | undefined
  /**
   * 表单提交的 HTTP 方法，覆盖 form 的 method
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/input#formmethod MDN
   */
  formMethod?: string | undefined
  /**
   * 提交表单时是否跳过验证，覆盖 form 的 novalidate
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/input#formnovalidate MDN
   */
  formNoValidate?: boolean | undefined
  /**
   * 表单提交的目标上下文，覆盖 form 的 target
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/input#formtarget MDN
   */
  formTarget?: string | undefined
  /**
   * 输入控件的高度
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/input#height MDN
   */
  height?: number | string | undefined
  /**
   * 建议选项的 datalist 元素 ID
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/input#list MDN
   */
  list?: string | undefined
  /**
   * 输入控件的最大值
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/input#max MDN
   */
  max?: number | string | undefined
  /**
   * 用户可输入的最大字符数
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/input#maxlength MDN
   */
  maxLength?: number | undefined
  /**
   * 输入控件的最小值
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/input#min MDN
   */
  min?: number | string | undefined
  /**
   * 用户可输入的最小字符数
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/input#minlength MDN
   */
  minLength?: number | undefined
  /**
   * 是否允许用户输入多个值
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/input#multiple MDN
   */
  multiple?: boolean | undefined
  /**
   * 输入控件的名称，作为表单数据提交
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/input#name MDN
   */
  name?: string | undefined
  /**
   * 输入值必须匹配的正则表达式模式
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/input#pattern MDN
   */
  pattern?: string | undefined
  /**
   * 输入字段的占位提示文本
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/input#placeholder MDN
   */
  placeholder?: string | undefined
  /**
   * 输入控件是否只读
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/input#readonly MDN
   */
  readOnly?: boolean | undefined
  /**
   * 提交表单前是否必须填写
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/input#required MDN
   */
  required?: boolean | undefined
  /**
   * 控件的可见宽度（字符数）
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/input#size MDN
   */
  size?: number | undefined
  /**
   * 图像类型提交按钮的图像 URL
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/input#src MDN
   */
  src?: string | undefined
  /**
   * 数值输入的步进间隔
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/input#step MDN
   */
  step?: number | string | undefined
  /**
   * 输入控件的类型
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/input#type MDN
   */
  type?: HTMLInputTypeAttribute | undefined
  /**
   * 输入控件的当前值
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/input#value MDN
   */
  value?: string | number | undefined
  /**
   * 输入控件的宽度
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/input#width MDN
   */
  width?: number | string | undefined
}

/** `<keygen>` 密钥对生成元素属性（已弃用） */
/** @deprecated 请使用 Web Cryptography API 替代 */
export interface KeygenHTMLAttributes<T> extends HTMLAttributes<T> {
  /**
   * 提交公钥时的挑战字符串
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/keygen#challenge MDN
   */
  challenge?: string | undefined
  /**
   * 密钥对生成控件是否禁用
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/keygen#disabled MDN
   */
  disabled?: boolean | undefined
  /**
   * 关联的表单元素 ID
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/keygen#form MDN
   */
  form?: string | undefined
  /**
   * 密钥类型（如 rsa）
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/keygen#keytype MDN
   */
  keyType?: string | undefined
  /**
   * 密钥参数
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/keygen#keyparams MDN
   */
  keyParams?: string | undefined
  /**
   * 控件名称，作为表单数据提交
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/keygen#name MDN
   */
  name?: string | undefined
}

/** `<label>` 标签元素属性 */
export interface LabelHTMLAttributes<T> extends HTMLAttributes<T> {
  /**
   * 关联的表单元素 ID
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/label#form MDN
   */
  form?: string | undefined
  /**
   * 标签关联的表单控件 ID
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/label#for MDN
   */
  htmlFor?: string | undefined
}

/** `<li>` 列表项元素属性 */
export interface LiHTMLAttributes<T> extends HTMLAttributes<T> {
  /**
   * 有序列表中列表项的序号值
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/li#value MDN
   */
  value?: string | number | undefined
}

/** `<link>` 外部资源链接元素属性 */
export interface LinkHTMLAttributes<T> extends HTMLAttributes<T> {
  /**
   * 链接资源的预加载类型
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/link#as MDN
   */
  as?: string | undefined
  /**
   * 资源的跨域设置
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/link#crossorigin MDN
   */
  crossOrigin?: CrossOrigin
  /**
   * 资源的获取优先级
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/link#fetchpriority MDN
   */
  fetchPriority?: 'high' | 'low' | 'auto'
  /**
   * 链接资源的 URL
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/link#href MDN
   */
  href?: string | undefined
  /**
   * 链接资源的语言
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/link#hreflang MDN
   */
  hrefLang?: string | undefined
  /**
   * 资源的完整性校验值
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/link#integrity MDN
   */
  integrity?: string | undefined
  /** 链接适用的媒体查询 */
  media?: string | undefined
  /**
   * 预加载图像的候选 URL 列表
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/link#imagesrcset MDN
   */
  imageSrcSet?: string | undefined
  /**
   * 预加载图像的尺寸列表
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/link#imagesizes MDN
   */
  imageSizes?: string | undefined
  /**
   * 获取资源时的引用策略
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/link#referrerpolicy MDN
   */
  referrerPolicy?: HTMLAttributeReferrerPolicy | undefined
  /**
   * 图标尺寸列表
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/link#sizes MDN
   */
  sizes?: string | undefined
  /**
   * 链接资源的 MIME 类型
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/link#type MDN
   */
  type?: string | undefined
  /**
   * 链接资源的字符编码
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/link#charset MDN
   */
  charSet?: string | undefined
}

/** `<map>` 图像映射元素属性 */
export interface MapHTMLAttributes<T> extends HTMLAttributes<T> {
  /**
   * 图像映射的名称，与 img 的 usemap 属性关联
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/map#name MDN
   */
  name?: string | undefined
}

/** `<menu>` 菜单元素属性 */
export interface MenuHTMLAttributes<T> extends HTMLAttributes<T> {
  /**
   * 菜单的类型
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/menu#type MDN
   */
  type?: string | undefined
}

/** 媒体元素（`<audio>`/`<video>`）共有属性 */
export interface MediaHTMLAttributes<T> extends HTMLAttributes<T> {
  /**
   * 媒体是否自动播放
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/video#autoplay MDN
   */
  autoPlay?: boolean | undefined
  /**
   * 是否显示媒体播放控件
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/video#controls MDN
   */
  controls?: boolean | undefined
  /**
   * 控件列表白名单或黑名单
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/video#controlslist MDN
   */
  controlsList?: string | undefined
  /**
   * 媒体资源的跨域设置
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/video#crossorigin MDN
   */
  crossOrigin?: CrossOrigin
  /**
   * 媒体是否循环播放
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/video#loop MDN
   */
  loop?: boolean | undefined
  /**
   * 关联的媒体组名称
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/video#mediagroup MDN
   */
  mediaGroup?: string | undefined
  /**
   * 媒体是否默认静音
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/video#muted MDN
   */
  muted?: boolean | undefined
  /**
   * 是否以内联方式播放，不进入全屏
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/video#playsinline MDN
   */
  playsInline?: boolean | undefined
  /**
   * 媒体预加载策略
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/video#preload MDN
   */
  preload?: string | undefined
  /**
   * 媒体资源的 URL
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/video#src MDN
   */
  src?: string | undefined
}

/** `<meta>` 元数据元素属性 */
export interface MetaHTMLAttributes<T> extends HTMLAttributes<T> {
  /**
   * 元数据的字符编码
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/meta#charset MDN
   */
  charSet?: string | undefined
  /**
   * 元数据的内容值
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/meta#content MDN
   */
  content?: string | undefined
  /**
   * HTTP 响应头名称，将 meta 转为 pragma 指令
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/meta#http-equiv MDN
   */
  httpEquiv?: string | undefined
  /** 元数据适用的媒体 */
  media?: string | undefined
  /**
   * 元数据的名称
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/meta#name MDN
   */
  name?: string | undefined
}

/** `<meter>` 度量元素属性 */
export interface MeterHTMLAttributes<T> extends HTMLAttributes<T> {
  /**
   * 关联的表单元素 ID
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/meter#form MDN
   */
  form?: string | undefined
  /**
   * 度量的高阈值上限
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/meter#high MDN
   */
  high?: number | undefined
  /**
   * 度量的低阈值下限
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/meter#low MDN
   */
  low?: number | undefined
  /**
   * 度量范围的最大值
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/meter#max MDN
   */
  max?: number | string | undefined
  /**
   * 度量范围的最小值
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/meter#min MDN
   */
  min?: number | string | undefined
  /**
   * 度量的最优值
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/meter#optimum MDN
   */
  optimum?: number | undefined
  /**
   * 度量的当前值
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/meter#value MDN
   */
  value?: string | number | undefined
}

/** `<q>` 行内引用元素属性 */
export interface QuoteHTMLAttributes<T> extends HTMLAttributes<T> {
  /**
   * 引用来源的 URL
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/q#cite MDN
   */
  cite?: string | undefined
}

/** `<object>` 嵌入对象元素属性 */
export interface ObjectHTMLAttributes<T> extends HTMLAttributes<T> {
  /**
   * 对象实现的类标识符
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/object#classid MDN
   */
  classID?: string | undefined
  /**
   * 对象资源的 URL
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/object#data MDN
   */
  data?: string | undefined
  /**
   * 关联的表单元素 ID
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/object#form MDN
   */
  form?: string | undefined
  /**
   * 对象显示的高度
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/object#height MDN
   */
  height?: number | string | undefined
  /**
   * 对象的名称，作为表单数据提交
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/object#name MDN
   */
  name?: string | undefined
  /**
   * 对象资源的 MIME 类型
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/object#type MDN
   */
  type?: string | undefined
  /**
   * 关联的图像映射名称
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/object#usemap MDN
   */
  useMap?: string | undefined
  /**
   * 对象显示的宽度
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/object#width MDN
   */
  width?: number | string | undefined
  /**
   * 对象的窗口模式，用于嵌入内容与页面层的交互
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/object#wmode MDN
   */
  wmode?: string | undefined
}

/** `<ol>` 有序列表元素属性 */
export interface OlHTMLAttributes<T> extends HTMLAttributes<T> {
  /**
   * 列表序号是否倒序
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/ol#reversed MDN
   */
  reversed?: boolean | undefined
  /**
   * 列表的起始序号
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/ol#start MDN
   */
  start?: number | undefined
  /**
   * 列表的编号类型
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/ol#type MDN
   */
  type?: '1' | 'a' | 'A' | 'i' | 'I' | undefined
}

/** `<optgroup>` 选项组元素属性 */
export interface OptgroupHTMLAttributes<T> extends HTMLAttributes<T> {
  /**
   * 选项组是否禁用
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/optgroup#disabled MDN
   */
  disabled?: boolean | undefined
  /**
   * 选项组的标签
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/optgroup#label MDN
   */
  label?: string | undefined
}

/** `<option>` 选项元素属性 */
export interface OptionHTMLAttributes<T> extends HTMLAttributes<T> {
  /**
   * 选项是否禁用
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/option#disabled MDN
   */
  disabled?: boolean | undefined
  /**
   * 选项的标签文本（若省略则使用元素内容）
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/option#label MDN
   */
  label?: string | undefined
  /**
   * 选项是否默认选中
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/option#selected MDN
   */
  selected?: boolean | undefined
  /**
   * 选项提交的值
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/option#value MDN
   */
  value?: string | number | undefined
}

/** `<output>` 计算结果输出元素属性 */
export interface OutputHTMLAttributes<T> extends HTMLAttributes<T> {
  /**
   * 关联的表单元素 ID
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/output#form MDN
   */
  form?: string | undefined
  /**
   * 参与计算的控件 ID 列表
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/output#for MDN
   */
  htmlFor?: string | undefined
  /**
   * 输出控件的名称
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/output#name MDN
   */
  name?: string | undefined
}

/** `<param>` 对象参数元素属性（已弃用） */
/** @deprecated 请使用 `<object>` 元素的属性替代 */
export interface ParamHTMLAttributes<T> extends HTMLAttributes<T> {
  /**
   * 参数名称
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/param#name MDN
   */
  name?: string | undefined
  /**
   * 参数值
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/param#value MDN
   */
  value?: string | number | undefined
}

/** `<progress>` 进度条元素属性 */
export interface ProgressHTMLAttributes<T> extends HTMLAttributes<T> {
  /**
   * 进度的最大值
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/progress#max MDN
   */
  max?: number | string | undefined
  /**
   * 进度的当前值
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/progress#value MDN
   */
  value?: string | number | undefined
}

/** `<slot>` Web Component 插槽元素属性 */
export interface SlotHTMLAttributes<T> extends HTMLAttributes<T> {
  /**
   * 插槽名称，用于匹配模板中的 slot 属性
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/slot#name MDN
   */
  name?: string | undefined
}

/** `<script>` 脚本元素属性 */
export interface ScriptHTMLAttributes<T> extends HTMLAttributes<T> {
  /**
   * 脚本是否异步执行
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/script#async MDN
   */
  async?: boolean | undefined
  /**
   * 脚本文件的字符编码（已弃用）
   *
   * @deprecated 请在 HTTP Content-Type 响应头中指定字符编码，或使用 UTF-8
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/script#charset MDN
   */
  charSet?: string | undefined
  /**
   * 脚本的跨域设置
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/script#crossorigin MDN
   */
  crossOrigin?: CrossOrigin
  /**
   * 脚本是否延迟到文档解析完成后执行
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/script#defer MDN
   */
  defer?: boolean | undefined
  /**
   * 脚本的完整性校验值
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/script#integrity MDN
   */
  integrity?: string | undefined
  /**
   * 脚本是否在支持 ES 模块的浏览器中不执行
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/script#nomodule MDN
   */
  noModule?: boolean | undefined
  /**
   * 获取脚本时的引用策略
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/script#referrerpolicy MDN
   */
  referrerPolicy?: HTMLAttributeReferrerPolicy | undefined
  /**
   * 外部脚本的 URL
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/script#src MDN
   */
  src?: string | undefined
  /**
   * 脚本的 MIME 类型
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/script#type MDN
   */
  type?: string | undefined
}

/** `<select>` 下拉选择元素属性 */
export interface SelectHTMLAttributes<T>
  extends HTMLAttributes<T>, WithEventAttributes<'onChange', T> {
  /**
   * 选择控件的自动完成行为
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/select#autocomplete MDN
   */
  autoComplete?: string | undefined
  /**
   * 选择控件是否禁用
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/select#disabled MDN
   */
  disabled?: boolean | undefined
  /**
   * 关联的表单元素 ID
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/select#form MDN
   */
  form?: string | undefined
  /**
   * 是否允许选择多个选项
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/select#multiple MDN
   */
  multiple?: boolean | undefined
  /**
   * 选择控件的名称
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/select#name MDN
   */
  name?: string | undefined
  /**
   * 提交表单前是否必须选择一个选项
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/select#required MDN
   */
  required?: boolean | undefined
  /**
   * 可见选项的数量
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/select#size MDN
   */
  size?: number | undefined
}

/** `<source>` 媒体源元素属性 */
export interface SourceHTMLAttributes<T> extends HTMLAttributes<T> {
  /**
   * 媒体源的固有高度
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/source#height MDN
   */
  height?: number | string | undefined
  /** 媒体源适用的媒体查询 */
  media?: string | undefined
  /**
   * 响应式图像源的尺寸列表
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/source#sizes MDN
   */
  sizes?: string | undefined
  /**
   * 媒体资源的 URL
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/source#src MDN
   */
  src?: string | undefined
  /**
   * 响应式图像源的候选 URL 列表
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/source#srcset MDN
   */
  srcSet?: string | undefined
  /**
   * 媒体资源的 MIME 类型
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/source#type MDN
   */
  type?: string | undefined
  /**
   * 媒体源的固有宽度
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/source#width MDN
   */
  width?: number | string | undefined
}

/** `<style>` 样式元素属性 */
export interface StyleHTMLAttributes<T> extends HTMLAttributes<T> {
  /** 样式适用的媒体查询 */
  media?: string | undefined
  /**
   * 样式是否仅应用于父元素及其子元素（已弃用）
   *
   * @deprecated 请使用 CSS 作用域样式或 Shadow DOM 替代
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/style#scoped MDN
   */
  scoped?: boolean | undefined
  /**
   * 样式语言的 MIME 类型
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/style#type MDN
   */
  type?: string | undefined
}

/** `<table>` 表格元素属性 */
export interface TableHTMLAttributes<T> extends HTMLAttributes<T> {
  /**
   * 表格的对齐方式（已弃用）
   *
   * @deprecated 请使用 CSS text-align 属性替代
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/table#align MDN
   */
  align?: 'left' | 'center' | 'right' | undefined
  /**
   * 表格的背景颜色（已弃用）
   *
   * @deprecated 请使用 CSS background-color 属性替代
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/table#bgcolor MDN
   */
  bgcolor?: string | undefined
  /**
   * 表格边框宽度（已弃用）
   *
   * @deprecated 请使用 CSS border 属性替代
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/table#border MDN
   */
  border?: number | undefined
  /**
   * 单元格内边距（已弃用）
   *
   * @deprecated 请使用 CSS padding 属性替代
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/table#cellpadding MDN
   */
  cellPadding?: number | string | undefined
  /**
   * 单元格间距（已弃用）
   *
   * @deprecated 请使用 CSS border-spacing 属性替代
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/table#cellspacing MDN
   */
  cellSpacing?: number | string | undefined
  /**
   * 表格外边框的显示方式（已弃用）
   *
   * @deprecated 请使用 CSS border 属性替代
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/table#frame MDN
   */
  frame?: boolean | undefined
  /**
   * 表格内部分隔线的显示方式（已弃用）
   *
   * @deprecated 请使用 CSS border 属性替代
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/table#rules MDN
   */
  rules?: 'none' | 'groups' | 'rows' | 'columns' | 'all' | undefined
  /**
   * 表格摘要描述（已弃用）
   *
   * @deprecated 请使用 aria-describedby 属性或普通文本描述替代
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/table#summary MDN
   */
  summary?: string | undefined
  /**
   * 表格宽度（已弃用）
   *
   * @deprecated 请使用 CSS width 属性替代
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/table#width MDN
   */
  width?: number | string | undefined
}

/** `<textarea>` 文本区域元素属性 */
export interface TextareaHTMLAttributes<T> extends HTMLAttributes<T> {
  /**
   * 文本区域的自动完成行为
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/textarea#autocomplete MDN
   */
  autoComplete?: string | undefined
  /**
   * 文本区域的可见列数
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/textarea#cols MDN
   */
  cols?: number | undefined
  /**
   * 文本方向的提交字段名称
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/textarea#dirname MDN
   */
  dirName?: string | undefined
  /**
   * 文本区域是否禁用
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/textarea#disabled MDN
   */
  disabled?: boolean | undefined
  /**
   * 关联的表单元素 ID
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/textarea#form MDN
   */
  form?: string | undefined
  /**
   * 用户可输入的最大字符数
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/textarea#maxlength MDN
   */
  maxLength?: number | undefined
  /**
   * 用户可输入的最小字符数
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/textarea#minlength MDN
   */
  minLength?: number | undefined
  /**
   * 文本区域的名称
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/textarea#name MDN
   */
  name?: string | undefined
  /**
   * 文本区域的占位提示文本
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/textarea#placeholder MDN
   */
  placeholder?: string | undefined
  /**
   * 文本区域是否只读
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/textarea#readonly MDN
   */
  readOnly?: boolean | undefined
  /**
   * 提交表单前是否必须填写
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/textarea#required MDN
   */
  required?: boolean | undefined
  /**
   * 文本区域的可见行数
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/textarea#rows MDN
   */
  rows?: number | undefined
  /**
   * 文本区域的当前值
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/textarea#value MDN
   */
  value?: string | number | undefined
  /**
   * 文本换行方式
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/textarea#wrap MDN
   */
  wrap?: string | undefined

  /** 文本内容变化事件处理函数 */
  onChange?: VitarxEventHandler<T> | undefined
}

/** `<td>` 表格数据单元格元素属性 */
export interface TdHTMLAttributes<T> extends HTMLAttributes<T> {
  /**
   * 单元格的水平对齐方式（已弃用）
   *
   * @deprecated 请使用 CSS text-align 属性替代
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/td#align MDN
   */
  align?: 'left' | 'center' | 'right' | 'justify' | 'char' | undefined
  /**
   * 单元格跨越的列数
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/td#colspan MDN
   */
  colSpan?: number | undefined
  /**
   * 与该单元格相关的表头单元格 ID 列表
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/td#headers MDN
   */
  headers?: string | undefined
  /**
   * 单元格跨越的行数
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/td#rowspan MDN
   */
  rowSpan?: number | undefined
  /**
   * 单元格在表头中的范围（已弃用，用于 td 无效）
   *
   * @deprecated 该属性在 `<td>` 元素上无效，只在 `<th>` 上有效
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/td#scope MDN
   */
  scope?: string | undefined
  /**
   * 单元格的缩写描述（已弃用）
   *
   * @deprecated 请使用 aria-describedby 属性替代
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/td#abbr MDN
   */
  abbr?: string | undefined
  /**
   * 单元格高度（已弃用）
   *
   * @deprecated 请使用 CSS height 属性替代
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/td#height MDN
   */
  height?: number | string | undefined
  /**
   * 单元格宽度（已弃用）
   *
   * @deprecated 请使用 CSS width 属性替代
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/td#width MDN
   */
  width?: number | string | undefined
  /**
   * 单元格的垂直对齐方式（已弃用）
   *
   * @deprecated 请使用 CSS vertical-align 属性替代
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/td#valign MDN
   */
  valign?: 'top' | 'middle' | 'bottom' | 'baseline' | undefined
}

/** `<th>` 表格表头单元格元素属性 */
export interface ThHTMLAttributes<T> extends HTMLAttributes<T> {
  /**
   * 单元格的水平对齐方式（已弃用）
   *
   * @deprecated 请使用 CSS text-align 属性替代
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/th#align MDN
   */
  align?: 'left' | 'center' | 'right' | 'justify' | 'char' | undefined
  /**
   * 单元格跨越的列数
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/th#colspan MDN
   */
  colSpan?: number | undefined
  /**
   * 与该单元格相关的表头单元格 ID 列表
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/th#headers MDN
   */
  headers?: string | undefined
  /**
   * 单元格跨越的行数
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/th#rowspan MDN
   */
  rowSpan?: number | undefined
  /**
   * 表头单元格的范围
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/th#scope MDN
   */
  scope?: string | undefined
  /**
   * 表头单元格的缩写描述（已弃用）
   *
   * @deprecated 请使用 aria-describedby 属性替代
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/th#abbr MDN
   */
  abbr?: string | undefined
}

/** `<time>` 时间元素属性 */
export interface TimeHTMLAttributes<T> extends HTMLAttributes<T> {
  /**
   * 时间的机器可读日期/时间值
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/time#datetime MDN
   */
  dateTime?: string | undefined
}

/** `<track>` 文本轨道元素属性 */
export interface TrackHTMLAttributes<T> extends HTMLAttributes<T> {
  /**
   * 是否启用默认轨道
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/track#default MDN
   */
  default?: boolean | undefined
  /**
   * 文本轨道的类型
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/track#kind MDN
   */
  kind?: string | undefined
  /**
   * 轨道的用户可读标签
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/track#label MDN
   */
  label?: string | undefined
  /**
   * 轨道文件的 URL
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/track#src MDN
   */
  src?: string | undefined
  /**
   * 轨道文本的语言
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/track#srclang MDN
   */
  srcLang?: string | undefined
}

/** `<video>` 视频元素属性 */
export interface VideoHTMLAttributes<T> extends MediaHTMLAttributes<T> {
  /**
   * 视频的显示宽度
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/video#width MDN
   */
  width?: number | string | undefined
  /**
   * 视频的显示高度
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/video#height MDN
   */
  height?: number | string | undefined
  /**
   * 是否以内联方式播放，不进入全屏
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/video#playsinline MDN
   */
  playsInline?: boolean | undefined
  /**
   * 视频未播放时的海报图像 URL
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/video#poster MDN
   */
  poster?: string | undefined
  /**
   * 是否禁用画中画模式
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/video#disablepictureinpicture MDN
   */
  disablePictureInPicture?: boolean | undefined
  /**
   * 是否禁用远程播放
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/video#disableremoteplayback MDN
   */
  disableRemotePlayback?: boolean | undefined
}

/** MathML 元素基础属性 */
export interface MathMLElementAttributes<T> extends HTMLAttributes<T> {}

/** `<math>` 数学元素属性 */
export interface MathElementAttributes<T> extends HTMLAttributes<T> {
  /**
   * 数学表达式的显示模式
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/MathML/Element/math#display MDN
   */
  display?: 'block' | 'normal' | 'inline' | 'compact' | undefined
}

/** `<annotation-xml>` 注解 XML 元素属性 */
export interface AnnotationXmlAttributes<T> extends MathMLElementAttributes<T> {
  /**
   * 注解内容的编码格式
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/MathML/Element/annotation-xml#encoding MDN
   */
  encoding?: string | undefined
}
