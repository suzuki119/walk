import { useRef, useMemo, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF, useAnimations, useKeyboardControls } from '@react-three/drei'
import * as THREE from 'three'

// public/doragon.glb を読み込みます（公開先の base に合わせて解決）
const DRAGON_URL = `${import.meta.env.BASE_URL}doragon.glb`

const WALK_RATIO = 0.32 // 体の最大寸法に対する歩行速度
const RUN_RATIO = 0.7 // 走行速度
const TURN_SPEED = 10 // 向きを変える速さ
const UP = new THREE.Vector3(0, 1, 0)

export default function Dragon({ groupRef }) {
  const localRef = useRef()
  const group = groupRef ?? localRef
  const { scene, animations } = useGLTF(DRAGON_URL)
  const { actions, names } = useAnimations(animations, group)

  // このモデルはアニメが1個（歩行）なので最初のクリップを使う
  const clip = names[0]

  // 影を有効化
  useMemo(() => {
    scene.traverse((o) => {
      if (o.isMesh) o.castShadow = o.receiveShadow = true
    })
  }, [scene])

  // モデルの最下点を地面(y=0)に合わせる量と、サイズ基準の移動速度を計算
  const [yOffset, setYOffset] = useState(0)
  const speed = useRef({ walk: 6, run: 12 })
  useEffect(() => {
    scene.updateWorldMatrix(true, true)
    const box = new THREE.Box3().setFromObject(scene)
    if (!Number.isFinite(box.min.y)) return
    setYOffset(-box.min.y)
    const size = box.getSize(new THREE.Vector3())
    const m = Math.max(size.x, size.z) || 1
    speed.current = { walk: m * WALK_RATIO, run: m * RUN_RATIO }
  }, [scene])

  const wasMoving = useRef(false)
  const [, getKeys] = useKeyboardControls()
  const dir = useMemo(() => new THREE.Vector3(), [])
  const q = useMemo(() => new THREE.Quaternion(), [])

  useFrame((_, delta) => {
    const { forward, backward, left, right, run } = getKeys()
    const g = group.current
    if (!g) return

    dir.set((right ? 1 : 0) - (left ? 1 : 0), 0, (backward ? 1 : 0) - (forward ? 1 : 0))
    const moving = dir.lengthSq() > 0
    const a = actions[clip]

    if (moving) {
      dir.normalize()
      g.position.addScaledVector(dir, (run ? speed.current.run : speed.current.walk) * delta)

      // 進行方向へ滑らかに回転（このモデルは頭が -Z 向きなので 180°反転）
      q.setFromAxisAngle(UP, Math.atan2(dir.x, dir.z) + Math.PI)
      g.quaternion.slerp(q, Math.min(1, TURN_SPEED * delta))

      if (a) a.timeScale = run ? 1.6 : 1 // 走行時はアニメも速く
    }

    // 移動状態が変わった瞬間だけ歩行アニメを再生/停止
    if (a && moving !== wasMoving.current) {
      moving ? a.reset().fadeIn(0.2).play() : a.fadeOut(0.2)
      wasMoving.current = moving
    }
  })

  return (
    <group ref={group} dispose={null}>
      {/* 持ち上げは外側のグループで行う（モデルは原点のまま＝計測がブレない） */}
      <group position={[0, yOffset, 0]}>
        <primitive object={scene} />
      </group>
    </group>
  )
}

useGLTF.preload(DRAGON_URL)
