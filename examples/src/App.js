import React, { useRef, Suspense } from 'react'
import './App.css'

import { GlobalCanvas, VirtualScrollbar } from '@14islands/r3f-scroll-rig'
import { Loader } from '@react-three/drei'

import PerspectiveCamera from './components/PerspectiveCamera'
import OrthographicCamera from './components/OrthographicCamera'
import Text from './components/text/Text'
import Image from './components/image'
import ParallaxImage from './components/image/ParallaxImage'
import StickyImage from './components/image/StickyImage'
import StickyBox from './components/StickyBox'
import InlineBox from './components/InlineBox'
import ModelViewport from './components/ModelViewport'

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
      <Suspense fallback={null}>
        <VirtualScrollbar>
          {(bind) => (
            <div className="App" {...bind}>
              <header className="App-header">
                <div style={{ margin: '-10vh 0 0', width: '100%' }}>
                  <Text style={{}}>14islands Scroll Rig</Text>
                  <div style={{ fontSize: '20px', letterSpacing: 0, color: 'darkturquoise' }}>
                    Example with antialiasing and global perspective camera
                  </div>
                </div>
              </header>
              <main>
                <Text>A ScrollScene with a Cube mesh inside</Text>
                <div style={{ margin: '20vw auto 0', width: '80vw', height: '80vw' }}>
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
                      <Text as="p">
                        This cube stays in the viewport during this section.
                      </Text>
                      <Text as="p">
                          It has some lerp on the sticky position so that you can feel the scroll direction.
                      </Text>
                    </div>
                  </div>
                </div>

                <Text>Moree ScrollScenes with Parallaxing images</Text>
                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '20vw 10vw' }}>
                  <ParallaxImage src={testImage} aspectRatio={2 / 1} style={{ width: '45%' }} parallax={-100} />
                  <ParallaxImage
                    src={testImage}
                    aspectRatio={2 / 1}
                    style={{ width: '45%', marginTop: '20%' }}
                    parallax={50}
                  />
                </div>
                <Text>A sticky scrollscene that covers 300vh with a fullscreen image</Text>
                <div style={{ height: '300vh', margin: '-5vw 5vw 15vw' }} ref={el}>
                  <StickyImage src={testPower2Image} />
                </div>

                <div style={{ padding: '10vw 0 5vw' }}>
                  <Text>Scrollscenes with real *.gltf 3D models from Thodoris:</Text>
                </div>
                <div style={{ padding: '0 40vw 0 15vw' }}>
                  <RotatingImage src={t3} aspectRatio={1920 / 1464}>
                    <div className="RotatingImageModel" style={{ right: '-30vw' }}>
                      <ModelViewport url={sailboatModel} size={0.15} position={[-0.02, -0.1, 0]} />
                    </div>
                  </RotatingImage>
                </div>

                <div style={{ padding: '20vh 15vw 0 40vw' }}>
                  <RotatingImage src={t2} aspectRatio={1920 / 1920}>
                    <div className="RotatingImageModel" style={{ left: '-30vw' }}>
                      <ModelViewport url={giraffeModel} size={0.15} position={[0, -0.2, 0]} />
                    </div>
                  </RotatingImage>
                </div>

                <div style={{ padding: '15vw 0 5vw' }}>
                  <Text>This one is massive and might lag</Text>
                  <div className="" style={{ height: '80vh' }}>
                    <ModelViewport url={hutModel} size={0.05} position={[0.15, -0.2, 0]} />
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
          // shadowMap
          // shadowMap={{
          //   enabled: true,
          //   autoUpdate: true,
          //   type: BasicShadowMap,
          // }}
          gl={{
            antialias: true,
            depth: true,
          }}
          noEvents={true}
          config={{
            debug: false,
            fps: true,
            scaleMultiplier: 0.001, // make 1000px = 1 in three to avoid depth buffer sorting issues etc
          }}
          // use our own default camera
          camera={null}
          updateDefaultCamera={false}
        >
          <PerspectiveCamera makeDefault={true} />
          {/* <OrthographicCamera makeDefault={true} /> */}
        </GlobalCanvas>
      </Suspense>
      <Loader/>
    </>
  )
}

export default App
