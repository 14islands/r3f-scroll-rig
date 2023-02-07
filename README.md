# @14islands/r3f-scroll-rig

![npm](https://img.shields.io/npm/v/@14islands/r3f-scroll-rig?color=magenta&style=flat-square)

Progressively enhance a React website with WebGL using `@react-three/fiber` and smooth scrolling.

<p align="center">
  <img width="49.5%" src="https://www.dropbox.com/s/kqaweg996jtb2ho/14islands600_10fps_2.gif?dl=0&raw=1" style="float:left" />
  <img width="49.5%" src="https://www.dropbox.com/s/vmpqf17oy0otkkl/pluto600_10fps.gif?dl=0&raw=1" style="float:right" />
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
- 🚀 Optimized for performance. Calls `getBoundingClientRect()` once on mount, and uses IntersectionObserver/ResizeObserver to keep track of elements.
- 🧈 Uses [Lenis](https://github.com/studio-freight/lenis/) for accessible smooth scrolling
- ♻️ 100% compatible with the @react-three ecosystem, like [Drei](https://github.com/pmndrs/drei), [react-spring](https://www.react-spring.dev/) and [react-xr](https://github.com/pmndrs/react-xr)

# Introduction

Background: [Progressive Enhancement with WebGL and React](https://medium.com/14islands/progressive-enhancement-with-webgl-and-react-71cd19e66d4)

![scrollrig](https://user-images.githubusercontent.com/420472/191715313-cc813f47-4e4a-454f-a2f5-d8e2ec998c95.jpeg)

At the core there is a global shared canvas `GlobalCanvas` that stays in between page loads. React DOM components can choose to draw things on this canvas while they are mounted using a custom hook called `useCanvas` or the `UseCanvas` tunnel component.

React DOM components can use `ScrollScene` or `ViewportScrollScene` to automatically track their position and draw a Three.js scene in that exact location while scrolling. Everything is synched in lockstep with the scrollbar position.

# Installing

`yarn add @14islands/r3f-scroll-rig @react-three/fiber three`

# Getting Started

1. Add `<GlobalCanvas>` to your layout. Keep it outside of your router to keep it from unmounting when navigating between pages.

<details>
<summary>Next.js</summary>

```jsx
// _app.jsx
function MyApp({ Component, pageProps, router }: AppProps) {
  return (
    <>
      <GlobalCanvas />
      <Component {...pageProps} />
    </>
  )
}
```

</details>

<details>
<summary>Gatsby.js</summary>

```jsx
// gatsby-browser.js
import { GlobalCanvas } from '@14islands/r3f-scroll-rig'

export const wrapRootElement = ({ element }) => (
  <>
    <GlobalCanvas />
    {element}
  </>
)
```

</details>

2. Add smooth scrolling to the DOM content

In order to perfectly match WebGL objects and DOM content, the browser scroll position needs to be animated on the main thread.

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
      <div ref={el}>Track me!</div>
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
    </>
  )
)
```

## How it works:

- The page layout is styled using normal HTML & CSS
- The `UseCanvas` component is used to send its children to the `GlobalCanvas` while the component is mounted
- A `<Scrollscene>` is used to track the DOM element
- Inside the `<ScrollScene>` we place a mesh which will receive the correct scale as part of the passed down `props`

# Examples

- [Hello World - basic ScrollScene](https://codesandbox.io/s/hello-world-ibc8y7?file=/src/App.jsx)
- [Load image from the DOM](https://codesandbox.io/s/load-image-from-dom-n120ll?file=/src/App.jsx)
- [Load responsive picture from the DOM](https://codesandbox.io/s/load-responsive-picture-from-dom-rgcx4b?file=/src/App.jsx)
- [Events from both DOM & Canvas](https://codesandbox.io/s/event-source-demo-w4wfyw?file=/src/App.jsx)
- [Parallax HTML with useTracker() and Framer Motion](https://codesandbox.io/s/parallax-with-framer-motion-dx2v1p?file=/src/App.jsx)
- [StickyScrollScene](https://codesandbox.io/s/r3f-scroll-rig-sticky-box-w5v4u7?file=/src/App.jsx)

# API

All components & hooks are described in the [API docs](/docs/api.md)

<table>
  <tr>
    <td valign="top">
      <h2><a href="/docs/api.md#components">Components</a></h2>
        <ul>
          <li><a href="/docs/api.md#globalcanvas">GlobalCanvas</a></li>
          <li><a href="/docs/api.md#smoothscrollbar">SmoothScrollbar</a></li>
          <li><a href="/docs/api.md#usecanvas">UseCanvas</a></li>
          <li><a href="/docs/api.md#scrollscene">ScrollScene</a></li>
          <li><a href="/docs/api.md#viewportscrollscene">ViewportScrollScene</a></li>
        </ul>
       <td valign="top">
       <h2> <a href="/docs/api.md#hooks">Hooks</a></h2>
        <ul>
          <li><a href="/docs/api.md#usescrollrig">useScrollRig</a></li>
          <li><a href="/docs/api.md#usescrollbar">useScrollbar</a></li>
          <li><a href="/docs/api.md#usecanvas">useCanvas</a></li>
          <li><a href="/docs/api.md#useimageastexture">useImageAsTexture</a></li>
          <li><a href="/docs/api.md#usetracker">useTracker</a></li>
        </ul>
    </td>

  </tr>
</table>

# Gotchas

<details>
  <summary>Matching exact hex colors</summary>

By default R3F uses ACES Filmic tone mapping which makes 3D scenes look great.

However, if you need to match hex colors or show editorial images, you can disable it per material like so:

```jsx
<meshBasicMaterial toneMapping={false} />
```

</details>

<details>
  <summary>Z-Fighting on 3D objects</summary>

By default the scroll-rig will calculate the camera FOV so that 1 pixel = 1 viewport unit.

In some cases, this can mess up the depth sorting, leading to visual glitches in a 3D model. A 1000 pixel wide screen would make the scene 1000 viewport units wide, and by default the camera will also be positioned 1000 units away in z-axis.

One way to fix this is to enable the [logarithmicDepthBuffer](https://threejs.org/docs/index.html?q=webglre#api/en/renderers/WebGLRenderer) but that's bad for performance.

A better way to fix the issue is to change the GlobalCanvas scaling to something like `0.01` which would make 1000px = 10 viewport units.

```jsx
<GlobalCanvas scaleMultiplier={0.01} />
```

</details>

<details>
  <summary>Cumulative layout shift (CLS)</summary>

All items on the page should have a predictable height - always define an aspect ratio using CSS for images and other interactive elements that might impact the document height as they load.

The scroll-rig uses `ResizeObserver` to detect changes to the `document.body` height, for instance after webfonts loaded, and will automatically recalculate postions.

If this fails for some reason, you can trigger a manual `reflow()` to recalculate all cached positions.

```jsx
const { reflow } = useScrollRig()

useEffect(() => {
  heightChanged && reflow()
}, [heightChanged])
```

</details>

<details>
  <summary>Performance tips</summary>

- Use CSS animations whenever possible instead of JS for maximum smoothness
- Consider disabling SmoothScrollbar and all scrolling WebGL elements on mobile - it is usually laggy.
- Make sure you [read, understand and follow all performance recomendations](https://docs.pmnd.rs/react-three-fiber/advanced/pitfalls) associated with `React` and `three`:

</details>

<details>
  <summary>How to catch events from both DOM and Canvas</summary>

This is possible in R3F by re-attaching the event system to a parent of the canvas:

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

</details>

<details>
  <summary>Can I use R3F events in `ViewportScrollScene`?</summary>

Yes, events will be correctly tunneled into the viewport, if you follow the steps above to re-attach the event system to a parent of the canvas.

</details>

<details>
  <summary>inViewportMargin is not working in CodeSandbox</summary>

The CodeSandbox editor runs in an iframe which breaks the IntersectionObserver's `rootMargin`. If you open the example outside the iframe, you'll see it's working as intended.

This is know [issue](https://github.com/thebuilder/react-intersection-observer/issues/330#issuecomment-612221114).

</details>

<details>
  <summary>HMR is not working with UseCanvas children</summary>

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

</details>

<details>
  <summary>Global render loop</summary>

The scroll-rig runs a custom render loop of the global scene inside r3f. It runs with priority `1000`.

You can disable the global render loop using `globalRender` or change the priority with the `globalPriority` props on the `<GlobalCanvas>`. You can still schedule your own render passes before or after the global pass using `useFrame` with your custom priority.

The main reason for running our own custom render pass instead of the default R3F render, is to be able to avoid rendering when no meshes are in the viewport. To enable this you need to set `frameloop="demand"` on the GlobalCanvas.

</details>

<details>
  <summary>Advanced - run frameloop on demand</summary>

If the R3F frameloop is set to `demand` - the scroll rig will make sure global renders and viewport renders only happens if it's needed.

To request global render call `requestRender()` from `useScrollRig` on each frame. `ScrollScene` will do this for you when the mesh is in viewport.

This library also supports rendering separate scenes in viewports as a separate render pass by calling `renderViewport()`. This way we can render scenes with separate lights or different camera than the global scene. This is how `ViewportScrollScene` works.

In this scenario you also need to call `invalidate` to trigger a new R3F frame.

</details>

<details>
  <summary>How to use post-processing</summary>

Post processing runs in a separate pass so you need to manually disable the global render loop to avoid double renders.

```jsx
<GlobalCanvas globalRender={false} scaleMultiplier={0.01}>
  <Effects />
</GlobalCanvas>
```

Note: `ViewportScrollScene` will not be affected by global postprocessing effects since it runs in a separate render pass.

</details>

# In the wild

- [14islands.com](https://14islands.com) by [14islands](https://14islands.com)
- [Pluto.app](https://www.pluto.app/) by [14islands](https://14islands.com)
- [Neko Health](https://www.nekohealth.com/) by [14islands](https://14islands.com)
- [Myriad.video](https://myriad.video/) by [14islands](https://14islands.com)
