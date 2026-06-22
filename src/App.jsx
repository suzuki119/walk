import { Canvas } from '@react-three/fiber'
import { KeyboardControls, OrbitControls, Grid, Environment } from '@react-three/drei'
import { Suspense, useRef } from 'react'
import Dragon from './Dragon.jsx'
import CameraRig from './CameraRig.jsx'

// 押されたキーをアクション名にマッピング
const keyMap = [
  { name: 'forward', keys: ['ArrowUp', 'KeyW'] },
  { name: 'backward', keys: ['ArrowDown', 'KeyS'] },
  { name: 'left', keys: ['ArrowLeft', 'KeyA'] },
  { name: 'right', keys: ['ArrowRight', 'KeyD'] },
  { name: 'run', keys: ['ShiftLeft', 'ShiftRight'] },
]

export default function App() {
  const dragonRef = useRef()
  const controlsRef = useRef()

  return (
    <KeyboardControls map={keyMap}>
      <Canvas shadows camera={{ position: [6, 5, 8], fov: 50 }}>
        <ambientLight intensity={0.6} />
        <directionalLight
          position={[8, 12, 6]}
          intensity={1.2}
          castShadow
          shadow-mapSize={[2048, 2048]}
        />
        <Suspense fallback={null}>
          <Dragon groupRef={dragonRef} />
          <Environment preset="sunset" />
        </Suspense>
        <OrbitControls ref={controlsRef} makeDefault enablePan={false} enableDamping />
        <CameraRig targetRef={dragonRef} controlsRef={controlsRef} />

        {/* 地面 */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[200, 200]} />
          <meshStandardMaterial color="#2b2b3d" />
        </mesh>
        <Grid
          args={[200, 200]}
          cellSize={1}
          sectionSize={5}
          infiniteGrid
          fadeDistance={60}
          cellColor="#444"
          sectionColor="#666"
        />
      </Canvas>
    </KeyboardControls>
  )
}
