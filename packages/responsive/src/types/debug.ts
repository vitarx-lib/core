import type { Signal } from './signal.js'

export type DebuggerEventHandler = (event: DebuggerEvent) => void
export type DependType = keyof ProxyHandler<{}>
export interface DebuggerEvent {
  signal: Signal
  type: DependType
}
