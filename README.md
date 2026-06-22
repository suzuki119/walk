# walk — ドラゴンを歩かせる

Blender で作ったボーン付きドラゴン（`.glb`）を React + Three.js で表示し、キー操作で歩かせて移動できるアプリです。

## 技術構成

- [React](https://react.dev/) + [Vite](https://vitejs.dev/)
- [Three.js](https://threejs.org/)
- [@react-three/fiber](https://docs.pmnd.rs/react-three-fiber) / [@react-three/drei](https://github.com/pmndrs/drei)

## セットアップ

```bash
npm install
npm run dev
```

表示された `http://localhost:5173/` をブラウザで開きます。

## 操作方法

| キー | 動作 |
|------|------|
| W / ↑ | 前進 |
| S / ↓ | 後退 |
| A / ← , D / → | 左右移動 |
| Shift | 走る |
| マウスドラッグ | カメラ回転 |

移動中だけ歩行アニメーションが再生され、止まるとポーズします。

## モデルの差し替え

`public/doragon.glb` を置き換えると別のモデルを表示できます。
Blender からは **glTF 2.0 (.glb)** 形式で、「アニメーション」「スキニング」を有効にしてエクスポートしてください。

モデルごとに以下を調整する場合があります（`src/Dragon.jsx`）。

- `DRAGON_URL` … 読み込むファイル名
- 向きの反転（`targetYaw` の `+ Math.PI`）
- 足を地面に合わせる持ち上げ量は自動計算（読み込み時にコンソールへ出力）

## ビルド

```bash
npm run build
npm run preview
```
