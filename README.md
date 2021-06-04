# @14islands/r3f-scroll-rig

Progressively enhance a React website with WebGL using `@react-three/fiber` and a virtual/hijacked scrollbar.

> 💡 This lib has been tested with `create-react-app` and `gatsby.js`.

<p align="center">
 <img height="200" src="https://www.dropbox.com/s/17rrpgbw07ct4jn/scroll-rig.gif?dl=0&raw=1" />
  <img height="200" src="https://www.dropbox.com/s/9rja3b6a3967mjv/scroll-rig2.gif?dl=0&raw=1" /> 
</p>

# Introduction

Background: [Progressive Enhancement with WebGL and React](https://medium.com/14islands/progressive-enhancement-with-webgl-and-react-71cd19e66d4)

At the core there is a global shared canvas `GlobalCanvas` that stays in between page loads. React DOM components can choose to draw things on this canvas while they are mounted using a custom hook called `useCanvas`.

React DOM components can use `ScrollScene` or `ViewportScrollScene` to automatically track their position and draw a Three.js scene in that exact location. Everything is synched to the scrollbar position.

# Setting up

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

In order to perfectly match the WebGL and DOM content while scrolling the page, some sort of Javascript "smooth scrolling" needs to be applied.

We have two approaches:

- The `VirtualScrollbar` will move all of the wrapped DOM content with `transform: translate` to match the easing of the canvas elements. Each child will be translated independantly for better performance. Keep this in mind to not create sections that are too tall.
- The `HijackedScrollbar` will animate `window.scrollY` to match the easing of the canvas elements.

Wrap your page in `VirtualScrollbar` or `HijackedScrollbar`:

```jsx
// pages/index.js`
import { VirtualScrollbar } from '@14islands/r3f-scroll-rig'

export const HomePage = () => (
    <VirtualScrollbar>
      {(bind) => (
        <article {...bind}>
          <header>
            <h1>I'm a smooth operator</h1>
          </header>
          <section></section>
          <footer></footer>
        </article>
      )}
    </VirtualScrollbar>
}
```

💡**Note:** _You can use either `GlobalCanvas` or `VirtualScrollbar` independently based on the project needs. If the project doesn't need WebGL you can still use the scrollbars to implement smooth scrolling._

# Getting Started

This is a basic example of a component that tracks the DOM and use the canvas to render a WebLG mesh in its place:

How it works:

- The page layout is styled using normal HTML & CSS
- A component will use the `useCanvas` hook and pass in a `<Scrollscene>` to track a DOM element
- Inside the `<ScrollScene>` we place a spinning 3D cube and scale it according to the DOM elements size.

Sandbox Demo:

[![Basic demo](https://www.dropbox.com/s/n3ciejf9micax70/demo1.png?dl=0&raw=1)](https://codesandbox.io/s/scroll-rig-basic-demo-zfmf0)

# Pitfalls & Recommendations

- All items on the page need a predictable height on load. Always define an aspect ratio using CSS for images and other interactive elements that might impact the document height as they load.
- If you can’t define height with CSS - you need to trigger `reflow()` from `useScrollRig` or `useScrollbar` after height is final
- All direct children of VirtualScrollbar will be scrolled separately - keep them small for best performance (~100-200vh)
- Use CSS animations whenever possible instead of JS for maximum smoothness
- `Intersection Observer` with a custom **rootMargin** is not working well with `VirtualScrollbar`
- Consider disabling VirtualScrollbar and all scrolling WebGL elements on mobile - it is usually laggy.
- Read, make sure you understand and follow all performance pitfalls associated with `React` and `three` https://github.com/pmndrs/react-three-fiber/blob/master/markdown/pitfalls.md

# API

## Hooks

### `useCanvas`

Hook used in regular DOM components to render something onto the webGl canvas.

```ts
useCanvas(object: Three.Object3D, deps = []): (props: any) => void
```

`object` will be added to the global canvas when this component is mounted and removed from the canvas when it unmounts.

`useCanvas` returns a function that can be used to update the props of the `object` that was passed in.

`deps` can be used to unmount/re-mount the `object` when they change but this is usually not needed. Use the returned function to send new props instead.

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

### `useScrollRig`

Hook to access current scroll rig state and functions related to rendering.

```js
import { useScrollRig } from '@14islands/r3f-scroll-rig'

const {
  isCanvasAvailable, // True if webgl is enabled and GlobalCanvas has been added to the page
  hasVirtualScrollbar, // True if a smooth scrollbar is currently enabled onm the DOM content
  pixelRatio, // current pixelratio used by the canvas
  preloadScene, // request scene to do a preload render before next frame, (scene, camera, layer, callback) => void
  requestRender, // request the global render loop to render next frame
  renderScissor, // renders scene with a scissor to the canvas, ({ gl, scene, camera, left, top, width, height, layer, autoClear, clearDepth}) => void
  renderViewport, // renders a scene inside a viewport to the canvas, ({ gl, scene, camera, left, top, width, height, layer, autoClear, clearDepth}) => void
  reflow, // tigger re-calculation of elements position (called automatically on resize), () => void
  reflowCompleted, // prop updating after positions have been recalculated, number
} = useScrollRig
```

### `useScrollbar`

Similar to `useScrollRig` but useful to access the smooth scrollbar on websites without webgl. Does not import any three dependencies.

```js
import { useScrollRig } from '@14islands/r3f-scroll-rig/scrollbar'

const {
  hasVirtualScrollbar, // True if a smooth scrollbar is currently enabled onm the DOM content
  reflow, // tigger re-calculation of elements position (called automatically on resize), () => void
  reflowCompleted, // number, trigger after positions have been recalculated
} = useScrollRig
```

## Components

### `<VirtualScrollbar>`

The virtual scrollbar moves the DOM content using Javascript and linear interpolation. This allows us to match the speed of objects moving on the fixed GlobalCanvas.

```jsx
import { VirtualScrollbar } from '@14islands/r3f-scroll-rig'

export const HomePage = () => (
    <VirtualScrollbar>
      {
        // Expects a single functional child
        (bind) => (
          // Return a single DOM wrapper and spread all props {...bind}
          <article {...bind}>
            <header>
              a scroll section
            </header>
            <section>
              another scroll section...
            </section>
            <footer>
              we all translate in separate layers
            </footer>
          </article>
        )
      }
    </VirtualScrollbar>
}
```

Each child elements inside the DOM wrapper will be translated individuallly. When an element leaves the viewport it is no longer animated.

💡**Note:** _Make sure you break your page into sections that can be traslated indivually for better scroll performance._

Cons:

- Moving all these composite layers consumes a lot of GPU memory and CPU cycles. Known to cause jank when combining with lots of viewport / scroll animations such as the letter-by-letter animation on 14islands.com

Pros:

- The native scrollbar is preserved and is controlled by the user (we let the user scroll a fake body with height matching the real page).

#### Props

```js
<VirtualScrollbar
  children                // a function child which recieves props and should return a single DOM child with the scroll content
  disabled = false        // Disable the virtual scroll and uses native scroll
  onUpdate                // Callback on each scroll frame `({ current, target, velocity, direction }) => {}`
  lerp                    // Easing (lerp) for the scroll. (syncs with GlobalCanvas by default)
  restDelta               // Delta when scroll animation stops. (syncs with GlobalCanvas by default)
  threshold = 100         // Extra margin outside the viewport limits for when layers are considered "visible" and start animating
/>
```

#### Use without GlobalCanvas

You can import and use `VirtualScrollbar` in isolation from a separate npm target. This excludes all `@react-three/fiber`, `three` related imports and allows you to slim down the bundle size.

```jsx
import { VirtualScrollbar } from '@14islands/r3f-scroll-rig/scrollbar'
```

💡**Note:** _Please keep in mind that this virtual scrollbar impacts accessibility. And even though we keep the borwser's native scrollbar it has not been fully tested with maximum accessibility in mind. Tabbing through form inputs etc might not work as expected._

### `<HijackedScrollbar>`

The hijacked scrollbar takes over the browser scrollbar and animates it with Javascript and linear interpolation. This allows us to match the speed of objects moving on the fixed GlobalCanvas.

Pros:

- Much better scroll performance as we don't have to move composite layers with CSS transforms.
- Usage on mobile is much more smooth since it doesn't allow the browser to scroll away the URL bar.
- Less internal logic needed to position/optimize things on screen as we can have one big page and let the browser scroll it.

Cons:

- Scrollbar is hijacked and might be worse for accessibility - it listens to the mouse wheel event and prevents default.
- Mobile scroll is simulated using touch events - not same feel as native scroll.
- Not visually as smooth as the VirtualScrollbar as it only scrolls by even pixels.

```jsx
import { HijackedScrollbar } from '@14islands/r3f-scroll-rig'

export const HomePage = () => (
    <HijackedScrollbar>
      {
        // Expects a single functional child
        (bind) => (
          // Return a single DOM wrapper and spread all props {...bind}
          <article {...bind}>
            This content will be smooth scrolled
          </article>
        )
      }
    </HijackedScrollbar>
}
```

#### Props

```jsx
<HijackedScrollbar
  children                // a function child which recieves props and should return a single DOM child with the scroll content
  disabled = false        // Disable the virtual scroll and uses native scroll
  onUpdate                // Callback on each scroll frame `({ current, target, velocity, direction }) => {}`
  lerp                    // Easing (lerp) for the scroll. (syncs with GlobalCanvas by default)
  restDelta               // Delta when scroll animation stops. (syncs with GlobalCanvas by default)
  subpixelScrolling = false // Tell ScrollScenes to scroll by even pixels by default
  location // Pass in router location to detect and recalculate height when navigating. However, it's recommend to unmount and mount the entire component instead.
/>
```

#### Subpixel scrolling

It seems (2021 at the time of writing) browsers can only animate scroll by full pixels. So by default, when the `HijackedScrollbar` is used, it tells `ScrollScene` and `ViewportScrollScene` to do the same, i.e. round the pixel positions.

This results in less smooth motion on the canvas, but visually the DOM content syncs better with the WebGL objects. Set `subpixelScrolling` to `true` to scroll more smooth on the GlobalCanvas, but this will visually make it look like the DOM content is very very janky when scrolling at slow speeds.

#### Use without GlobalCanvas

You can import and use `HijackedScrollbar` in isolation from a separate npm target. This excludes all `@react-three/fiber`, `three` related imports and allows you to slim down the bundle size.

```jsx
import { HijackedScrollbar } from '@14islands/r3f-scroll-rig/scrollbar'
```

💡**Note:** _Please keep in mind that this hijacked scrollbar impacts accessibility. And even though we keep the borwser's native scrollbar it has not been fully tested with maximum accessibility in mind. Tabbing through form inputs etc might not work as expected._

### `<GlobalCanvas>`

#### Props

```js
<GlobalCanvas
  children               // r3f child nodes
  gl                     // optional gl overrides
  orthographic = false   // use orthographic camera, perspective by default
  noEvents = true        // no r3f events by default
  colorManagement = true // use sRGB color space
  config                 // override scroll-rig config
  as = Canvas            // make it possible to render as VRCanvas
  // + all other props from r3f Canvas
/>
```

Default canvas `gl` props:

```json
  antialias = true
  alpha = true
  depth = true
  powerPreference = 'high-performance'
  failIfMajorPerformanceCaveat = true
```

Default `config` props:

```json
  debug = false             // true = print render calls to console.log and shader compile errors
  fps = false               // true = stats.js FPS monitor
  autoPixelRatio = true     // use internal PerformanceMonitor to scale pixelRatio
  scrollLerp = 0.1          // scrolling lerp value used by both canvas and scrollbar
  scrollRestDelta = 0.14,   // min delta to trigger animation frame on scroll
  subpixelScrolling = true  // move canvas elements on subpixels
```

Note: even though `colorManagement` is turned on, `ACESFilmic` toneMapping is turned off by default to make it easier to match hex colors with the DOM.

### `<ScrollScene>`

```js
<ScrollScene
  el                          // DOM element to track (ref)
  children                    // a single functional child
  lerp                        // Easing (lerp) for the scroll. (syncs with GlobalCanvas by default)
  lerpOffset = 0              // Optional offset to move with adjusted lerp compared to global canvas
  renderOrder = 1             // Three.js renderOrder for this Group
  inViewportMargin = size.height/3  // margin for when it's considered out of screen and will stop animating
  visible = true              // Scene visibility
  debug = false               // Render a debug plane and show 50% opacity of DOM element
  setInViewportProp = false   // Set `inViewport` prop on child node when entering viewport (may cause jank)
  positionFixed = false       // Make scene fixed in the viewport instead of moving with scrollbar. Usefull to s
>
  { ({ scale, ...props }) => (
    <mesh>
      <planeGeometry args={[scale.width, scale.height]} />
      <meshBasicMaterial color="turquoise" />
    </mesh>
  )}
</ScrollScene>
```

The child node will be passed the following `props`:

```js
// inherited props from ScrollScene
el
lerp, lerpOffset
margin
visible
renderOrder

// use this to size your child mesh to the scene!
scale: {
  width, height
}
// transient info about where this element is in the viewport - useful in useFrame()
scrollState: {
  inViewport // boolean - true if currently in viewport
  progress // number - 0 when below viewport. 1 when above viewport
  visibility // number - percent of item height in view
  viewport // number - percent of window height scrolled since visible
}

scene // three js scene that wraps this child node
inViewport // boolean set to true while in viewport if setInViewportProp=true on the ScrollScene
// useFrame render priority (in case children need to run after)
priority // the r3f useFrame priority that these props were calculate for
```

# Under the hood

## Render loop

This library runs a manual render loop of the global scene inside r3f. It runs with priority `1000` if a component has requested a global render frame.

To request global render call `requestRender()` from `useScrollRig` on each frame.

This library also supports rendering separate scenes in viewports as a separate render pass by calling `renderViewport()`. This way we can render scenes with separate lights or different camera than the global scene. This is how `ViewportScrollScene` works.

The scroll rig makes sure global renders and viewport renders only happens if it's needed.

You can still schedule your own render passes using `useFrame` with a given priority.
