# ⚙️ API

<table>
  <tr>
    <td valign="top">
      <h2><a href="#components">Components</a></h2>
        <ul>
          <li><a href="#globalcanvas">GlobalCanvas</a></li>
          <li><a href="#smoothscrollbar">SmoothScrollbar</a></li>
          <li><a href="#usecanvas">UseCanvas</a></li>
          <li><a href="#scrollscene">ScrollScene</a></li>
          <li><a href="#viewportscrollscene">ViewportScrollScene</a></li>
        </ul>
       <td valign="top">
       <h2> <a href="#hooks">Hooks</a></h2>
        <ul>
          <li><a href="#usescrollrig">useScrollRig</a></li>
          <li><a href="#usescrollbar">useScrollbar</a></li>
          <li><a href="#usetracker">useTracker</a></li>
          <li><a href="#usecanvas-1">useCanvas</a></li>
          <li><a href="#useimageastexture">useImageAsTexture</a></li>
        </ul>
    </td>

  </tr>
</table>

## Components

### `<GlobalCanvas>`

This is the global canvas component that should stay mounted in between page loads.

#### Render Props

`GlobalCanvas` is just a thin wrapper around the default R3F `Canvas` and accepts all the same props.

```tsx
<GlobalCanvas
  children // R3F global child nodes
  debug?: boolean = false
  scaleMultiplier?: number = 1 // 1 pixel = 1 viewport unit
  globalRender?: boolean
  globalPriority?: number
  globalClearDepth?: boolean
  // and all default R3F Canvas props
/>
```

**Note:** _the `GlobalCanvas` has a custom Perspective / Orthographic camera - don't override the camera unless you want full control. For the default `PerspectiveCamera`, you can either specify the `fov` or the `distance` and the other will be calculated to make sure we always match the size of DOM elements._

The following default styles are applied to the canvas:

```css
style={{
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  height: '100vh', // use 100vh to avoid resize on iOS when url bar goes away
  ...style,
}}
```

#### Children as render function

You can pass a render function as the single child to `GlobalCanvas` if you want full control over where the children from `UseCanvas`/`useCanvas` appear in the scene hierarchy.

This is for useful if you want to wrap the global children in a `Suspense` to prevent persistent meshes from being hidden while loading new assets.

```jsx
<GlobalCanvas>
  {(globalChildren) => (
    <>
      <MyPersistentBackground />
      <Suspense fallback={null}>{globalChildren}</Suspense>
    </>
  )}
</GlobalCanvas>
```

### `<SmoothScrollbar>`

The `SmoothScrollbar` component will animate `window.scrollY` smoothly. This allows us to match the speed of objects moving on the fixed GlobalCanvas.

Worth noting:

