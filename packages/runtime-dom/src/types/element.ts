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

interface HTMLElementMap extends HTMLElementTagNameMap {
  /**
   * The HTML Big element
   *
   * @deprecated The HTML Big element is deprecated. Use the CSS font-size property to change the size of text.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/big MDN Web Docs
   */
  big: HTMLElement
  /**
   * The HTML Center element
   *
   * @deprecated The HTML Center element is deprecated. Use CSS to center content.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/center MDN Web Docs
   */
  center: HTMLElement
  /**
   * The HTML Menuitem element
   *
   * @deprecated The HTML Menuitem element is deprecated. Use the HTML Command element or the HTML MenuItem element instead.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/menuitem MDN Web Docs
   */
  menuitem: HTMLElement
  /**
   * The HTML Noindex element
   *
   * @deprecated The HTML Noindex element is deprecated. Use the CSS display property to hide content.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/noindex MDN Web Docs
   */
  noindex: HTMLElement
  /**
   * The HTML WebView element
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/webview MDN Web Docs
   */
  webview: HTMLElement
}

interface SVGElementMap extends SVGElementTagNameMap {}

interface MathMLElementMap extends MathMLElementTagNameMap {}

export interface AllElementMap
  extends
    HTMLElementMap,
    Omit<SVGElementMap, 'a' | 'style' | 'script' | 'title'>,
    Omit<MathMLElementMap, 'a'> {}

