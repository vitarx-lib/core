import { setRenderer } from '@vitarx/runtime-core'
import { DomRenderer } from '../../runtime-dom/dist/DomRenderer.js'
import { registerDefaultDrivers } from '../src/index.js'

setRenderer(new DomRenderer() as any)
registerDefaultDrivers()
