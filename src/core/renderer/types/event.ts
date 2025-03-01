type HTMLEventHandler<T extends Element, E> = (this: T, event: E) => void

export interface HTMLEventHumpMap<T extends Element> {
  // Window 事件
  /**
   * 在打印文档之后触发
   * @see https://developer.mozilla.org/docs/Web/API/Window/afterprint_event
   * @applies body
   */
  onAfterPrint?: HTMLEventHandler<T, Event>

  /**
   * 在打印文档之前触发
   * @see https://developer.mozilla.org/docs/Web/API/Window/beforeprint_event
   * @applies body
   */
  onBeforePrint?: HTMLEventHandler<T, Event>

  /**
   * 在窗口即将被卸载（关闭）时触发
   * @see https://developer.mozilla.org/docs/Web/API/Window/beforeunload_event
   * @applies body
   */
  onBeforeUnload?: HTMLEventHandler<T, BeforeUnloadEvent>

  /**
   * 在发生错误时触发
   * @see https://developer.mozilla.org/docs/Web/API/Window/error_event
   * @applies body, img, script, audio, video
   */
  onError?: HTMLEventHandler<T, ErrorEvent>

  /**
   * 当 URL 的片段标识符更改时触发
   * @see https://developer.mozilla.org/docs/Web/API/Window/hashchange_event
   * @applies body
   */
  onHashChange?: HTMLEventHandler<T, HashChangeEvent>

  /**
   * 当资源及其依赖资源已完成加载时触发
   * @see https://developer.mozilla.org/docs/Web/API/Window/load_event
   * @applies body, body, img, script, link, audio, video
   */
  onLoad?: HTMLEventHandler<T, Event>

  /**
   * 当窗口接收到消息时触发
   * @see https://developer.mozilla.org/docs/Web/API/Window/message_event
   * @applies body
   */
  onMessage?: HTMLEventHandler<T, MessageEvent>

  /**
   * 当浏览器失去网络连接时触发
   * @see https://developer.mozilla.org/docs/Web/API/Window/offline_event
   * @applies window
   */
  onOffline?: HTMLEventHandler<T, Event>

  /**
   * 当浏览器获得网络连接时触发
   * @see https://developer.mozilla.org/docs/Web/API/Window/online_event
   * @applies body
   */
  onOnline?: HTMLEventHandler<T, Event>

  /**
   * 当用户离开页面时触发
   * @see https://developer.mozilla.org/docs/Web/API/Window/pagehide_event
   * @applies body
   */
  onPageHide?: HTMLEventHandler<T, PageTransitionEvent>

  /**
   * 当用户导航到页面时触发
   * @see https://developer.mozilla.org/docs/Web/API/Window/pageshow_event
   * @applies window
   */
  onPageShow?: HTMLEventHandler<T, PageTransitionEvent>

  /**
   * 当浏览器历史记录改变时触发
   * @see https://developer.mozilla.org/docs/Web/API/Window/popstate_event
   * @applies window
   */
  onPopState?: HTMLEventHandler<T, PopStateEvent>

  /**
   * 当窗口被调整大小时触发
   * @see https://developer.mozilla.org/docs/Web/API/Window/resize_event
   * @applies window
   */
  onResize?: HTMLEventHandler<T, UIEvent>

  /**
   * 当 Web Storage 发生变化时触发
   * @see https://developer.mozilla.org/docs/Web/API/Window/storage_event
   * @applies body
   */
  onStorage?: HTMLEventHandler<T, StorageEvent>

  /**
   * 当页面即将被卸载时触发
   * @see https://developer.mozilla.org/docs/Web/API/Window/unload_event
   * @applies body
   */
  onUnload?: HTMLEventHandler<T, Event>

  // 表单事件
  /**
   * 当元素失去焦点时触发
   * @see https://developer.mozilla.org/docs/Web/API/Element/blur_event
   * @applies 所有可聚焦元素(如input, select, a等)
   */
  onBlur?: HTMLEventHandler<T, FocusEvent>

  /**
   * 当元素的值发生改变时触发
   * @see https://developer.mozilla.org/docs/Web/API/HTMLElement/change_event
   * @applies input, select, textarea
   */
  onChange?: HTMLEventHandler<T, Event>

  /**
   * 当右键点击元素时触发
   * @see https://developer.mozilla.org/docs/Web/API/Element/contextmenu_event
   * @applies 所有元素
   */
  onContextMenu?: HTMLEventHandler<T, MouseEvent>

  /**
   * 当元素获得焦点时触发
   * @see https://developer.mozilla.org/docs/Web/API/Element/focus_event
   * @applies 所有可聚焦元素(如input, select, a等)
   */
  onFocus?: HTMLEventHandler<T, FocusEvent>

