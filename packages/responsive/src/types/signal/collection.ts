import type { AnyCollection } from '@vitarx/utils'
import type { Signal } from './core.js'

export type CollectionSignal<T extends AnyCollection> = T & Signal<T>
