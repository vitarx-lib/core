// @ts-ignore
import { DOMRenderer } from '../../runtime-dom/dist/index.esm-bundler.js'
import { setRenderer } from '../src/index.js'

setRenderer(new DOMRenderer() as any)
