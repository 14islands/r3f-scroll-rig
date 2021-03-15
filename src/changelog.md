# Changelog

## v1.9.21

### ScrollDom (Experimental)

- Removed. Consider using `ScrollPortal` or use `drei`'s `HTML` component instead.

### ScrollScene

- Removed experimental `softDirection`

## v1.9.17

### GlobalCanvas

- Added config option `subpixelScrolling` that affects ScrollScene. If false, the scroll poition will be rounded to an integer (browsers usually do this with normal scroll)

## v1.9.13

### ScrollDomPortal

- `portalEl` now needs to be passed as an argument. GlobalCanvas no longer provides a default portal.

## v1.9.12

### GlobalCanvas

- `antialias` and `depth` are now `true` by default.
- `VirtualScrolbar` now uses same lerp & restDelta as Canvas components

## v1.9.0

### GlobalRenderer

- No more automatic switching between global vs scissor renders. To make it more predictable, scissor passes are always rendered if requested.

### ScrollScene

- `scissor` is now false by default

## v1.8.0

### VirtualScrollbar

- New prop `scrollToTop` (false by default) to automatically scroll to top of page when scrollbar mounts. (used to be true by default)

## v1.7.1

### GlobalRenderer

- `gl.autoClear` is now only turned off if we have viewports renderering before main global render call. This fixes background alpha glitch on Oculus browser and WebXR clearing issues.

## v1.7.0

### GlobalCanvas

- New property `as` to support rendering the global canvas as a `VRCanvas` for instance.

## v1.6.0

### ViewportScrollScene

- `PerspectiveCameraScene` renamed to `ViewportScrollScene` with optional property `orthographic` to switch between orthographic and perspective cameras. Both are scaled to fit the viewport exactly.

### GlobalCanvas

- Uses custom cameras for global `scaleMultiplier` to work properly. Bypasses all built-in react-three-fiber camera logic. Property `orthogonal` is used to select which camera.
- added `fps` setting to the `config` propery which overrides scroll-rig config Querystring value for `fps` and `debug` override this config.
- Default pixelRatio scaling can now be turned off with `config={{autoPixelRatio: false}}`
- turned stencil buffer on by default (not sure disabling did anything good for perf anyway)
- removed gl properties `preserveDrawingBuffer: false` and `premultipliedAlpha: true` that are default in threejs anyway to simplify

## v1.5.0

### ScrollScene

- Deprecated `layoutOffset` and `layoutLerp`. Should be implemented by child component.

## v1.4.0

### ScrollScene

- Deprecated `state` prop passed to child. Replaced by `scrollState`

### PerspectiveCameraScene

- Deprecated `state` prop passed to child. Replaced by `scrollState`
- Accepts `scaleMultiplier` prop which overrides global setting

## v1.3.0

### GlobalCanvas

- `config` propery which overrides scroll-rig config. Props that might be useful to change are `debug`, `scaleMultiplier`, `scrollLerp`.
- `scaleMultiplier` config added which affects PerspectiveCameraScene and ScrollScene scaling. Used to scale pixels vs viewport units (1 by default, i.e. 1px = 1 viewport unit). Suggest using `0.001` for perspective scenes to avoid depth buffer sorting issues etc. (1000px == 1 viewport unit)

### ScrollScene

- Scale scene using global `config.scaleMultiplier`

### PerspectiveCameraScene

- Scale scene using global `config.scaleMultiplier`

### ResizeManager

- Fix broken resize logic under some race conditions

## v1.2.0

### GlobalRenderer

- Viewport scenes can now renderOnTop to render after global queue
- depth is no longer disabled
- config.fbo is removed, implement in your app instead
- `renderScissor`is deprecated

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
