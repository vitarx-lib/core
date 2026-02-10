import { defineDirective } from '@vitarx/runtime-core'
import html from './directives/html.js'
import show from './directives/show.js'
import text from './directives/text.js'

export * from './core/index.js'
export type * from './types/index.js'
defineDirective('show', show)
defineDirective('html', html)
defineDirective('text', text)
