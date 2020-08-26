import React, { useRef } from 'react'
import logo from './logo.svg'
import './App.css'

import { GlobalCanvas, VirtualScrollbar } from 'r3f-scroll-rig'
import { BasicShadowMap } from 'three'

import PerspectiveCamera from './components/PerspectiveCamera'
import Text from './components/Text'
import Image from './components/image'
import StickyImage from './components/image/StickyImage'
import StickyBox from './components/image/StickyBox'
import InlineBox from './components/image/InlineBox'
import InlineModel from './components/InlineModel'

import testImage from './assets/test.jpg'
import testPower2Image from './assets/test-power2.jpg'
import t1 from './assets/thodoris-island.png'
import t2 from './assets/thodoris-archipelago.jpg'
import t3 from './assets/thodoris-archipelago1.jpeg'
import t4 from './assets/thodoris-archipelago2.jpeg'
import sailboatModel from './assets/boat.glb'
import giraffeModel from './assets/giraffe.glb'
import hutModel from './assets/hut.glb'

import RotatingImage from './components/image/RotatingImage'

function App() {
  const el = useRef()
  return (
    <>
      <VirtualScrollbar>
        {(bind) => (
          <div className="App" {...bind}>
            <header className="App-header">
              <div style={{ margin: '40vh auto 10vw' }}>
                <Text style={{}}>14islands Scroll Rig</Text>
                <div style={{ fontSize: '20px', letterSpacing: 0 }}>
                  Example with antialiasing and global perspective camera
                </div>
              </div>
            </header>
            <main>
              <div style={{ margin: '0vw auto 0', width: '80vw', height: '80vw' }}>
                <Text>A ScrollScene with a Cube mesh inside</Text>
                <InlineBox />
              </div>

              <Text>A ScrollScene with an Image inside</Text>
              <div style={{ padding: '0 10vw', margin: '10vw auto' }}>
                <Image src={testPower2Image} aspectRatio={16 / 9} />
              </div>

              <Text>A sticky ScrollScene with a Cube mesh inside</Text>
              <div style={{ position: 'relative', margin: '10vw 0' }} ref={el}>
                <StickyBox />
                <div style={{ marginLeft: '50vw', fontSize: '5vw' }}>
                  <div className="StickySection" style={{ minHeight: '200vh' }}>
                    <Text>
                      This cube stays in the viewport during this section. It has some sticky lerp so you feel the
                      scroll direction.
                    </Text>
                  </div>
                </div>
              </div>

              <Text>These are ScrollScenes with images inside</Text>
              <div style={{ display: 'flex', justifyContent: 'space-between', margin: '10vw' }}>
                <Image src={testImage} aspectRatio={2 / 1} style={{ width: '45%' }} />
                <Image src={testImage} aspectRatio={2 / 1} style={{ width: '45%', marginTop: '20%' }} />
              </div>
              <Text>A sticky scrollscene that covers 300vh with a fullscreen image</Text>
              <div style={{ height: '300vh', margin: '5vw' }} ref={el}>
                <StickyImage src={testPower2Image} />
              </div>

              <div style={{ padding: '10vw 0 5vw' }}>
                <Text>Scrollscenes with real *.gltf 3D models from Thodoris:</Text>
              </div>
              <div style={{ padding: '0 40vw 0 15vw' }}>
                <RotatingImage src={t3} aspectRatio={1920 / 1464}>
                  <div className="RotatingImageModel" style={{ right: '-30vw' }}>
                    <InlineModel url={sailboatModel} size={0.15} position={[-0.02, -0.1, 0]} />
                  </div>
                </RotatingImage>
              </div>

              <div style={{ padding: '20vh 15vw 0 40vw' }}>
                <RotatingImage src={t2} aspectRatio={1920 / 1920}>
                  <div className="RotatingImageModel" style={{ left: '-30vw' }}>
                    <InlineModel url={giraffeModel} size={0.15} position={[0, -0.2, 0]} />
                  </div>
                </RotatingImage>
              </div>

              <div style={{ padding: '15vw 0 5vw' }}>
                <Text>This one is massive and might lag</Text>
                <div className="" style={{ height: '80vh' }}>
                  <InlineModel url={hutModel} size={0.05} position={[0.15, -0.2, 0]} />
                </div>
              </div>

              <div style={{ padding: '15vw 0 5vw' }}>
                <Text>Some more warping Scrollscene images, because they look cool...</Text>
              </div>

              <RotatingImage src={t1} aspectRatio={1920 / 1920} />

              <RotatingImage src={t4} aspectRatio={1920 / 1920} />
            </main>
            <footer style={{ padding: '10vw 0 60vh' }}>
              <Text>That's all for now...</Text>
            </footer>
          </div>
        )}
      </VirtualScrollbar>
      <GlobalCanvas
        shadowMap
        // shadowMap={{
        //   enabled: true,
        //   autoUpdate: true,
        //   type: BasicShadowMap,
        // }}
        gl={{
          antialias: true,
          depth: true,
          // logarithmicDepthBuffer: true,
        }}
        orthographic={false}
        // camera={{
        //   near: 0.1,
        //   far: Math.max(window.innerWidth, window.innerHeight) * 2,
        //   position: [0, 0, Math.max(window.innerWidth, window.innerHeight)],
        //   aspect: window.innerWidth / window.innerHeight,
        //   fov:
        //     2 * (180 / Math.PI) * Math.atan(window.innerHeight / (2 * Math.max(window.innerWidth, window.innerHeight))),
        // }}
        camera={null}
      >
        <PerspectiveCamera makeDefault={true} />
      </GlobalCanvas>
    </>
  )
}

export default App
