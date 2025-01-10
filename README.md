# @14islands/r3f-scroll-rig

![npm](https://img.shields.io/npm/v/@14islands/r3f-scroll-rig?color=magenta&style=flat-square)

Progressively enhance a React website with WebGL using `@react-three/fiber` and smooth scrolling.

<p align="center">
  <img width="49.5%" src="https://www.dropbox.com/s/kqaweg996jtb2ho/14islands600_10fps_2.gif?dl=0&raw=1" style="float:left" />
  <img width="49.5%" src="https://www.dropbox.com/s/vmpqf17oy0otkkl/pluto600_10fps.gif?dl=0&raw=1" style="float:right" />
</p>

[ <a href="#features-">Features</a> |
<a href="#introduction-">Introduction</a> |
<a href="#installing-">Installing</a> |
<a href="#getting-started-">Getting Started</a> |
<a href="#examples-">Examples</a> |
<a href="#api-%EF%B8%8F">API</a> |
<a href="#gotchas-">Gotchas</a> ]

# Features 🌈

- 🔍 Tracks DOM elements and draws Three.js objects in their place using correct scale and position.
- 🤷 Framework agnostic - works with `next.js`, `gatsby.js`, `create-react-app` etc.
- 📐 Can render objects in viewports. Makes it possible for each object to have a unique camera, lights, environment map, etc.
- 🌠 Helps load responsive images from the DOM. Supports `<picture>`, `srset` and `loading="lazy"`
- 🚀 Optimized for performance. Calls `getBoundingClientRect()` once on mount, and uses IntersectionObserver/ResizeObserver to keep track of elements.
- 🧈 Uses [Lenis](https://github.com/darkroomengineering/lenis) for accessible smooth scrolling
- ♻️ 100% compatible with the @react-three ecosystem, like [Drei](https://github.com/pmndrs/drei), [react-spring](https://www.react-spring.dev/) and [react-xr](https://github.com/pmndrs/react-xr)

# Introduction 📚

Mixing WebGL with scrolling HTML is hard. One way is to have multiple canvases, but there is a browser-specific limit to how many WebGL contexts can be active at any one time, and resources can't be shared between contexts.

<img align="right" width="40%" src="https://user-images.githubusercontent.com/420472/191715313-cc813f47-4e4a-454f-a2f5-d8e2ec998c95.jpeg" />

The scroll-rig has only one shared `<GlobalCanvas/>` that stays in between page loads.

React DOM components can choose to draw things on this canvas while they are mounted using a custom hook called `useCanvas()` or the `<UseCanvas/>` tunnel component.

The library also provides means to sync WebGL objects with the DOM while scrolling. We use a technique that tracks “proxy” elements in the normal page flow and updates the WebGL scene positions to match them.

The `<ScrollScene/>`, `<ViewportScrollScene/>` or the underlying `useTracker()` hook will detect initial location and dimensions of the proxy elements, and update positions while scrolling.

Everything is synchronized in lockstep with the scrollbar position on the main thread.

Further reading: [Progressive Enhancement with WebGL and React](https://medium.com/14islands/progressive-enhancement-with-webgl-and-react-71cd19e66d4)

# Installing 💾

`yarn add @14islands/r3f-scroll-rig @react-three/fiber three`

# Getting Started 🛫

1. Add `<GlobalCanvas>` to your layout. Keep it outside of your router to keep it from unmounting when navigating between pages.

2. Add `<SmoothScrollbar/>` to your layout. In order to perfectly match WebGL objects and DOM content, the browser scroll position needs to be animated on the main thread.

<details open>
<summary>Next.js</summary>

```jsx
import { GlobalCanvas, SmoothScrollbar } from '@14islands/r3f-scroll-rig'

// _app.jsx
function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <GlobalCanvas />
      <SmoothScrollbar />
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
import { GlobalCanvas, SmoothScrollbar } from '@14islands/r3f-scroll-rig'

export const wrapRootElement = ({ element }) => (
  <>
    <GlobalCanvas />
    <SmoothScrollbar />
    {element}
  </>
)
```

</details>

2. Track a DOM element and render a Three.js object in its place

This is a basic example of a component that tracks the DOM and use the canvas to render a Mesh in its place:

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

**⚠️ Note:** HMR might not work for the children of `<UseCanvas>` unless you defined them outside. Also, the props on the children are not reactive by default since the component is tunneled to the global canvas. <a href="/docs/api.md#usecanvas">Updated props need to be tunneled like this.</a>

Learn more about edge cases and solutions in the <a href="#gotchas-">gotchas section</a>.

# Examples 🎪

- [ScrollScene basic example](https://codesandbox.io/s/hello-world-ibc8y7?file=/src/App.jsx)
- [ScrollScene with GLB model & events from both DOM & Canvas](https://codesandbox.io/s/scrollscene-with-glb-6l2fc3?file=/src/App.js)
- [ViewportScrollScene with custom camera and controls](https://codesandbox.io/s/hello-viewportscrollscene-fu0ky6?file=/src/App.jsx)
- [Loading textures from &lt;img&gt; tags](https://codesandbox.io/s/load-image-from-dom-n120ll?file=/src/App.jsx)
- [Load responsive texture from the DOM](https://codesandbox.io/s/load-responsive-picture-from-dom-rgcx4b?file=/src/App.jsx)
- [HTML parallax with useTracker() and Framer Motion](https://codesandbox.io/s/parallax-with-framer-motion-dx2v1p?file=/src/App.jsx)
- [A sticky ScrollScene from the powerups samples](https://codesandbox.io/s/r3f-scroll-rig-sticky-box-w5v4u7?file=/src/App.jsx)
- [A basic Post Processing example](https://codesandbox.io/p/sandbox/hello-scrollscene-forked-cp3n93?file=/src/App.jsx)

# API ⚙️

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
          <li><a href="/docs/api.md#usetracker">useTracker</a></li>
          <li><a href="/docs/api.md#usecanvas-1">useCanvas</a></li>
          <li><a href="/docs/api.md#useimageastexture">useImageAsTexture</a></li>
        </ul>
    </td>

  </tr>
</table>

# Gotchas 🧐

<details>
  <summary>The default camera</summary>

The default scroll-rig camera is locked to a 50 degree Field-of-View.

In order to perfectly match DOM dimensions, the camera distance will be calculated. This calculation is based on screen height since Threejs uses a vertical FoV. This means the camera position-z will change slightly based on your height.

You can override the default camera behaviour, and for instance set the distance and have a variable FoV instead:

```jsx
<GlobalCanvas camera={{ position: [0, 0, 10] }} />
```

Or change the FoV, which would move the camera further away in this case:

```jsx
<GlobalCanvas camera={{ fov: 20 }} />
```

If you need full control of the camera you can pass in a custom camera as a child instead.

</details>

<details>
  <summary>Use relative scaling</summary>
  Always base your sizes on the `scale` passed down from ScrollScene/ViewportScrollScene/useTracker in order to have consistent scaling for all screen sizes.

The `scale` is always matching the tracked DOM element and will update based on media queries etc.

```jsx
<ScrollScene track={el}>
  {{ scale }} => (
  <mesh scale={scale} />
  )}
</ScrollScene>
```

Scale is a 3-dimensional vector type from [vecn](https://www.npmjs.com/package/vecn) that support swizzling and object notation. You can do things like:

```js
position.x === position[0]
position.xy => [x,y]
scale.xy.min() => Math.min(scale.x, scale.y)
```

</details>

<details>
  <summary>Z-Fighting on 3D objects (scaleMultiplier)</summary>

By default the scroll-rig will calculate the camera FoV so that 1 pixel = 1 viewport unit.

In some cases, this can mess up the depth sorting, leading to visual glitches in a 3D model. A 1000 pixel wide screen would make the scene 1000 viewport units wide, and by default the camera will also be positioned ~1000 units away in Z-axis (depending on the FoV and screen hight).

One way to fix this is to enable the [logarithmicDepthBuffer](https://threejs.org/docs/index.html?q=webglre#api/en/renderers/WebGLRenderer) but that can be bad for performance.

A better way to fix the issue is to change the GlobalCanvas `scaleMultiplier` to something like `0.01` which would make 1000px = 10 viewport units.

```jsx
<GlobalCanvas scaleMultiplier={0.01} />
```

The `scaleMultiplier` setting updates all internal camera and scaling logic. Hardcoded scales and positions would need to be updated if you change this setting.

</details>

<details>
  <summary>Matching exact hex colors</summary>

By default R3F uses ACES Filmic tone mapping which makes 3D scenes look great.

However, if you need to match hex colors or show editorial images, you can disable it per material like so:

```jsx
<meshBasicMaterial toneMapping={false} />
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
const MyScrollScene = ({ el }) => <ScrollScene track={el}>/* ... */</ScrollScene>

function MyHtmlComponent() {
  return (
    <UseCanvas>
      <MyScrollScene />
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

<details>
  <summary>How can I wrap my UseCanvas meshes in a shared Suspense?</summary>

Please read the API docs on using [children as a render function](/docs/api.md#children-as-render-function) for an example.

</details>

# In the wild 🐾

- [14islands.com](https://14islands.com) by [14islands](https://14islands.com)
- [v3.14islands.com](https://v3.14islands.com) by [14islands](https://14islands.com)
- [Pluto.app](https://pluto-xr.netlify.app/) by [14islands](https://14islands.com)
- [Myriad.video](https://myriad.video/) by [14islands](https://14islands.com)
- [Neko Health](https://www.nekohealth.com/) by [14islands](https://14islands.com)
- ~~[Playgoals.com](https://playgoals.com/) by [14islands](https://14islands.com)~~
- [Goals studio](https://studio.playgoals.com/) by [14islands](https://14islands.com)
- ~~[Pluto dev portal](https://dev.pluto.app/) by [14islands](https://14islands.com)~~
- [Quantum Wallet](https://quantumwallet.tech/) by [14islands](https://14islands.com)
- [Metamask Learn](https://learn.metamask.io/) by [Antinomy Studio](https://antinomy.studio)
- [Lynxeye](https://lynxeye.com/) by [14islands](https://14islands.com)
- [Astra Nova](https://astranova.world/) by [estudio/nk](https://thefwa.com/profiles/estudionk-r) and [@juliperoncini](https://twitter.com/juliperoncini)
- [Axolot Games](https://www.axolotgames.com/) by [14islands](https://14islands.com)
- [Cartier 365](https://365ayearof.cartier.com/en/) by [14islands](https://14islands.com)
