import { createElement, type Element, isClassWidget, Widget } from '../src/index.js'

class A extends Widget {
  protected build(): Element {
    return createElement('div')
  }
}

console.log(isClassWidget(A))