  /**
   * 当元素获取输入时触发
   * @see https://developer.mozilla.org/docs/Web/API/HTMLElement/input_event
   * @applies input, textarea, select
   */
  onInput?: HTMLEventHandler<T, InputEvent>

  /**
   * 当元素验证失败时触发
   * @see https://developer.mozilla.org/docs/Web/API/HTMLInputElement/invalid_event
   * @applies form, input, select, textarea
   */
  onInvalid?: HTMLEventHandler<T, Event>

  /**
   * 当表单重置时触发
   * @see https://developer.mozilla.org/docs/Web/API/HTMLFormElement/reset_event
   * @applies form
   */
  onReset?: HTMLEventHandler<T, Event>

  /**
   * 当搜索输入框提交搜索时触发
   * @see https://developer.mozilla.org/docs/Web/API/HTMLInputElement/search_event
   * @applies input[type="search"]
   */
  onSearch?: HTMLEventHandler<T, Event>

  /**
   * 当文本被选中时触发
   * @see https://developer.mozilla.org/docs/Web/API/Element/select_event
   * @applies input[type="text"], textarea
   */
  onSelect?: HTMLEventHandler<T, Event>

  /**
   * 当表单提交时触发
   * @see https://developer.mozilla.org/docs/Web/API/HTMLFormElement/submit_event
   * @applies form
   */
  onSubmit?: HTMLEventHandler<T, SubmitEvent>

  // 键盘事件
  /**
   * 当键盘按键被按下时触发
   * @see https://developer.mozilla.org/docs/Web/API/Element/keydown_event
   * @applies 所有可聚焦元素和document
   */
  onKeyDown?: HTMLEventHandler<T, KeyboardEvent>

  /**
   * 当键盘按键被按下并释放时触发
   * @see https://developer.mozilla.org/docs/Web/API/Element/keypress_event
   * @applies 所有可聚焦元素和document
   * @deprecated 建议使用keydown代替
   */
  onKeyPress?: HTMLEventHandler<T, KeyboardEvent>

  /**
   * 当键盘按键被释放时触发
   * @see https://developer.mozilla.org/docs/Web/API/Element/keyup_event
   * @applies 所有可聚焦元素和document
   */
  onKeyUp?: HTMLEventHandler<T, KeyboardEvent>

  // 鼠标事件
  /**
   * 当元素被点击时触发
   * @see https://developer.mozilla.org/docs/Web/API/Element/click_event
   * @applies 所有可见元素
   */
  onClick?: HTMLEventHandler<T, MouseEvent>

  /**
   * 当元素被双击时触发
   * @see https://developer.mozilla.org/docs/Web/API/Element/dblclick_event
   * @applies 所有可见元素
   */
  onDblClick?: HTMLEventHandler<T, MouseEvent>

  /**
   * 当鼠标按钮在元素上按下时触发
   * @see https://developer.mozilla.org/docs/Web/API/Element/mousedown_event
   * @applies 所有可见元素
   */
  onMouseDown?: HTMLEventHandler<T, MouseEvent>

  /**
   * 当鼠标指针在元素上移动时触发
   * @see https://developer.mozilla.org/docs/Web/API/Element/mousemove_event
   * @applies 所有可见元素
   */
  onMouseMove?: HTMLEventHandler<T, MouseEvent>

  /**
   * 当鼠标指针移出元素时触发
   * @see https://developer.mozilla.org/docs/Web/API/Element/mouseout_event
   * @applies 所有可见元素
   */
  onMouseOut?: HTMLEventHandler<T, MouseEvent>

  /**
   * 当鼠标指针移入元素时触发
   * @see https://developer.mozilla.org/docs/Web/API/Element/mouseover_event
   * @applies 所有可见元素
   */
  onMouseOver?: HTMLEventHandler<T, MouseEvent>

  /**
   * 当鼠标按钮在元素上释放时触发
   * @see https://developer.mozilla.org/docs/Web/API/Element/mouseup_event
   * @applies 所有可见元素
   */
  onMouseUp?: HTMLEventHandler<T, MouseEvent>

  /**
   * 当鼠标滚轮在元素上滚动时触发
   * @see https://developer.mozilla.org/docs/Web/API/Element/wheel_event
   * @applies 所有可见元素
   */
  onWheel?: HTMLEventHandler<T, WheelEvent>

  // 拖拽事件
  /**
   * 当元素被拖动时触发
   * @see https://developer.mozilla.org/docs/Web/API/HTMLElement/drag_event
   * @applies 所有设置了draggable=true的元素
   */
  onDrag?: HTMLEventHandler<T, DragEvent>

  /**
   * 当拖动操作结束时触发
   * @see https://developer.mozilla.org/docs/Web/API/HTMLElement/dragend_event
   * @applies 所有设置了draggable=true的元素
   */
  onDragEnd?: HTMLEventHandler<T, DragEvent>

