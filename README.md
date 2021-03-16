# @14islands/r3f-scroll-rig
Progressively enhance a React website with WebGL using `react-three-fiber` and a virtual/hijacked scrollbar.

> 💡 This lib has been tested with `create-react-app` and `gatsby.js`.

[awesome example gifs go here]

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

2. Wrap your page in `VirtualScrollbar`

The virtual scrollbar will move all of the DOM content inside with transforms to match the easing of the canvas elements.

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

Each child will be translated independantly for better performance. Keep this in mind to not create sections that are too tall.

💡**Note:** *You can use either `GlobalCanvas` or `VirtualScrollbar` independently. Use them together for maximum smoothness between DOM elements and Canvas elements.*


# Getting Started

*show example of a component that tracks the DOM and use the canvas*

TBC:
- [ ] Style website using HTML & CSS
- [ ] Use a scrollscene to track a DOM element
- [ ] Render a 3D cube in it's place



# Pitfalls & Recommendations

* All items on the page need a predictable height on load. Always define an aspect ratio using CSS for images and other interactive elements that might impact the document height as they load.
* If you can’t define height with CSS - you need to trigger `reflow()` from `useScrollRig` or `useScrollbar` after height is final
* All direct children of VirtualScrollbar will be scrolled separately - keep them small for best performance (~100-200vh)
* Use CSS animations whenever possible instead of JS for maximum smoothness
* `Intersection Observer` with a custom **rootMargin** is not working well with `VirtualScrollbar`
* Consider disabling VirtualScrollbar and all scrolling WebGL elements on mobile - it is usually laggy.
* Read, make sure you understand and follow all performance pitfalls associated with `React` and `three` https://github.com/pmndrs/react-three-fiber/blob/master/markdown/pitfalls.md


# API


## Hooks 

### `useScrollRig`
### `useCanvas`
### `useScrollbar`

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

Each child elements inside the DOM wrapper will be translated individuallly. When an element leaves the viewport it's is no longer animated.

💡**Note:** *Make sure you break your page into sections that can be traslated indivually for better scroll performance.*

#### Props
```js
<VirtualScrollbar
  children                // a function child which recieves props and should return a single DOM child with the scroll content
  disabled = false        // Disable the virtual scroll and uses native scroll
  resizeOnHeight = true   // Reflow all components when height changes
  onUpdate                // Callback on each scroll frame `({ current, target, velocity, direction }) => {}`
  lerp                    // Easing (lerp) for the scroll. (syncs with GlobalCanvas by default)
  restDelta               // Delta when scroll animation stops. (syncs with GlobalCanvas by default)
  threshold = 100         // ()
/>
```

#### Use without GlobalCanvas
You can import and use `VirtualScrollbar` in isolation from a separate npm target. This excludes all `react-three-fiber`, `three` related imports and allows you to slim down the bundle size.

```jsx
import { VirtualScrollbar } from '@14islands/r3f-scroll-rig/scrollbar'
```

💡**Note:** *Please keep in mind that this virtual scrollbar impacts accessibility. And even though we keep the borwser's native scrollbar it has not been fully tested with maximum accessibility in mind. Tabbing through form inputs etc might not work as expected.*





### `<GlobalCanvas>`

#### Props
```js
  as = Canvas     // make it possible to render as VRCanvas
  children,       // r3f child nodes
  gl              // optional gl overrides           
  orthographic = false // use orthographic camera, perspective by default
  noEvents = true // no r3f events by default
  colorManagement=true // use sRGB color space
  config          // override scroll-rig config
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
  children                    // r3f child node to render inside this scene
  lerp                        // Easing (lerp) for the scroll. (syncs with GlobalCanvas by default)
  lerpOffset = 0              // Optional offset to move with adjusted lerp compared to global canvas
  renderOrder = 1             // Three.js renderOrder for this Group
  inViewportMargin = size.height/3  // margin for when it's considered out of screen and will stop animating
  visible = true              // Scene visibility
  debug = false               // Render debug plane and show 50% opacity of DOM element
  setInViewportProp = false   // Set `inViewport` prop on child node when entering viewport (may cause jank)
  positionFixed = false       // Make scene fixed in the viewport instead of moving with scrollbar. Usefull to s
/>
```

The child node will be passed the following props:

```js
  // inherited props
  el
  lerp,
  lerpOffset
  margin
  visible
  renderOrder

  // use this to size your child mesh to the scene!
  scale: {       
    width,
    height
  }
  // transient info about where this element is in the viewport - useful in useFrame()
  scrollState: {
      inViewport    // boolean - true if currently in viewport
      progress      // number - 0 when below viewport. 1 when above viewport
      visibility    // number - percent of item height in view
      viewport      // number - percent of window height scrolled since visible
  }

  scene             // three js scene that wraps this child node
  inViewport        // boolean set to true while in viewport if setInViewportProp=true on the ScrollScene
  // useFrame render priority (in case children need to run after)
  priority          // the r3f useFrame priority that these props were calculate for
  ```


# Under the hood

## Render loop

This library runs a manual render loop of the global scene inside r3f. It runs with priority `1001` if a component has requested a global render frame.

To request global render call `renderFullscreen()` from `useScrollRig` on each frame.

This library also supports rendering viewports as a separate render pass by calling `renderViewport()`. This way we can render scenes with separate lights or different camera than the global scene. 

The scroll rig makes sure global renders and viewport renders only happens if it's needed. 

You can still schedule your own render passes using `useFrame` with a given priority.
