import { setVitarxVersion } from '@vitarx/runtime-core'
import { jsx, jsxs } from './jsx-runtime.js'

// 设置 Vitarx 的版本号，build脚本会自动替换为实际版本号
setVitarxVersion('__VERSION__')

export * from '@vitarx/utils'
export * from '@vitarx/responsive'
export * from '@vitarx/runtime-core'
export * from '@vitarx/runtime-dom'
export { jsx, jsxs }
