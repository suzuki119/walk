import { useRef, useMemo, useEffect } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// ドラゴンを後ろ上から追いながら、マウスドラッグで視点を回せる三人称カメラ
export default function CameraRig({ targetRef }) {
  const { camera, gl } = useThree()
  const info = useRef({ radius: 0, ready: false })

  // ユーザー操作の視点（ドラゴンの向きを基準にした相対角度）
  const view = useRef({
    yaw: 0, // 左右（0 = 真後ろ）
    pitch: 0.45, // 上下（少し見下ろす）
    distFactor: 2.4, // 距離倍率（ホイールで変わる）
  })

  const offset = useMemo(() => new THREE.Vector3(), [])
  const desiredPos = useMemo(() => new THREE.Vector3(), [])
  const lookTarget = useMemo(() => new THREE.Vector3(), [])

  // マウス・ホイール操作の登録
  useEffect(() => {
    const el = gl.domElement
    let dragging = false
    let lastX = 0
    let lastY = 0

    const onDown = (e) => {
      dragging = true
      lastX = e.clientX
      lastY = e.clientY
    }
    const onUp = () => {
      dragging = false
    }
    const onMove = (e) => {
      if (!dragging) return
      const dx = e.clientX - lastX
      const dy = e.clientY - lastY
      lastX = e.clientX
      lastY = e.clientY
      const v = view.current
      v.yaw -= dx * 0.005
      v.pitch += dy * 0.005
      // 真上・真下まで行かないよう制限
      v.pitch = Math.max(-0.2, Math.min(1.3, v.pitch))
    }
    const onWheel = (e) => {
      e.preventDefault()
      const v = view.current
      v.distFactor += e.deltaY * 0.002
      v.distFactor = Math.max(1.2, Math.min(6, v.distFactor))
    }

    el.addEventListener('pointerdown', onDown)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointermove', onMove)
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      el.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointermove', onMove)
      el.removeEventListener('wheel', onWheel)
    }
  }, [gl])

  useFrame((_, delta) => {
    const t = targetRef.current
    if (!t) return

    // 初回にモデルの大きさを測り、カメラ距離の基準にする
    if (!info.current.ready) {
      const sphere = new THREE.Box3()
        .setFromObject(t)
        .getBoundingSphere(new THREE.Sphere())
      info.current.radius = sphere.radius || 10
      info.current.ready = true
    }
    const r = info.current.radius
    const { yaw, pitch, distFactor } = view.current
    const d = r * distFactor

    // ドラゴンの向きを基準に、後方(+Z)から視点角度ぶん回した位置を作る
    offset.set(
      Math.sin(yaw) * Math.cos(pitch),
      Math.sin(pitch),
      Math.cos(yaw) * Math.cos(pitch),
    ).multiplyScalar(d)
    offset.applyQuaternion(t.quaternion)
    desiredPos.copy(t.position).add(offset)
    // 地面より下に潜らないように
    desiredPos.y = Math.max(desiredPos.y, r * 0.2)

    // フレームレートに依存しない滑らかな追従
    const lerp = 1 - Math.pow(0.0015, delta)
    camera.position.lerp(desiredPos, lerp)

    // 体の中心あたりを見る
    lookTarget.copy(t.position)
    lookTarget.y += r * 0.6
    camera.lookAt(lookTarget)
  })

  return null
}
