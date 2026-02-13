import { DOMRenderer, setRenderer } from 'vitarx'

// 注册浏览器端渲染器，用于测试
setRenderer(new DOMRenderer())
