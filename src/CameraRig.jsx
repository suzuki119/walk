import { useRef, useMemo } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// OrbitControls の注視点をドラゴンに追従させるだけのリグ
// （回転・ズームは drei の OrbitControls に任せる）
export default function CameraRig({ targetRef, controlsRef }) {
  const { camera } = useThree()
  const prev = useMemo(() => new THREE.Vector3(), [])
  const delta = useMemo(() => new THREE.Vector3(), [])
  const ready = useRef(false)

  useFrame(() => {
    const t = targetRef.current
    const controls = controlsRef.current
    if (!t || !controls) return

    // 初回：モデルの大きさからカメラ位置・距離の制限を決める
    if (!ready.current) {
      const sphere = new THREE.Box3()
        .setFromObject(t)
        .getBoundingSphere(new THREE.Sphere())
      const r = sphere.radius || 10
      const c = sphere.center
      controls.target.copy(c)
      camera.position.set(c.x + r * 3, c.y + r * 1.5, c.z) // 横から
      controls.minDistance = r * 1.2
      controls.maxDistance = r * 20
      prev.copy(t.position)
      ready.current = true
      return
    }

    // ドラゴンが動いたぶんだけ、カメラと注視点を一緒に動かす
    delta.copy(t.position).sub(prev)
    if (delta.lengthSq() > 0) {
      camera.position.add(delta)
      controls.target.add(delta)
      prev.copy(t.position)
    }
  })

  return null
}
