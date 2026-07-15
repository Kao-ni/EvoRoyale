# EvoRoyale Phase Notes

The implementation is consolidated into one playable Phaser prototype while preserving the phase requirements from the supplied plan.

## Implemented

- Phase 0: Vite, TypeScript, Phaser 3, Vitest project scaffold.
- Phase 1: Arena, player movement, camera follow, facing direction, HUD.
- Phase 2: Resource spawning and collection.
- Phase 3: Wall building with cost, cooldown, collisions, and blocked placement checks.
- Phase 4: Sword swing visuals, cooldown, range-based hit checks, fixed damage.
- Phase 5: 5-HP enemy bots with 1-damage sword hits and kill handling.
- Phase 6: Kill-based sword level-ups, clamped to max level.
- Phase 7: Ground XP orbs and XP-threshold sword range upgrades.
- Phase 8: Bot wandering, chase behavior, wall collisions, world bounds.
- Phase 9: Visible shrinking safe zone with separate zone damage.
- Phase 10: Build selection plus resource generator buildable with cost, collision, and wood production.
- Phase 11: Win, loss, and restart flow.
- Phase 12: Centralized balance/rules modules with invariant tests.
- Phase 13: Runtime entity IDs plus multiplayer server-authority notes in `MULTIPLAYER_PREP.md`.

## Test Checklist

- [x] Game compiles/builds successfully via `npm run build`.
- [ ] No console errors during startup.
- [ ] Feature works manually in the browser.
- [x] Automated tests pass via `npm test`.
- [x] Dev server responds at `http://localhost:5173/`.
- [x] Vite transforms `/src/main.ts` and `/src/scenes/GameScene.ts` over HTTP.
- [x] Notes added for known issue: in-app browser automation was unavailable in this session, so console and manual gameplay checks need a local browser pass.