  /**
   * 当被拖动元素进入有效放置目标时触发
   * @see https://developer.mozilla.org/docs/Web/API/HTMLElement/dragenter_event
   * @applies 所有元素
   */
  onDragEnter?: HTMLEventHandler<T, DragEvent>

  /**
   * 当被拖动元素离开有效放置目标时触发
   * @see https://developer.mozilla.org/docs/Web/API/HTMLElement/dragleave_event
   * @applies 所有元素
   */
  onDragLeave?: HTMLEventHandler<T, DragEvent>

  /**
   * 当被拖动元素在有效放置目标上方时触发
   * @see https://developer.mozilla.org/docs/Web/API/HTMLElement/dragover_event
   * @applies 所有元素
   */
  onDragOver?: HTMLEventHandler<T, DragEvent>

  /**
   * 当开始拖动元素时触发
   * @see https://developer.mozilla.org/docs/Web/API/HTMLElement/dragstart_event
   * @applies 所有设置了draggable=true的元素
   */
  onDragStart?: HTMLEventHandler<T, DragEvent>

  /**
   * 当被拖动元素放置在有效放置目标上时触发
   * @see https://developer.mozilla.org/docs/Web/API/HTMLElement/drop_event
   * @applies 所有元素
   */
  onDrop?: HTMLEventHandler<T, DragEvent>

  /**
   * 当元素的滚动条被滚动时触发
   * @see https://developer.mozilla.org/docs/Web/API/Element/scroll_event
   * @applies 带有滚动条的元素
   */
  onScroll?: HTMLEventHandler<T, Event>

  // 剪贴板事件
  /**
   * 当用户复制元素内容时触发
   * @see https://developer.mozilla.org/docs/Web/API/Element/copy_event
   * @applies 所有可编辑元素
   */
  onCopy?: HTMLEventHandler<T, ClipboardEvent>

  /**
   * 当用户剪切元素内容时触发
   * @see https://developer.mozilla.org/docs/Web/API/Element/cut_event
   * @applies 所有可编辑元素
   */
  onCut?: HTMLEventHandler<T, ClipboardEvent>

  /**
   * 当用户粘贴内容到元素时触发
   * @see https://developer.mozilla.org/docs/Web/API/Element/paste_event
   * @applies 所有可编辑元素
   */
  onPaste?: HTMLEventHandler<T, ClipboardEvent>

  // 媒体事件
  /**
   * 当媒体加载终止时触发
   * @see https://developer.mozilla.org/docs/Web/API/HTMLMediaElement/abort_event
   * @applies audio, video, img
   */
  onAbort?: HTMLEventHandler<T, Event>

  /**
   * 当媒体可以开始播放时触发
   * @see https://developer.mozilla.org/docs/Web/API/HTMLMediaElement/canplay_event
   * @applies audio, video
   */
  onCanPlay?: HTMLEventHandler<T, Event>

  /**
   * 当媒体可以无需暂停地播放完成时触发
   * @see https://developer.mozilla.org/docs/Web/API/HTMLMediaElement/canplaythrough_event
   * @applies audio, video
   */
  onCanPlayThrough?: HTMLEventHandler<T, Event>

  /**
   * 当字幕轨道发生变化时触发
   * @see https://developer.mozilla.org/docs/Web/API/HTMLTrackElement/cuechange_event
   * @applies track
   */
  onCueChange?: HTMLEventHandler<T, Event>

  /**
   * 当媒体时长变化时触发
   * @see https://developer.mozilla.org/docs/Web/API/HTMLMediaElement/durationchange_event
   * @applies audio, video
   */
  onDurationChange?: HTMLEventHandler<T, Event>

  /**
   * 当媒体被清空时触发
   * @see https://developer.mozilla.org/docs/Web/API/HTMLMediaElement/emptied_event
   * @applies audio, video
   */
  onEmptied?: HTMLEventHandler<T, Event>

  /**
   * 当媒体播放结束时触发
   * @see https://developer.mozilla.org/docs/Web/API/HTMLMediaElement/ended_event
   * @applies audio, video
   */
  onEnded?: HTMLEventHandler<T, Event>

  /**
   * 当媒体数据已加载时触发
   * @see https://developer.mozilla.org/docs/Web/API/HTMLMediaElement/loadeddata_event
   * @applies audio, video
   */
  onLoadedData?: HTMLEventHandler<T, Event>

  /**
   * 当媒体元数据已加载时触发
   * @see https://developer.mozilla.org/docs/Web/API/HTMLMediaElement/loadedmetadata_event
   * @applies audio, video
   */
  onLoadedMetadata?: HTMLEventHandler<T, Event>

