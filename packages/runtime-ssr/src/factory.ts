import { type HostRenderer, setRenderer } from '@vitarx/runtime-core'
import { DomRenderer } from '@vitarx/runtime-dom/renderer'
import { __IS_SERVER__ } from './shared/constants.js'
import { setupServerDrivers } from './server/setup.js'

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
  // Register server-side drivers
  setupServerDrivers()
} else {
  setRenderer(new DomRenderer())
}
