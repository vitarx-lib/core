/**
 * 事件监听器配置选项接口
 *
 * @interface
 * @description 定义了事件监听器的行为配置选项。这些选项可以控制事件的捕获方式、触发次数和性能优化等特性
 * @example
 * // 配置一个只触发一次的点击事件监听器
 * element.addEventListener("click", handler, { once: true });
 */
export interface EventOptions {
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
   * @description 当设置为true时，事件监听器在被触发一次后会自动移除
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
 * 事件修饰符
 *
 * @type {EventModifier}
 * @description 定义了事件修饰符的联合类型，这些修饰符可以控制事件的捕获、触发次数和性能优化等特性
 */
export type EventModifier = keyof EventOptions
/**
 * 事件修饰符(大驼峰)
 */
export type EventModifierHump = 'Capture' | 'Once' | 'Passive' | 'OnceCapture'
// 事件处理器类型
type EventHandler<T extends Element, E> = (this: T, event: E) => void

/**
 * 所有事件映射，小驼峰事件名
 */
export interface EventHumpMap<T extends Element> {
  /**
   * 在发生错误时触发
   * @see https://developer.mozilla.org/docs/Web/API/Window/error_event
   * @applies img, script, audio, video
   */
  onError?: EventHandler<T, ErrorEvent>
  /**
   * 当资源及其依赖资源已完成加载时触发
   * @see https://developer.mozilla.org/docs/Web/API/Window/load_event
   * @applies img, script, link, audio, video
   */
  onLoad?: EventHandler<T, Event>
  /**
   * 当元素失去焦点时触发
   * @see https://developer.mozilla.org/docs/Web/API/Element/blur_event
   * @applies 所有可聚焦元素(如input, select, a等)
   */
  onBlur?: EventHandler<T, FocusEvent>
  /**
   * 当元素的值发生改变时触发
   * @see https://developer.mozilla.org/docs/Web/API/HTMLElement/change_event
   * @applies input, select, textarea
   */
  onChange?: EventHandler<T, Event>
  /**
   * 当右键点击元素时触发
   * @see https://developer.mozilla.org/docs/Web/API/Element/contextmenu_event
   * @applies 所有元素
   */
  onContextMenu?: EventHandler<T, MouseEvent>
  /**
   * 当元素获得焦点时触发
   * @see https://developer.mozilla.org/docs/Web/API/Element/focus_event
   * @applies 所有可聚焦元素(如input, select, a等)
   */
  onFocus?: EventHandler<T, FocusEvent>
  /**
   * 当元素获取输入时触发
   * @see https://developer.mozilla.org/docs/Web/API/HTMLElement/input_event
   * @applies input, textarea, select
   */
  onInput?: EventHandler<T, InputEvent>
  /**
   * 当元素验证失败时触发
   * @see https://developer.mozilla.org/docs/Web/API/HTMLInputElement/invalid_event
   * @applies form, input, select, textarea
   */
  onInvalid?: EventHandler<T, Event>
  /**
   * 当表单重置时触发
   * @see https://developer.mozilla.org/docs/Web/API/HTMLFormElement/reset_event
   * @applies form
   */
  onReset?: EventHandler<T, Event>
  /**
   * 当搜索输入框提交搜索时触发
   * @see https://developer.mozilla.org/docs/Web/API/HTMLInputElement/search_event
   * @applies input[type="search"]
   */
  onSearch?: EventHandler<T, Event>
  /**
   * 当文本被选中时触发
   * @see https://developer.mozilla.org/docs/Web/API/Element/select_event
   * @applies input[type="text"], textarea
   */
  onSelect?: EventHandler<T, Event>
  /**
   * 当表单提交时触发
   * @see https://developer.mozilla.org/docs/Web/API/HTMLFormElement/submit_event
   * @applies form
   */
  onSubmit?: EventHandler<T, SubmitEvent>
  /**
   * 当键盘按键被按下时触发
   * @see https://developer.mozilla.org/docs/Web/API/Element/keydown_event
   * @applies 所有可聚焦元素和document
   */
  onKeyDown?: EventHandler<T, KeyboardEvent>
  /**
   * 当键盘按键被按下并释放时触发
   * @see https://developer.mozilla.org/docs/Web/API/Element/keypress_event
   * @applies 所有可聚焦元素和document
   * @deprecated 建议使用keydown代替
   */
  onKeyPress?: EventHandler<T, KeyboardEvent>
  /**
   * 当键盘按键被释放时触发
   * @see https://developer.mozilla.org/docs/Web/API/Element/keyup_event
   * @applies 所有可聚焦元素和document
   */
  onKeyUp?: EventHandler<T, KeyboardEvent>
  // 鼠标事件
  /**
   * 当元素被点击时触发
   * @see https://developer.mozilla.org/docs/Web/API/Element/click_event
   * @applies 所有可见元素
   */
  onClick?: EventHandler<T, MouseEvent>
  /**
   * 当元素被双击时触发
   * @see https://developer.mozilla.org/docs/Web/API/Element/dblclick_event
   * @applies 所有可见元素
   */
  onDblClick?: EventHandler<T, MouseEvent>
  /**
   * 当鼠标按钮在元素上按下时触发
   * @see https://developer.mozilla.org/docs/Web/API/Element/mousedown_event
   * @applies 所有可见元素
   */
  onMouseDown?: EventHandler<T, MouseEvent>
  /**
   * 当鼠标指针在元素上移动时触发
   * @see https://developer.mozilla.org/docs/Web/API/Element/mousemove_event
   * @applies 所有可见元素
   */
  onMouseMove?: EventHandler<T, MouseEvent>
  /**
   * 当鼠标指针移出元素时触发
   * @see https://developer.mozilla.org/docs/Web/API/Element/mouseout_event
   * @applies 所有可见元素
   */
  onMouseOut?: EventHandler<T, MouseEvent>
  /**
   * 当鼠标指针移入元素时触发
   * @see https://developer.mozilla.org/docs/Web/API/Element/mouseover_event
   * @applies 所有可见元素
   */
  onMouseOver?: EventHandler<T, MouseEvent>
  /**
   * 当鼠标按钮在元素上释放时触发
   * @see https://developer.mozilla.org/docs/Web/API/Element/mouseup_event
   * @applies 所有可见元素
   */
  onMouseUp?: EventHandler<T, MouseEvent>
  /**
   * 当鼠标滚轮在元素上滚动时触发
   * @see https://developer.mozilla.org/docs/Web/API/Element/wheel_event
   * @applies 所有可见元素
   */
  onWheel?: EventHandler<T, WheelEvent>
  // 拖拽事件
  /**
   * 当元素被拖动时触发
   * @see https://developer.mozilla.org/docs/Web/API/HTMLElement/drag_event
   * @applies 所有设置了draggable=true的元素
   */
  onDrag?: EventHandler<T, DragEvent>
  /**
   * 当拖动操作结束时触发
   * @see https://developer.mozilla.org/docs/Web/API/HTMLElement/dragend_event
   * @applies 所有设置了draggable=true的元素
   */
  onDragEnd?: EventHandler<T, DragEvent>
  /**
   * 当被拖动元素进入有效放置目标时触发
   * @see https://developer.mozilla.org/docs/Web/API/HTMLElement/dragenter_event
   * @applies 所有元素
   */
  onDragEnter?: EventHandler<T, DragEvent>
  /**
   * 当被拖动元素离开有效放置目标时触发
   * @see https://developer.mozilla.org/docs/Web/API/HTMLElement/dragleave_event
   * @applies 所有元素
   */
  onDragLeave?: EventHandler<T, DragEvent>
  /**
   * 当被拖动元素在有效放置目标上方时触发
   * @see https://developer.mozilla.org/docs/Web/API/HTMLElement/dragover_event
   * @applies 所有元素
   */
  onDragOver?: EventHandler<T, DragEvent>
  /**
   * 当开始拖动元素时触发
   * @see https://developer.mozilla.org/docs/Web/API/HTMLElement/dragstart_event
   * @applies 所有设置了draggable=true的元素
   */
  onDragStart?: EventHandler<T, DragEvent>
  /**
   * 当被拖动元素放置在有效放置目标上时触发
   * @see https://developer.mozilla.org/docs/Web/API/HTMLElement/drop_event
   * @applies 所有元素
   */
  onDrop?: EventHandler<T, DragEvent>
  /**
   * 当元素的滚动条被滚动时触发
   * @see https://developer.mozilla.org/docs/Web/API/Element/scroll_event
   * @applies 带有滚动条的元素
   */
  onScroll?: EventHandler<T, Event>
  // 剪贴板事件
  /**
   * 当用户复制元素内容时触发
   * @see https://developer.mozilla.org/docs/Web/API/Element/copy_event
   * @applies 所有可编辑元素
   */
  onCopy?: EventHandler<T, ClipboardEvent>
  /**
   * 当用户剪切元素内容时触发
   * @see https://developer.mozilla.org/docs/Web/API/Element/cut_event
   * @applies 所有可编辑元素
   */
  onCut?: EventHandler<T, ClipboardEvent>
  /**
   * 当用户粘贴内容到元素时触发
   * @see https://developer.mozilla.org/docs/Web/API/Element/paste_event
   * @applies 所有可编辑元素
   */
  onPaste?: EventHandler<T, ClipboardEvent>
  // 媒体事件
  /**
   * 当媒体加载终止时触发
   * @see https://developer.mozilla.org/docs/Web/API/HTMLMediaElement/abort_event
   * @applies audio, video, img
   */
  onAbort?: EventHandler<T, Event>
  /**
   * 当媒体可以开始播放时触发
   * @see https://developer.mozilla.org/docs/Web/API/HTMLMediaElement/canplay_event
   * @applies audio, video
   */
  onCanPlay?: EventHandler<T, Event>
  /**
   * 当媒体可以无需暂停地播放完成时触发
   * @see https://developer.mozilla.org/docs/Web/API/HTMLMediaElement/canplaythrough_event
   * @applies audio, video
   */
  onCanPlayThrough?: EventHandler<T, Event>
  /**
   * 当字幕轨道发生变化时触发
   * @see https://developer.mozilla.org/docs/Web/API/HTMLTrackElement/cuechange_event
   * @applies track
   */
  onCueChange?: EventHandler<T, Event>
  /**
   * 当媒体时长变化时触发
   * @see https://developer.mozilla.org/docs/Web/API/HTMLMediaElement/durationchange_event
   * @applies audio, video
   */
  onDurationChange?: EventHandler<T, Event>
  /**
   * 当媒体被清空时触发
   * @see https://developer.mozilla.org/docs/Web/API/HTMLMediaElement/emptied_event
   * @applies audio, video
   */
  onEmptied?: EventHandler<T, Event>
  /**
   * 当媒体播放结束时触发
   * @see https://developer.mozilla.org/docs/Web/API/HTMLMediaElement/ended_event
   * @applies audio, video
   */
  onEnded?: EventHandler<T, Event>
  /**
   * 当媒体数据已加载时触发
   * @see https://developer.mozilla.org/docs/Web/API/HTMLMediaElement/loadeddata_event
   * @applies audio, video
   */
  onLoadedData?: EventHandler<T, Event>
  /**
   * 当媒体元数据已加载时触发
   * @see https://developer.mozilla.org/docs/Web/API/HTMLMediaElement/loadedmetadata_event
   * @applies audio, video
   */
  onLoadedMetadata?: EventHandler<T, Event>
  /**
   * 当媒体开始加载时触发
   * @see https://developer.mozilla.org/docs/Web/API/HTMLMediaElement/loadstart_event
   * @applies audio, video
   */
  onLoadStart?: EventHandler<T, Event>
  /**
   * 当媒体暂停时触发
   * @see https://developer.mozilla.org/docs/Web/API/HTMLMediaElement/pause_event
   * @applies audio, video
   */
  onPause?: EventHandler<T, Event>
  /**
   * 当媒体开始播放时触发
   * @see https://developer.mozilla.org/docs/Web/API/HTMLMediaElement/play_event
   * @applies audio, video
   */
  onPlay?: EventHandler<T, Event>
  /**
   * 当媒体从暂停状态开始播放时触发
   * @see https://developer.mozilla.org/docs/Web/API/HTMLMediaElement/playing_event
   * @applies audio, video
   */
  onPlaying?: EventHandler<T, Event>
  /**
   * 当媒体下载时触发
   * @see https://developer.mozilla.org/docs/Web/API/HTMLMediaElement/progress_event
   * @applies audio, video
   */
  onProgress?: EventHandler<T, Event>
  /**
   * 当播放速率改变时触发
   * @see https://developer.mozilla.org/docs/Web/API/HTMLMediaElement/ratechange_event
   * @applies audio, video
   */
  onRateChange?: EventHandler<T, Event>
  /**
   * 当媒体完成跳转操作时触发
   * @see https://developer.mozilla.org/docs/Web/API/HTMLMediaElement/seeked_event
   * @applies audio, video
   */
  onSeeked?: EventHandler<T, Event>
  /**
   * 当媒体开始跳转操作时触发
   * @see https://developer.mozilla.org/docs/Web/API/HTMLMediaElement/seeking_event
   * @applies audio, video
   */
  onSeeking?: EventHandler<T, Event>
  /**
   * 当媒体加载意外停止时触发
   * @see https://developer.mozilla.org/docs/Web/API/HTMLMediaElement/stalled_event
   * @applies audio, video
   */
  onStalled?: EventHandler<T, Event>
  /**
   * 当媒体加载暂停时触发
   * @see https://developer.mozilla.org/docs/Web/API/HTMLMediaElement/suspend_event
   * @applies audio, video
   */
  onSuspend?: EventHandler<T, Event>
  /**
   * 当播放位置改变时触发
   * @see https://developer.mozilla.org/docs/Web/API/HTMLMediaElement/timeupdate_event
   * @applies audio, video
   */
  onTimeUpdate?: EventHandler<T, Event>
  /**
   * 当音量改变时触发
   * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/volumechange_event
   * @applies audio, video
   */
  onVolumeChange?: EventHandler<T, Event>
  /**
   * 当媒体暂停但预期会继续时触发
   * @see https://developer.mozilla.org/docs/Web/API/HTMLMediaElement/waiting_event
   * @applies audio, video
   */
  onWaiting?: EventHandler<T, Event>
  // 其他事件
  /**
   * 当details元素的展开/折叠状态改变时触发
   * @see https://developer.mozilla.org/docs/Web/API/HTMLDetailsElement/toggle_event
   * @applies details
   */
  onToggle?: EventHandler<T, Event>
  // 触摸事件
  /**
   * 当触摸事件开始时触发
   * @see https://developer.mozilla.org/docs/Web/API/Element/touchstart_event
   * @applies 所有元素
   */
  onTouchStart?: EventHandler<T, TouchEvent>
  /**
   * 当触摸事件结束时触发
   * @see https://developer.mozilla.org/docs/Web/API/Element/touchend_event
   * @applies 所有元素
   */
  onTouchEnd?: EventHandler<T, TouchEvent>
  /**
   * 当触摸事件被取消时触发
   * @see https://developer.mozilla.org/docs/Web/API/Element/touchcancel_event
   * @applies 所有元素
   */
  onTouchCancel?: EventHandler<T, TouchEvent>
  /**
   * 当触摸事件移动时触发
   * @see https://developer.mozilla.org/docs/Web/API/Element/touchmove_event
   * @applies 所有元素
   */
  onTouchMove?: EventHandler<T, TouchEvent>
}

/**
 * 所有事件映射，小写事件名
 */
export type EventLowerMap<T extends Element> = {
  [K in keyof EventHumpMap<T> as Lowercase<K>]: EventHumpMap<T>[K]
}
/**
 * 所有事件映射，小驼峰支持修饰符
 */
export type EventModifierMap<T extends Element> = {
  [K in keyof EventHumpMap<T> as `${K}${EventModifierHump}`]: EventHumpMap<T>[K]
}
/**
 * 所有事件名，小写
 */
export type EventLowerNames = keyof EventLowerMap<Element>
/**
 * 所有事件名，全小写、小驼峰、修饰符
 */
export type EventNames =
  | EventLowerNames
  | keyof EventModifierMap<Element>
  | keyof EventHumpMap<Element>
