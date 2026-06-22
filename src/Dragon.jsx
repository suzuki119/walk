import { useRef, useEffect, useState, useMemo, Component } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF, useAnimations, useKeyboardControls } from '@react-three/drei'
import * as THREE from 'three'

// public/dragon.glb に置いたモデルを読み込みます
const DRAGON_URL = '/doragon.glb'

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

  // モデルの一番下が地面(y=0)に来るように、持ち上げる量を計算
  // スキン付きメッシュはワールド行列を更新してから測らないと正しく出ない
  const [yOffset, setYOffset] = useState(0)
  useEffect(() => {
    clonedScene.updateWorldMatrix(true, true)
    const box = new THREE.Box3().setFromObject(clonedScene)
    if (Number.isFinite(box.min.y)) {
      setYOffset(-box.min.y)
      console.log('モデル下端 y =', box.min.y, '→ 持ち上げ量 =', -box.min.y)
    }
  }, [clonedScene])

  // 利用可能なアニメーション名をコンソールに出す（名前確認用）
  useEffect(() => {
    console.log('利用可能なアニメーション:', names)
  }, [names])

  // 待機モーションを探す。無ければ null（= 止まったらアニメを停止する）
  const idleName = useMemo(() => {
    const found = names.find((n) =>
      ['idle', 'stand', 'rest', '待機'].some((k) => n.toLowerCase().includes(k.toLowerCase())),
    )
    return found ?? null
  }, [names])
  // 歩行モーション。それっぽい名前が無ければ最初のアニメを歩行として使う
  const walkName = useMemo(
    () => pickClip(names, ['walk', 'run', 'move', 'アクション', 'action'], 0),
    [names],
  )

  const wasMoving = useRef(null) // 直前が移動中だったか

  const startWalk = () => {
    const a = actions[walkName]
    if (a) {
      a.paused = false
      a.reset().fadeIn(0.2).play()
    }
  }
  const stopWalk = () => {
    const a = actions[walkName]
    if (!a) return
    if (idleName && actions[idleName]) {
      // 待機モーションがあれば切り替え
      a.fadeOut(0.2)
      actions[idleName].reset().fadeIn(0.2).play()
    } else {
      // 無ければ歩行を最初のフレームで停止
      a.fadeOut(0.2)
    }
  }

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

      // 進行方向へ滑らかに回転（このモデルは頭が -Z 向きなので 180°反転）
      const targetYaw = Math.atan2(dir.x, dir.z) + Math.PI
      const q = new THREE.Quaternion().setFromAxisAngle(
        new THREE.Vector3(0, 1, 0),
        targetYaw,
      )
      g.quaternion.slerp(q, Math.min(1, TURN_SPEED * delta))

      // 走行時はアニメも速く再生
      const a = actions[walkName]
      if (a) a.timeScale = run ? 1.6 : 1
    }

    // 移動状態が変わった瞬間だけアニメを切り替える
    if (moving !== wasMoving.current) {
      if (moving) startWalk()
      else stopWalk()
      wasMoving.current = moving
    }
  })

  return (
    <group ref={group} dispose={null}>
      {/* 持ち上げは外側のグループで行う（モデル自身は原点のまま＝計測がブレない） */}
      <group position={[0, yOffset, 0]}>
        <primitive object={clonedScene} />
      </group>
    </group>
  )
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
