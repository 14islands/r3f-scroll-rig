Breaking changes v1.0:

GlobalCanvas

- WebGL 2.0 by default

ScrollScene

- `live` flag is now called `updateLayout`
- `getOffset` -> `layoutOffset`
- `scene` prop passed to children is no longer a ref

PerspectiveScrollScene

- Uses `createPortal` instead of nested scene and all of its problems (sweet!)

GlobalRenderer

- colorManagement=true + gl.toneMapping = NoToneMapping to match hex with DOM
- Viewport scenes now render LAST (after scissors)

TODO - FIX flip logic

- `resizeOnHeight` added to GlobalCanvas
- `resizeOnWebFontLoaded` added to ResizeManager
