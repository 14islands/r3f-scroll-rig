# Changelog

## v8.9.0

Simplify render logic and improve camera controls.

- `ViewportScrollScene`

  - Feat: now uses portal state enclave for camera so you can use OrbitControls or pass in a custom camera as a child.
  - Feat: No longer clears depth by default
  - Feat: added `hud` prop to clear depth
  - Feat: aadded `camera` prop to allow overriding default camera settings
    - specifying `fov` will calculate distance to match the DOM
  - Removed `renderOrder` - can be set manually on children instead

- `ScrollScene`

  - Removed `renderOrder` - can be set manually on children instead

- `GlobalCanvas`

  - Fix: make sure `viewport` is correct after resize when using default perspective camera
  - Feat: `camera` prop now allows overriding `fov`. If `fov` is specified, the camera distance will be calculated to match DOM size.
  - Feat: Default camera FoV now set to 50
  - Removed: `globalClearAlpha` - can be controlled by other useFrames with higher or lower priority instead

- `useImageAsTexture`

  - Fix: better support for next/image loading="lazy"

- `SmoothScrollbar`
  - Fix: make sure binding an onScroll callback fires an initial scroll event

## v8.8.0

Added some properties to help support having multiple SmoothScrollbar on the page at the same time. The usecase is to open a Modal on top of the current page which also needs to be smooth scrolled.

- `useTracker`

  - Added `wrapper` option to get initial scroll offset from DOM element instead of the window object.
  - Added `scroll` prop to `update({ scroll })` to update tracker with custom scroll state. Useful when having a secondary scrollbar mounted.

- `SmoothScrollbar`
  - Added `onScroll` prop to register a scroll event callback.
  - Added `updateGlobalState` prop. True by default. Set it to false to disable updating the global scroll state. Useful when having a secondary scrollbar mounted.

## v8.7.0

- `scrollInContainer`

  - Feat: Added experimental `scrollInContainer` prop which scrolls inside the body element instead of the default window. This can be used to avoid scrolling away the URL bar on mobile. It also enables the `smoothTouch` setting in Lenis which emulates scroll using touch events.

- `useTracker`
  - Fix: Matches height of canvas element instead of window.innerHeight if possible. (Fixes position problems on mobile where canvas is 100vh)

## v8.6.0

- All files converted to TypeScript

## v8.5.0

- Fixed SSR warnings by replacing `uesLayoutEffect` with `useIsomorphicLayoutEffect`

- `GlobalCanvas`

  - removed `loadingFallback`
  - children can now be a render function (optional). It accepts the global canvas children from useCanvas as a single parameter. This can be used to add suspense boundaries.

  ```jsx
  <GlobalCanvas>
    {(globalChildren) => (
      <Suspense fallback={null}>
        {globalChildren}
        <AnotherPersistentComponent />
      </Suspense>
    )}
  </GlobalCanvas>
  ```

- `useImageAsTexture`

  - Added WebP Accept header to fetch request if supported by brower
  - Notifies the DefaultLoadingManager that something is loading while waiting for the DOM image load.

- Added global css with classes that can hide DOM elements when canvas is active
  `import "@14islands/r3f-scroll-rig/css";`

- Global export `styles` added to access CSS class names from Javascript.

```jsx
import { styles } from '@14islands/r3f-scroll-rig'

function Component() {
  return <div className={styles.hidden}>I will be `visibility: hidden` if WebGL is supported</div>
}
```

- Removed `useCanvasRef` - use exported classnames and global CSS to hide elements via SSR instead to avoid FOUC

- `SmoothScrollbar`

  - Replaced global html classname `js-has-smooth-scrollbar` with two classes: `js-smooth-scrollbar-enabled` and `js-smooth-scrollbar-disabled`

- `useCanvas` - improved option `dispose:false` to keep unused meshes mounted. Now passes an `inactive` prop to the component which is true if no hook is using the mesh.

- `useTracker` - new call signature
  - first argument is always the DOM ref
  - second argument is the optional config settings for the IntersectionObserver

## v8.4.0

- `GlobalCanvas`
  - `children` can now be a render function which accepts all global children as a single argument. Can be used if you need to wrap all canvas children with a parent.

## v8.3.0

- `useTracker` hook

  - Added `autoUpdate` configuration which decides if the tracker automatically updates on scroll events. True by default.
  - The `update` callback will now always recalculate positions even if element is outside viewport in case user wants to turn off autUpdate and take control.

- `SmoothScrollbar`
  - Added `horizontal` prop

## v8.1.0

- `useTracker` hook

  - Added `threshold` prop which can used to customize the underlying Intersection Observer of the tracked DOM element

- `ScrollScene` and `ViewportScrollScene`
  - Added `inViewportThreshold` prop which is passed to `useTracker` as `threshold`

## v8.0.0

Complete refactor with focus on reducing complexity.

