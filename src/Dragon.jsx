import { useRef, useEffect, useState, useMemo, Component } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF, useAnimations, useKeyboardControls } from '@react-three/drei'
import * as THREE from 'three'

// public/dragon.glb に置いたモデルを読み込みます
const DRAGON_URL = '/dragon.glb'

const WALK_SPEED = 3 // 1秒あたりの移動量
const RUN_SPEED = 6
const TURN_SPEED = 10 // 向きを変える速さ

// アニメーション名の候補から、それっぽいものを探す
function pickClip(names, keywords, fallbackIndex = 0) {
  const found = names.find((n) =>
    keywords.some((k) => n.toLowerCase().includes(k)),
  )
  return found ?? names[fallbackIndex] ?? null
}

function DragonModel() {
  const group = useRef()
  const { scene, animations } = useGLTF(DRAGON_URL)
  const { actions, names } = useAnimations(animations, group)

  // 影を有効化
  const clonedScene = useMemo(() => {
    scene.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = true
        o.receiveShadow = true
      }
    })
    return scene
  }, [scene])

  // 利用可能なアニメーション名をコンソールに出す（名前確認用）
  useEffect(() => {
    console.log('利用可能なアニメーション:', names)
  }, [names])

  const idleName = useMemo(() => pickClip(names, ['idle', 'stand', 'rest'], 0), [names])
  const walkName = useMemo(() => pickClip(names, ['walk', 'run', 'move'], 0), [names])

  const current = useRef('') // 今再生中のアクション名

  const fade = (name) => {
    if (!name || current.current === name || !actions[name]) return
    const prev = actions[current.current]
    const next = actions[name]
    next.reset().fadeIn(0.25).play()
    if (prev) prev.fadeOut(0.25)
    current.current = name
  }

  useEffect(() => {
    fade(idleName)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idleName, walkName])

  const [, getKeys] = useKeyboardControls()
  const dir = useMemo(() => new THREE.Vector3(), [])

  useFrame((_, delta) => {
    const { forward, backward, left, right, run } = getKeys()
    const g = group.current
    if (!g) return

    // 入力からワールド座標の移動方向を作る
    dir.set((right ? 1 : 0) - (left ? 1 : 0), 0, (backward ? 1 : 0) - (forward ? 1 : 0))
    const moving = dir.lengthSq() > 0

    if (moving) {
      dir.normalize()
      const speed = (run ? RUN_SPEED : WALK_SPEED) * delta
      g.position.addScaledVector(dir, speed)

      // 進行方向へ滑らかに回転
      const targetYaw = Math.atan2(dir.x, dir.z)
      const q = new THREE.Quaternion().setFromAxisAngle(
        new THREE.Vector3(0, 1, 0),
        targetYaw,
      )
      g.quaternion.slerp(q, Math.min(1, TURN_SPEED * delta))

      fade(walkName)
    } else {
      fade(idleName)
    }
  })

  return <primitive ref={group} object={clonedScene} dispose={null} />
}

// dragon.glb がまだ無い場合に表示する仮のドラゴン（箱）
function PlaceholderDragon() {
  const group = useRef()
  const [, getKeys] = useKeyboardControls()
  const dir = useMemo(() => new THREE.Vector3(), [])

  useFrame((_, delta) => {
    const { forward, backward, left, right, run } = getKeys()
    const g = group.current
    if (!g) return
    dir.set((right ? 1 : 0) - (left ? 1 : 0), 0, (backward ? 1 : 0) - (forward ? 1 : 0))
    if (dir.lengthSq() > 0) {
      dir.normalize()
      g.position.addScaledVector(dir, (run ? RUN_SPEED : WALK_SPEED) * delta)
      const targetYaw = Math.atan2(dir.x, dir.z)
      const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), targetYaw)
      g.quaternion.slerp(q, Math.min(1, TURN_SPEED * delta))
    }
  })

  return (
    <group ref={group} position={[0, 0.5, 0]}>
      <mesh castShadow>
        <boxGeometry args={[1, 1, 2]} />
        <meshStandardMaterial color="#5fa86a" />
      </mesh>
      <mesh castShadow position={[0, 0.2, 1.1]}>
        <boxGeometry args={[0.6, 0.6, 0.6]} />
        <meshStandardMaterial color="#76c084" />
      </mesh>
    </group>
  )
}

// glb の読み込みに失敗したら仮ドラゴンにフォールバック
class ModelBoundary extends Component {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch() {
    console.warn(
      'dragon.glb が読み込めませんでした。public/dragon.glb を配置すると本物のモデルが表示されます。',
    )
  }
  render() {
    return this.state.failed ? <PlaceholderDragon /> : this.props.children
  }
}

export default function Dragon() {
  return (
    <ModelBoundary>
      <DragonModel />
    </ModelBoundary>
  )
}

// 事前読み込み（ファイルがあれば）
try {
  useGLTF.preload(DRAGON_URL)
} catch (e) {
  // ignore
}
