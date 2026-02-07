import { setRenderer } from '@vitarx/runtime-core'
import { DOMRenderer } from '../src/index.js'

setRenderer(new DOMRenderer())
