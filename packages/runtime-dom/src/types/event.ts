/**
 * 事件监听器配置选项接口
 *
 * @interface
 * @description 定义了事件监听器的行为配置选项。这些选项可以控制事件的捕获方式、触发次数和性能优化等特性
 * @example
 * // 配置一个只触发一次的点击事件监听器
 * element.addEventListener("click", handler, { once: true });
 */
export interface DOMEventOptions {
  /**
   * 是否在捕获阶段触发事件监听器
   *
   * @type {boolean}
   * @default false
   * @description 当设置为true时，事件监听器会在事件捕获阶段被触发，而不是在冒泡阶段
   */
  capture?: boolean

  /**
   * 是否只触发一次事件监听器
   *
   * @type {boolean}
   * @default false
   * @description 当设置为true时，事件监听器会被触发一次后会自动移除
   */
  once?: boolean

  /**
   * 是否使用被动模式注册事件监听器
   *
   * @type {boolean}
   * @default false
   * @description 当设置为true时，表示事件监听器永远不会调用preventDefault()，这可以提高滚动性能
   */
  passive?: boolean
}

/**
 * 事件修饰符(大驼峰)
 */
type EventModifier = 'Capture' | 'Once' | 'Passive' | 'OnceCapture'

/**
 * 事件处理函数接口
 *
 * @template T - 元素
 * @template E - 事件类型，可以是Event或UIEvent
 */
export type VitarxEventHandler<T, E extends Event | UIEvent = Event> = (this: T, event: E) => void

/**
 * W3C标准事件映射
 */
