# @14islands/r3f-scroll-rig

![npm](https://img.shields.io/npm/v/@14islands/r3f-scroll-rig?color=magenta&style=flat-square)

Progressively enhance a React website with WebGL using `@react-three/fiber` and smooth scrolling.

<p align="center">
  <img width="59%" src="https://www.dropbox.com/s/9rja3b6a3967mjv/scroll-rig2.gif?dl=0&raw=1" style="float:right" />
 <img width="40%" src="https://www.dropbox.com/s/17rrpgbw07ct4jn/scroll-rig.gif?dl=0&raw=1" style="float:right" />
</p>

[ <a href="#features">Features</a> |
<a href="#introduction">Introduction</a> |
<a href="#installing">Installing</a> |
<a href="#getting-started">Getting Started</a> |
<a href="#examples">Examples</a> |
<a href="#api">API</a> |
<a href="#gotchas">Gotchas</a> ]

# Features

- 🔍 Tracks DOM elements and draws Three.js objects in their place using correct scale and position.
- 🤷 Framework agnostic - works with `next.js`, `gatsby.js`, `create-react-app` etc.
- 📐 Can render objects in viewports. Makes it possible for each object to have a unique camera, lights, environment map, etc.
- 🌠 Helps load responsive images from the DOM. Supports `<picture>`, `srset` and `loading="lazy"`
- 🚀 Optimized for performance. Only calls `Element.getBoundingClientRect()` once on mount and uses IntersectionObserver to know if something is in the viewport.
- ♻️ Plays nice with the @react-three ecosystem

# Introduction

Background: [Progressive Enhancement with WebGL and React](https://medium.com/14islands/progressive-enhancement-with-webgl-and-react-71cd19e66d4)

![scrollrig](https://user-images.githubusercontent.com/420472/191715313-cc813f47-4e4a-454f-a2f5-d8e2ec998c95.jpeg)

At the core there is a global shared canvas `GlobalCanvas` that stays in between page loads. React DOM components can choose to draw things on this canvas while they are mounted using a custom hook called `useCanvas` or the `UseCanvas` tunnel component.

React DOM components can use `ScrollScene` or `ViewportScrollScene` to automatically track their position and draw a Three.js scene in that exact location. Everything is synched to the scrollbar position.

# Installing

`yarn add @14islands/r3f-scroll-rig @react-three/fiber three`

# Getting Started

1. Add `<GlobalCanvas>` to your layout. Keep it outside of your router to keep it from unmounting when navigating between pages.

```jsx
// gatsby-browser.js
import { GlobalCanvas } from '@14islands/r3f-scroll-rig'

export const wrapRootElement = ({ element }) => (
  <>
    {element}
    <GlobalCanvas />
  </>
)
```

2. Add smooth scrolling to the DOM content

We need to animate the browser scroll position in order to perfectly match the WebGL objects and DOM content.

Wrap your page in `SmoothScrollbar`:

```jsx
// pages/index.js`
import { SmoothScrollbar } from '@14islands/r3f-scroll-rig'

export const HomePage = () => (
  <SmoothScrollbar>
    {(bind) => (
      <article {...bind}>
        <header>
          <h1>I'm a smooth operator</h1>
        </header>
        <section></section>
        <footer></footer>
      </article>
    )}
  </SmoothScrollbar>
)
```

3. Track a DOM element and render a Three.js object in its place

This is a basic example of a component that tracks the DOM and use the canvas to render a WebLG mesh in its place:

```jsx
import { UseCanvas, ScrollScene } from '@14islands/r3f-scroll-rig'

export const HtmlComponent = () => (
  const el = useRef()
  return (
    <>
      <div ref={el}>Track me!</a>
      <UseCanvas>
        <ScrollScene track={el}>
          {(props) => (
            <mesh {...props}>
              <planeGeometry />
              <meshBasicMaterial color="turquoise" />
            </mesh>
          )}
        </ScrollScene>
      </UseCanvas>
  )
)
```

How it works:

- The page layout is styled using normal HTML & CSS
- The `UseCanvas` component is used to send its children to the `GlobalCanvas` while the component is mounted
- A `<Scrollscene>` is used to track the DOM element
- Inside the `<ScrollScene>` we place a mesh which will receive the correct scale as part of the passed down `props`

# Examples

- [Hello World - basic ScrollScene](https://codesandbox.io/s/hello-world-ibc8y7)
- [Load image from the DOM](https://codesandbox.io/s/load-image-from-dom-n120ll?file=/src/App.jsx)
- [Load responsive picture from the DOM](https://codesandbox.io/s/load-responsive-picture-from-dom-rgcx4b?file=/src/styles.css)
- [Events from both DOM & Canvas](https://codesandbox.io/s/event-source-demo-w4wfyw)

# API

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
          <li><a href="#usecanvas">useCanvas</a></li>
          <li><a href="#useimageastexture">useImageAsTexture</a></li>
          <li><a href="#usetracker">useTracker</a></li>
        </ul>
    </td>

  </tr>
</table>

## Components

### `<GlobalCanvas>`

#### Render Props

```tsx
<GlobalCanvas
  children // R3F global child nodes
  as?: any = Canvas
  orthographic?: boolean = false
  camera?: object // warning: only change camera.position.z to keep matching the DOM dimensions (FOV is calculated automatically)
  debug?: boolean = false
  scaleMultiplier?: number = 1 // 1 pixel = 1 viewport unit
  globalRender?: boolean
  globalPriority?: number
  globalAutoClear?: boolean
  globalClearDepth?: boolean
  loadingFallback?: any
/>
```

### `<SmoothScrollbar>`

The `SmoothScrollbar` component will animate `window.scrollY` smoothly. This allows us to match the speed of objects moving on the fixed GlobalCanvas.

Worth noting:

- it **does not** use JS to move the content using transforms
- we can use `position: sticky` etc 👌
- the component sets `pointer-events: none` on the immediate child while scrolling to avoid jank caused by hover states
- the R3F event loop is used to animate scroll
- `SmoothScrollbar` uses `@studio-freight/lenis` internally. Make sure to read through their section on [considerations](https://github.com/studio-freight/lenis#considerations) when adding `SmoothScrollbar` to your project.

```jsx
import { SmoothScrolbar } from '@14islands/r3f-scroll-rig'

export const HomePage = () => (
  <SmoothScrollbar>
    {(bind) => (
      // Return a single DOM wrapper and spread all props {...bind}
      <article {...bind}>This content will be smooth scrolled</article>
    )}
  </SmoothScrollbar>
)
```

#### Render Props

```tsx
<SmoothScrollbar
  children: (props) => JSX.Element // render function
  scrollRestoration?: ScrollRestoration = "auto"
  enabled?: boolean = true // smooth scroll or not
  locked?: boolean = false // lock/disable scroll
  disablePointerOnScroll?: boolean = true
  config?: object  // lenis config options
/>
```

#### Use without GlobalCanvas

💡**Note:** _You can use `SmoothScrollbar` independently based on the project needs. If the project doesn't need WebGL you can still use the scrollbar to implement smooth scrolling._

```jsx
import { SmoothScrollbar } from '@14islands/r3f-scroll-rig/scrollbar'
```

💡 _A The `scrollbar` import target excludes all `@react-three/fiber`, `three` related imports and allows you to slim down the bundle size._

### `<UseCanvas>`

This component tunnels the children to the GlobalCanvas using the `useCanvas` hook.

The props added to `UseCanvas` will be tunneled to the child component inside the GlobalCanvas.

It's basically just the same as using the hook but it automatically updates the canvas component's props when any of the props change

#### Render Props

```tsx
<UseCanvas
  children: JSX.Element | (props) => JSX.Element
  props?: any[] // props tunneled to the canvas child - updates on re-render
  id?: string   // persistent layout ID (see below)
>
  <MyMeshComponent />
</UseCanvas>
```

`id` can be used to indicate that the same canvas componets is to be shared between DOM components. For instance it can prevent a mesh from unmounting when navigating to a new page, if that same mesh with the same ID is also present on the new page. This is similar to how Framer Motions layoutId works, but without the automatic layout animation.

### `<ScrollScene>`

Tracks a DOM element and moves to match its position in the viewport.

The child component is passed `scale` which can be used to match the DOM element's size. It's also passed `scrollState` which contains information regarding it's position in the viewport, this is useful for things like parallax or animations.

```tsx
<ScrollScene
  track: RefObject            // DOM element to track (ref)
  children: (props) => JSX.Element  // render function
  as?: string = "scene"       // renders as a Scene by default
  inViewportMargin?: string = "50%"  // IntersectionObserver rootMargin
  hideOffscreen?: boolean = true // Hide scene when off screen
  margin?: number             // margin added outside scissor
  scissor?: boolean = false   // Render as separate pass in a scissor
  visible?: boolean = true    // Scene visibility
  debug?: boolean = false     // Render a debug plane and show 50% opacity of DOM element
  renderOrder?: number = 1    // Object3D renderOrder
  priority?: number = 1       // useFrame priority
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
track: RefObject
scale: number[]
scrollState: {
  // transient state - not reactive
  inViewport: boolean // boolean - true if currently in viewport
  progress: number // number - 0 when below viewport. 1 when above viewport
  visibility: number // number - percent of item height in view
  viewport: number // number - percent of window height scrolled since visible
}
scene: Scene // three js scene that wraps this component
inViewport: boolean // boolean set to true while in viewport
priority: number // the parent useFrame priority
props: any[] // tunneled from the parent
```

### `<ViewportScrollScene>`

Tracks a DOM element similar to ScrollScene, but renders a virtual scene in a separate pass.

This makes it possible to use different lights and camera settings compared to the global scene, at the cost of one extra render per instance.

The child receives similar props as the ScrollScene provides.

```tsx
<ViewportScrollScene
  track: RefObject            // DOM element to track (ref)
  children: (props) => JSX.Element  // render function
  orthographic?: boolean = false // uses a perspective camera by default
  inViewportMargin?: string = "50%"  // IntersectionObserver rootMargin
  hideOffscreen?: boolean = true // Hide scene when off screen
  margin?: number             // margin added outside scissor
  visible?: boolean = true    // Scene visibility
  debug?: boolean = false     // Render a debug plane and show 50% opacity of DOM element
  renderOrder?: number = 1    // Object3D renderOrder
  priority?: number = 1       // useFrame priority
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
track: RefObject
scale: number[]
scrollState: {
  // transient state - not reactive
  inViewport: boolean // boolean - true if currently in viewport
  progress: number // number - 0 when below viewport. 1 when above viewport
  visibility: number // number - percent of item height in view
  viewport: number // number - percent of window height scrolled since visible
}
scene: Scene // the parent three js scene that is rendered in the viewport
camera: Camera // three js camera used to render the viewpor
inViewport: boolean // boolean set to true while in viewport
priority: number // the parent useFrame priority
props: any[] // tunneled from the parent
```

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
  preloadScene: (scene, camera, layer, callback) => void, // request scene to do a preload render before next frame
  requestRender: (layers?: number[]) => void, // request the global render loop to render next frame
  renderScissor: ({ gl, scene, camera, top, left, width, height, layer, autoClear, clearDepth}) => void, // renders scene with a scissor to the canvas
  renderViewport:  ({ gl, scene, camera, top, left, width, height, layer, autoClear, clearDepth}) => void, // renders a scene inside a viewport to the canvas,
} = useScrollRig
```

### `useCanvas`

Hook used in regular DOM components to render something onto the `GlobalCanvas`.

```ts
const update = useCanvas(
  object: Object3D | (props) => Object3D,
  deps = {},
  { key, dispose = true} = {}
): (props: any) => void
```

`object` will be added to the global canvas when this component is mounted and removed from the canvas when it unmounts.

`deps` is an optional object can be used to automatically update properties on the canvas object when they change due to a re-render of the parent component.

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

### `useCanvasRef`

Use this to hide DOM elements while the GlobalCanvas is active. Usually used in combination with `ScrollScene` to hide the DOM element being tracked.

```tsx
const ref = useCanvasRef(props: {
  style?: Partial<CSSStyleDeclaration>
  className?: string
})
```

Default hidden style is `opacity: 0`

The specified styles or classes will be added to the DOM element if the GlobalCanvas is active. If the WebGL context creation fails, these styles will be removed.

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
  scale: vec3 // reactive viewport unti scale
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
```

# Gotchas

## Tone Mapping

By default R3F uses ACES Filmic tone mapping which makes 3D scenes look great.

However, if you need to match hex colors or show editorial images, you can disable it per material like so:

```jsx
<meshBasicMaterial toneMapping={false} />
```

## ScaleMultiplier

By default the scroll-rig will calculate the camera FOV so that 1 pixel = 1 viewport unit.

In some cases, this can mess up the depth sorting, leading to visual glitches in a 3D model. A 1000 pixel wide screen would make the scene 1000 viewport units wide, and by default the camera will also be positioned 1000 units away in z-axis.

One way to fix this is to enable the [logarithmicDepthBuffer](https://threejs.org/docs/index.html?q=webglre#api/en/renderers/WebGLRenderer) but that's bad for performance.

A better way to fix the issue is to change the GlobalCanvas scaling to something like `0.01` which would make 1000px = 10 viewport units.

```jsx
<GlobalCanvas scaleMultiplier={0.01} />
```

## All items on the page need a predictable height

Always define an aspect ratio using CSS for images and other interactive elements that might impact the document height as they load.

If you can’t define height with CSS - you need to trigger `reflow()` from `useScrollRig` after height is final

## Performance tips

- Use CSS animations whenever possible instead of JS for maximum smoothness
- Consider disabling SmoothScrollbar and all scrolling WebGL elements on mobile - it is usually laggy.
- Make sure you [read, understand and follow all performance recomendations](https://docs.pmnd.rs/react-three-fiber/advanced/pitfalls) associated with `React` and `three`:

## Render loop

This library runs a manual render loop of the global scene inside r3f. It runs with priority `1000` if a component has requested a global render frame.

You can still schedule your own render passes using `useFrame` with a given priority.

You can disable the globla render loop using `globalRender` or change the priority with the `globalPriority` props on the `<GlobalCanvas>`

## Post-processing

Post processing runs in a separate pass so you need to manually disable the global render loop to avoid double renders.

Some effects like the Bloom also become heavy with large viewport dimensions so it's recommended to set `scaleMultiplier` to a lower value than `1`.

```jsx
<GlobalCanvas globalRender={false} scaleMultiplier={0.01}>
  <Effects />
</GlobalCanvas>
```

Note: `ViewportScrollScene` will not be affected by global postprocessing effects since it runs in a separate render pass.

## Can I use events from both DOM and R3F?

Yes, you need to re-attach the event system to a parent of the canvas for this to work:

```tsx
const ref = useRef()
return (
  <div ref={ref}>
    <GlobalCanvas
      eventSource={ref} // rebind event source to a parent DOM element
      eventPrefix="client" // use clientX/Y for a scrolling page
      style={{
        pointerEvents: 'none', // delegate events to wrapper
      }}
    />
  </div>
)
```

## Can I use R3F events in `<ViewportScrollScene>`?

Yes, events will be correctly tunneled into the viewport, if you follow the steps above to re-attach the event system to a parent of the canvas.

## inViewportMargin is not working in CodeSandbox

The CodeSandbox editor runs in an iframe which breaks the IntersectionObserver's `rootMargin`. If you open the example outside the iframe, you'll see it's working as intended.

This is know [issue](https://github.com/thebuilder/react-intersection-observer/issues/330#issuecomment-612221114).

## HMR is not working with UseCanvas children

This is a known issue with the `UseCanvas` component.

You can either use the `useCanvas()` hook instead, or make HMR work again by defining your children as top level functions instead of inlining them:

```jsx

// HMR will work on me since I'm defined here!
const MyScrollScene => () => (
  <ScrollScene track={el} debug={false}>
    ...
  </ScrollScene>
)

function MyHtmlComponent() {
  return (
    <UseCanvas>
       <MyScrollScene/>
    </UseCanvas>
  )
}
```

A similar [issue](https://github.com/pmndrs/tunnel-rat/issues/4) exist in `tunnel-rat`.

# Advanced - render on demand

If the R3F frameloop is set to `demand` - the scroll rig will make sure global renders and viewport renders only happens if it's needed.

To request global render call `requestRender()` from `useScrollRig` on each frame.

This library also supports rendering separate scenes in viewports as a separate render pass by calling `renderViewport()`. This way we can render scenes with separate lights or different camera than the global scene. This is how `ViewportScrollScene` works.

In this scenario you also need to call `invalidate` to trigger a new R3F frame.

```

```