Now uses mostly R3F defaults and `<GlobalCanvas>` accepts all R3F Canvas props.

Advanced use-cases are enabled only when setting `frameloop="demand"` - so most users won't have to worry about this.

### New peer deps:

- @react-three/fiber `">=8.0.0"`
- Three.js `>=0.139.0` is now required for colorManagement

### New features

- Started adding typescript
- Uses `https://github.com/studio-freight/lenis` scrollbar
- New hook `useTracker` that tracks DOM elements - refactored `ScrollScene` and `ViewportScrollScene` to use this internally.
- New hook `useCanvasRef` which can be used to hide tracked DOM elements when the canvas is active.
- New hook `useImageAsTexture` which loads images from the DOM and suspends via useLoader. Replaces the old `useImgTagAsTexture` which did not suspend properly and was more of a hack.

### Breaking Changes:

- Removed `useImgTagAsTexture`. Use `useImageAsTexture` instead.
- `ScrollScene` and `ViewportScrollScene`

  - Renamed `el` prop to `track`
  - `inViewportMargin` is now a string and maps to IntersectionObserver `rootMargin`
  - Removed `lerp`, `lerpOffset`. Uses the SmoothScrollbar position directly.
  - Removed `setInViewportProp` prop. Instead uses IntersectionObserver to always set `inViewport` prop.
  - Removed `updateLayout` - relac position using the `reflow()` method from `useSrcollRig()` instead.
  - Removed `positionFixed` - suggest implementing manually in some other way using `useTracker`.
  - Removed `autoRender` - suggest implementing manually in a custom component using `useTracker`.
  - Removed `resizeDelay`
  - Removed `hiddenStyle` - use `useCanvasRef` instead to control how tracked DOM elements are hidden.

- `VirtualScrollbar` and `HijackedScrollbar` removed. Use `SmoothScrollbar` instead which is similar to the old hijacked version.
- `GlobalCanvas`

  - Removed `config` prop and added individual props instead:
    - Added `debug` to turn on shader compile errors and show console.logs
    - Added `scaleMultiplier` to control viewport units scaling
    - Added `globalRender` - enable/disable built-in render loop
    - Added `globalPriority` - enable/disable built-in render loop
    - Added `globalAutoClear?: boolean` to control if `gl.clearDepth()` is called before render in global render loop. Default `false` - render as HUD on top of viewports without clearing them.
    - Added `globalClearDepth?: boolean` to control `gl.autoClear` in global render loop. Default `true`.
  - Renamed `fallback` property to `loadingFallback` for global Suspense fallback as R3F Canvas already has a prop with this name

- examples/ folder removed
- added new import target `@14islands/r3f-scroll-rig/powerups` with useful helpers - might become separate repo later

## v7.0.0

- update to R3f v7
- Enables autoRender by default if frameloop="always"

## v6.0.0

- Updated to R3F v6 api.

## v2.1.0

### ViewportScrollScene, ScrollScene, ScrollDomPortal

- `lerpOffset` is now a factor that is multiplied with the lerp instead of added. Default value is now `1` instead of `0`.

## v2.0.0

Breaking upgrade. Simplify and remove as much as possible.

- `requestFrame` is now removed. please use `invalidate` to trigger useFrame
- global render pass now run with priority `1000`
- `renderFullscreen` has been renamed to `requestRender` - use this to trigger a global render pass.
- `renderScissor` and `renderViewport` now renders immediately. use `useFrame() priority` to render before or after global render
- `preloadScene` now runs with priority `0`
- `ScrollScene` and `ViewportScrollScene` runs with priority `1` by default
- `ScrollScene` and `ViewportScrollScene` now accepts a `priority` prop to change the `useFrame` priority.
- all `pause` and `suspend` logic has been removed

## v1.11.0

Added `stdlib` export target with the following reusable components:

- WebGLText
- WebGLImage
- ParallaxScrollScene
- StickyScrollScene

E.g. `import { StickyScrollScene } from '@14islands/r3f-scroll-rig/stdlib`

## v1.10.0

### GlobalCanvas

- Added back Stats component. `fps` config and querystring now works again

### HijackedScrollbar

- New experimental scrollbar with animates `window.scrollTo` instead of translating sections with CSS.

## v1.9.21

### ScrollDom (Experimental)

- Removed. Consider using `ScrollPortal` or use `drei`'s `HTML` component instead.

### ScrollDomPortal

- Removed `framer-motion` dependency.

### ViewportScrollScene

- Removed `framer-motion` dependency.

### VirtualScrollbar

- Removed `framer-motion` dependency.

### ScrollScene

- Removed experimental `softDirection`
- Removed `framer-motion` dependency.

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

- Uses custom cameras for global `scaleMultiplier` to work properly. Bypasses all built-in @react-three/fiber camera logic. Property `orthogonal` is used to select which camera.
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
