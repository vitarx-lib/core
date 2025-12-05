import { type HostRenderer, setRenderer } from '@vitarx/runtime-core'
import { DomRenderer } from '@vitarx/runtime-dom/renderer'
import { __IS_SERVER__ } from './shared/index.js'

if (__IS_SERVER__) {
  setRenderer(
    new Proxy({} as HostRenderer, {
      get(_target: HostRenderer, p: string | symbol, _receiver: any): any {
        return () => {
          throw new Error(`HostRenderer.${p.toString()} is not supported in server side`)
        }
      }
    })
  )
} else {
  setRenderer(new DomRenderer())
}
