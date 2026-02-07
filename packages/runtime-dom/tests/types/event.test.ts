/**
 * event 类型定义单元测试
 *
 * 测试目标：验证事件类型定义和修饰符支持
 */
import { describe, expect, it } from 'vitest'
import type { HTMLEventOptions, HTMLIntrinsicElement } from '../../src/index.js'

describe('types/event', () => {
  describe('事件处理函数类型', () => {
    it('事件处理函数类型签名应该正确', () => {
      type ButtonProps = HTMLIntrinsicElement['button']

      const clickHandler: Required<ButtonProps>['onClick'] = function (
        this: HTMLButtonElement,
        event
      ) {
        expect(this).toBeInstanceOf(HTMLButtonElement)
        expect(event).toBeInstanceOf(MouseEvent)
      }

      expect(typeof clickHandler).toBe('function')
    })

    it('事件参数类型应该正确', () => {
      type InputProps = HTMLIntrinsicElement['input']

      const changeHandler: Required<InputProps>['onChange'] = (event: Event) => {
        // event 应该是 Event 类型
        expect(event).toBeInstanceOf(Event)
      }

      expect(typeof changeHandler).toBe('function')
    })

    it('应该支持不同事件类型', () => {
      type DivProps = HTMLIntrinsicElement['div']

      const mouseHandler: Required<DivProps>['onClick'] = event => {
        expect(event).toBeInstanceOf(MouseEvent)
      }

      const keyHandler: Required<DivProps>['onKeyDown'] = event => {
        expect(event).toBeInstanceOf(KeyboardEvent)
      }

      expect(typeof mouseHandler).toBe('function')
      expect(typeof keyHandler).toBe('function')
    })
  })

  describe('事件名称映射', () => {
    it('应该支持小驼峰事件名', () => {
      type ButtonProps = HTMLIntrinsicElement['button']

      const props: ButtonProps = {
        onClick: () => {},
        onMouseDown: () => {},
        onMouseUp: () => {},
        onKeyDown: () => {},
        onFocus: () => {},
        onBlur: () => {}
      }

      expect(typeof props.onClick).toBe('function')
      expect(typeof props.onMouseDown).toBe('function')
      expect(typeof props.onKeyDown).toBe('function')
    })

    it('应该支持表单事件', () => {
      type FormProps = HTMLIntrinsicElement['form']

      const props: FormProps = {
        onSubmit: () => {},
        onReset: () => {},
        onInvalid: () => {},
        children: []
      }

      expect(typeof props.onSubmit).toBe('function')
      expect(typeof props.onReset).toBe('function')
    })

    it('应该支持输入事件', () => {
      type InputProps = HTMLIntrinsicElement['input']

      const props: InputProps = {
        onInput: () => {},
        onChange: () => {},
        onFocus: () => {},
        onBlur: () => {}
      }

      expect(typeof props.onInput).toBe('function')
      expect(typeof props.onChange).toBe('function')
    })

    it('应该支持鼠标事件', () => {
      type DivProps = HTMLIntrinsicElement['div']

      const props: DivProps = {
        onClick: () => {},
        onDblClick: () => {},
        onMouseDown: () => {},
        onMouseUp: () => {},
        onMouseMove: () => {},
        onMouseEnter: () => {},
        onMouseLeave: () => {},
        onMouseOver: () => {},
        onMouseOut: () => {},
        onWheel: () => {}
      }

      expect(typeof props.onClick).toBe('function')
      expect(typeof props.onDblClick).toBe('function')
      expect(typeof props.onMouseMove).toBe('function')
    })

    it('应该支持键盘事件', () => {
      type InputProps = HTMLIntrinsicElement['input']

      const props: InputProps = {
        onKeyDown: () => {},
        onKeyUp: () => {},
        onKeyPress: () => {}
      }

      expect(typeof props.onKeyDown).toBe('function')
      expect(typeof props.onKeyUp).toBe('function')
    })

    it('应该支持拖拽事件', () => {
      type DivProps = HTMLIntrinsicElement['div']

      const props: DivProps = {
        onDrag: () => {},
        onDragEnd: () => {},
        onDragEnter: () => {},
        onDragLeave: () => {},
        onDragOver: () => {},
        onDragStart: () => {},
        onDrop: () => {}
      }

      expect(typeof props.onDrag).toBe('function')
      expect(typeof props.onDragStart).toBe('function')
      expect(typeof props.onDrop).toBe('function')
    })

    it('应该支持剪贴板事件', () => {
      type DivProps = HTMLIntrinsicElement['div']

      const props: DivProps = {
        onCopy: () => {},
        onCut: () => {},
        onPaste: () => {}
      }

      expect(typeof props.onCopy).toBe('function')
      expect(typeof props.onCut).toBe('function')
      expect(typeof props.onPaste).toBe('function')
    })

    it('应该支持触摸事件', () => {
      type DivProps = HTMLIntrinsicElement['div']

      const props: DivProps = {
        onTouchStart: () => {},
        onTouchEnd: () => {},
        onTouchMove: () => {},
        onTouchCancel: () => {}
      }

      expect(typeof props.onTouchStart).toBe('function')
      expect(typeof props.onTouchMove).toBe('function')
    })

    it('应该支持媒体事件', () => {
      type VideoProps = HTMLIntrinsicElement['video']

      const props: VideoProps = {
        onPlay: () => {},
        onPause: () => {},
        onEnded: () => {},
        onVolumeChange: () => {},
        onTimeUpdate: () => {},
        onLoadedMetadata: () => {},
        children: []
      }

      expect(typeof props.onPlay).toBe('function')
      expect(typeof props.onPause).toBe('function')
    })
  })

  describe('事件修饰符类型', () => {
    it('应该支持 Capture 修饰符', () => {
      type DivProps = HTMLIntrinsicElement['div']

      const props: DivProps = {
        onClickCapture: () => {},
        onMouseDownCapture: () => {},
        onFocusCapture: () => {}
      }

      expect(typeof props.onClickCapture).toBe('function')
      expect(typeof props.onMouseDownCapture).toBe('function')
    })

    it('应该支持 Once 修饰符', () => {
      type ButtonProps = HTMLIntrinsicElement['button']

      const props: ButtonProps = {
        onClickOnce: () => {},
        onMouseDownOnce: () => {}
      }

      expect(typeof props.onClickOnce).toBe('function')
      expect(typeof props.onMouseDownOnce).toBe('function')
    })

    it('应该支持 Passive 修饰符', () => {
      type DivProps = HTMLIntrinsicElement['div']

      const props: DivProps = {
        onScrollPassive: () => {},
        onWheelPassive: () => {},
        onTouchMovePassive: () => {}
      }

      expect(typeof props.onScrollPassive).toBe('function')
      expect(typeof props.onWheelPassive).toBe('function')
    })

    it('应该支持组合修饰符', () => {
      type DivProps = HTMLIntrinsicElement['div']

      const props: DivProps = {
        onClickCaptureOnce: () => {},
        onScrollPassiveCapture: () => {}
      }

      expect(typeof props.onClickCaptureOnce).toBe('function')
    })
  })

  describe('HTMLEventOptions 接口', () => {
    it('capture 选项应该为可选布尔值', () => {
      const options1: HTMLEventOptions = {
        capture: true
      }

      const options2: HTMLEventOptions = {
        capture: false
      }

      const options3: HTMLEventOptions = {}

      expect(options1.capture).toBe(true)
      expect(options2.capture).toBe(false)
      expect(options3.capture).toBeUndefined()
    })

    it('once 选项应该为可选布尔值', () => {
      const options1: HTMLEventOptions = {
        once: true
      }

      const options2: HTMLEventOptions = {
        once: false
      }

      expect(options1.once).toBe(true)
      expect(options2.once).toBe(false)
    })

    it('passive 选项应该为可选布尔值', () => {
      const options1: HTMLEventOptions = {
        passive: true
      }

      const options2: HTMLEventOptions = {
        passive: false
      }

      expect(options1.passive).toBe(true)
      expect(options2.passive).toBe(false)
    })

    it('应该支持所有选项的组合', () => {
      const options: HTMLEventOptions = {
        capture: true,
        once: true,
        passive: false
      }

      expect(options.capture).toBe(true)
      expect(options.once).toBe(true)
      expect(options.passive).toBe(false)
    })

    it('应该允许空选项对象', () => {
      const options: HTMLEventOptions = {}

      expect(options).toBeDefined()
      expect(Object.keys(options).length).toBe(0)
    })
  })

  describe('事件类型完整性', () => {
    it('应该支持所有标准 DOM 事件', () => {
      type DivProps = HTMLIntrinsicElement['div']

      const allEvents: Partial<DivProps> = {
        // 鼠标事件
        onClick: () => {},
        onDblClick: () => {},
        onMouseDown: () => {},
        onMouseUp: () => {},
        onMouseMove: () => {},
        onMouseOver: () => {},
        onMouseOut: () => {},
        onWheel: () => {},

        // 键盘事件
        onKeyDown: () => {},
        onKeyUp: () => {},
        onKeyPress: () => {},

        // 焦点事件
        onFocus: () => {},
        onBlur: () => {},

        // 拖拽事件
        onDrag: () => {},
        onDrop: () => {},

        // 剪贴板事件
        onCopy: () => {},
        onCut: () => {},
        onPaste: () => {},

        // 滚动事件
        onScroll: () => {},

        // 触摸事件
        onTouchStart: () => {},
        onTouchEnd: () => {},
        onTouchMove: () => {},

        // 其他
        onContextMenu: () => {},
        onError: () => {}
      }

      expect(Object.keys(allEvents).length).toBeGreaterThan(20)
    })
  })
})
