import { DOMRenderer } from '../../runtime-dom/dist/core/renderer.js'
import { setRenderer } from '../src/index.js'

setRenderer(new DOMRenderer() as any)
