import type {
  AnchorHTMLAttributes,
  AnnotationXmlAttributes,
  AreaHTMLAttributes,
  AudioHTMLAttributes,
  BaseHTMLAttributes,
  BlockquoteHTMLAttributes,
  ButtonHTMLAttributes,
  CanvasHTMLAttributes,
  ColgroupHTMLAttributes,
  ColHTMLAttributes,
  DataHTMLAttributes,
  DelHTMLAttributes,
  DetailsHTMLAttributes,
  DialogHTMLAttributes,
  EmbedHTMLAttributes,
  FieldsetHTMLAttributes,
  FormHTMLAttributes,
  HTMLAttributes,
  HtmlHTMLAttributes,
  IframeHTMLAttributes,
  ImgHTMLAttributes,
  InputHTMLAttributes,
  InsHTMLAttributes,
  KeygenHTMLAttributes,
  LabelHTMLAttributes,
  LiHTMLAttributes,
  LinkHTMLAttributes,
  MapHTMLAttributes,
  MathElementAttributes,
  MathMLElementAttributes,
  MenuHTMLAttributes,
  MetaHTMLAttributes,
  MeterHTMLAttributes,
  ObjectHTMLAttributes,
  OlHTMLAttributes,
  OptgroupHTMLAttributes,
  OptionHTMLAttributes,
  OutputHTMLAttributes,
  ParamHTMLAttributes,
  ProgressHTMLAttributes,
  QuoteHTMLAttributes,
  ScriptHTMLAttributes,
  SelectHTMLAttributes,
  SlotHTMLAttributes,
  SourceHTMLAttributes,
  StyleHTMLAttributes,
  SVGAttributes,
  TableHTMLAttributes,
  TdHTMLAttributes,
  TextareaHTMLAttributes,
  ThHTMLAttributes,
  TimeHTMLAttributes,
  TrackHTMLAttributes,
  VideoHTMLAttributes,
  WebViewHTMLAttributes
} from './attributes.js'

/**
 * Electron WebView 元素接口
 *
 * 这是 Electron 框架特有的非标准元素，用于在应用中嵌入独立的 Web 内容。
 * 运行在独立进程中，与主应用隔离。
 *
 * @deprecated Electron 官方已不推荐使用，建议改用 iframe 或 WebContentsView
 *
 * @see https://www.electronjs.org/docs/latest/api/webview-tag Electron 文档
 */
interface WebViewElement extends HTMLElement {
  // 属性
  allowFullScreen: boolean
  allowpopups: boolean
  autosize: boolean
  blinkfeatures: string
  disableblinkfeatures: string
  disableguestresize: boolean
  disablewebsecurity: boolean
  guestinstance: string
  httpreferrer: string
  nodeintegration: boolean
  partition: string
  plugins: boolean
  preload: string
  src: string
  useragent: string
  webpreferences: string

  // 方法
  /** 加载指定 URL */
  loadURL(url: string): void
  /** 重新加载页面 */
  reload(): void
  /** 后退 */
  goBack(): void
  /** 前进 */
  goForward(): void
  /** 停止加载 */
  stop(): void
  /** 执行 JavaScript 代码 */
  executeJavaScript(code: string, userGesture?: boolean): Promise<any>
  /** 打印页面 */
  print(): void
  /** 捕获页面截图 */
  capturePage(rect?: WebViewRectangle): Promise<WebViewNativeImage>
  /** 打开开发者工具 */
  openDevTools(options?: WebViewOpenDevToolsOptions): void
  /** 关闭开发者工具 */
  closeDevTools(): void
  /** 发送 IPC 消息到主进程 */
  send(channel: string, ...args: any[]): void

  // 事件（作为属性存在）
  addEventListener<K extends keyof WebViewElementEventMap>(
    type: K,
    listener: (event: WebViewElementEventMap[K]) => void,
    options?: boolean | AddEventListenerOptions
  ): void
  removeEventListener<K extends keyof WebViewElementEventMap>(
    type: K,
    listener: (event: WebViewElementEventMap[K]) => void,
    options?: boolean | EventListenerOptions
  ): void
}

/** WebView 矩形区域类型 */
interface WebViewRectangle {
  x: number
  y: number
  width: number
  height: number
}

/** WebView 原生图片类型 */
interface WebViewNativeImage {
  toPNG(): Buffer
  toJPEG(quality: number): Buffer
  toBitmap(): Buffer
  getSize(): { width: number; height: number }
}

/** WebView 打开开发者工具选项 */
interface WebViewOpenDevToolsOptions {
  mode?: 'right' | 'bottom' | 'undocked' | 'detach'
  activate?: boolean
}

/** WebView 元素事件类型映射 */
interface WebViewElementEventMap {
  'dom-ready': Event
  'did-start-loading': Event
  'did-stop-loading': Event
  'did-finish-load': Event
  'did-fail-load': Event
  'did-frame-finish-load': Event
  'will-navigate': Event
  'did-navigate': Event
  'did-navigate-in-page': Event
  'new-window': Event
  close: Event
  'ipc-message': Event
  'console-message': Event
  'context-menu': Event
  login: Event
  crashed: Event
  'plugin-crashed': Event
  destroyed: Event
}

/**
 * HTML 元素映射接口，扩展了 HTMLElementTagNameMap
 */
interface HTMLElementMap extends HTMLElementTagNameMap {
  /**
   * HTML 大号文本元素，用于显示大号字体文本
   *
   * @deprecated 已废弃，请使用 CSS font-size 属性改变文本大小
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/big MDN Web Docs
   */
  big: HTMLElement
  /**
   * HTML 居中元素，用于将其内容水平居中显示
   *
   * @deprecated 已废弃，请使用 CSS 居中布局
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/center MDN Web Docs
   */
  center: HTMLElement
  /**
   * `<webview>` WebView 元素，是 Electron 框架特有的非标准元素，用于在应用中嵌入独立的 Web 内容
   *
   * @deprecated 这不是标准 HTML 元素，仅在 Electron 环境中可用；Electron 官方已不推荐使用，建议改用 iframe 或 WebContentsView
   *
   * @example
   * ```html
   * <!-- 仅在 Electron 应用中有效（需启用 webviewTag: true） -->
   * <webview src="https://example.com" width="640" height="480"></webview>
   * ```
   *
   * @see https://www.electronjs.org/docs/latest/api/webview-tag Electron 文档
   */
  webview: WebViewElement
}

/**
 * SVG 元素映射接口，扩展了 SVGElementTagNameMap
 */
interface SVGElementMap extends SVGElementTagNameMap {}

/**
 * MathML 元素映射接口，扩展了 MathMLElementTagNameMap
 */
interface MathMLElementMap extends MathMLElementTagNameMap {}

/**
 * 元素映射接口，扩展了 HTMLElementMap、SVGElementMap 和 MathMLElementMap
 */
export interface AllElementMap
  extends
    HTMLElementMap,
    Omit<SVGElementMap, 'a' | 'style' | 'script' | 'title'>,
    Omit<MathMLElementMap, 'a'> {}

/**
 * HTML 内置元素映射，用于 JSX.IntrinsicElements
 */