export interface HTMLIntrinsicElement {
  // HTML
  a: AnchorHTMLAttributes<HTMLAnchorElement>
  abbr: HTMLAttributes<HTMLElement>
  address: HTMLAttributes<HTMLElement>
  area: AreaHTMLAttributes<HTMLAreaElement>
  article: HTMLAttributes<HTMLElement>
  aside: HTMLAttributes<HTMLElement>
  audio: AudioHTMLAttributes<HTMLAudioElement>
  b: HTMLAttributes<HTMLElement>
  base: BaseHTMLAttributes<HTMLBaseElement>
  bdi: HTMLAttributes<HTMLElement>
  bdo: HTMLAttributes<HTMLElement>
  big: HTMLAttributes<HTMLElement>
  blockquote: BlockquoteHTMLAttributes<HTMLQuoteElement>
  body: HTMLAttributes<HTMLBodyElement>
  br: HTMLAttributes<HTMLBRElement>
  button: ButtonHTMLAttributes<HTMLButtonElement>
  canvas: CanvasHTMLAttributes<HTMLCanvasElement>
  caption: HTMLAttributes<HTMLElement>
  center: HTMLAttributes<HTMLElement>
  cite: HTMLAttributes<HTMLElement>
  code: HTMLAttributes<HTMLElement>
  col: ColHTMLAttributes<HTMLTableColElement>
  colgroup: ColgroupHTMLAttributes<HTMLTableColElement>
  data: DataHTMLAttributes<HTMLDataElement>
  datalist: HTMLAttributes<HTMLDataListElement>
  dd: HTMLAttributes<HTMLElement>
  del: DelHTMLAttributes<HTMLModElement>
  details: DetailsHTMLAttributes<HTMLDetailsElement>
  dfn: HTMLAttributes<HTMLElement>
  dialog: DialogHTMLAttributes<HTMLDialogElement>
  div: HTMLAttributes<HTMLDivElement>
  dl: HTMLAttributes<HTMLDListElement>
  dt: HTMLAttributes<HTMLElement>
  em: HTMLAttributes<HTMLElement>
  embed: EmbedHTMLAttributes<HTMLEmbedElement>
  fieldset: FieldsetHTMLAttributes<HTMLFieldSetElement>
  figcaption: HTMLAttributes<HTMLElement>
  figure: HTMLAttributes<HTMLElement>
  footer: HTMLAttributes<HTMLElement>
  form: FormHTMLAttributes<HTMLFormElement>
  h1: HTMLAttributes<HTMLHeadingElement>
  h2: HTMLAttributes<HTMLHeadingElement>
  h3: HTMLAttributes<HTMLHeadingElement>
  h4: HTMLAttributes<HTMLHeadingElement>
  h5: HTMLAttributes<HTMLHeadingElement>
  h6: HTMLAttributes<HTMLHeadingElement>
  head: HTMLAttributes<HTMLHeadElement>
  header: HTMLAttributes<HTMLElement>
  hgroup: HTMLAttributes<HTMLElement>
  hr: HTMLAttributes<HTMLHRElement>
  html: HtmlHTMLAttributes<HTMLHtmlElement>
  i: HTMLAttributes<HTMLElement>
  iframe: IframeHTMLAttributes<HTMLIFrameElement>
  img: ImgHTMLAttributes<HTMLImageElement>
  input: InputHTMLAttributes<HTMLInputElement>
  ins: InsHTMLAttributes<HTMLModElement>
  kbd: HTMLAttributes<HTMLElement>
  keygen: KeygenHTMLAttributes<HTMLElement>
  label: LabelHTMLAttributes<HTMLLabelElement>
  legend: HTMLAttributes<HTMLLegendElement>
  li: LiHTMLAttributes<HTMLLIElement>
  link: LinkHTMLAttributes<HTMLLinkElement>
  main: HTMLAttributes<HTMLElement>
  map: MapHTMLAttributes<HTMLMapElement>
  mark: HTMLAttributes<HTMLElement>
  menu: MenuHTMLAttributes<HTMLElement>
  menuitem: HTMLAttributes<HTMLElement>
  meta: MetaHTMLAttributes<HTMLMetaElement>
  meter: MeterHTMLAttributes<HTMLMeterElement>
  nav: HTMLAttributes<HTMLElement>
  noindex: HTMLAttributes<HTMLElement>
  noscript: HTMLAttributes<HTMLElement>
  object: ObjectHTMLAttributes<HTMLObjectElement>
  ol: OlHTMLAttributes<HTMLOListElement>
  optgroup: OptgroupHTMLAttributes<HTMLOptGroupElement>
  option: OptionHTMLAttributes<HTMLOptionElement>
  output: OutputHTMLAttributes<HTMLOutputElement>
  p: HTMLAttributes<HTMLParagraphElement>
  param: ParamHTMLAttributes<HTMLParamElement>
  picture: HTMLAttributes<HTMLElement>
  pre: HTMLAttributes<HTMLPreElement>
  progress: ProgressHTMLAttributes<HTMLProgressElement>
  q: QuoteHTMLAttributes<HTMLQuoteElement>
  rp: HTMLAttributes<HTMLElement>
  rt: HTMLAttributes<HTMLElement>
  ruby: HTMLAttributes<HTMLElement>
  s: HTMLAttributes<HTMLElement>
  samp: HTMLAttributes<HTMLElement>
  search: HTMLAttributes<HTMLElement>
  slot: SlotHTMLAttributes<HTMLSlotElement>
  script: ScriptHTMLAttributes<HTMLScriptElement>
  section: HTMLAttributes<HTMLElement>
  select: SelectHTMLAttributes<HTMLSelectElement>
  small: HTMLAttributes<HTMLElement>
  source: SourceHTMLAttributes<HTMLSourceElement>
  span: HTMLAttributes<HTMLSpanElement>
  strong: HTMLAttributes<HTMLElement>
  style: StyleHTMLAttributes<HTMLStyleElement>
  sub: HTMLAttributes<HTMLElement>
  summary: HTMLAttributes<HTMLElement>
  sup: HTMLAttributes<HTMLElement>
  table: TableHTMLAttributes<HTMLTableElement>
  template: HTMLAttributes<HTMLTemplateElement>
  tbody: HTMLAttributes<HTMLTableSectionElement>
  td: TdHTMLAttributes<HTMLTableDataCellElement>
  textarea: TextareaHTMLAttributes<HTMLTextAreaElement>
  tfoot: HTMLAttributes<HTMLTableSectionElement>
  th: ThHTMLAttributes<HTMLTableHeaderCellElement>
  thead: HTMLAttributes<HTMLTableSectionElement>
  time: TimeHTMLAttributes<HTMLTimeElement>
  title: HTMLAttributes<HTMLTitleElement>
  tr: HTMLAttributes<HTMLTableRowElement>
  track: TrackHTMLAttributes<HTMLTrackElement>
  u: HTMLAttributes<HTMLElement>
  ul: HTMLAttributes<HTMLUListElement>
  var: HTMLAttributes<HTMLElement>
  video: VideoHTMLAttributes<HTMLVideoElement>
  wbr: HTMLAttributes<HTMLElementMap['wbr']>
  webview: WebViewHTMLAttributes<HTMLElement>

