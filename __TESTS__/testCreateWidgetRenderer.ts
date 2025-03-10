import { createElement, createWidgetRenderer, type Element, Widget } from '../src/index.js'

class TestCreateWidgetRenderer extends Widget<{ data: string }> {
  protected build(): Element {
    return createElement('div')
  }
}

class TestCreateWidgetRenderer2 extends Widget {
  protected build(): Element {
    return createElement('div')
  }
}

createWidgetRenderer(TestCreateWidgetRenderer2)