export interface HTMLIntrinsicElement {
  // HTML
  /**
   * `<a>` 锚元素，用于创建超链接，可链接到网页、文件、电子邮件地址或页面内的锚点
   *
   * @props
   * - `href` - 链接目标 URL
   * - `target` - 在何处打开链接（_blank, _self, _parent, _top）
   * - `download` - 指定下载链接
   * - `rel` - 链接关系（nofollow, noreferrer, noopener）
   * - `hrefLang` - 链接内容的语言
   *
   * @example
   * ```html
   * <a href="https://example.com">访问示例网站</a>
   * <a href="#section">跳转到页面内锚点</a>
   * <a href="mailto:test@example.com">发送邮件</a>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a MDN Web Docs
   */
  a: AnchorHTMLAttributes<HTMLAnchorElement>
  /**
   * `<abbr>` 缩写元素，用于表示缩写词或首字母缩略词，鼠标悬停时可显示完整含义
   *
   * @example
   * ```html
   * <abbr title="HyperText Markup Language">HTML</abbr>
   * <abbr title="世界卫生组织">WHO</abbr>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/abbr MDN Web Docs
   */
  abbr: HTMLAttributes<HTMLElement>
  /**
   * `<address>` 联系方式元素，用于表示个人或组织的联系信息
   *
   * @example
   * ```html
   * <address>
   *   作者：张三<br>
   *   邮箱：zhangsan@example.com<br>
   *   地址：北京市朝阳区xxx路
   * </address>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/address MDN Web Docs
   */
  address: HTMLAttributes<HTMLElement>
  /**
   * `<area>` 图像区域元素，用于在图像映射中定义可点击的热区
   *
   * @example
   * ```html
   * <map name="image-map">
   *   <area shape="rect" coords="0,0,100,100" href="page1.html" alt="区域1">
   *   <area shape="circle" coords="200,150,50" href="page2.html" alt="区域2">
   * </map>
   * <img usemap="#image-map" src="map.png" alt="图像映射">
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/area MDN Web Docs
   */
  area: AreaHTMLAttributes<HTMLAreaElement>
  /**
   * `<article>` 文章元素，表示页面中独立的、可复用的内容块，如博客文章、新闻条目等
   *
   * @example
   * ```html
   * <article>
   *   <h2>文章标题</h2>
   *   <p>文章内容...</p>
   * </article>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/article MDN Web Docs
   */
  article: HTMLAttributes<HTMLElement>
  /**
   * `<aside>` 侧边栏元素，表示与主内容间接相关的辅助内容，如侧边栏、广告、引用块等
   *
   * @example
   * ```html
   * <aside>
   *   <h3>相关推荐</h3>
   *   <p>推荐内容...</p>
   * </aside>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/aside MDN Web Docs
   */
  aside: HTMLAttributes<HTMLElement>
  /**
   * `<audio>` 音频元素，用于在文档中嵌入音频内容
   *
   * @props
   * - `src` - 音频文件 URL
   * - `controls` - 显示播放控件
   * - `autoplay` - 自动播放
   * - `loop` - 循环播放
   * - `muted` - 静音播放
   * - `preload` - 预加载策略（auto, metadata, none）
   *
   * @example
   * ```html
   * <audio src="music.mp3" controls>
   * <audio controls>
   *   <source src="music.ogg" type="audio/ogg">
   *   <source src="music.mp3" type="audio/mpeg">
   * </audio>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/audio MDN Web Docs
   */
  audio: AudioHTMLAttributes<HTMLAudioElement>
  /**
   * `<b>` 关注元素，用于吸引读者注意力的文本，不表示额外重要性（如关键词、产品名称）
   *
   * @example
   * ```html
   * <p>请使用 <b>Ctrl+S</b> 保存文件</p>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/b MDN Web Docs
   */
  b: HTMLAttributes<HTMLElement>
  /**
   * `<base>` 基准 URL 元素，用于指定文档中所有相对 URL 的基础地址
   *
   * @props
   * - `href` - 基准 URL
   * - `target` - 默认目标窗口
   *
   * @example
   * ```html
   * <head>
   *   <base href="https://example.com/" target="_blank">
   * </head>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/base MDN Web Docs
   */
  base: BaseHTMLAttributes<HTMLBaseElement>
  /**
   * `<bdi>` 双向隔离元素，使文本的双向算法独立于周围文本处理，避免方向混淆
   *
   * @example
   * ```html
   * <p>用户 <bdi>إبراهيم</bdi> 获得了 10 分</p>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/bdi MDN Web Docs
   */
  bdi: HTMLAttributes<HTMLElement>
  /**
   * `<bdo>` 双向覆盖元素，用于覆盖文本的默认显示方向
   *
   * @props
   * - `dir` - 文本方向（ltr, rtl）
   *
   * @example
   * ```html
   * <bdo dir="rtl">这段文字将从右到左显示</bdo>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/bdo MDN Web Docs
   */
  bdo: HTMLAttributes<HTMLElement>
  /**
   * `<big>` 大号文本元素，用于显示大号字体文本
   *
   * @deprecated 已废弃，请使用 CSS font-size 属性改变文本大小
   *
   * @example
   * ```html
   * <!-- 不推荐使用，请改用 CSS -->
   * <big>大号文本</big>
   * <span style="font-size: larger">大号文本</span>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/big MDN Web Docs
   */
  big: HTMLAttributes<HTMLElement>
  /**
   * `<blockquote>` 块引用元素，用于表示从其他来源引用的段落级内容
   *
   * @props
   * - `cite` - 引用来源 URL
   *
   * @example
   * ```html
   * <blockquote cite="https://example.com/source">
   *   <p>学而不思则罔，思而不学则殆。</p>
   * </blockquote>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/blockquote MDN Web Docs
   */
  blockquote: BlockquoteHTMLAttributes<HTMLQuoteElement>
  /**
   * `<body>` 文档主体元素，表示 HTML 文档的内容区域
   *
   * @deprecated 禁止在组件中使用此元素，HTML文档中仅应存在一个body，它通常位于入口 index.html
   *
   * @example
   * ```html
   * <body>
   *   <h1>页面标题</h1>
   *   <p>页面内容</p>
   * </body>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/body MDN Web Docs
   */
  body: HTMLAttributes<HTMLBodyElement>
  /**
   * `<br>` 换行元素，在文本中产生一个换行
   *
   * @example
   * ```html
   * <p>第一行<br>第二行<br>第三行</p>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/br MDN Web Docs
   */
  br: HTMLAttributes<HTMLBRElement>
  /**
   * `<button>` 按钮元素，表示一个可点击的交互式按钮
   *
   * @props
   * - `type` - 按钮类型（button, submit, reset）
   * - `disabled` - 是否禁用按钮
   * - `form` - 关联的表单 ID
   * - `formAction` - 表单提交 URL
   * - `formMethod` - 表单提交方法
   *
   * @example
   * ```html
   * <button type="submit">提交</button>
   * <button type="button" disabled>不可用按钮</button>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/button MDN Web Docs
   */
  button: ButtonHTMLAttributes<HTMLButtonElement>
  /**
   * `<canvas>` 画布元素，提供一块位图画布，可通过脚本（通常是 JavaScript）动态绘制图形
   *
   * @props
   * - `width` - 画布宽度
   * - `height` - 画布高度
   *
   * @example
   * ```html
   * <canvas id="myCanvas" width="300" height="200"></canvas>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/canvas MDN Web Docs
   */
  canvas: CanvasHTMLAttributes<HTMLCanvasElement>
  /**
   * `<caption>` 表格标题元素，用于指定表格的标题说明
   *
   * @example
   * ```html
   * <table>
   *   <caption>2024年销售数据</caption>
   *   <tr><th>月份</th><th>销售额</th></tr>
   * </table>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/caption MDN Web Docs
   */
  caption: HTMLAttributes<HTMLElement>
  /**
   * `<center>` 居中元素，用于将其内容水平居中显示
   *
   * @deprecated 已废弃，请使用 CSS 居中布局
   *
   * @example
   * ```html
   * <!-- 不推荐使用，请改用 CSS -->
   * <center>居中文本</center>
   * <div style="text-align: center">居中文本</div>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/center MDN Web Docs
   */
  center: HTMLAttributes<HTMLElement>
  /**
   * `<cite>` 引用标题元素，用于标记被引用作品的标题（如书名、文章名、影视名）
   *
   * @example
   * ```html
   * <p>我最喜欢的书是 <cite>红楼梦</cite></p>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/cite MDN Web Docs
   */
  cite: HTMLAttributes<HTMLElement>
  /**
   * `<code>` 代码元素，用于以等宽字体显示计算机代码片段
   *
   * @example
   * ```html
   * <p>使用 <code>console.log()</code> 输出调试信息</p>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/code MDN Web Docs
   */
  code: HTMLAttributes<HTMLElement>
  /**
   * `<col>` 表格列元素，用于定义表格中一列的语义属性，常与 `<colgroup>` 配合使用
   *
   * @props
   * - `span` - 跨越的列数
   *
   * @example
   * ```html
   * <table>
   *   <colgroup>
   *     <col style="width: 30%">
   *     <col style="width: 70%">
   *   </colgroup>
   *   <tr><td>列1</td><td>列2</td></tr>
   * </table>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/col MDN Web Docs
   */
  col: ColHTMLAttributes<HTMLTableColElement>
  /**
   * `<colgroup>` 表格列组元素，用于将表格中的列分组，以便统一设置样式
   *
   * @props
   * - `span` - 跨越的列数
   *
   * @example
   * ```html
   * <table>
   *   <colgroup>
   *     <col span="2" style="background-color: #f0f0f0">
   *     <col style="background-color: #e0e0e0">
   *   </colgroup>
   *   <tr><td>A1</td><td>B1</td><td>C1</td></tr>
   * </table>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/colgroup MDN Web Docs
   */
  colgroup: ColgroupHTMLAttributes<HTMLTableColElement>
  /**
   * `<data>` 数据元素，将给定内容与机器可读的翻译值关联起来
   *
   * @props
   * - `value` - 机器可读的值
   *
   * @example
   * ```html
   * <data value="10001">苹果</data>
   * <data value="10002">香蕉</data>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/data MDN Web Docs
   */
  data: DataHTMLAttributes<HTMLDataElement>
  /**
   * `<datalist>` 数据列表元素，包含一组 `<option>` 元素，为其他控件提供预定义的选项列表
   *
   * @example
   * ```html
   * <input list="browsers" name="browser">
   * <datalist id="browsers">
   *   <option value="Chrome">
   *   <option value="Firefox">
   *   <option value="Safari">
   * </datalist>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/datalist MDN Web Docs
   */
  datalist: HTMLAttributes<HTMLDataListElement>
  /**
   * `<dd>` 描述详情元素，在描述列表中提供前述术语（`<dt>`）的定义、描述或值
   *
   * @example
   * ```html
   * <dl>
   *   <dt>HTML</dt>
   *   <dd>超文本标记语言</dd>
   *   <dt>CSS</dt>
   *   <dd>层叠样式表</dd>
   * </dl>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dd MDN Web Docs
   */
  dd: HTMLAttributes<HTMLElement>
  /**
   * `<del>` 删除文本元素，表示文档中已被删除的文本范围
   *
   * @example
   * ```html
   * <p>原价 <del>99元</del> 现价 59元</p>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/del MDN Web Docs
   */
  del: DelHTMLAttributes<HTMLModElement>
  /**
   * `<details>` 折叠面板元素，创建一个可展开/折叠的披露组件，点击可切换内容的显示状态
   *
   * @example
   * ```html
   * <details>
   *   <summary>点击展开详情</summary>
   *   <p>这里是隐藏的详细内容</p>
   * </details>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/details MDN Web Docs
   */
  details: DetailsHTMLAttributes<HTMLDetailsElement>
  /**
   * `<dfn>` 定义元素，用于标记在定义语境中被定义的术语
   *
   * @example
   * ```html
   * <p><dfn>HTML</dfn> 是一种用于创建网页的标记语言</p>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dfn MDN Web Docs
   */
  dfn: HTMLAttributes<HTMLElement>
  /**
   * `<dialog>` 对话框元素，表示模态或非模态的对话框及其他交互组件
   *
   * @props
   * - `open` - 是否打开对话框
   *
   * @example
   * ```html
   * <dialog id="myDialog">
   *   <p>这是一个对话框</p>
   *   <button onclick="document.getElementById('myDialog').close()">关闭</button>
   * </dialog>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog MDN Web Docs
   */
  dialog: DialogHTMLAttributes<HTMLDialogElement>
  /**
   * `<div>` 通用容器元素，是流内容的通用包装器，无语义含义
   *
   * @example
   * ```html
   * <div class="container">
   *   <h2>标题</h2>
   *   <p>内容</p>
   * </div>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/div MDN Web Docs
   */
  div: HTMLAttributes<HTMLDivElement>
  /**
   * `<dl>` 描述列表元素，包含一组术语和描述的配对列表
   *
   * @example
   * ```html
   * <dl>
   *   <dt>JavaScript</dt>
   *   <dd>一种脚本语言</dd>
   *   <dt>TypeScript</dt>
   *   <dd>JavaScript 的超集</dd>
   * </dl>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dl MDN Web Docs
   */
  dl: HTMLAttributes<HTMLDListElement>
  /**
   * `<dt>` 描述术语元素，在描述列表中指定一个术语，必须放在 `<dl>` 元素内
   *
   * @example
   * ```html
   * <dl>
   *   <dt>Vue</dt>
   *   <dd>渐进式 JavaScript 框架</dd>
   * </dl>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dt MDN Web Docs
   */
  dt: HTMLAttributes<HTMLElement>
  /**
   * `<em>` 强调元素，标记需要重读的文本，默认以斜体显示
   *
   * @example
   * ```html
   * <p>你<em>必须</em>在截止日期前提交</p>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/em MDN Web Docs
   */
  em: HTMLAttributes<HTMLElement>
  /**
   * `<embed>` 嵌入元素，用于在文档中嵌入外部内容（如插件、多媒体）
   *
   * @props
   * - `src` - 嵌入内容的 URL
   * - `type` - MIME 类型
   * - `width` - 宽度
   * - `height` - 高度
   *
   * @example
   * ```html
   * <embed type="video/mp4" src="movie.mp4" width="400" height="300">
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/embed MDN Web Docs
   */
  embed: EmbedHTMLAttributes<HTMLEmbedElement>
  /**
   * `<fieldset>` 字段集元素，用于将表单中的多个控件和标签分组
   *
   * @props
   * - `disabled` - 是否禁用字段集内所有控件
   * - `form` - 关联的表单 ID
   *
   * @example
   * ```html
   * <fieldset>
   *   <legend>个人信息</legend>
   *   <label>姓名：<input type="text" name="name"></label>
   *   <label>年龄：<input type="number" name="age"></label>
   * </fieldset>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/fieldset MDN Web Docs
   */
  fieldset: FieldsetHTMLAttributes<HTMLFieldSetElement>
  /**
   * `<figcaption>` 图注元素，为其父 `<figure>` 元素的内容提供标题或说明
   *
   * @example
   * ```html
   * <figure>
   *   <img src="photo.jpg" alt="风景照">
   *   <figcaption>美丽的日落风景</figcaption>
   * </figure>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/figcaption MDN Web Docs
   */
  figcaption: HTMLAttributes<HTMLElement>
  /**
   * `<figure>` 图例元素，表示自包含的内容，通常配合 `<figcaption>` 添加说明
   *
   * @example
   * ```html
   * <figure>
   *   <img src="chart.png" alt="数据图表">
   *   <figcaption>图1：2024年月度趋势</figcaption>
   * </figure>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/figure MDN Web Docs
   */
  figure: HTMLAttributes<HTMLElement>
  /**
   * `<footer>` 页脚元素，表示最近祖先分区内容或分区根元素的页脚
   *
   * @example
   * ```html
   * <footer>
   *   <p>&copy; 2024 示例公司. 保留所有权利.</p>
   * </footer>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/footer MDN Web Docs
   */
  footer: HTMLAttributes<HTMLElement>
  /**
   * `<form>` 表单元素，表示包含交互控件的信息提交区域
   *
   * @props
   * - `action` - 表单提交的 URL
   * - `method` - HTTP 方法（get, post）
   * - `enctype` - 表单数据编码类型
   * - `target` - 提交目标（_blank, _self）
   * - `novalidate` - 是否禁用表单验证
   *
   * @example
   * ```html
   * <form action="/submit" method="post">
   *   <label>用户名：<input type="text" name="username"></label>
   *   <label>密码：<input type="password" name="password"></label>
   *   <button type="submit">登录</button>
   * </form>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/form MDN Web Docs
   */
  form: FormHTMLAttributes<HTMLFormElement>
  /**
   * `<h1>` 一级标题元素，表示最高级别的章节标题
   *
   * @example
   * ```html
   * <h1>网站主标题</h1>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/Heading_Elements MDN Web Docs
   */
  h1: HTMLAttributes<HTMLHeadingElement>
  /**
   * `<h2>` 二级标题元素，表示二级章节标题
   *
   * @example
   * ```html
   * <h2>章节标题</h2>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/Heading_Elements MDN Web Docs
   */
  h2: HTMLAttributes<HTMLHeadingElement>
  /**
   * `<h3>` 三级标题元素，表示三级章节标题
   *
   * @example
   * ```html
   * <h3>小节标题</h3>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/Heading_Elements MDN Web Docs
   */
  h3: HTMLAttributes<HTMLHeadingElement>
  /**
   * `<h4>` 四级标题元素，表示四级章节标题
   *
   * @example
   * ```html
   * <h4>段落标题</h4>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/Heading_Elements MDN Web Docs
   */
  h4: HTMLAttributes<HTMLHeadingElement>
  /**
   * `<h5>` 五级标题元素，表示五级章节标题
   *
   * @example
   * ```html
   * <h5>子段落标题</h5>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/Heading_Elements MDN Web Docs
   */
  h5: HTMLAttributes<HTMLHeadingElement>
  /**
   * `<h6>` 六级标题元素，表示最低级别的章节标题
   *
   * @example
   * ```html
   * <h6>最小级别标题</h6>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/Heading_Elements MDN Web Docs
   */
  h6: HTMLAttributes<HTMLHeadingElement>
  /**
   * `<head>` 文档头部元素，包含文档的元数据，如标题、脚本和样式表
   *
   * @example
   * ```html
   * <head>
   *   <meta charset="UTF-8">
   *   <title>页面标题</title>
   *   <link rel="stylesheet" href="style.css">
   * </head>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/head MDN Web Docs
   */
  head: HTMLAttributes<HTMLHeadElement>
  /**
   * `<header>` 页头元素，表示介绍性内容或导航链接的分组区域
   *
   * @example
   * ```html
   * <header>
   *   <h1>网站名称</h1>
   *   <nav>
   *     <a href="/">首页</a>
   *     <a href="/about">关于</a>
   *   </nav>
   * </header>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/header MDN Web Docs
   */
  header: HTMLAttributes<HTMLElement>
  /**
   * `<hgroup>` 标题组元素，将标题与相关内容（如副标题）分组
   *
   * @example
   * ```html
   * <hgroup>
   *   <h1>主标题</h1>
   *   <p>副标题说明文字</p>
   * </hgroup>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/hgroup MDN Web Docs
   */
  hgroup: HTMLAttributes<HTMLElement>
  /**
   * `<hr>` 水平线元素，表示段落级元素之间的主题分隔
   *
   * @example
   * ```html
   * <p>第一章内容</p>
   * <hr>
   * <p>第二章内容</p>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/hr MDN Web Docs
   */
  hr: HTMLAttributes<HTMLHRElement>
  /**
   * `<html>` 根元素，表示 HTML 文档的顶层元素，也称为根元素
   *
   * @example
   * ```html
   * <html lang="zh-CN">
   *   <head>...</head>
   *   <body>...</body>
   * </html>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/html MDN Web Docs
   */
  html: HtmlHTMLAttributes<HTMLHtmlElement>
  /**
   * `<i>` 习语文本元素，表示因某种原因与正常文本区分的文本（如术语、外文短语等）
   *
   * @example
   * ```html
   * <p>他正在学习 <i>JavaScript</i> 语言</p>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/i MDN Web Docs
   */
  i: HTMLAttributes<HTMLElement>
  /**
   * `<iframe>` 内联框架元素，用于在当前 HTML 文档中嵌入另一个文档
   *
   * @props
   * - `src` - 嵌入文档的 URL
   * - `width` - 宽度
   * - `height` - 高度
   * - `title` - 框架标题（无障碍）
   * - `sandbox` - 沙箱安全限制
   * - `allow` - 允许的权限策略
   *
   * @example
   * ```html
   * <iframe src="https://example.com" width="600" height="400" title="嵌入页面"></iframe>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe MDN Web Docs
   */
  iframe: IframeHTMLAttributes<HTMLIFrameElement>
  /**
   * `<img>` 图像元素，在文档中嵌入图片
   *
   * @props
   * - `src` - 图像 URL
   * - `alt` - 替代文本（无障碍）
   * - `width` - 宽度
   * - `height` - 高度
   * - `loading` - 懒加载策略（lazy, eager）
   * - `srcSet` - 响应式图像源
   * - `sizes` - 源尺寸说明
   *
   * @example
   * ```html
   * <img src="photo.jpg" alt="风景照片" width="300" height="200">
   * <img src="icon.svg" alt="图标" loading="lazy">
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img MDN Web Docs
   */
  img: ImgHTMLAttributes<HTMLImageElement>
  /**
   * `<input>` 输入元素，用于创建表单中的交互式控件以接收用户数据
   *
   * @props
   * - `type` - 输入类型（text, password, email, number, checkbox, radio, file 等）
   * - `name` - 表单字段名称
   * - `value` - 当前值
   * - `placeholder` - 占位提示文本
   * - `required` - 是否必填
   * - `disabled` - 是否禁用
   * - `readOnly` - 是否只读
   *
   * @example
   * ```html
   * <input type="text" placeholder="请输入姓名">
   * <input type="email" required>
   * <input type="checkbox" name="agree"> 同意条款
   * <input type="range" min="0" max="100" value="50">
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input MDN Web Docs
   */
  input: InputHTMLAttributes<HTMLInputElement>
  /**
   * `<ins>` 插入文本元素，表示文档中新增的文本范围
   *
   * @example
   * ```html
   * <p>价格：<del>99元</del> <ins>59元</ins></p>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/ins MDN Web Docs
   */
  ins: InsHTMLAttributes<HTMLModElement>
  /**
   * `<kbd>` 键盘输入元素，表示来自键盘、语音输入或其他文本输入设备的用户输入
   *
   * @example
   * ```html
   * <p>按 <kbd>Ctrl</kbd> + <kbd>C</kbd> 复制文本</p>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/kbd MDN Web Docs
   */
  kbd: HTMLAttributes<HTMLElement>
  /**
   * `<keygen>` 密钥对生成元素，用于生成公钥-私钥对
   *
   * @deprecated 已废弃，请使用现代 Web 加密 API 替代
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/keygen MDN Web Docs
   */
  keygen: KeygenHTMLAttributes<HTMLElement>
  /**
   * `<label>` 标签元素，为用户界面中的控件提供说明文字
   *
   * @props
   * - `for` - 关联控件的 ID
   * - `form` - 关联的表单 ID
   *
   * @example
   * ```html
   * <label for="username">用户名：</label>
   * <input id="username" type="text" name="username">
   * <label><input type="checkbox"> 记住我</label>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/label MDN Web Docs
   */
  label: LabelHTMLAttributes<HTMLLabelElement>
  /**
   * `<legend>` 图例元素，为其父 `<fieldset>` 提供标题说明
   *
   * @example
   * ```html
   * <fieldset>
   *   <legend>配送信息</legend>
   *   <label>地址：<input type="text" name="address"></label>
   * </fieldset>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/legend MDN Web Docs
   */
  legend: HTMLAttributes<HTMLLegendElement>
  /**
   * `<li>` 列表项元素，用于表示列表中的单个项目
   *
   * @example
   * ```html
   * <ul>
   *   <li>苹果</li>
   *   <li>香蕉</li>
   *   <li>橙子</li>
   * </ul>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/li MDN Web Docs
   */
  li: LiHTMLAttributes<HTMLLIElement>
  /**
   * `<link>` 链接元素，指定当前文档与外部资源之间的关系，常用于引入样式表
   *
   * @props
   * - `rel` - 关系类型（stylesheet, icon, alternate, prefetch 等）
   * - `href` - 资源 URL
   * - `type` - MIME 类型
   * - `media` - 媒体查询
   * - `as` - 资源类型提示
   *
   * @example
   * ```html
   * <link rel="stylesheet" href="styles.css">
   * <link rel="icon" href="favicon.ico">
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/link MDN Web Docs
   */
  link: LinkHTMLAttributes<HTMLLinkElement>
  /**
   * `<main>` 主体内容元素，表示文档 `<body>` 的主要区域内容
   *
   * @example
   * ```html
   * <main>
   *   <h1>页面主要内容</h1>
   *   <p>这里是页面的核心内容...</p>
   * </main>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/main MDN Web Docs
   */
  main: HTMLAttributes<HTMLElement>
  /**
   * `<map>` 图像映射元素，与 `<area>` 元素配合定义可点击的图像热区
   *
   * @example
   * ```html
   * <map name="navmap">
   *   <area shape="rect" coords="0,0,50,50" href="home.html" alt="首页">
   * </map>
   * <img usemap="#navmap" src="nav.png" alt="导航图">
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/map MDN Web Docs
   */
  map: MapHTMLAttributes<HTMLMapElement>
  /**
   * `<mark>` 标记元素，表示因参考或标注目的而突出显示的文本
   *
   * @example
   * ```html
   * <p>搜索结果中的 <mark>关键词</mark> 会被高亮显示</p>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/mark MDN Web Docs
   */
  mark: HTMLAttributes<HTMLElement>
  /**
   * `<menu>` 菜单元素，是 `<ul>` 的语义替代，浏览器将其视为与 `<ul>` 相同
   *
   * @example
   * ```html
   * <menu>
   *   <li><button onclick="copy()">复制</button></li>
   *   <li><button onclick="paste()">粘贴</button></li>
   * </menu>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/menu MDN Web Docs
   */
  menu: MenuHTMLAttributes<HTMLElement>
  /**
   * `<meta>` 元数据元素，表示无法由其他 HTML 元数据元素表示的元数据信息
   *
   * @props
   * - `charset` - 字符编码
   * - `name` - 元数据名称（viewport, description, keywords 等）
   * - `content` - 元数据内容
   * - `httpEquiv` - HTTP 响应头模拟
   *
   * @example
   * ```html
   * <meta charset="UTF-8">
   * <meta name="viewport" content="width=device-width, initial-scale=1.0">
   * <meta name="description" content="网站描述">
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/meta MDN Web Docs
   */
  meta: MetaHTMLAttributes<HTMLMetaElement>
  /**
   * `<meter>` 度量元素，表示已知范围内的标量值或分数值
   *
   * @props
   * - `value` - 当前值
   * - `min` - 最小值
   * - `max` - 最大值
   * - `low` - 低值阈值
   * - `high` - 高值阈值
   * - `optimum` - 最佳值
   *
   * @example
   * ```html
   * <meter value="0.7" min="0" max="1">70%</meter>
   * <meter value="60" min="0" max="100" low="30" high="80">60分</meter>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/meter MDN Web Docs
   */
  meter: MeterHTMLAttributes<HTMLMeterElement>
  /**
   * `<nav>` 导航元素，表示页面中提供导航链接的区域
   *
   * @example
   * ```html
   * <nav>
   *   <a href="/">首页</a>
   *   <a href="/products">产品</a>
   *   <a href="/about">关于</a>
   *   <a href="/contact">联系我们</a>
   * </nav>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/nav MDN Web Docs
   */
  nav: HTMLAttributes<HTMLElement>
  /**
   * `<noscript>` 无脚本元素，当浏览器不支持脚本或脚本被禁用时显示其内容
   *
   * @example
   * ```html
   * <noscript>
   *   <p>本页面需要启用 JavaScript 才能正常显示</p>
   * </noscript>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/noscript MDN Web Docs
   */
  noscript: HTMLAttributes<HTMLElement>
  /**
   * `<object>` 对象元素，表示外部资源，可作为图像、嵌套浏览上下文或插件资源使用
   *
   * @props
   * - `data` - 对象数据 URL
   * - `type` - MIME 类型
   * - `width` - 宽度
   * - `height` - 高度
   *
   * @example
   * ```html
   * <object data="animation.svg" type="image/svg+xml" width="300" height="200">
   *   <p>您的浏览器不支持 SVG</p>
   * </object>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/object MDN Web Docs
   */
  object: ObjectHTMLAttributes<HTMLObjectElement>
  /**
   * `<ol>` 有序列表元素，表示一个有序的项目列表，通常渲染为编号列表
   *
   * @props
   * - `start` - 起始序号
   * - `reversed` - 是否倒序排列
   * - `type` - 编号类型（1, A, a, I, i）
   *
   * @example
   * ```html
   * <ol>
   *   <li>第一步：打开文件</li>
   *   <li>第二步：编辑内容</li>
   *   <li>第三步：保存文件</li>
   * </ol>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/ol MDN Web Docs
   */
  ol: OlHTMLAttributes<HTMLOListElement>
  /**
   * `<optgroup>` 选项组元素，在 `<select>` 下拉列表中创建选项分组
   *
   * @props
   * - `label` - 分组标签文本
   * - `disabled` - 是否禁用该组选项
   *
   * @example
   * ```html
   * <select name="car">
   *   <optgroup label="德系车">
   *     <option value="bmw">宝马</option>
   *     <option value="benz">奔驰</option>
   *   </optgroup>
   *   <optgroup label="日系车">
   *     <option value="toyota">丰田</option>
   *     <option value="honda">本田</option>
   *   </optgroup>
   * </select>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/optgroup MDN Web Docs
   */
  optgroup: OptgroupHTMLAttributes<HTMLOptGroupElement>
  /**
   * `<option>` 选项元素，定义 `<select>`、`<optgroup>` 或 `<datalist>` 中的选项
   *
   * @props
   * - `value` - 选项值
   * - `selected` - 是否默认选中
   * - `disabled` - 是否禁用
   * - `label` - 标签文本
   *
   * @example
   * ```html
   * <select name="color">
   *   <option value="">请选择颜色</option>
   *   <option value="red">红色</option>
   *   <option value="blue" selected>蓝色</option>
   * </select>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/option MDN Web Docs
   */
  option: OptionHTMLAttributes<HTMLOptionElement>
  /**
   * `<output>` 输出元素，用于显示计算结果或用户操作的输出
   *
   * @example
   * ```html
   * <form oninput="result.value=Number(a.value)+Number(b.value)">
   *   <input type="number" id="a" value="10"> +
   *   <input type="number" id="b" value="20"> =
   *   <output name="result" for="a b">30</output>
   * </form>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/output MDN Web Docs
   */
  output: OutputHTMLAttributes<HTMLOutputElement>
  /**
   * `<p>` 段落元素，表示一个文本段落
   *
   * @example
   * ```html
   * <p>这是一个段落文本。</p>
   * <p>这是另一个段落。</p>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/p MDN Web Docs
   */
  p: HTMLAttributes<HTMLParagraphElement>
  /**
   * `<param>` 参数元素，为 `<object>` 元素定义参数
   *
   * @deprecated 已废弃，请使用 `<object>` 元素的适当属性替代
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/param MDN Web Docs
   */
  param: ParamHTMLAttributes<HTMLParamElement>
  /**
   * `<picture>` 图片容器元素，包含零或多个 `<source>` 和一个 `<img>`，为不同场景提供图片替代版本
   *
   * @example
   * ```html
   * <picture>
   *   <source srcset="photo.webp" type="image/webp">
   *   <source srcset="photo.jpg" type="image/jpeg">
   *   <img src="photo.jpg" alt="照片">
   * </picture>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/picture MDN Web Docs
   */
  picture: HTMLAttributes<HTMLElement>
  /**
   * `<pre>` 预格式化文本元素，表示文本应按 HTML 源码中的原样显示，保留空格和换行
   *
   * @example
   * ```html
   * <pre>
   * function hello() {
   *   console.log('Hello, World!');
   * }
   * </pre>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/pre MDN Web Docs
   */
  pre: HTMLAttributes<HTMLPreElement>
  /**
   * `<progress>` 进度条元素，显示任务的完成进度，通常渲染为进度条
   *
   * @props
   * - `value` - 当前进度值
   * - `max` - 最大值（默认为1）
   *
   * @example
   * ```html
   * <progress value="70" max="100">70%</progress>
   * <progress>加载中...</progress>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/progress MDN Web Docs
   */
  progress: ProgressHTMLAttributes<HTMLProgressElement>
  /**
   * `<q>` 行内引用元素，表示一个简短的行内引用
   *
   * @props
   * - `cite` - 引用来源 URL
   *
   * @example
   * ```html
   * <p>孔子曰：<q>学而时习之，不亦说乎？</q></p>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/q MDN Web Docs
   */
  q: QuoteHTMLAttributes<HTMLQuoteElement>
  /**
   * `<rp>` 注音括号元素，为不支持注音标注的浏览器提供后备括号
   *
   * @example
   * ```html
   * <ruby>
   *   汉 <rp>(</rp><rt>hàn</rt><rp>)</rp>
   *   字 <rp>(</rp><rt>zì</rt><rp>)</rp>
   * </ruby>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/rp MDN Web Docs
   */
  rp: HTMLAttributes<HTMLElement>
  /**
   * `<rt>` 注音文本元素，指定注音标注的发音、翻译或音译信息，用于东亚排版
   *
   * @example
   * ```html
   * <ruby>
   *   漢 <rt>hàn</rt>
   * </ruby>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/rt MDN Web Docs
   */
  rt: HTMLAttributes<HTMLElement>
  /**
   * `<ruby>` 注音元素，表示出现在文字上方或下方的小注音，用于显示发音或含义
   *
   * @example
   * ```html
   * <ruby>
   *   日本語 <rt>にほんご</rt>
   * </ruby>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/ruby MDN Web Docs
   */
  ruby: HTMLAttributes<HTMLElement>
  /**
   * `<s>` 删除线元素，渲染带有删除线的文本，表示不再准确或不再相关的内容
   *
   * @example
   * ```html
   * <p><s>原价 199 元</s> 现价 99 元</p>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/s MDN Web Docs
   */
  s: HTMLAttributes<HTMLElement>
  /**
   * `<samp>` 示例输出元素，用于表示程序或计算机的示例输出文本
   *
   * @example
   * ```html
   * <p>程序输出：<samp>Hello, World!</samp></p>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/samp MDN Web Docs
   */
  samp: HTMLAttributes<HTMLElement>
  /**
   * `<search>` 搜索元素，表示包含搜索相关控件的容器区域
   *
   * @example
   * ```html
   * <search>
   *   <form action="/search">
   *     <input type="search" name="q" placeholder="搜索...">
   *     <button type="submit">搜索</button>
   *   </form>
   * </search>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/search MDN Web Docs
   */
  search: HTMLAttributes<HTMLElement>
  /**
   * `<slot>` 插槽元素，是 Web Component 中的占位符，用户可填充自定义标记
   *
   * @props
   * - `name` - 插槽名称
   *
   * @example
   * ```html
   * <slot name="header">默认头部内容</slot>
   * <slot>默认内容</slot>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/slot MDN Web Docs
   */
  slot: SlotHTMLAttributes<HTMLSlotElement>
  /**
   * `<script>` 脚本元素，用于嵌入可执行代码或数据，通常是 JavaScript
   *
   * @props
   * - `src` - 外部脚本 URL
   * - `type` - MIME 类型
   * - `async` - 异步加载执行
   * - `defer` - 延迟执行
   * - `crossOrigin` - 跨域属性
   *
   * @example
   * ```html
   * <script src="app.js"></script>
   * <script>
   *   console.log('Hello, World!');
   * </script>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script MDN Web Docs
   */
  script: ScriptHTMLAttributes<HTMLScriptElement>
  /**
   * `<section>` 章节元素，表示文档中一个独立的通用章节
   *
   * @example
   * ```html
   * <section>
   *   <h2>功能介绍</h2>
   *   <p>这里是功能介绍的内容...</p>
   * </section>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/section MDN Web Docs
   */
  section: HTMLAttributes<HTMLElement>
  /**
   * `<select>` 下拉选择元素，提供选项菜单的控件
   *
   * @props
   * - `name` - 表单字段名称
   * - `value` - 当前选中值
   * - `multiple` - 是否允许多选
   * - `size` - 可见选项数量
   * - `disabled` - 是否禁用
   * - `required` - 是否必填
   *
   * @example
   * ```html
   * <select name="city">
   *   <option value="">请选择城市</option>
   *   <option value="beijing">北京</option>
   *   <option value="shanghai">上海</option>
   *   <option value="guangzhou">广州</option>
   * </select>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/select MDN Web Docs
   */
  select: SelectHTMLAttributes<HTMLSelectElement>
  /**
   * `<small>` 旁注元素，表示旁注和小字印刷，如版权声明和法律文本
   *
   * @example
   * ```html
   * <p>限时优惠！<small>活动截止至2024年12月31日</small></p>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/small MDN Web Docs
   */
  small: HTMLAttributes<HTMLElement>
  /**
   * `<source>` 媒体源元素，为 `<picture>`、`<audio>` 和 `<video>` 指定多个媒体资源
   *
   * @props
   * - `src` - 媒体资源 URL
   * - `type` - MIME 类型
   * - `srcSet` - 响应式图像源（仅用于 picture）
   * - `sizes` - 源尺寸说明（仅用于 picture）
   * - `media` - 媒体查询（仅用于 picture）
   *
   * @example
   * ```html
   * <video controls>
   *   <source src="movie.webm" type="video/webm">
   *   <source src="movie.mp4" type="video/mp4">
   * </video>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/source MDN Web Docs
   */
  source: SourceHTMLAttributes<HTMLSourceElement>
  /**
   * `<span>` 通用行内容器元素，是短语内容的通用行内包装器，本身无语义
   *
   * @example
   * ```html
   * <p>价格：<span class="price">99元</span></p>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/span MDN Web Docs
   */
  span: HTMLAttributes<HTMLSpanElement>
  /**
   * `<strong>` 重要元素，表示其内容具有很强的重要性、严重性或紧迫性
   *
   * @example
   * ```html
   * <p><strong>警告：</strong>此操作不可逆！</p>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/strong MDN Web Docs
   */
  strong: HTMLAttributes<HTMLElement>
  /**
   * `<style>` 样式元素，包含文档或文档某部分的样式信息
   *
   * @props
   * - `type` - MIME 类型（默认 text/css）
   * - `media` - 媒体查询
   * - `scoped` - 作用域样式（已废弃）
   *
   * @example
   * ```html
   * <style>
   *   .container { max-width: 1200px; margin: 0 auto; }
   * </style>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/style MDN Web Docs
   */
  style: StyleHTMLAttributes<HTMLStyleElement>
  /**
   * `<sub>` 下标元素，指定因排版原因应显示为下标的行内文本
   *
   * @example
   * ```html
   * <p>水的化学式是 H<sub>2</sub>O</p>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/sub MDN Web Docs
   */
  sub: HTMLAttributes<HTMLElement>
  /**
   * `<summary>` 摘要元素，为 `<details>` 折叠面板指定可见的标题
   *
   * @example
   * ```html
   * <details>
   *   <summary>常见问题</summary>
   *   <p>这里是问题的详细解答</p>
   * </details>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/summary MDN Web Docs
   */
  summary: HTMLAttributes<HTMLElement>
  /**
   * `<sup>` 上标元素，指定因排版原因应显示为上标的行内文本
   *
   * @example
   * ```html
   * <p>E = mc<sup>2</sup></p>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/sup MDN Web Docs
   */
  sup: HTMLAttributes<HTMLElement>
  /**
   * `<table>` 表格元素，表示由行列组成的二维表格数据
   *
   * @props
   * - `border` - 边框宽度（已废弃，建议用 CSS）
   * - `cellPadding` - 单元格内边距（已废弃）
   * - `cellSpacing` - 单元格间距（已废弃）
   * - `summary` - 表格摘要（已废弃）
   *
   * @example
   * ```html
   * <table>
   *   <thead>
   *     <tr><th>姓名</th><th>年龄</th></tr>
   *   </thead>
   *   <tbody>
   *     <tr><td>张三</td><td>25</td></tr>
   *     <tr><td>李四</td><td>30</td></tr>
   *   </tbody>
   * </table>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/table MDN Web Docs
   */
  table: TableHTMLAttributes<HTMLTableElement>
  /**
   * `<template>` 模板元素，用于保存不会立即渲染的 HTML，可在运行时通过 JavaScript 实例化
   *
   * @example
   * ```html
   * <template id="row-template">
   *   <tr><td class="name"></td><td class="score"></td></tr>
   * </template>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/template MDN Web Docs
   */
  template: HTMLAttributes<HTMLTemplateElement>
  /**
   * `<tbody>` 表格主体元素，封装一组表格行，表示表格数据的主体部分
   *
   * @example
   * ```html
   * <table>
   *   <tbody>
   *     <tr><td>数据1</td><td>数据2</td></tr>
   *   </tbody>
   * </table>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/tbody MDN Web Docs
   */
  tbody: HTMLAttributes<HTMLTableSectionElement>
  /**
   * `<td>` 表格数据单元格元素，定义表格中包含数据的单元格
   *
   * @example
   * ```html
   * <tr>
   *   <td>张三</td>
   *   <td>25</td>
   * </tr>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/td MDN Web Docs
   */
  td: TdHTMLAttributes<HTMLTableDataCellElement>
  /**
   * `<textarea>` 文本域元素，表示多行纯文本编辑控件
   *
   * @props
   * - `name` - 表单字段名称
   * - `rows` - 可见行数
   * - `cols` - 可见列数
   * - `value` - 当前值
   * - `placeholder` - 占位提示文本
   * - `disabled` - 是否禁用
   * - `readOnly` - 是否只读
   * - `required` - 是否必填
   *
   * @example
   * ```html
   * <textarea name="comment" rows="4" cols="50" placeholder="请输入评论..."></textarea>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/textarea MDN Web Docs
   */
  textarea: TextareaHTMLAttributes<HTMLTextAreaElement>
  /**
   * `<tfoot>` 表格脚注元素，定义表格列的汇总行
   *
   * @example
   * ```html
   * <table>
   *   <tfoot>
   *     <tr><td>合计</td><td>100</td></tr>
   *   </tfoot>
   * </table>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/tfoot MDN Web Docs
   */
  tfoot: HTMLAttributes<HTMLTableSectionElement>
  /**
   * `<th>` 表格标题单元格元素，定义一组表格单元格的标题
   *
   * @props
   * - `scope` - 标题作用域（col, row, colgroup, rowgroup）
   * - `colSpan` - 跨越列数
   * - `rowSpan` - 跨越行数
   *
   * @example
   * ```html
   * <tr>
   *   <th scope="col">姓名</th>
   *   <th scope="col">年龄</th>
   * </tr>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/th MDN Web Docs
   */
  th: ThHTMLAttributes<HTMLTableHeaderCellElement>
  /**
   * `<thead>` 表格头部元素，定义表格列标题的行集合
   *
   * @example
   * ```html
   * <table>
   *   <thead>
   *     <tr><th>姓名</th><th>成绩</th></tr>
   *   </thead>
   * </table>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/thead MDN Web Docs
   */
  thead: HTMLAttributes<HTMLTableSectionElement>
  /**
   * `<time>` 时间元素，表示特定的时间段或日期
   *
   * @props
   * - `datetime` - 机器可读的日期时间值
   *
   * @example
   * ```html
   * <time datetime="2024-01-15">2024年1月15日</time>
   * <time datetime="14:30">下午2:30</time>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/time MDN Web Docs
   */
  time: TimeHTMLAttributes<HTMLTimeElement>
  /**
   * `<title>` 标题元素，定义文档的标题，显示在浏览器标题栏或标签页上
   *
   * @example
   * ```html
   * <title>我的网站 - 首页</title>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/title MDN Web Docs
   */
  title: HTMLAttributes<HTMLTitleElement>
  /**
   * `<tr>` 表格行元素，定义表格中的一行单元格
   *
   * @example
   * ```html
   * <tr>
   *   <th>姓名</th>
   *   <td>张三</td>
   * </tr>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/tr MDN Web Docs
   */
  tr: HTMLAttributes<HTMLTableRowElement>
  /**
   * `<track>` 字幕轨道元素，作为 `&lt;audio&gt;` 和 `<video>` 的子元素，用于指定定时文本轨道
   *
   * @props
   * - `kind` - 轨道类型（subtitles, captions, descriptions, chapters, metadata）
   * - `src` - 轨道文件 URL
   * - `srclang` - 轨道语言
   * - `label` - 轨道标签
   * - `default` - 是否默认启用
   *
   * @example
   * ```html
   * <video src="movie.mp4" controls>
   *   <track kind="subtitles" src="subtitles-zh.vtt" srclang="zh" label="中文字幕">
   *   <track kind="captions" src="captions.vtt" label="英文字幕">
   * </video>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/track MDN Web Docs
   */
  track: TrackHTMLAttributes<HTMLTrackElement>
  /**
   * `<u>` 未标注元素，表示带有非文本注释的行内文本，默认以下划线显示
   *
   * @example
   * ```html
   * <p>这段文字中有<u>拼写错误</u>需要修正</p>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/u MDN Web Docs
   */
  u: HTMLAttributes<HTMLElement>
  /**
   * `<ul>` 无序列表元素，表示无序的项目列表，通常渲染为项目符号列表
   *
   * @example
   * ```html
   * <ul>
   *   <li>苹果</li>
   *   <li>香蕉</li>
   *   <li>橙子</li>
   * </ul>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/ul MDN Web Docs
   */
  ul: HTMLAttributes<HTMLUListElement>
  /**
   * `<var>` 变量元素，表示数学表达式或编程上下文中的变量名
   *
   * @example
   * ```html
   * <p>计算公式为 <var>x</var> = <var>y</var> + 1</p>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/var MDN Web Docs
   */
  var: HTMLAttributes<HTMLElement>
  /**
   * `<video>` 视频元素，在文档中嵌入支持视频播放的媒体播放器
   *
   * @props
   * - `src` - 视频文件 URL
   * - `width` - 宽度
   * - `height` - 高度
   * - `controls` - 显示播放控件
   * - `autoplay` - 自动播放
   * - `loop` - 循环播放
   * - `muted` - 静音播放
   * - `poster` - 预览图 URL
   * - `preload` - 预加载策略
   *
   * @example
   * ```html
   * <video src="movie.mp4" controls width="640" height="360"></video>
   * <video controls poster="preview.jpg">
   *   <source src="movie.webm" type="video/webm">
   *   <source src="movie.mp4" type="video/mp4">
   * </video>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video MDN Web Docs
   */
  video: VideoHTMLAttributes<HTMLVideoElement>
  /**
   * `<wbr>` 换行机会元素，表示一个可选的换行位置，浏览器可在该处断行
   *
   * @example
   * ```html
   * <p>超长单词：Super<wbr>califragilistic<wbr>expialidocious</p>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/wbr MDN Web Docs
   */
  wbr: HTMLAttributes<HTMLElementMap['wbr']>
  /**
   * `<webview>` WebView 元素，用于嵌入原生 WebView 组件
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/webview MDN Web Docs
   */
  webview: WebViewHTMLAttributes<HTMLElement>