interface W3CEventMap<T> {
  /**
   * 在发生错误时触发
   * @see https://developer.mozilla.org/docs/Web/API/Window/error_event
   * @applies img, script, audio, video
   */
  onError?: VitarxEventHandler<T, ErrorEvent> | undefined
  /**
   * 当资源及其依赖资源已完成加载时触发
   * @see https://developer.mozilla.org/docs/Web/API/Window/load_event
   * @applies img, script, link, audio, video
   */
  onLoad?: VitarxEventHandler<T> | undefined
  /**
   * 当元素失去焦点时触发
   * @see https://developer.mozilla.org/docs/Web/API/Element/blur_event
   * @applies 所有可聚焦元素(如input, select, a等)
   */
  onBlur?: VitarxEventHandler<T, FocusEvent> | undefined
  /**
   * 当右键点击元素时触发
   * @see https://developer.mozilla.org/docs/Web/API/Element/contextmenu_event
   * @applies 所有元素
   */
  onContextMenu?: VitarxEventHandler<T, MouseEvent> | undefined
  /**
   * 当元素获得焦点时触发
   * @see https://developer.mozilla.org/docs/Web/API/Element/focus_event
   * @applies 所有可聚焦元素(如input, select, a等)
   */
  onFocus?: VitarxEventHandler<T, FocusEvent> | undefined
  /**
   * 当元素获取输入时触发
   * @see https://developer.mozilla.org/docs/Web/API/HTMLElement/input_event
   * @applies input, textarea, select
   */
  onInput?: VitarxEventHandler<T, InputEvent> | undefined
  /**
   * 当元素验证失败时触发
   * @see https://developer.mozilla.org/docs/Web/API/HTMLInputElement/invalid_event
   * @applies form, input, select, textarea
   */
  onInvalid?: VitarxEventHandler<T> | undefined
  /**
   * 当表单重置时触发
   * @see https://developer.mozilla.org/docs/Web/API/HTMLFormElement/reset_event
   * @applies form
   */
  onReset?: VitarxEventHandler<T> | undefined
  /**
   * 当搜索输入框提交搜索时触发
   * @see https://developer.mozilla.org/docs/Web/API/HTMLInputElement/search_event
   * @applies input[type="search"]
   */
  onSearch?: VitarxEventHandler<T> | undefined
  /**
   * 当文本被选中时触发
   * @see https://developer.mozilla.org/docs/Web/API/Element/select_event
   * @applies input[type="text"], textarea
   */
  onSelect?: VitarxEventHandler<T> | undefined
  /**
   * 当表单提交时触发
   * @see https://developer.mozilla.org/docs/Web/API/HTMLFormElement/submit_event
   * @applies form
   */
  onSubmit?: VitarxEventHandler<T, SubmitEvent> | undefined
  /**
   * 当键盘按键被按下时触发
   * @see https://developer.mozilla.org/docs/Web/API/Element/keydown_event
   * @applies 所有可聚焦元素和document
   */
  onKeyDown?: VitarxEventHandler<T, KeyboardEvent> | undefined
  /**
   * 当键盘按键被按下并释放时触发
   * @see https://developer.mozilla.org/docs/Web/API/Element/keypress_event
   * @applies 所有可聚焦元素和document
   * @deprecated 建议使用keydown代替
   */
  onKeyPress?: VitarxEventHandler<T, KeyboardEvent> | undefined
  /**
   * 当键盘按键被释放时触发
   * @see https://developer.mozilla.org/docs/Web/API/Element/keyup_event
   * @applies 所有可聚焦元素和document
   */
  onKeyUp?: VitarxEventHandler<T, KeyboardEvent> | undefined
  // 鼠标事件
  /**
   * 当元素被点击时触发
   * @see https://developer.mozilla.org/docs/Web/API/Element/click_event
   * @applies 所有可见元素
   */
  onClick?: VitarxEventHandler<T, MouseEvent> | undefined
  /**
   * 当元素被双击时触发
   * @see https://developer.mozilla.org/docs/Web/API/Element/dblclick_event
   * @applies 所有可见元素
   */
  onDblClick?: VitarxEventHandler<T, MouseEvent> | undefined
  /**
   * 当鼠标指针进入元素时触发
   * @see https://developer.mozilla.org/docs/Web/API/Element/mouseenter_event
   * @applies 所有可见元素
   */
  onMouseEnter?: VitarxEventHandler<T, MouseEvent> | undefined
  /**
   * 当鼠标指针离开元素时触发
   * @see https://developer.mozilla.org/docs/Web/API/Element/mouseleave_event
   * @applies 所有可见元素
   */
  onMouseLeave?: VitarxEventHandler<T, MouseEvent> | undefined
  /**
   * 当鼠标按钮在元素上按下时触发
   * @see https://developer.mozilla.org/docs/Web/API/Element/mousedown_event
   * @applies 所有可见元素
   */
  onMouseDown?: VitarxEventHandler<T, MouseEvent> | undefined
  /**
   * 当鼠标指针在元素上移动时触发
   * @see https://developer.mozilla.org/docs/Web/API/Element/mousemove_event
   * @applies 所有可见元素
   */
  onMouseMove?: VitarxEventHandler<T, MouseEvent> | undefined
  /**
   * 当鼠标指针移出元素时触发
   * @see https://developer.mozilla.org/docs/Web/API/Element/mouseout_event
   * @applies 所有可见元素
   */
  onMouseOut?: VitarxEventHandler<T, MouseEvent> | undefined
  /**
   * 当鼠标指针移入元素时触发
   * @see https://developer.mozilla.org/docs/Web/API/Element/mouseover_event
   * @applies 所有可见元素
   */
  onMouseOver?: VitarxEventHandler<T, MouseEvent> | undefined
  /**
   * 当鼠标按钮在元素上释放时触发
   * @see https://developer.mozilla.org/docs/Web/API/Element/mouseup_event
   * @applies 所有可见元素
   */
  onMouseUp?: VitarxEventHandler<T, MouseEvent> | undefined
  /**
   * 当鼠标滚轮在元素上滚动时触发
   * @see https://developer.mozilla.org/docs/Web/API/Element/wheel_event
   * @applies 所有可见元素
   */
  onWheel?: VitarxEventHandler<T, WheelEvent> | undefined
  // 拖拽事件
  /**
   * 当元素被拖动时触发
   * @see https://developer.mozilla.org/docs/Web/API/HTMLElement/drag_event
   * @applies 所有设置了draggable=true的元素
   */
  onDrag?: VitarxEventHandler<T, DragEvent> | undefined
  /**
   * 当拖动操作结束时触发
   * @see https://developer.mozilla.org/docs/Web/API/HTMLElement/dragend_event
   * @applies 所有设置了draggable=true的元素
   */
  onDragEnd?: VitarxEventHandler<T, DragEvent> | undefined
  /**
   * 当被拖动元素进入有效放置目标时触发
   * @see https://developer.mozilla.org/docs/Web/API/HTMLElement/dragenter_event
   * @applies 所有元素
   */
  onDragEnter?: VitarxEventHandler<T, DragEvent> | undefined
  /**
   * 当被拖动元素离开有效放置目标时触发
   * @see https://developer.mozilla.org/docs/Web/API/HTMLElement/dragleave_event
   * @applies 所有元素
   */
  onDragLeave?: VitarxEventHandler<T, DragEvent> | undefined
  /**
   * 当被拖动元素在有效放置目标上方时触发
   * @see https://developer.mozilla.org/docs/Web/API/HTMLElement/dragover_event
   * @applies 所有元素
   */
  onDragOver?: VitarxEventHandler<T, DragEvent> | undefined
  /**
   * 当开始拖动元素时触发
   * @see https://developer.mozilla.org/docs/Web/API/HTMLElement/dragstart_event
   * @applies 所有设置了draggable=true的元素
   */
  onDragStart?: VitarxEventHandler<T, DragEvent> | undefined
  /**
   * 当被拖动元素放置在有效放置目标上时触发
   * @see https://developer.mozilla.org/docs/Web/API/HTMLElement/drop_event
   * @applies 所有元素
   */
  onDrop?: VitarxEventHandler<T, DragEvent> | undefined
  /**
   * 当元素的滚动条被滚动时触发
   * @see https://developer.mozilla.org/docs/Web/API/Element/scroll_event
   * @applies 带有滚动条的元素
   */
  onScroll?: VitarxEventHandler<T> | undefined
  // 剪贴板事件
  /**
   * 当用户复制元素内容时触发
   * @see https://developer.mozilla.org/docs/Web/API/Element/copy_event
   * @applies 所有可编辑元素
   */
  onCopy?: VitarxEventHandler<T, ClipboardEvent> | undefined
  /**
   * 当用户剪切元素内容时触发
   * @see https://developer.mozilla.org/docs/Web/API/Element/cut_event
   * @applies 所有可编辑元素
   */
  onCut?: VitarxEventHandler<T, ClipboardEvent> | undefined
  /**
   * 当用户粘贴内容到元素时触发
   * @see https://developer.mozilla.org/docs/Web/API/Element/paste_event
   * @applies 所有可编辑元素
   */
  onPaste?: VitarxEventHandler<T, ClipboardEvent> | undefined
  // 媒体事件
  /**
   * 当媒体加载终止时触发
   * @see https://developer.mozilla.org/docs/Web/API/HTMLMediaElement/abort_event
   * @applies audio, video, img
   */
  onAbort?: VitarxEventHandler<T> | undefined
  /**
   * 当媒体可以开始播放时触发
   * @see https://developer.mozilla.org/docs/Web/API/HTMLMediaElement/canplay_event
   * @applies audio, video
   */
  onCanPlay?: VitarxEventHandler<T> | undefined
  /**
   * 当媒体可以无需暂停地播放完成时触发
   * @see https://developer.mozilla.org/docs/Web/API/HTMLMediaElement/canplaythrough_event
   * @applies audio, video
   */
  onCanPlayThrough?: VitarxEventHandler<T> | undefined
  /**
   * 当字幕轨道发生变化时触发
   * @see https://developer.mozilla.org/docs/Web/API/HTMLTrackElement/cuechange_event
   * @applies track
   */
  onCueChange?: VitarxEventHandler<T> | undefined
  /**
   * 当媒体时长变化时触发
   * @see https://developer.mozilla.org/docs/Web/API/HTMLMediaElement/durationchange_event
   * @applies audio, video
   */
  onDurationChange?: VitarxEventHandler<T> | undefined
  /**
   * 当媒体被清空时触发
   * @see https://developer.mozilla.org/docs/Web/API/HTMLMediaElement/emptied_event
   * @applies audio, video
   */
  onEmptied?: VitarxEventHandler<T> | undefined
  /**
   * 当媒体播放结束时触发
   * @see https://developer.mozilla.org/docs/Web/API/HTMLMediaElement/ended_event
   * @applies audio, video
   */
  onEnded?: VitarxEventHandler<T> | undefined
  /**
   * 当媒体数据已加载时触发
   * @see https://developer.mozilla.org/docs/Web/API/HTMLMediaElement/loadeddata_event
   * @applies audio, video
   */
  onLoadedData?: VitarxEventHandler<T> | undefined
  /**
   * 当媒体元数据已加载时触发
   * @see https://developer.mozilla.org/docs/Web/API/HTMLMediaElement/loadedmetadata_event
   * @applies audio, video
   */
  onLoadedMetadata?: VitarxEventHandler<T> | undefined
  /**
   * 当媒体开始加载时触发
   * @see https://developer.mozilla.org/docs/Web/API/HTMLMediaElement/loadstart_event
   * @applies audio, video
   */
  onLoadStart?: VitarxEventHandler<T> | undefined
  /**
   * 当媒体暂停时触发
   * @see https://developer.mozilla.org/docs/Web/API/HTMLMediaElement/pause_event
   * @applies audio, video
   */
  onPause?: VitarxEventHandler<T> | undefined
  /**
   * 当媒体开始播放时触发
   * @see https://developer.mozilla.org/docs/Web/API/HTMLMediaElement/play_event
   * @applies audio, video
   */
  onPlay?: VitarxEventHandler<T> | undefined
  /**
   * 当媒体从暂停状态开始播放时触发
   * @see https://developer.mozilla.org/docs/Web/API/HTMLMediaElement/playing_event
   * @applies audio, video
   */
  onPlaying?: VitarxEventHandler<T> | undefined
  /**
   * 当媒体下载时触发
   * @see https://developer.mozilla.org/docs/Web/API/HTMLMediaElement/progress_event
   * @applies audio, video
   */
  onProgress?: VitarxEventHandler<T> | undefined
  /**
   * 当播放速率改变时触发
   * @see https://developer.mozilla.org/docs/Web/API/HTMLMediaElement/ratechange_event
   * @applies audio, video
   */
  onRateChange?: VitarxEventHandler<T> | undefined
  /**
   * 当媒体完成跳转操作时触发
   * @see https://developer.mozilla.org/docs/Web/API/HTMLMediaElement/seeked_event
   * @applies audio, video
   */
  onSeeked?: VitarxEventHandler<T> | undefined
  /**
   * 当媒体开始跳转操作时触发
   * @see https://developer.mozilla.org/docs/Web/API/HTMLMediaElement/seeking_event
   * @applies audio, video
   */
  onSeeking?: VitarxEventHandler<T> | undefined
  /**
   * 当媒体加载意外停止时触发
   * @see https://developer.mozilla.org/docs/Web/API/HTMLMediaElement/stalled_event
   * @applies audio, video
   */
  onStalled?: VitarxEventHandler<T> | undefined
  /**
   * 当媒体加载暂停时触发
   * @see https://developer.mozilla.org/docs/Web/API/HTMLMediaElement/suspend_event
   * @applies audio, video
   */
  onSuspend?: VitarxEventHandler<T> | undefined
  /**
   * 当播放位置改变时触发
   * @see https://developer.mozilla.org/docs/Web/API/HTMLMediaElement/timeupdate_event
   * @applies audio, video
   */
  onTimeUpdate?: VitarxEventHandler<T> | undefined
  /**
   * 当音量改变时触发
   * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/volumechange_event
   * @applies audio, video
   */
  onVolumeChange?: VitarxEventHandler<T> | undefined
  /**
   * 当媒体暂停但预期会继续时触发
   * @see https://developer.mozilla.org/docs/Web/API/HTMLMediaElement/waiting_event
   * @applies audio, video
   */
  onWaiting?: VitarxEventHandler<T> | undefined
  // 触摸事件
  /**
   * 当触摸事件开始时触发
   * @see https://developer.mozilla.org/docs/Web/API/Element/touchstart_event
   * @applies 所有元素
   */
  onTouchStart?: VitarxEventHandler<T, TouchEvent> | undefined
  /**
   * 当触摸事件结束时触发
   * @see https://developer.mozilla.org/docs/Web/API/Element/touchend_event
   * @applies 所有元素
   */
  onTouchEnd?: VitarxEventHandler<T, TouchEvent> | undefined
  /**
   * 当触摸事件被取消时触发
   * @see https://developer.mozilla.org/docs/Web/API/Element/touchcancel_event
   * @applies 所有元素
   */
  onTouchCancel?: VitarxEventHandler<T, TouchEvent> | undefined
  /**
   * 当触摸事件移动时触发
   * @see https://developer.mozilla.org/docs/Web/API/Element/touchmove_event
   * @applies 所有元素
   */
  onTouchMove?: VitarxEventHandler<T, TouchEvent> | undefined
}

/**
 * W3C事件映射与修饰符事件映射的联合类型
 */
type W3CEventWithModifierMap<T> = {
  [K in keyof W3CEventMap<T> as `${K}${EventModifier}`]?: W3CEventMap<T>[K] | undefined
}

/**
 * 全局事件接口
 */
export interface GlobalEventAttributes<T> extends W3CEventMap<T>, W3CEventWithModifierMap<T> {}

export type WithEventAttributes<
  Name extends `on${string}`,
  T,
  E extends Event | UIEvent = Event
> = {
  [K in Name]?: VitarxEventHandler<T, E> | undefined
} & {
  [K in Name as `${K}${EventModifier}`]?: VitarxEventHandler<T, E> | undefined
}