- it **does not** use JS to move the content using transforms
- we can use `position: sticky` etc 👌
- the component sets `pointer-events: none` on `document.documentElement` to avoid jank caused by hover states (optional, turn of using `disablePointerOnScroll={false}`)
- the R3F event loop is used to animate scroll
- `SmoothScrollbar` uses `lenis` internally. Make sure to read through their section on [considerations](https://github.com/darkroomengineering/lenis#considerations) when adding `SmoothScrollbar` to your project.
- supports horizontal scroll, adding `horizontal: true` will create a horizontal Lenis instance and will scroll the scene along the x axis.

```jsx
import { SmoothScrollbar } from '@14islands/r3f-scroll-rig'

// _app.jsx
function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <SmoothScrollbar />
      <GlobalCanvas />
      <Component {...pageProps} />
    </>
  )
}
```

💡 You can either place the `SmoothScrollbar` in a persistent layout (Lenis will autmatically pick up changes to the document height when navigating). Or, you can place it inside each page in case you want some pages with smooth scrolling and some without.

#### Render Props

```tsx
<SmoothScrollbar
  scrollRestoration?: ScrollRestoration = "auto"
  enabled?: boolean = true // smooth scroll or not
  locked?: boolean = false // lock/disable scroll
  disablePointerOnScroll?: boolean = true
  horizontal?: boolean = false
  config?: object  // lenis config options
/>
```

If you attach a ref to the SmoothScrollbar you will recieve an imperative handle with access to the Lenis instance and its functions.

#### Use without GlobalCanvas

💡**Note:** _You can use `SmoothScrollbar` independently based on the project needs. If the project doesn't need WebGL, you can still use the scrollbar to implement smooth scrolling, and stay flexible to add Canvas later in the project if needed._

```jsx
import { SmoothScrollbar } from '@14islands/r3f-scroll-rig/scrollbar'
```

💡 _A The `scrollbar` import target excludes all `@react-three/fiber`, `three` related imports and allows you to slim down the bundle size._

### `<UseCanvas>`

This component tunnels the children to the GlobalCanvas using the `useCanvas` hook. It's basically just the same, but a bit more user friendly

The children will stay mounted on the canvas until this component unmounts.

#### Render Props

```tsx
<UseCanvas
  children: JSX.Element | (props) => JSX.Element
  id?: string  // persistent layout ID (optional: see below)
  dispose?: boolean // dispose on unmount (optional: true by default)
  [key: string]: any // props to reactively tunnel to the child
>
  <MyMeshComponent />
</UseCanvas>
```

`id` can be used to indicate that the same canvas componets is to be shared between DOM components. For instance it can prevent a mesh from unmounting when navigating to a new page, if that same mesh with the same ID is also present on the new page. This is similar to how Framer Motions layoutId works, but without the automatic layout animation.

The props added to `UseCanvas` will be tunneled and applied to the child component running inside the GlobalCanvas. It automatically updates the canvas component's props when any of the them change.

```jsx
const [isOpen, setIsOpen] = useState(false)

return (
  <div onClick={() => setIsOpen(true)}>
  <UseCanvas isOpen={isOpen}>
    <MyMesh /* I will receieve all props from UseCanvas when they update */ />
  </UseCanvas>
)
```

### `<ScrollScene>`

Tracks a DOM element and renders a Threejs Scene that matches the position in the viewport during scroll.

The child component is passed `scale` which can be used to match the DOM element's size. It's also passed `scrollState` which contains information regarding it's position in the viewport, this is useful for things like parallax or animations. By default it will also hide the children when leaving the viewport.

```tsx
<ScrollScene
  track: RefObject            // DOM element to track (ref)
  children: (props) => JSX.Element  // render function
  as?: string = "scene"       // renders as a Scene by default
  inViewportMargin?: string = "0%"  // IntersectionObserver rootMargin
  inViewportThreshold?: number = 0  // IntersectionObserver threshold
  hideOffscreen?: boolean = true // Hide scene when outside viewport
  visible?: boolean = true    // Scene visibility
  debug?: boolean = false     // Render a debug plane and show 50% opacity of DOM element
  scissor?: boolean = false   // Render as separate pass in a scissor
  margin?: number             // margin added outside scissor
  priority?: number = 1       // useFrame priority for scissor render
  >
  { ({ scale, ...props }) => (
    <mesh scale={scale}>
      <planeGeometry />
      <meshBasicMaterial color="turquoise" />
    </mesh>
  )}
</ScrollScene>
```

The child node will be passed the following `props`:

```ts
track: RefObject // HTML element being tracked
scale: number[]  // HTML element dimensions converted to world scale
scrollState: {
  // transient state - not reactive
  inViewport: boolean // boolean - true if currently in viewport
  progress: number // number - 0 when below viewport. 1 when above viewport
  visibility: number // number - percent of item height in view
  viewport: number // number - percent of window height scrolled since visible
}
inViewport: boolean // boolean set to true while in viewport (+/- inViewportMargin)
priority: number // the parent useFrame priority
props: any[] // tunneled from the parent
```

_Note: this is an abstraction on top of the <a href="#usetracker">useTracker</a> hook._

### `<ViewportScrollScene>`

Tracks a DOM element similar to ScrollScene, but renders a virtual scene in a separate pass.

This makes it possible to use different lights and camera settings compared to the global scene, at the cost of one extra render per instance.

The child receives the same props as the ScrollScene provides.

```tsx
<ViewportScrollScene
  track: RefObject            // DOM element to track (ref)
  children: (props) => JSX.Element  // render function
  orthographic?: boolean = false // uses a perspective camera by default
  inViewportMargin?: string = "0%"  // IntersectionObserver rootMargin
  inViewportThreshold?: number = 0  // IntersectionObserver threshold
  hideOffscreen?: boolean = true // Hide scene when outside viewport
  margin?: number             // margin added outside scissor
  visible?: boolean = true    // Scene visibility
  debug?: boolean = false     // Render a debug plane and show 50% opacity of DOM element
  priority?: number = 1       // useFrame priority
  hud?: boolean               // clear depth
  camera?: any                // camera overrides
  >
  { ({ scale, ...props }) => (
    <mesh scale={scale}>
      <planeGeometry />
      <meshBasicMaterial color="turquoise" />
    </mesh>
  )}
</ViewportScrollScene>
```

The child node will be passed the following `props`:

```ts
track: RefObject // HTML element being tracked
scale: number[]  // HTML element dimensions converted to world scale
scrollState: {
  // transient state - not reactive
  inViewport: boolean // boolean - true if currently in viewport
  progress: number // number - 0 when below viewport. 1 when above viewport
  visibility: number // number - percent of item height in view
  viewport: number // number - percent of window height scrolled since visible
}
inViewport: boolean // boolean set to true while in viewport (+/- inViewportMargin)
priority: number // the parent useFrame priority
props: any[] // tunneled from the parent
```

_Note: this is an abstraction on top of the <a href="#usetracker">useTracker</a> hook._

## Hooks

### `useScrollbar`

Use this to access the scrollbar and current scroll information.

```tsx
import { useScrollbar } from '@14islands/r3f-scroll-rig'

const {
  enabled: boolean, // True if SmoothScrollbar is enabled
  scroll: {
    // transient scroll information
    y: number
    x: number
    limit: number
    velocity: number
    progress: number
    direction: string
  },
  scrollTo: (number | element) => void, // scroll to
  onScroll: (cb) => unbindFunc // subscribe to scroll events
} = useScrollbar
```

#### Use without GlobalCanvas

💡 You can import and use `useScrollbar` in isolation from a separate `scrollbar` target. This excludes all `@react-three/fiber`, `three` related imports and allows you to slim down the bundle size.

```jsx
import { useScrollbar } from '@14islands/r3f-scroll-rig/scrollbar'
```

### `useScrollRig`

Hook to access current scroll rig state and functions related to rendering.

```tsx
import { useScrollRig } from '@14islands/r3f-scroll-rig'

const {
  isCanvasAvailable: boolean, // True if webgl is enabled and GlobalCanvas has been added to the page
  hasSmoothScrollbar: boolean, // True if a smooth scrollbar is currently enabled onm the DOM content
  scaleMultiplier: number, // current viewport unit scaling = 1 by default
  reflow: () => void, // tigger re-calculation of elements position (called automatically on resize), () => void
  debug: boolean, // whether the GloblCanvas is in debug mode or not
  // Advanced render API
  preloadScene: ({ scene?: Scene; camera?: Camera; layer?: number }, callback) => void, // request scene to do a preload render before next frame
  requestRender: (layers?: number[]) => void, // request the global render loop to render next frame
  renderScissor: ({ gl, scene, camera, top, left, width, height, layer, autoClear, clearDepth}) => void, // renders scene with a scissor to the canvas
  renderViewport:  ({ gl, scene, camera, top, left, width, height, layer, autoClear, clearDepth}) => void, // renders a scene inside a viewport to the canvas,
} = useScrollRig
```

### `useTracker`

Used internally by `ScrollScene` and `ViewportScrollScene` to track DOM elements as the user scrolls.

This hook makes a single call to `getBoundingClientRect` when it mounts and then uses scroll offsets to calculate the element's position during scroll.

It will not detect changes to the element size - only as a result of window resize.

It returns `scale` and `position` in Three.js units. `position` is not reactive to avoid expensive re-renders, so you need to read its properties in a rAF or on scroll.

```ts

interface TrackerOptions {
  rootMargin?: string = "50%" // IntersectionObserver
  threshold?: number = 0 // IntersectionObserver
  autoUpdate?: boolean = true // auto updates position/bounds/scrollState on scroll
}

const tracker: Tracker = useTracker(track: MutableRefObject<HTMLElement>, options?: TrackerOptions)

interface Tracker {
  rect: DOMRect // reactive pixel size
  scale: vec3 // reactive viewport unit scale
  inViewport: Boolean // reactive
  bounds: Bounds // non-reactive pixel bounds - updates on scroll
  position: vec3 // non-reactive viewport unit position, updates on scroll
  scrollState: ScrollState // non-reactive scroll stats, updates on scroll
  update: () => void // use to manually update position/bounds/scrollState
}
```

`vec3` is 3-dimensional vector type from [vecn](https://www.npmjs.com/package/vecn) that support swizzling and object notation. You can do things like:

```js
position.x === position[0]
position.xy => [x,y]
scale.xy.min() => Math.min(scale.x, scale.y)
```

The `scrollState` is also passed down to the children of `ScrollScene` and `ViewportScrollScene`:

```ts
export interface ScrollState {
  inViewport: boolean
  progress: number
  visibility: number
  viewport: number
}
```

### `useCanvas`

Hook used in regular DOM components to render something onto the `GlobalCanvas`.

```ts
const update = useCanvas(
  object: Object3D | (props) => Object3D,
  props = {},
  { key, dispose = true} = {}
): (props: any) => void
```

`object` will be added to the global canvas when this component is mounted and removed from the canvas when it unmounts.

`props` is an optional object can be used to automatically update those properties on the canvas object when they change due to a re-render of the parent component.

If `key` is specified, the mesh will not unmount as long as there are other hooks using this key. This can be used to make page transitions where an object moves seamlessly from one page to another.

if `dispose` is set to `false` - objects will never unmount from the canvas.

Returns a function that can be used to update the props of the `object` at any time.

```jsx
import { useCanvas } from '@14islands/r3f-scroll-rig';

function MyMesh() {
  return (
    <mesh>
      <boxGeometry args={[1,1,1]}/>
    </mesh>
  )
}

function MyComponent() {
  useCanvas(<MyMesh/>);
  return ...
}

```

### `useImageAsTexture`

Loads a `THREE.Texture` from a DOM image source.

Supports <picture> tags with multiple sources or responsive `srcset`.

It will wait for the DOM image to be loaded and then use the `currentSrc` to get a cache hit and upload the texture to the GPU.

It suspends until the texture is fully loaded and also notifies the Three.js `DefaultLoadingManager` that something is loading.

```jsx
function MyMesh({ imgTagRef, scale }) {
  const texture = useImageAsTexture(imgTagRef)
  return (
    <mesh scale={scale}>
      <planeGeometry />
      <meshBasicMaterial map={texture} />
    </mesh>
  )
}
```
