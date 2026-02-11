import { App } from '@vitarx/runtime-core'

export * from '@vitarx/utils'
export * from '@vitarx/responsive'
export * from '@vitarx/runtime-core'
export * from '@vitarx/runtime-dom'
export * from '@vitarx/runtime-ssr'

// @ts-ignore 打包后注入
// noinspection JSConstantReassignment
App.version = '__VERSION__'
