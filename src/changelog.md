# Changelog

## v2.1.0

### GlobalCanvas

- `config` propery which overrides scroll-rig config. Props that might be useful to change are `debug`, `scaleMultiplier`, `scrollLerp`.
- `scaleMultiplier` config added which affects PerspectiveCameraScene and ScrollScene scaling. Used to scale pixels vs viewport units (1 by default, i.e. 1px = 1 viewport unit). Suggest using `0.001` for perspective scenes to avoid depth buffer sorting issues etc. (1000px == 1 viewport unit)

### ScrollScene

- Scale scene using global `config.scaleMultiplier`

### PerspectiveCameraScene

- Scale scene using global `config.scaleMultiplier`

### ResizeManager

- Fix broken resize logic under some race conditions

## v2.0.0

### GlobalRenderer

- Viewport scenes can now renderOnTop to render after global queue
- depth is no longer disabled
- config.fbo is removed, implement in your app instead
- `renderScissor`is deprecated - to complex - not enough perf gain.

### PerspectiveScrollScene

- Uses `createPortal` instead of nested scene and all of its problems (sweet!)
- New prop `renderOnTop` to render after global render

## v1.0:

### GlobalCanvas

- WebGL 2.0 by default
- `resizeOnHeight` added to GlobalCanvas (default true)

### ScrollScene

- `live` flag is now called `updateLayout`
- `getOffset` -> `layoutOffset`
- `scene` prop passed to children is no longer a ref

### PerspectiveScrollScene

- Uses `createPortal` instead of nested scene and all of its problems (sweet!)

GlobalRenderer

- colorManagement=true + gl.toneMapping = NoToneMapping to match hex with DOM

### ResizeManager

- `resizeOnWebFontLoaded` added to ResizeManager
