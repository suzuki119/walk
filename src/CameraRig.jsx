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
    const target = targetRef.current
    const controls = controlsRef.current
    if (!target || !controls) return

    // 初回：モデルの大きさからカメラ位置・距離の制限を決める
    if (!ready.current) {
      const sphere = new THREE.Box3()
        .setFromObject(target)
        .getBoundingSphere(new THREE.Sphere())
      const radius = sphere.radius || 10
      const center = sphere.center
      controls.target.copy(center)
      camera.position.set(center.x, center.y + radius * 1.5, center.z + radius * 3) // 横から
      controls.minDistance = radius * 1.2
      controls.maxDistance = radius * 20
      prev.copy(target.position)
      ready.current = true
      return
    }

    // ドラゴンが動いたぶんだけ、カメラと注視点を一緒に動かす
    delta.copy(target.position).sub(prev)
    if (delta.lengthSq() > 0) {
      camera.position.add(delta)
      controls.target.add(delta)
      prev.copy(target.position)
    }
  })

  return null
}