  /**
   * 当媒体开始加载时触发
   * @see https://developer.mozilla.org/docs/Web/API/HTMLMediaElement/loadstart_event
   * @applies audio, video
   */
  onLoadStart?: HTMLEventHandler<T, Event>

  /**
   * 当媒体暂停时触发
   * @see https://developer.mozilla.org/docs/Web/API/HTMLMediaElement/pause_event
   * @applies audio, video
   */
  onPause?: HTMLEventHandler<T, Event>

  /**
   * 当媒体开始播放时触发
   * @see https://developer.mozilla.org/docs/Web/API/HTMLMediaElement/play_event
   * @applies audio, video
   */
  onPlay?: HTMLEventHandler<T, Event>

  /**
   * 当媒体从暂停状态开始播放时触发
   * @see https://developer.mozilla.org/docs/Web/API/HTMLMediaElement/playing_event
   * @applies audio, video
   */
  onPlaying?: HTMLEventHandler<T, Event>

  /**
   * 当媒体下载时触发
   * @see https://developer.mozilla.org/docs/Web/API/HTMLMediaElement/progress_event
   * @applies audio, video
   */
  onProgress?: HTMLEventHandler<T, Event>

  /**
   * 当播放速率改变时触发
   * @see https://developer.mozilla.org/docs/Web/API/HTMLMediaElement/ratechange_event
   * @applies audio, video
   */
  onRateChange?: HTMLEventHandler<T, Event>

  /**
   * 当媒体完成跳转操作时触发
   * @see https://developer.mozilla.org/docs/Web/API/HTMLMediaElement/seeked_event
   * @applies audio, video
   */
  onSeeked?: HTMLEventHandler<T, Event>

  /**
   * 当媒体开始跳转操作时触发
   * @see https://developer.mozilla.org/docs/Web/API/HTMLMediaElement/seeking_event
   * @applies audio, video
   */
  onSeeking?: HTMLEventHandler<T, Event>

  /**
   * 当媒体加载意外停止时触发
   * @see https://developer.mozilla.org/docs/Web/API/HTMLMediaElement/stalled_event
   * @applies audio, video
   */
  onStalled?: HTMLEventHandler<T, Event>

  /**
   * 当媒体加载暂停时触发
   * @see https://developer.mozilla.org/docs/Web/API/HTMLMediaElement/suspend_event
   * @applies audio, video
   */
  onSuspend?: HTMLEventHandler<T, Event>

  /**
   * 当播放位置改变时触发
   * @see https://developer.mozilla.org/docs/Web/API/HTMLMediaElement/timeupdate_event
   * @applies audio, video
   */
  onTimeUpdate?: HTMLEventHandler<T, Event>

  /**
   * 当音量改变时触发
   * @see https://developer.mozilla.org/docs/Web/API/HTMLMediaElement/volumechange_event
   * @applies audio, video
   */
  onVolumeChange?: HTMLEventHandler<T, Event>

  /**
   * 当媒体暂停但预期会继续时触发
   * @see https://developer.mozilla.org/docs/Web/API/HTMLMediaElement/waiting_event
   * @applies audio, video
   */
  onWaiting?: HTMLEventHandler<T, Event>

  // 其他事件
  /**
   * 当details元素的展开/折叠状态改变时触发
   * @see https://developer.mozilla.org/docs/Web/API/HTMLDetailsElement/toggle_event
   * @applies details
   */
  onToggle?: HTMLEventHandler<T, Event>

  // 触摸事件
  /**
   * 当触摸事件开始时触发
   * @see https://developer.mozilla.org/docs/Web/API/Element/touchstart_event
   * @applies 所有元素
   */
  onTouchStart?: HTMLEventHandler<T, TouchEvent>

  /**
   * 当触摸事件结束时触发
   * @see https://developer.mozilla.org/docs/Web/API/Element/touchend_event
   * @applies 所有元素
   */
  onTouchEnd?: HTMLEventHandler<T, TouchEvent>

  /**
   * 当触摸事件被取消时触发
   * @see https://developer.mozilla.org/docs/Web/API/Element/touchcancel_event
   * @applies 所有元素
   */
  onTouchCancel?: HTMLEventHandler<T, TouchEvent>

  /**
   * 当触摸事件移动时触发
   * @see https://developer.mozilla.org/docs/Web/API/Element/touchmove_event
   * @applies 所有元素
   */
  onTouchMove?: HTMLEventHandler<T, TouchEvent>
}

/**
 * HTML所有事件映射
 */
export type HTMLEventLowerMap<T extends Element> = {
  [K in keyof HTMLEventHumpMap<T> as Lowercase<K>]: HTMLEventHumpMap<T>[K]
}

/**
 * HTML所有事件名，小写
 */
export type HTMLEventLowerNames = keyof HTMLEventLowerMap<Element>
