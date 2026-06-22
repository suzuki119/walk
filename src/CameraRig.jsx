import { useRef, useMemo } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// ドラゴンの後ろ上から滑らかに追いかけるカメラ
export default function CameraRig({ targetRef }) {
  const { camera } = useThree()
  const info = useRef({ radius: 0, ready: false })

  const localOffset = useMemo(() => new THREE.Vector3(), [])
  const desiredPos = useMemo(() => new THREE.Vector3(), [])
  const lookTarget = useMemo(() => new THREE.Vector3(), [])

  useFrame((_, delta) => {
    const t = targetRef.current
    if (!t) return

    // 初回にモデルの大きさを測り、カメラ距離を決める
    if (!info.current.ready) {
      const sphere = new THREE.Box3()
        .setFromObject(t)
        .getBoundingSphere(new THREE.Sphere())
      info.current.radius = sphere.radius || 10
      info.current.ready = true
    }
    const r = info.current.radius

    // ドラゴンの後ろ(local +Z)・上に位置を取る
    localOffset.set(0, r * 1.0, r * 2.4).applyQuaternion(t.quaternion)
    desiredPos.copy(t.position).add(localOffset)

    // フレームレートに依存しない滑らかな追従
    const lerp = 1 - Math.pow(0.001, delta)
    camera.position.lerp(desiredPos, lerp)

    // 体の中心あたりを見る
    lookTarget.copy(t.position)
    lookTarget.y += r * 0.6
    camera.lookAt(lookTarget)
  })

  return null
}