  // MathML
  /**
   * `<math>` 数学元素，是 MathML 的顶层容器，所有有效的 MathML 实例必须包裹在 `<math>` 元素中
   *
   * @example
   * ```html
   * <math>
   *   <mfrac><mn>1</mn><mn>2</mn></mfrac>
   * </math>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/MathML/Element/math MDN Web Docs
   */
  math: MathElementAttributes<MathMLElement>
  /**
   * `<annotation-xml>` XML 注解元素，包含 XML 格式的语义注解
   *
   * @example
   * ```html
   * <semantics>
   *   <mfrac><mn>1</mn><mn>2</mn></mfrac>
   *   <annotation-xml encoding="MathML-Content">
   *     <divide><cn>1</cn><cn>2</cn></divide>
   *   </annotation-xml>
   * </semantics>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/MathML/Element/annotation-xml MDN Web Docs
   */
  'annotation-xml': AnnotationXmlAttributes<MathMLElement>
  /**
   * `<annotation>` 注解元素，包含非 XML 格式的语义注解
   *
   * @example
   * ```html
   * <semantics>
   *   <mfrac><mn>1</mn><mn>2</mn></mfrac>
   *   <annotation encoding="application/x-tex">1/2</annotation>
   * </semantics>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/MathML/Element/annotation MDN Web Docs
   */
  annotation: MathMLElementAttributes<MathMLElement>
  /**
   * `<maction>` 动作元素，为数学表达式绑定交互动作
   *
   * @example
   * ```html
   * <math>
   *   <maction actiontype="toggle">
   *     <mtext>点击切换</mtext>
   *     <mtext>已切换</mtext>
   *   </maction>
   * </math>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/MathML/Element/maction MDN Web Docs
   */
  maction: MathMLElementAttributes<MathMLElement>
  /**
   * `<merror>` 错误元素，用于显示错误消息
   *
   * @example
   * ```html
   * <math>
   *   <merror><mtext>语法错误</mtext></merror>
   * </math>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/MathML/Element/merror MDN Web Docs
   */
  merror: MathMLElementAttributes<MathMLElement>
  /**
   * `<mfrac>` 分数元素，用于显示分数
   *
   * @example
   * ```html
   * <math>
   *   <mfrac>
   *     <mi>x</mi>
   *     <mn>2</mn>
   *   </mfrac>
   * </math>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/MathML/Element/mfrac MDN Web Docs
   */
  mfrac: MathMLElementAttributes<MathMLElement>
  /**
   * `<mi>` 标识符元素，表示函数名、变量或符号常量等标识符
   *
   * @example
   * ```html
   * <math>
   *   <mi>x</mi>
   *   <mi>sin</mi>
   * </math>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/MathML/Element/mi MDN Web Docs
   */
  mi: MathMLElementAttributes<MathMLElement>
  /**
   * `<mmultiscripts>` 多重上下标元素，用于为表达式附加任意数量的上下标
   *
   * @example
   * ```html
   * <math>
   *   <mmultiscripts>
   *     <mi>X</mi>
   *     <mn>1</mn><none/>
   *     <mprescripts/>
   *     <none/><mn>2</mn>
   *   </mmultiscripts>
   * </math>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/MathML/Element/mmultiscripts MDN Web Docs
   */
  mmultiscripts: MathMLElementAttributes<MathMLElement>
  /**
   * `<mn>` 数字元素，表示数值字面量，通常是一串数字
   *
   * @example
   * ```html
   * <math>
   *   <mn>42</mn>
   *   <mn>3.14</mn>
   * </math>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/MathML/Element/mn MDN Web Docs
   */
  mn: MathMLElementAttributes<MathMLElement>
  /**
   * `<mo>` 运算符元素，表示广义上的运算符（如 +、-、= 等）
   *
   * @example
   * ```html
   * <math>
   *   <mi>x</mi><mo>+</mo><mi>y</mi>
   * </math>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/MathML/Element/mo MDN Web Docs
   */
  mo: MathMLElementAttributes<MathMLElement>
  /**
   * `<mover>` 上标元素，用于在表达式上方附加重音符号或极限
   *
   * @example
   * ```html
   * <math>
   *   <mover>
   *     <mi>x</mi>
   *     <mo>&#x0304;</mo>
   *   </mover>
   * </math>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/MathML/Element/mover MDN Web Docs
   */
  mover: MathMLElementAttributes<MathMLElement>
  /**
   * `<mpadded>` 填充元素，用于添加额外间距并调整子元素的位置和大小
   *
   * @example
   * ```html
   * <math>
   *   <mpadded width="+1em">
   *     <mi>x</mi>
   *   </mpadded>
   * </math>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/MathML/Element/mpadded MDN Web Docs
   */
  mpadded: MathMLElementAttributes<MathMLElement>
  /**
   * `<mphantom>` 幽灵元素，不可见渲染但保留高度、宽度和基线位置等尺寸
   *
   * @example
   * ```html
   * <math>
   *   <mfrac>
   *     <mrow><mi>x</mi><mo>+</mo><mphantom><mi>y</mi></mphantom></mrow>
   *     <mrow><mphantom><mi>x</mi></mphantom><mo>+</mo><mi>y</mi></mrow>
   *   </mfrac>
   * </math>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/MathML/Element/mphantom MDN Web Docs
   */
  mphantom: MathMLElementAttributes<MathMLElement>
  /**
   * `<mprescripts>` 前置上下标元素，用于在 `<mmultiscripts>` 中放置前置上下标
   *
   * @example
   * ```html
   * <math>
   *   <mmultiscripts>
   *     <mi>X</mi>
   *     <mprescripts/>
   *     <mn>0</mn><none/>
   *   </mmultiscripts>
   * </math>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/MathML/Element/mprescripts MDN Web Docs
   */
  mprescripts: MathMLElementAttributes<MathMLElement>
  /**
   * `<mroot>` 根号元素，用于显示带有显式指数的根号
   *
   * @example
   * ```html
   * <math>
   *   <mroot>
   *     <mi>x</mi>
   *     <mn>3</mn>
   *   </mroot>
   * </math>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/MathML/Element/mroot MDN Web Docs
   */
  mroot: MathMLElementAttributes<MathMLElement>
  /**
   * `<mrow>` 行元素，用于将子表达式分组，通常包含一个或多个运算符及其操作数
   *
   * @example
   * ```html
   * <math>
   *   <mrow>
   *     <mi>a</mi><mo>+</mo><mi>b</mi>
   *   </mrow>
   * </math>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/MathML/Element/mrow MDN Web Docs
   */
  mrow: MathMLElementAttributes<MathMLElement>
  /**
   * `<ms>` 字符串元素，表示由编程语言和计算机代数系统解释的字符串字面量
   *
   * @example
   * ```html
   * <math>
   *   <ms>"hello"</ms>
   * </math>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/MathML/Element/ms MDN Web Docs
   */
  ms: MathMLElementAttributes<MathMLElement>
  /**
   * `<mspace>` 空格元素，用于显示空白区域，其大小由属性设置
   *
   * @example
   * ```html
   * <math>
   *   <mi>x</mi><mspace width="1em"/><mi>y</mi>
   * </math>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/MathML/Element/mspace MDN Web Docs
   */
  mspace: MathMLElementAttributes<MathMLElement>
  /**
   * `<msqrt>` 平方根元素，用于显示不带指数的平方根
   *
   * @example
   * ```html
   * <math>
   *   <msqrt>
   *     <mi>x</mi><mo>+</mo><mn>1</mn>
   *   </msqrt>
   * </math>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/MathML/Element/msqrt MDN Web Docs
   */
  msqrt: MathMLElementAttributes<MathMLElement>
  /**
   * `<mstyle>` 样式元素，用于对其子元素的渲染进行样式修改
   *
   * @example
   * ```html
   * <math>
   *   <mstyle displaystyle="true" mathcolor="red">
   *     <mfrac><mn>1</mn><mn>2</mn></mfrac>
   *   </mstyle>
   * </math>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/MathML/Element/mstyle MDN Web Docs
   */
  mstyle: MathMLElementAttributes<MathMLElement>
  /**
   * `<msub>` 下标元素，用于为表达式附加下标
   *
   * @example
   * ```html
   * <math>
   *   <msub>
   *     <mi>x</mi>
   *     <mn>1</mn>
   *   </msub>
   * </math>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/MathML/Element/msub MDN Web Docs
   */
  msub: MathMLElementAttributes<MathMLElement>
  /**
   * `<msubsup>` 上下标元素，用于同时为表达式附加下标和上标
   *
   * @example
   * ```html
   * <math>
   *   <msubsup>
   *     <mi>x</mi>
   *     <mn>1</mn>
   *     <mn>2</mn>
   *   </msubsup>
   * </math>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/MathML/Element/msubsup MDN Web Docs
   */
  msubsup: MathMLElementAttributes<MathMLElement>
  /**
   * `<msup>` 上标元素，用于为表达式附加上标
   *
   * @example
   * ```html
   * <math>
   *   <msup>
   *     <mi>x</mi>
   *     <mn>2</mn>
   *   </msup>
   * </math>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/MathML/Element/msup MDN Web Docs
   */
  msup: MathMLElementAttributes<MathMLElement>
  /**
   * `<mtable>` 矩阵元素，用于创建表格或矩阵
   *
   * @example
   * ```html
   * <math>
   *   <mtable>
   *     <mtr><mtd><mn>1</mn></mtd><mtd><mn>0</mn></mtd></mtr>
   *     <mtr><mtd><mn>0</mn></mtd><mtd><mn>1</mn></mtd></mtr>
   *   </mtable>
   * </math>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/MathML/Element/mtable MDN Web Docs
   */
  mtable: MathMLElementAttributes<MathMLElement>
  /**
   * `<mtd>` 矩阵单元格元素，表示表格或矩阵中的一个单元格
   *
   * @example
   * ```html
   * <math>
   *   <mtable>
   *     <mtr><mtd><mn>1</mn></mtd></mtr>
   *   </mtable>
   * </math>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/MathML/Element/mtd MDN Web Docs
   */
  mtd: MathMLElementAttributes<MathMLElement>
  /**
   * `<mtext>` 文本元素，用于渲染无数学含义的文本，如注释或说明
   *
   * @example
   * ```html
   * <math>
   *   <mtext>其中</mtext>
   *   <mi>x</mi>
   *   <mtext>为变量</mtext>
   * </math>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/MathML/Element/mtext MDN Web Docs
   */
  mtext: MathMLElementAttributes<MathMLElement>
  /**
   * `<mtr>` 矩阵行元素，表示表格或矩阵中的一行
   *
   * @example
   * ```html
   * <math>
   *   <mtable>
   *     <mtr><mtd><mi>a</mi></mtd><mtd><mi>b</mi></mtd></mtr>
   *   </mtable>
   * </math>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/MathML/Element/mtr MDN Web Docs
   */
  mtr: MathMLElementAttributes<MathMLElement>
  /**
   * `<munder>` 下标元素，用于在表达式下方附加重音符号或极限
   *
   * @example
   * ```html
   * <math>
   *   <munder>
   *     <mo>&#x2211;</mo>
   *     <mrow><mi>i</mi><mo>=</mo><mn>1</mn></mrow>
   *   </munder>
   * </math>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/MathML/Element/munder MDN Web Docs
   */
  munder: MathMLElementAttributes<MathMLElement>
  /**
   * `<munderover>` 上下限元素，用于同时为表达式附加下限和上限
   *
   * @example
   * ```html
   * <math>
   *   <munderover>
   *     <mo>&#x2211;</mo>
   *     <mrow><mi>i</mi><mo>=</mo><mn>1</mn></mrow>
   *     <mi>n</mi>
   *   </munderover>
   * </math>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/MathML/Element/munderover MDN Web Docs
   */
  munderover: MathMLElementAttributes<MathMLElement>
  /**
   * `<semantics>` 语义元素，将注解与 MathML 表达式关联，通常包含内容表达式和表现表达式的配对
   *
   * @example
   * ```html
   * <semantics>
   *   <mfrac><mn>1</mn><mn>2</mn></mfrac>
   *   <annotation encoding="application/x-tex">1/2</annotation>
   * </semantics>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/MathML/Element/semantics MDN Web Docs
   */
  semantics: MathMLElementAttributes<MathMLElement>

