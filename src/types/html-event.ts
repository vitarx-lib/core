/**
 * 部分事件名转小驼峰命名
 *
 * @extends {@link GlobalEventHandlersEventMap}
 */
interface GlobalEventHandlersEventMap_HUMP {
  animationcancel: 'animationCancel'
  animationend: 'animationEnd'
  animationiteration: 'animationIteration'
  animationstart: 'animationStart'
  auxclick: 'auxClick'
  beforeinput: 'beforeInput'
  beforetoggle: 'beforeToggle'
  canplay: 'canPlay'
  canplaythrough: 'canPlayThrough'
  compositionend: 'compositionEnd'
  compositionstart: 'compositionStart'
  compositionupdate: 'compositionUpdate'
  contextlost: 'contextLost'
  contextmenu: 'contextMenu'
  contextrestored: 'contextRestored'
  cuechange: 'cueChange'
  dragend: 'dragEnd'
  dragenter: 'dragEnter'
  dragleave: 'dragLeave'
  dragover: 'dragOver'
  dragstart: 'dragStart'
  durationchange: 'durationChange'
  focusin: 'focusIn'
  focusout: 'focusOut'
  formdata: 'formData'
  gotpointercapture: 'gotPointerCapture'
  loadeddata: 'loadedData'
  loadedmetadata: 'loadedMetaData'
  loadstart: 'loadStart'
  lostpointercapture: 'lostPointerCapture'
  mousedown: 'mouseDown'
  mouseenter: 'mouseEnter'
  mouseleave: 'mouseLeave'
  mousemove: 'mouseMove'
  mouseout: 'mouseOut'
  mouseover: 'mouseOver'
  mouseup: 'mouseUp'
  pointercancel: 'pointerCancel'
  pointerdown: 'pointerDown'
  pointerenter: 'pointerEnter'
  pointerleave: 'pointerLeave'
  pointermove: 'pointerMove'
  pointerout: 'pointerOut'
  pointerover: 'pointerOver'
  pointerup: 'pointerUp'
  ratechange: 'rateChange'
  scrollend: 'scrollEnd'
  securitypolicyviolation: 'securityPolicyViolation'
  selectionchange: 'selectionChange'
  selectstart: 'selectStart'
  slotchange: 'slotChange'
  timeupdate: 'timeUpdate'
  touchcancel: 'touchCancel'
  touchend: 'touchEnd'
  touchmove: 'touchMove'
  touchstart: 'touchStart'
  transitioncancel: 'transitionCancel'
  transitionend: 'transitionEnd'
  transitionrun: 'transitionRun'
  transitionstart: 'transitionStart'
  volumechange: 'volumeChange'
  webkitanimationend: 'webkitAnimationEnd'
  webkitanimationiteration: 'webkitAnimationIteration'
  webkitanimationstart: 'webkitAnimationStart'
  webkittransitionend: 'webkitTransitionEnd'
}

// 匹配小驼峰命名 不存在时返回原始字符串
type ToHump<S extends string> = S extends keyof GlobalEventHandlersEventMap_HUMP
  ? GlobalEventHandlersEventMap_HUMP[S]
  : S
type EventName<K extends string> = `on${K}` | `on${Capitalize<ToHump<K>>}`

// 拓展事件名
export type OutreachEventName<T extends Record<string, any>> = {
  [K in keyof T as K extends `on${infer Rest}` ? EventName<Rest> : K]?: T[K]
}
