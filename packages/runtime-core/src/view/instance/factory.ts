import { App } from '../../app/index.js'
import { ViewFlag } from '../../shared/constants/viewFlag.js'
import type { ParentView, View, ViewRuntime } from '../../types/index.js'
import { DynamicInstance } from './dynamic.js'
import { HostViewInstance } from './host.js'
import { WidgetInstance } from './widget.js'

export function createViewInstance<T extends ViewFlag>(
  view: View<T>,
  parent: ParentView | null,
  owner: WidgetInstance | null,
  app: App | null
): ViewRuntime<T> {
  let instance: View<T>['instance']
  switch (view.flag) {
    case ViewFlag.WIDGET:
      instance = new WidgetInstance(view, parent, owner, app)
      break
    case ViewFlag.DYNAMIC:
      instance = new DynamicInstance(view, parent, owner, app)
      break
    default:
      instance = new HostViewInstance(parent, owner, app)
      if (view.flag === ViewFlag.ELEMENT || (view as any).tyep === 'svg') {
        instance.svgNamespace = true
      }
  }
  view.instance = instance
  return view as unknown as ViewRuntime<T>
}