  // MathML
  math: MathElementAttributes<MathMLElement>
  'annotation-xml': AnnotationXmlAttributes<MathMLElement>
  annotation: MathMLElementAttributes<MathMLElement>
  maction: MathMLElementAttributes<MathMLElement>
  merror: MathMLElementAttributes<MathMLElement>
  mfrac: MathMLElementAttributes<MathMLElement>
  mi: MathMLElementAttributes<MathMLElement>
  mmultiscripts: MathMLElementAttributes<MathMLElement>
  mn: MathMLElementAttributes<MathMLElement>
  mo: MathMLElementAttributes<MathMLElement>
  mover: MathMLElementAttributes<MathMLElement>
  mpadded: MathMLElementAttributes<MathMLElement>
  mphantom: MathMLElementAttributes<MathMLElement>
  mprescripts: MathMLElementAttributes<MathMLElement>
  mroot: MathMLElementAttributes<MathMLElement>
  mrow: MathMLElementAttributes<MathMLElement>
  ms: MathMLElementAttributes<MathMLElement>
  mspace: MathMLElementAttributes<MathMLElement>
  msqrt: MathMLElementAttributes<MathMLElement>
  mstyle: MathMLElementAttributes<MathMLElement>
  msub: MathMLElementAttributes<MathMLElement>
  msubsup: MathMLElementAttributes<MathMLElement>
  msup: MathMLElementAttributes<MathMLElement>
  mtable: MathMLElementAttributes<MathMLElement>
  mtd: MathMLElementAttributes<MathMLElement>
  mtext: MathMLElementAttributes<MathMLElement>
  mtr: MathMLElementAttributes<MathMLElement>
  munder: MathMLElementAttributes<MathMLElement>
  munderover: MathMLElementAttributes<MathMLElement>
  semantics: MathMLElementAttributes<MathMLElement>

  // SVG
  svg: SVGAttributes<SVGSVGElement>
  animate: SVGAttributes<SVGAnimateElement>
  animateMotion: SVGAttributes<SVGAnimateMotionElement>
  animateTransform: SVGAttributes<SVGAnimateTransformElement>
  circle: SVGAttributes<SVGCircleElement>
  clipPath: SVGAttributes<SVGClipPathElement>
  defs: SVGAttributes<SVGDefsElement>
  desc: SVGAttributes<SVGDescElement>
  ellipse: SVGAttributes<SVGEllipseElement>
  feBlend: SVGAttributes<SVGFEBlendElement>
  feColorMatrix: SVGAttributes<SVGFEColorMatrixElement>
  feComponentTransfer: SVGAttributes<SVGFEComponentTransferElement>
  feComposite: SVGAttributes<SVGFECompositeElement>
  feConvolveMatrix: SVGAttributes<SVGFEConvolveMatrixElement>
  feDiffuseLighting: SVGAttributes<SVGFEDiffuseLightingElement>
  feDisplacementMap: SVGAttributes<SVGFEDisplacementMapElement>
  feDistantLight: SVGAttributes<SVGFEDistantLightElement>
  feDropShadow: SVGAttributes<SVGFEDropShadowElement>
  feFlood: SVGAttributes<SVGFEFloodElement>
  feFuncA: SVGAttributes<SVGFEFuncAElement>
  feFuncB: SVGAttributes<SVGFEFuncBElement>
  feFuncG: SVGAttributes<SVGFEFuncGElement>
  feFuncR: SVGAttributes<SVGFEFuncRElement>
  feGaussianBlur: SVGAttributes<SVGFEGaussianBlurElement>
  feImage: SVGAttributes<SVGFEImageElement>
  feMerge: SVGAttributes<SVGFEMergeElement>
  feMergeNode: SVGAttributes<SVGFEMergeNodeElement>
  feMorphology: SVGAttributes<SVGFEMorphologyElement>
  feOffset: SVGAttributes<SVGFEOffsetElement>
  fePointLight: SVGAttributes<SVGFEPointLightElement>
  feSpecularLighting: SVGAttributes<SVGFESpecularLightingElement>
  feSpotLight: SVGAttributes<SVGFESpotLightElement>
  feTile: SVGAttributes<SVGFETileElement>
  feTurbulence: SVGAttributes<SVGFETurbulenceElement>
  filter: SVGAttributes<SVGFilterElement>
  foreignObject: SVGAttributes<SVGForeignObjectElement>
  g: SVGAttributes<SVGGElement>
  image: SVGAttributes<SVGImageElement>
  line: SVGAttributes<SVGLineElement>
  linearGradient: SVGAttributes<SVGLinearGradientElement>
  marker: SVGAttributes<SVGMarkerElement>
  mask: SVGAttributes<SVGMaskElement>
  metadata: SVGAttributes<SVGMetadataElement>
  mpath: SVGAttributes<SVGMPathElement>
  path: SVGAttributes<SVGPathElement>
  pattern: SVGAttributes<SVGPatternElement>
  polygon: SVGAttributes<SVGPolygonElement>
  polyline: SVGAttributes<SVGPolylineElement>
  radialGradient: SVGAttributes<SVGRadialGradientElement>
  rect: SVGAttributes<SVGRectElement>
  set: SVGAttributes<SVGSetElement>
  stop: SVGAttributes<SVGStopElement>
  switch: SVGAttributes<SVGSwitchElement>
  symbol: SVGAttributes<SVGSymbolElement>
  text: SVGAttributes<SVGTextElement>
  textPath: SVGAttributes<SVGTextPathElement>
  tspan: SVGAttributes<SVGTSpanElement>
  use: SVGAttributes<SVGUseElement>
  view: SVGAttributes<SVGViewElement>
}