  // SVG
  /**
   * `<svg>` SVG 容器元素，定义新的坐标系统和视口，是 SVG 文档的最外层元素
   *
   * @example
   * ```html
   * <svg width="100" height="100" viewBox="0 0 100 100">
   *   <circle cx="50" cy="50" r="40" fill="blue" />
   * </svg>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/SVG/Element/svg MDN Web Docs
   */
  svg: SVGAttributes<SVGSVGElement>
  /**
   * `<animate>` 动画元素，用于随时间动画化元素的属性
   *
   * @example
   * ```html
   * <rect width="100" height="100">
   *   <animate attributeName="width" from="100" to="200" dur="2s" repeatCount="indefinite" />
   * </rect>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/SVG/Element/animate MDN Web Docs
   */
  animate: SVGAttributes<SVGAnimateElement>
  /**
   * `<animateMotion>` 运动路径动画元素，使引用元素沿运动路径移动
   *
   * @example
   * ```html
   * <circle r="5" fill="red">
   *   <animateMotion path="M10,80 C40,10 65,10 95,80" dur="3s" repeatCount="indefinite" />
   * </circle>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/SVG/Element/animateMotion MDN Web Docs
   */
  animateMotion: SVGAttributes<SVGAnimateMotionElement>
  /**
   * `<animateTransform>` 变换动画元素，动画化目标元素的变换属性，控制平移、缩放、旋转和倾斜
   *
   * @example
   * ```html
   * <rect width="50" height="50" fill="green">
   *   <animateTransform attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="2s" repeatCount="indefinite" />
   * </rect>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/SVG/Element/animateTransform MDN Web Docs
   */
  animateTransform: SVGAttributes<SVGAnimateTransformElement>
  /**
   * `<circle>` 圆形元素，SVG 基本形状，基于圆心和半径绘制圆形
   *
   * @example
   * ```html
   * <circle cx="50" cy="50" r="30" fill="red" stroke="black" stroke-width="2" />
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/SVG/Element/circle MDN Web Docs
   */
  circle: SVGAttributes<SVGCircleElement>
  /**
   * `<clipPath>` 裁剪路径元素，定义裁剪路径以限制元素的可见区域
   *
   * @example
   * ```html
   * <clipPath id="myClip">
   *   <circle cx="50" cy="50" r="30" />
   * </clipPath>
   * <rect width="100" height="100" clip-path="url(#myClip)" fill="blue" />
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/SVG/Element/clipPath MDN Web Docs
   */
  clipPath: SVGAttributes<SVGClipPathElement>
  /**
   * `<defs>` 定义元素，用于存储稍后使用的图形对象
   *
   * @example
   * ```html
   * <defs>
   *   <linearGradient id="myGradient">
   *     <stop offset="0%" stop-color="red" />
   *     <stop offset="100%" stop-color="blue" />
   *   </linearGradient>
   * </defs>
   * <rect fill="url(#myGradient)" width="100" height="100" />
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/SVG/Element/defs MDN Web Docs
   */
  defs: SVGAttributes<SVGDefsElement>
  /**
   * `<desc>` 描述元素，为 SVG 容器或图形元素提供无障碍的长文本描述
   *
   * @example
   * ```html
   * <desc>这是一张展示数据趋势的折线图</desc>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/SVG/Element/desc MDN Web Docs
   */
  desc: SVGAttributes<SVGDescElement>
  /**
   * `<ellipse>` 椭圆元素，SVG 基本形状，基于圆心和两个半径绘制椭圆
   *
   * @example
   * ```html
   * <ellipse cx="100" cy="50" rx="80" ry="30" fill="yellow" />
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/SVG/Element/ellipse MDN Web Docs
   */
  ellipse: SVGAttributes<SVGEllipseElement>
  /**
   * `<feBlend>` 混合滤镜元素，使用常见图像混合模式合成两个对象
   *
   * @example
   * ```html
   * <filter id="blend">
   *   <feBlend in="SourceGraphic" in2="BackgroundImage" mode="multiply" />
   * </filter>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feBlend MDN Web Docs
   */
  feBlend: SVGAttributes<SVGFEBlendElement>
  /**
   * `<feColorMatrix>` 颜色矩阵滤镜元素，基于变换矩阵改变颜色
   *
   * @example
   * ```html
   * <filter id="grayscale">
   *   <feColorMatrix type="saturate" values="0" />
   * </filter>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feColorMatrix MDN Web Docs
   */
  feColorMatrix: SVGAttributes<SVGFEColorMatrixElement>
  /**
   * `<feComponentTransfer>` 分量传递滤镜元素，对每个像素的颜色分量进行重映射
   *
   * @example
   * ```html
   * <filter id="invert">
   *   <feComponentTransfer>
   *     <feFuncR type="table" tableValues="1 0" />
   *     <feFuncG type="table" tableValues="1 0" />
   *     <feFuncB type="table" tableValues="1 0" />
   *   </feComponentTransfer>
   * </filter>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feComponentTransfer MDN Web Docs
   */
  feComponentTransfer: SVGAttributes<SVGFEComponentTransferElement>
  /**
   * `<feComposite>` 合成滤镜元素，使用 Porter-Duff 合成操作逐像素合成两个输入图像
   *
   * @example
   * ```html
   * <filter id="composite">
   *   <feComposite in="SourceGraphic" in2="BackgroundImage" operator="over" />
   * </filter>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feComposite MDN Web Docs
   */
  feComposite: SVGAttributes<SVGFECompositeElement>
  /**
   * `<feConvolveMatrix>` 卷积矩阵滤镜元素，应用矩阵卷积滤镜效果，可用于模糊、锐化、浮雕等
   *
   * @example
   * ```html
   * <filter id="sharpen">
   *   <feConvolveMatrix order="3" kernelMatrix="0 -1 0 -1 5 -1 0 -1 0" />
   * </filter>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feConvolveMatrix MDN Web Docs
   */
  feConvolveMatrix: SVGAttributes<SVGFEConvolveMatrixElement>
  /**
   * `<feDiffuseLighting>` 漫反射光照滤镜元素，使用 Alpha 通道作为凹凸贴图照亮图像
   *
   * @example
   * ```html
   * <filter id="light">
   *   <feDiffuseLighting in="SourceAlpha" surfaceScale="2">
   *     <feDistantLight azimuth="45" elevation="55" />
   *   </feDiffuseLighting>
   * </filter>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feDiffuseLighting MDN Web Docs
   */
  feDiffuseLighting: SVGAttributes<SVGFEDiffuseLightingElement>
  /**
   * `<feDisplacementMap>` 位移映射滤镜元素，使用第二个输入的像素值位移第一个输入的像素
   *
   * @example
   * ```html
   * <filter id="displace">
   *   <feDisplacementMap in="SourceGraphic" in2="SourceAlpha" scale="20" />
   * </filter>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feDisplacementMap MDN Web Docs
   */
  feDisplacementMap: SVGAttributes<SVGFEDisplacementMapElement>
  /**
   * `<feDistantLight>` 远光滤镜元素，定义可用于光照滤镜的远距离光源
   *
   * @example
   * ```html
   * <feDistantLight azimuth="45" elevation="55" />
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feDistantLight MDN Web Docs
   */
  feDistantLight: SVGAttributes<SVGFEDistantLightElement>
  /**
   * `<feDropShadow>` 投影滤镜元素，为输入图像创建投影效果
   *
   * @example
   * ```html
   * <filter id="shadow">
   *   <feDropShadow dx="4" dy="4" stdDeviation="3" flood-color="black" flood-opacity="0.5" />
   * </filter>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feDropShadow MDN Web Docs
   */
  feDropShadow: SVGAttributes<SVGFEDropShadowElement>
  /**
   * `<feFlood>` 填充滤镜元素，使用 `flood-color` 和 `flood-opacity` 定义的色彩和透明度填充滤镜子区域
   *
   * @example
   * ```html
   * <filter id="flood">
   *   <feFlood flood-color="green" flood-opacity="0.5" />
   * </filter>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feFlood MDN Web Docs
   */
  feFlood: SVGAttributes<SVGFEFloodElement>
  /**
   * `<feFuncA>` Alpha 传递函数元素，定义 `<feComponentTransfer>` 中 Alpha 分量的颜色变换
   *
   * @example
   * ```html
   * <feComponentTransfer>
   *   <feFuncA type="linear" slope="0.5" />
   * </feComponentTransfer>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feFuncA MDN Web Docs
   */
  feFuncA: SVGAttributes<SVGFEFuncAElement>
  /**
   * `<feFuncB>` 蓝色传递函数元素，定义 `<feComponentTransfer>` 中蓝色分量的颜色变换
   *
   * @example
   * ```html
   * <feComponentTransfer>
   *   <feFuncB type="table" tableValues="0 1" />
   * </feComponentTransfer>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feFuncB MDN Web Docs
   */
  feFuncB: SVGAttributes<SVGFEFuncBElement>
  /**
   * `<feFuncG>` 绿色传递函数元素，定义 `<feComponentTransfer>` 中绿色分量的颜色变换
   *
   * @example
   * ```html
   * <feComponentTransfer>
   *   <feFuncG type="table" tableValues="0 1" />
   * </feComponentTransfer>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feFuncG MDN Web Docs
   */
  feFuncG: SVGAttributes<SVGFEFuncGElement>
  /**
   * `<feFuncR>` 红色传递函数元素，定义 `<feComponentTransfer>` 中红色分量的颜色变换
   *
   * @example
   * ```html
   * <feComponentTransfer>
   *   <feFuncR type="table" tableValues="1 0" />
   * </feComponentTransfer>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feFuncR MDN Web Docs
   */
  feFuncR: SVGAttributes<SVGFEFuncRElement>
  /**
   * `<feGaussianBlur>` 高斯模糊滤镜元素，按 `stdDeviation` 指定的量模糊输入图像
   *
   * @example
   * ```html
   * <filter id="blur">
   *   <feGaussianBlur in="SourceGraphic" stdDeviation="5" />
   * </filter>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feGaussianBlur MDN Web Docs
   */
  feGaussianBlur: SVGAttributes<SVGFEGaussianBlurElement>
  /**
   * `<feImage>` 图像滤镜元素，从外部源获取图像数据并作为输出提供像素数据
   *
   * @example
   * ```html
   * <filter id="image">
   *   <feImage href="photo.jpg" />
   * </filter>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feImage MDN Web Docs
   */
  feImage: SVGAttributes<SVGFEImageElement>
  /**
   * `<feMerge>` 合并滤镜元素，将多个输入滤镜结果合成在一起
   *
   * @example
   * ```html
   * <filter id="merge">
   *   <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="blur" />
   *   <feOffset in="blur" dx="4" dy="4" result="offsetBlur" />
   *   <feMerge>
   *     <feMergeNode in="offsetBlur" />
   *     <feMergeNode in="SourceGraphic" />
   *   </feMerge>
   * </filter>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feMerge MDN Web Docs
   */
  feMerge: SVGAttributes<SVGFEMergeElement>
  /**
   * `<feMergeNode>` 合并节点元素，将另一个滤镜的结果提供给 `<feMerge>` 使用
   *
   * @example
   * ```html
   * <feMerge>
   *   <feMergeNode in="blur" />
   *   <feMergeNode in="SourceGraphic" />
   * </feMerge>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feMergeNode MDN Web Docs
   */
  feMergeNode: SVGAttributes<SVGFEMergeNodeElement>
  /**
   * `<feMorphology>` 形态学滤镜元素，腐蚀或膨胀输入图像，用于加粗或变细效果
   *
   * @example
   * ```html
   * <filter id="dilate">
   *   <feMorphology operator="dilate" radius="1" />
   * </filter>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feMorphology MDN Web Docs
   */
  feMorphology: SVGAttributes<SVGFEMorphologyElement>
  /**
   * `<feOffset>` 偏移滤镜元素，按指定向量偏移输入图像
   *
   * @example
   * ```html
   * <filter id="offset">
   *   <feOffset in="SourceAlpha" dx="5" dy="5" />
   * </filter>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feOffset MDN Web Docs
   */
  feOffset: SVGAttributes<SVGFEOffsetElement>
  /**
   * `<fePointLight>` 点光源滤镜元素，定义可用于光照滤镜的点光源
   *
   * @example
   * ```html
   * <feDiffuseLighting>
   *   <fePointLight x="50" y="50" z="100" />
   * </feDiffuseLighting>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/SVG/Element/fePointLight MDN Web Docs
   */
  fePointLight: SVGAttributes<SVGFEPointLightElement>
  /**
   * `<feSpecularLighting>` 镜面光照滤镜元素，使用源图形的 Alpha 通道作为凹凸贴图照亮图形
   *
   * @example
   * ```html
   * <filter id="specular">
   *   <feSpecularLighting in="SourceAlpha" surfaceScale="3" specularConstant="1" specularExponent="20">
   *     <fePointLight x="50" y="50" z="200" />
   *   </feSpecularLighting>
   * </filter>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feSpecularLighting MDN Web Docs
   */
  feSpecularLighting: SVGAttributes<SVGFESpecularLightingElement>
  /**
   * `<feSpotLight>` 聚光灯滤镜元素，定义可用于光照滤镜的聚光灯光源
   *
   * @example
   * ```html
   * <feSpecularLighting>
   *   <feSpotLight x="50" y="50" z="200" limitingConeAngle="30" />
   * </feSpecularLighting>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feSpotLight MDN Web Docs
   */
  feSpotLight: SVGAttributes<SVGFESpotLightElement>
  /**
   * `<feTile>` 平铺滤镜元素，用输入图像的重复平铺模式填充目标矩形
   *
   * @example
   * ```html
   * <filter id="tile">
   *   <feTile in="SourceGraphic" />
   * </filter>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feTile MDN Web Docs
   */
  feTile: SVGAttributes<SVGFETileElement>
  /**
   * `<feTurbulence>` 湍流滤镜元素，使用 Perlin 湍流函数创建图像，可用于模拟云彩、大理石等自然现象
   *
   * @example
   * ```html
   * <filter id="noise">
   *   <feTurbulence type="fractalNoise" baseFrequency="0.01" numOctaves="3" />
   * </filter>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feTurbulence MDN Web Docs
   */
  feTurbulence: SVGAttributes<SVGFETurbulenceElement>
  /**
   * `<filter>` 滤镜元素，作为原子滤镜操作的容器，通过组合滤镜原语定义自定义滤镜效果
   *
   * @example
   * ```html
   * <filter id="myFilter" x="-5%" y="-5%" width="110%" height="110%">
   *   <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
   * </filter>
   * <rect filter="url(#myFilter)" width="100" height="100" fill="red" />
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/SVG/Element/filter MDN Web Docs
   */
  filter: SVGAttributes<SVGFilterElement>
  /**
   * `<foreignObject>` 外部对象元素，允许在 SVG 中包含外部 XML 命名空间的内容
   *
   * @example
   * ```html
   * <foreignObject x="10" y="10" width="100" height="50">
   *   <div xmlns="http://www.w3.org/1999/xhtml">HTML 内容</div>
   * </foreignObject>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/SVG/Element/foreignObject MDN Web Docs
   */
  foreignObject: SVGAttributes<SVGForeignObjectElement>
  /**
   * `<g>` 分组元素，用于将其他 SVG 元素分组，统一应用变换和样式
   *
   * @example
   * ```html
   * <g fill="red" transform="translate(10, 10)">
   *   <rect width="20" height="20" />
   *   <circle cx="10" cy="10" r="5" />
   * </g>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/SVG/Element/g MDN Web Docs
   */
  g: SVGAttributes<SVGGElement>
  /**
   * `<image>` 图像元素，在 SVG 文档中嵌入外部图像
   *
   * @example
   * ```html
   * <image href="photo.jpg" x="0" y="0" width="200" height="150" />
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/SVG/Element/image MDN Web Docs
   */
  image: SVGAttributes<SVGImageElement>
  /**
   * `<line>` 线条元素，SVG 基本形状，绘制连接两点的直线
   *
   * @example
   * ```html
   * <line x1="0" y1="0" x2="100" y2="100" stroke="black" stroke-width="2" />
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/SVG/Element/line MDN Web Docs
   */
  line: SVGAttributes<SVGLineElement>
  /**
   * `<linearGradient>` 线性渐变元素，定义可通过 `fill` 或 `stroke` 应用于其他 SVG 元素的线性渐变
   *
   * @example
   * ```html
   * <linearGradient id="myGrad" x1="0%" y1="0%" x2="100%" y2="0%">
   *   <stop offset="0%" stop-color="red" />
   *   <stop offset="100%" stop-color="blue" />
   * </linearGradient>
   * <rect fill="url(#myGrad)" width="200" height="100" />
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/SVG/Element/linearGradient MDN Web Docs
   */
  linearGradient: SVGAttributes<SVGLinearGradientElement>
  /**
   * `<marker>` 标记元素，定义可用于路径、线条、折线和多边形上绘制标记的图形模板
   *
   * @example
   * ```html
   * <marker id="arrow" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto">
   *   <path d="M 0 0 L 10 5 L 0 10 z" fill="black" />
   * </marker>
   * <line x1="0" y1="50" x2="100" y2="50" marker-end="url(#arrow)" />
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/SVG/Element/marker MDN Web Docs
   */
  marker: SVGAttributes<SVGMarkerElement>
  /**
   * `<mask>` 遮罩元素，定义用于将当前对象合成到背景中的 Alpha 遮罩
   *
   * @example
   * ```html
   * <mask id="myMask">
   *   <circle cx="50" cy="50" r="40" fill="white" />
   * </mask>
   * <rect width="100" height="100" mask="url(#myMask)" fill="blue" />
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/SVG/Element/mask MDN Web Docs
   */
  mask: SVGAttributes<SVGMaskElement>
  /**
   * `<metadata>` 元数据元素，允许向 SVG 内容添加结构化元数据
   *
   * @example
   * ```html
   * <metadata>
   *   <rdf:RDF>...</rdf:RDF>
   * </metadata>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/SVG/Element/metadata MDN Web Docs
   */
  metadata: SVGAttributes<SVGMetadataElement>
  /**
   * `<mpath>` 运动路径元素，定义被 `<animateMotion>` 引用的路径以创建运动路径动画
   *
   * @example
   * ```html
   * <path id="motionPath" d="M10,80 C40,10 65,10 95,80" fill="none" />
   * <circle r="5" fill="red">
   *   <animateMotion dur="3s" repeatCount="indefinite">
   *     <mpath href="#motionPath" />
   *   </animateMotion>
   * </circle>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/SVG/Element/mpath MDN Web Docs
   */
  mpath: SVGAttributes<SVGMPathElement>
  /**
   * `<path>` 路径元素，SVG 通用形状元素，使用 `d` 属性描述路径数据
   *
   * @example
   * ```html
   * <path d="M10 30 C20 10 40 10 50 30 L90 30" stroke="black" fill="none" />
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/SVG/Element/path MDN Web Docs
   */
  path: SVGAttributes<SVGPathElement>
  /**
   * `<pattern>` 图案元素，定义可用于填充或描边元素的重复图案
   *
   * @example
   * ```html
   * <pattern id="dots" width="20" height="20" patternUnits="userSpaceOnUse">
   *   <circle cx="10" cy="10" r="2" fill="blue" />
   * </pattern>
   * <rect width="200" height="100" fill="url(#dots)" />
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/SVG/Element/pattern MDN Web Docs
   */
  pattern: SVGAttributes<SVGPatternElement>
  /**
   * `<polygon>` 多边形元素，定义由一组相连直线段组成的封闭形状
   *
   * @example
   * ```html
   * <polygon points="100,10 190,78 155,178 45,178 10,78" fill="gold" stroke="black" />
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/SVG/Element/polygon MDN Web Docs
   */
  polygon: SVGAttributes<SVGPolygonElement>
  /**
   * `<polyline>` 折线元素，SVG 基本形状，创建连接多个点的直线段
   *
   * @example
   * ```html
   * <polyline points="0,100 50,25 100,50 150,0 200,75" fill="none" stroke="black" />
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/SVG/Element/polyline MDN Web Docs
   */
  polyline: SVGAttributes<SVGPolylineElement>
  /**
   * `<radialGradient>` 径向渐变元素，定义可通过 `fill` 或 `stroke` 应用于其他 SVG 元素的径向渐变
   *
   * @example
   * ```html
   * <radialGradient id="myRadial" cx="50%" cy="50%" r="50%">
   *   <stop offset="0%" stop-color="white" />
   *   <stop offset="100%" stop-color="blue" />
   * </radialGradient>
   * <circle cx="50" cy="50" r="40" fill="url(#myRadial)" />
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/SVG/Element/radialGradient MDN Web Docs
   */
  radialGradient: SVGAttributes<SVGRadialGradientElement>
  /**
   * `<rect>` 矩形元素，SVG 基本形状，根据位置、宽度和高度绘制矩形
   *
   * @example
   * ```html
   * <rect x="10" y="10" width="80" height="60" fill="blue" rx="5" ry="5" />
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/SVG/Element/rect MDN Web Docs
   */
  rect: SVGAttributes<SVGRectElement>
  /**
   * `<set>` 设置元素，提供一种简单的方式在指定持续时间内设置属性值
   *
   * @example
   * ```html
   * <circle cx="50" cy="50" r="20" fill="red">
   *   <set attributeName="r" to="40" begin="mouseover" end="mouseout" />
   * </circle>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/SVG/Element/set MDN Web Docs
   */
  set: SVGAttributes<SVGSetElement>
  /**
   * `<stop>` 渐变停止点元素，定义渐变上使用的颜色渐变序列，是 `<linearGradient>` 或 `<radialGradient>` 的子元素
   *
   * @example
   * ```html
   * <linearGradient id="myGrad">
   *   <stop offset="0%" stop-color="red" />
   *   <stop offset="50%" stop-color="yellow" />
   *   <stop offset="100%" stop-color="blue" />
   * </linearGradient>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/SVG/Element/stop MDN Web Docs
   */
  stop: SVGAttributes<SVGStopElement>
  /**
   * `<switch>` 切换元素，评估直接子元素的 `requiredFeatures`、`requiredExtensions` 和 `systemLanguage` 属性，渲染第一个符合条件的子元素
   *
   * @example
   * ```html
   * <switch>
   *   <text systemLanguage="zh">你好</text>
   *   <text systemLanguage="en">Hello</text>
   *   <text>Hello</text>
   * </switch>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/SVG/Element/switch MDN Web Docs
   */
  switch: SVGAttributes<SVGSwitchElement>
  /**
   * `<symbol>` 符号元素，定义可由 `<use>` 元素实例化的图形模板对象
   *
   * @example
   * ```html
   * <symbol id="icon" viewBox="0 0 24 24">
   *   <path d="M12 2L2 22h20z" />
   * </symbol>
   * <use href="#icon" x="0" y="0" width="24" height="24" />
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/SVG/Element/symbol MDN Web Docs
   */
  symbol: SVGAttributes<SVGSymbolElement>
  /**
   * `<text>` 文本元素，定义由文本组成的图形元素
   *
   * @example
   * ```html
   * <text x="10" y="30" font-size="20" fill="black">Hello, SVG!</text>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/SVG/Element/text MDN Web Docs
   */
  text: SVGAttributes<SVGTextElement>
  /**
   * `<textPath>` 文本路径元素，沿 `<path>` 定义的路径渲染文本
   *
   * @example
   * ```html
   * <path id="curve" d="M10,90 C30,10 70,10 90,90" fill="none" />
   * <text>
   *   <textPath href="#curve">沿路径排列的文字</textPath>
   * </text>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/SVG/Element/textPath MDN Web Docs
   */
  textPath: SVGAttributes<SVGTextPathElement>
  /**
   * `<tspan>` 文本跨度元素，在 `<text>` 或另一个 `<tspan>` 中定义子文本，允许对文本段进行样式和定位
   *
   * @example
   * ```html
   * <text x="10" y="30">
   *   <tspan fill="red">红色文字</tspan>
   *   <tspan dx="10" fill="blue">蓝色文字</tspan>
   * </text>
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/SVG/Element/tspan MDN Web Docs
   */
  tspan: SVGAttributes<SVGTSpanElement>
  /**
   * `<use>` 引用元素，从 SVG 文档中取出节点并在不同位置复制使用
   *
   * @example
   * ```html
   * <defs>
   *   <circle id="dot" cx="0" cy="0" r="5" fill="red" />
   * </defs>
   * <use href="#dot" x="20" y="30" />
   * <use href="#dot" x="60" y="30" />
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/SVG/Element/use MDN Web Docs
   */
  use: SVGAttributes<SVGUseElement>
  /**
   * `<view>` 视图元素，定义 SVG 文档的特定视图，指定视口和视图框
   *
   * @example
   * ```html
   * <view id="zoom" viewBox="50 50 100 100" />
   * ```
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/SVG/Element/view MDN Web Docs
   */
  view: SVGAttributes<SVGViewElement>
}
