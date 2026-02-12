// @ts-ignore
import { DOMRenderer } from '../../runtime-dom/dist/index.es.js'
import { setRenderer } from '../src/index.js'

setRenderer(new DOMRenderer() as any)
