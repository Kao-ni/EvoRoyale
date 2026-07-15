# EvoRoyale

A local Phaser 3 browser prototype based on `plan  (EvoRoyale).md` and `agent  (EvoRoyale).md`.

## Run

```bash
npm install
npm run dev
```

To open the app from VS Code Live Server or any static server, use the root `index.html` directly.

For a production-style preview built by Vite:

```bash
npm run build
npm run preview
```

## Controls

- WASD or arrow keys: move
- Mouse: aim selected tool
- Left click: use selected hotbar tool
- 1: sword
- 2: axe
- 3: pickaxe
- 4: build menu
- Q / E: cycle buildable while the build menu is selected
- B: quick-place selected buildable
- R: restart after a match ends

## Core Rules

- Every player and bot starts with 5 HP.
- Every sword hit deals exactly 1 damage.
- A full-health bot dies after exactly 5 sword hits.
- Sword level increases only sword range, never damage.
- Trees and stones must be mined with the axe and pickaxe for wood and rocks.
- Resource generators are buildables that periodically grow trees nearby.
- Sword range increases from XP thresholds.
