export const enum NodeShapeFlags {
  REGULAR_ELEMENT = 1,
  VOID_ELEMENT = 1 << 1,
  FRAGMENT = 1 << 2,
  TEXT = 1 << 3,
  COMMENT = 1 << 4,
  STATEFUL_WIDGET = 1 << 5,
  STATELESS_WIDGET = 1 << 6
}
