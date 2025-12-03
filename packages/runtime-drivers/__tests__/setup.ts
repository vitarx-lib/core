import { setRenderer } from '@vitarx/runtime-core'
import { DomRenderer } from '../../runtime-dom/dist/client/DomRenderer.js'
import { setupDefaultDrivers } from '../src/index.js'

setRenderer(new DomRenderer() as any)
setupDefaultDrivers()
