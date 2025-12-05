// Export SSR app
export { SSRApp } from './SSRApp.js'
export { createSSRApp } from './createSSRApp.js'

// Export SSR context type
export type { SSRContext } from './common/context.js'

// Export rendering functions
export { renderToString, type RenderOptions } from './render/renderToString.js'

// Export server drivers
export { setupServerDrivers } from './server/setup.js'

// Export string utilities
export { StringSink } from './string/StringSink.js'
export {
  escapeHTML,
  serializeAttributes,
  tagOpen,
  tagClose,
  tagSelfClosing
} from './string/helpers.js'

// Import factory to ensure initialization
import './factory.js'
