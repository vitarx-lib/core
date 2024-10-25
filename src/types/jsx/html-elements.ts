import { GenerateProperties } from './html-properties'

type HtmlProperties<T extends Element = HTMLElement> = GenerateProperties<T>

/**
 * ## HTML固有元素
 *
 * Vitarx在解析元素属性时遵循`W3C`标准语法，元素的属性和在html中编写是一致的，但有以下不同之处。
 *
 * 1. style属性接受对象和字符串，对象会自动转为字符串。
 * 2. class属性接受字符串、数组和对象，对象和字符串都会自动转为字符串。
 * 3. 绑定事件支持多种语法，事件名称不区分大小写，示例如下：
 *    - `W3C`标准语法，如onclick。
 *    - 小驼峰式语法，如onClick。
 */
export default interface HtmlIntrinsicElements {
  a: HtmlProperties<HTMLAnchorElement>
  abbr: HtmlProperties
  address: HtmlProperties
  area: HtmlProperties<HTMLAreaElement>
  article: HtmlProperties
  aside: HtmlProperties
  audio: HtmlProperties<HTMLAudioElement>
  b: HtmlProperties
  base: HtmlProperties<HTMLBaseElement>
  bdi: HtmlProperties
  bdo: HtmlProperties
  big: HtmlProperties
  blockquote: HtmlProperties<HTMLQuoteElement>
  body: HtmlProperties<HTMLBodyElement>
  br: HtmlProperties<HTMLBRElement>
  button: HtmlProperties<HTMLButtonElement>
  canvas: HtmlProperties<HTMLCanvasElement>
  caption: HtmlProperties
  center: HtmlProperties
  cite: HtmlProperties
  code: HtmlProperties
  col: HtmlProperties<HTMLTableColElement>
  colgroup: HtmlProperties<HTMLTableColElement>
  data: HtmlProperties<HTMLDataElement>
  datalist: HtmlProperties<HTMLDataListElement>
  dd: HtmlProperties
  del: HtmlProperties<HTMLModElement>
  details: HtmlProperties<HTMLDetailsElement>
  dfn: HtmlProperties
  dialog: HtmlProperties<HTMLDialogElement>
  div: HtmlProperties<HTMLDivElement>
  dl: HtmlProperties<HTMLDListElement>
  dt: HtmlProperties<HTMLLIElement>
  em: HtmlProperties
  embed: HtmlProperties<HTMLEmbedElement>
  fieldset: HtmlProperties<HTMLFieldSetElement>
  figcaption: HtmlProperties
  figure: HtmlProperties
  footer: HtmlProperties
  form: HtmlProperties<HTMLFormElement>
  h1: HtmlProperties<HTMLHeadingElement>
  h2: HtmlProperties<HTMLHeadingElement>
  h3: HtmlProperties<HTMLHeadingElement>
  h4: HtmlProperties<HTMLHeadingElement>
  h5: HtmlProperties<HTMLHeadingElement>
  h6: HtmlProperties<HTMLHeadingElement>
  head: HtmlProperties<HTMLHeadElement>
  header: HtmlProperties
  hgroup: HtmlProperties
  hr: HtmlProperties<HTMLHRElement>
  html: HtmlProperties<HTMLHtmlElement>
  i: HtmlProperties
  iframe: HtmlProperties<HTMLIFrameElement>
  img: HtmlProperties<HTMLImageElement>
  input: HtmlProperties<HTMLInputElement>
  ins: HtmlProperties<HTMLModElement>
  kbd: HtmlProperties
  keygen: HtmlProperties
  label: HtmlProperties<HTMLLabelElement>
  legend: HtmlProperties<HTMLLegendElement>
  li: HtmlProperties<HTMLLIElement>
  link: HtmlProperties<HTMLLinkElement>
  main: HtmlProperties
  map: HtmlProperties<HTMLMapElement>
  mark: HtmlProperties
  menu: HtmlProperties<HTMLMenuElement>
  menuitem: HtmlProperties
  meta: HtmlProperties<HTMLMetaElement>
  meter: HtmlProperties<HTMLMeterElement>
  nav: HtmlProperties
  noindex: HtmlProperties
  noscript: HtmlProperties
  object: HtmlProperties<HTMLObjectElement>
  ol: HtmlProperties<HTMLOListElement>
  optgroup: HtmlProperties<HTMLOptGroupElement>
  option: HtmlProperties<HTMLOptionElement>
  output: HtmlProperties<HTMLOutputElement>
  p: HtmlProperties<HTMLParagraphElement>
  /**
   * @deprecated **此标签已被荒废**： 不再推荐使用此功能。
   * 尽管某些浏览器可能仍支持它，但它可能已从相关 Web 标准中删除，可能正在被删除，或者可能仅用于兼容性目的。
   * 避免使用它，并尽可能更新现有代码;请参阅本页底部的 兼容性表  以指导您做出决定。请注意，此功能可能随时停止工作
   */
  param: HtmlProperties<HTMLParamElement>
  picture: HtmlProperties<HTMLPictureElement>
  pre: HtmlProperties<HTMLPreElement>
  progress: HtmlProperties<HTMLProgressElement>
  q: HtmlProperties<HTMLQuoteElement>
  rp: HtmlProperties
  rt: HtmlProperties
  ruby: HtmlProperties
  s: HtmlProperties<HTMLModElement>
  samp: HtmlProperties
  search: HtmlProperties
  slot: HtmlProperties<HTMLSlotElement>
  script: HtmlProperties<HTMLScriptElement>
  section: HtmlProperties
  select: HtmlProperties<HTMLSelectElement>
  small: HtmlProperties
  source: HtmlProperties<HTMLSourceElement>
  span: HtmlProperties<HTMLSpanElement>
  strong: HtmlProperties
  style: HtmlProperties<HTMLStyleElement>
  sub: HtmlProperties
  summary: HtmlProperties
  sup: HtmlProperties
  table: HtmlProperties<HTMLTableElement>
  template: HtmlProperties<HTMLTemplateElement>
  tbody: HtmlProperties<HTMLTableSectionElement>
  td: HtmlProperties<HTMLTableCellElement>
  textarea: HtmlProperties<HTMLTextAreaElement>
  tfoot: HtmlProperties<HTMLTableSectionElement>
  th: HtmlProperties<HTMLTableCellElement>
  thead: HtmlProperties<HTMLTableSectionElement>
  time: HtmlProperties<HTMLTimeElement>
  title: HtmlProperties<HTMLTitleElement>
  tr: HtmlProperties<HTMLTableRowElement>
  track: HtmlProperties<HTMLTrackElement>
  u: HtmlProperties
  ul: HtmlProperties<HTMLUListElement>
  var: HtmlProperties
  video: HtmlProperties<HTMLVideoElement>
  wbr: HtmlProperties<HTMLBRElement>
  webview: HtmlProperties
  // SVG
  svg: HtmlProperties<SVGSVGElement>
  animate: HtmlProperties<SVGAnimateElement>
  animateMotion: HtmlProperties<SVGAnimateMotionElement>
  animateTransform: HtmlProperties<SVGAnimateTransformElement>
  circle: HtmlProperties<SVGCircleElement>
  clipPath: HtmlProperties<SVGClipPathElement>
  defs: HtmlProperties<SVGDefsElement>
  desc: HtmlProperties<SVGDescElement>
  ellipse: HtmlProperties<SVGEllipseElement>
  feBlend: HtmlProperties<SVGFEBlendElement>
  feColorMatrix: HtmlProperties<SVGFEColorMatrixElement>
  feComponentTransfer: HtmlProperties<SVGFEComponentTransferElement>
  feComposite: HtmlProperties<SVGFECompositeElement>
  feConvolveMatrix: HtmlProperties<SVGFEConvolveMatrixElement>
  feDiffuseLighting: HtmlProperties<SVGFEDiffuseLightingElement>
  feDisplacementMap: HtmlProperties<SVGFEDisplacementMapElement>
  feDistantLight: HtmlProperties<SVGFEDistantLightElement>
  feDropShadow: HtmlProperties<SVGFEDropShadowElement>
  feFlood: HtmlProperties<SVGFEFloodElement>
  feFuncA: HtmlProperties<SVGFEFuncAElement>
  feFuncB: HtmlProperties<SVGFEFuncBElement>
  feFuncG: HtmlProperties<SVGFEFuncGElement>
  feFuncR: HtmlProperties<SVGFEFuncRElement>
  feGaussianBlur: HtmlProperties<SVGFEGaussianBlurElement>
  feImage: HtmlProperties<SVGFEImageElement>
  feMerge: HtmlProperties<SVGFEMergeElement>
  feMergeNode: HtmlProperties<SVGFEMergeNodeElement>
  feMorphology: HtmlProperties<SVGFEMorphologyElement>
  feOffset: HtmlProperties<SVGFEOffsetElement>
  fePointLight: HtmlProperties<SVGFESpotLightElement>
  feSpecularLighting: HtmlProperties<SVGFESpecularLightingElement>
  feSpotLight: HtmlProperties<SVGFESpotLightElement>
  feTile: HtmlProperties<SVGFETileElement>
  feTurbulence: HtmlProperties<SVGFETurbulenceElement>
  filter: HtmlProperties<SVGFilterElement>
  foreignObject: HtmlProperties<SVGForeignObjectElement>
  g: HtmlProperties<SVGGElement>
  image: HtmlProperties<SVGImageElement>
  line: HtmlProperties<SVGLineElement>
  linearGradient: HtmlProperties<SVGLinearGradientElement>
  marker: HtmlProperties<SVGMarkerElement>
  mask: HtmlProperties<SVGMaskElement>
  metadata: HtmlProperties<SVGMetadataElement>
  mpath: HtmlProperties<SVGElement>
  path: HtmlProperties<SVGPathElement>
  pattern: HtmlProperties<SVGPatternElement>
  polygon: HtmlProperties<SVGPolygonElement>
  polyline: HtmlProperties<SVGPolylineElement>
  radialGradient: HtmlProperties<SVGRadialGradientElement>
  rect: HtmlProperties<SVGRectElement>
  set: HtmlProperties<SVGSetElement>
  stop: HtmlProperties<SVGStopElement>
  switch: HtmlProperties<SVGSwitchElement>
  symbol: HtmlProperties<SVGSymbolElement>
  text: HtmlProperties<SVGTextElement>
  textPath: HtmlProperties<SVGTextPathElement>
  tspan: HtmlProperties<SVGTSpanElement>
  use: HtmlProperties<SVGUseElement>
  view: HtmlProperties<SVGViewElement>

  [elemName: string]: HtmlProperties
}
