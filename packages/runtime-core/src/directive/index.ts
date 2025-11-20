import { defineDirective } from './core.js'
import { show } from './show.js'

export * from './core.js'

// 注册内置指令 - show
defineDirective('show', show)
