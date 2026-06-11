// ======================== 公共 API（需要文档） ========================

// 应用
export { createApp, WebApp } from '@vitarx/runtime-dom'

// 内置组件
export { Head, Teleport, Transition, TransitionGroup } from '@vitarx/runtime-dom'

// 公共类型
export type {
  HeadProps,
  TeleportProps,
  TransitionProps,
  TransitionGroupProps,
  BaseTransitionProps,
  TransitionType,
  TransitionCssClass,
  TransitionDuration,
  TransitionHooks,
  TransitionHandler
} from '@vitarx/runtime-dom'

// ======================== 进阶 API（不需要文档） ========================

// 进阶常量
export { __EXCLUDE_PROP_NAMES__ } from '@vitarx/runtime-dom'

// 进阶类
export { DOMRenderer } from '@vitarx/runtime-dom'

// 进阶类型
export type {
  AnnotationXmlAttributes,
  AreaHTMLAttributes,
  BaseHTMLAttributes,
  BlockquoteHTMLAttributes,
  ColgroupHTMLAttributes,
  ColHTMLAttributes,
  DataHTMLAttributes,
  DelHTMLAttributes,
  DetailsHTMLAttributes,
  DialogHTMLAttributes,
  EmbedHTMLAttributes,
  FieldsetHTMLAttributes,
  HtmlHTMLAttributes,
  InsHTMLAttributes,
  KeygenHTMLAttributes,
  LabelHTMLAttributes,
  LiHTMLAttributes,
  LinkHTMLAttributes,
  MapHTMLAttributes,
  MathElementAttributes,
  MathMLElementAttributes,
  MediaHTMLAttributes,
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
  TableHTMLAttributes,
  TdHTMLAttributes,
  ThHTMLAttributes,
  TimeHTMLAttributes,
  TrackHTMLAttributes,
  WebViewHTMLAttributes,
  VitarxEventHandler,
  WithEventAttributes,
  GlobalEventAttributes,
  InputHTMLAttributes,
  ButtonHTMLAttributes,
  ImgHTMLAttributes,
  AnchorHTMLAttributes,
  VideoHTMLAttributes,
  AudioHTMLAttributes,
  CanvasHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
  FormHTMLAttributes,
  IframeHTMLAttributes,
  ScriptHTMLAttributes,
  StyleHTMLAttributes,
  SlotHTMLAttributes,
  SourceHTMLAttributes,
  HTMLAttributes,
  SVGAttributes,
  HTMLIntrinsicElement,
  AllElementMap,
  DOMEventOptions,
  CSSProperties
} from '@vitarx/runtime-dom'
