# PLAN.md — Phaser 2D Battle Royale Builder / Sword-Growth Game

## Game Context

Build a 2D browser game using Phaser 3.

The game is a 2D battle royale prototype with the following core premise:

- Players move around a top-down 2D arena.
- Players gather resources from the map.
- Resources are spent to build walls and, later, other structures.
- Combat is inspired by EvoWars-style progression: when a player kills another player, their sword becomes longer.
- Sword upgrades must **only increase sword length/range**.
- Sword upgrades must **not increase damage**.
- It should always take **5 successful hits** to kill any player or bot, no matter the sword level.
- XP orbs/points spawn on the ground.
- Collecting enough XP should also allow sword upgrades, even without killing another player.
- The first version should be a local single-player prototype with bots, not real multiplayer.
- Multiplayer should only be added after the core loop works.

The intended loop is:

1. Player moves around the arena.
2. Player collects resources.
3. Player collects XP orbs.
4. Player builds walls using resources.
5. Player attacks enemies with a sword.
6. Every sword hit deals exactly 1 damage.
7. Every player/bot has 5 HP.
8. Killing an enemy increases sword level by 1.
9. Collecting enough XP also increases sword level.
10. Sword level increases reach only.

## Non-Negotiable Gameplay Rules

Cursor must preserve these rules throughout implementation:

```js
const PLAYER_MAX_HP = 5;
const SWORD_DAMAGE = 1;
```

A target dies only after 5 successful hits.

Sword level must affect only sword range, not damage, health, attack speed, or kill count.

Suggested sword progression:

```js
const SWORD_LEVELS = [
  { level: 1, range: 45, xpRequired: 0 },
  { level: 2, range: 60, xpRequired: 5 },
  { level: 3, range: 80, xpRequired: 12 },
  { level: 4, range: 105, xpRequired: 22 },
  { level: 5, range: 135, xpRequired: 35 },
  { level: 6, range: 170, xpRequired: 55 }
];
```

Suggested balance constants:

```js
const BALANCE = {
  maxHp: 5,
  swordDamage: 1,
  wallCost: 3,
  wallHp: 8,
  resourcePickupValue: 1,
  xpOrbValue: 1,
  killSwordLevelGain: 1,
  attackCooldownMs: 500,
  buildCooldownMs: 250
};
```

## Technical Target

Use Phaser 3 with JavaScript or TypeScript. Prefer TypeScript if the project is being created from scratch, but do not convert an existing JavaScript project unless necessary.

Recommended setup if no project exists:

```bash
npm create @phaserjs/game@latest
npm install
npm run dev
```

Use placeholder shapes or simple generated assets if art assets are missing. Do not block implementation on final art.

## Required Testing Rule

After every phase, Cursor must run the available test command.

Use this order:

1. If `npm test` exists, run `npm test`.
2. If `npm run lint` exists, run `npm run lint`.
3. Always run `npm run build` if it exists.
4. If no automated tests exist yet, create minimal tests or a validation script before continuing.

Cursor must not move to the next phase until the current phase is tested and the result is recorded in the phase notes.

Each phase should end with this checklist:

```md
### Phase Test Checklist

- [ ] Game compiles/builds successfully.
- [ ] No console errors during startup.
- [ ] Feature works manually in the browser.
- [ ] Any automated tests or validation scripts pass.
- [ ] Notes added for any known issue.
```

---

# Phase 0 — Project Audit and Baseline Setup

## Goal

Understand the current project state and establish a runnable Phaser baseline.

## Tasks

1. Inspect the repository structure.
2. Identify whether the project already uses Phaser.
3. Identify whether the project uses JavaScript or TypeScript.
4. Find available scripts in `package.json`.
5. Ensure the project can install dependencies and run locally.
6. If no Phaser project exists, create a new Phaser 3 project structure.
7. Add or confirm these scripts if missing and appropriate:

```json
{
  "scripts": {
    "dev": "vite --host 0.0.0.0",
    "build": "vite build",
    "test": "vitest run"
  }
}
```

Only add Vitest if it fits the current project. If not, add a simple validation script.

## Expected Output

A Phaser project that can run in development mode and build without errors.

## Manual Acceptance Criteria

- The browser opens a Phaser canvas.
- The game scene loads.
- No gameplay is required yet.

## Testing Required

Run:

```bash
npm install
npm run build
```

Also run `npm test` if available.

### Phase Test Checklist

- [ ] Game compiles/builds successfully.
- [ ] No console errors during startup.
- [ ] Feature works manually in the browser.
- [ ] Any automated tests or validation scripts pass.
- [ ] Notes added for any known issue.

---

# Phase 1 — Core Game Scene, Arena, and Player Movement

## Goal

Create the playable top-down arena and player controller.

## Tasks

1. Create a main Phaser scene, for example `GameScene`.
2. Add a top-down arena with world bounds.
3. Add a player entity.
4. Implement keyboard movement.
5. Track player facing direction.
6. Make the camera follow the player if the world is larger than the viewport.
7. Add simple HUD text showing HP, resources, XP, sword level, and sword range.

## Player State

Create a player data object similar to:

```js
const playerData = {
  hp: 5,
  resources: 0,
  xp: 0,
  swordLevelIndex: 0,
  attacking: false,
  facing: new Phaser.Math.Vector2(1, 0)
};
```

## Controls

Use these default controls unless the project already has another scheme:

- Arrow keys or WASD: move.
- Space: attack.
- B: build wall.

## Expected Output

The player can move around a simple arena and the HUD updates without errors.

## Manual Acceptance Criteria

- Player moves in all four directions.
- Player cannot leave world bounds.
- Facing direction updates when moving.
- HUD displays correct default values:
  - HP: 5/5
  - Wood/resources: 0
  - XP: 0
  - Sword Level: 1
  - Sword Range: 45

## Testing Required

Run the available automated test/build command after implementation.

Add at least one basic test or validation for constants if the project has a test framework.

### Phase Test Checklist

- [ ] Game compiles/builds successfully.
- [ ] No console errors during startup.
- [ ] Feature works manually in the browser.
- [ ] Any automated tests or validation scripts pass.
- [ ] Notes added for any known issue.

---

# Phase 2 — Resource Spawning and Collection

## Goal

Add gatherable map resources used for building.

## Tasks

1. Create a resource group, such as `resources` or `woodGroup`.
2. Spawn resource pickups randomly across the arena.
3. Give each pickup a value, defaulting to 1.
4. Add collision/overlap between player and resources.
5. On pickup:
   - destroy the resource pickup;
   - increase player resource count;
   - update the HUD.
6. Add periodic or initial spawning so the arena contains enough resources.

## Suggested Rules

```js
const RESOURCE_PICKUP_VALUE = 1;
const INITIAL_RESOURCE_COUNT = 20;
```

Resource collection should not affect sword level, HP, or damage.

## Expected Output

The player can collect resource pickups and see the resource count increase.

## Manual Acceptance Criteria

- At least 20 resources spawn in the arena.
- Walking over a resource removes it from the map.
- Resource count increases by 1 per pickup.
- HUD updates immediately.

## Testing Required

Run the available automated test/build command after implementation.

If tests exist, add or update tests for resource count changes.

### Phase Test Checklist

- [ ] Game compiles/builds successfully.
- [ ] No console errors during startup.
- [ ] Feature works manually in the browser.
- [ ] Any automated tests or validation scripts pass.
- [ ] Notes added for any known issue.

---

# Phase 3 — Wall Building

## Goal

Allow the player to spend resources to place walls.

## Tasks

1. Create a static physics group for walls.
2. Implement build input using the `B` key.
3. Place a wall in front of the player based on facing direction.
4. Charge a resource cost for each wall.
5. Prevent building if the player lacks resources.
6. Add collision between player and walls.
7. Add collision between bots/enemies and walls when bots are implemented.
8. Add a simple build cooldown to avoid accidental spam.

## Suggested Rules

```js
const WALL_COST = 3;
const WALL_HP = 8;
const BUILD_COOLDOWN_MS = 250;
```

Initial walls can be indestructible for this phase. Wall HP can be used later.

## Expected Output

The player can collect resources and spend them to place walls.

## Manual Acceptance Criteria

- Pressing `B` with fewer than 3 resources does nothing.
- Pressing `B` with at least 3 resources places one wall.
- Resource count decreases by 3.
- Wall appears in front of the player.
- Player collides with the wall.

## Testing Required

Run the available automated test/build command after implementation.

If tests exist, add or update tests for wall cost and resource spending.

### Phase Test Checklist

- [ ] Game compiles/builds successfully.
- [ ] No console errors during startup.
- [ ] Feature works manually in the browser.
- [ ] Any automated tests or validation scripts pass.
- [ ] Notes added for any known issue.

---

# Phase 4 — Sword Attack System

## Goal

Implement sword attacks where range depends on sword level but damage is fixed.

## Tasks

1. Add sword state to the player.
2. Add a visible sword swing or temporary attack rectangle/arc.
3. Use player facing direction to position the attack hitbox.
4. Implement attack cooldown.
5. Ensure the current sword level controls attack range.
6. Ensure damage is always exactly 1.
7. Do not modify player speed, health, damage, or attack rate based on sword level.

## Core Combat Constants

```js
const PLAYER_MAX_HP = 5;
const SWORD_DAMAGE = 1;
const ATTACK_COOLDOWN_MS = 500;
```

## Suggested Attack Logic

```js
function getCurrentSwordRange(playerData) {
  return SWORD_LEVELS[playerData.swordLevelIndex].range;
}
```

Use the current range to size or position the hitbox.

## Expected Output

Pressing Space shows a sword attack in the facing direction. The sword range matches the current sword level.

## Manual Acceptance Criteria

- Pressing Space triggers a visible attack.
- Attack appears in front of the player.
- Attack disappears quickly after the swing.
- Attack cannot be spammed faster than the cooldown.
- Sword level 1 uses range 45.

## Testing Required

Run the available automated test/build command after implementation.

Add a test or validation that `SWORD_DAMAGE` remains 1 for every sword level.

Example invariant:

```js
for (const level of SWORD_LEVELS) {
  expect(SWORD_DAMAGE).toBe(1);
  expect(level.range).toBeGreaterThan(0);
}
```

### Phase Test Checklist

- [ ] Game compiles/builds successfully.
- [ ] No console errors during startup.
- [ ] Feature works manually in the browser.
- [ ] Any automated tests or validation scripts pass.
- [ ] Notes added for any known issue.

---

# Phase 5 — Enemy Bots with 5-HP Kill Rule

## Goal

Add simple enemies/bots that can be hit and killed using the sword.

## Tasks

1. Create an enemy group.
2. Spawn several enemies in the arena.
3. Give each enemy exactly 5 HP.
4. Add sword overlap or distance-based hit detection.
5. Each valid hit reduces enemy HP by exactly 1.
6. Add short per-target hit invulnerability so one swing does not count as multiple hits.
7. Destroy the enemy when HP reaches 0.
8. On enemy death, trigger sword level-up by kill.
9. Optionally drop XP at the enemy death position.

## Required Combat Rule

A bot must take exactly 5 valid sword hits to die at every sword level.

Sword level changes reach only.

## Suggested Enemy State

```js
enemy.setData("hp", PLAYER_MAX_HP);
enemy.setData("recentlyHit", false);
```

Suggested damage logic:

```js
function damageEnemy(enemy) {
  if (enemy.getData("recentlyHit")) return;

  enemy.setData("hp", enemy.getData("hp") - SWORD_DAMAGE);
  enemy.setData("recentlyHit", true);

  if (enemy.getData("hp") <= 0) {
    killEnemy(enemy);
  }
}
```

## Expected Output

The player can attack enemies. Enemies die after 5 hits. Killing an enemy increases sword level by 1.

## Manual Acceptance Criteria

- At least 5 enemies spawn.
- Sword hits reduce enemy HP by 1.
- Enemy survives hits 1 through 4.
- Enemy dies on hit 5.
- Killing an enemy increases sword level by 1.
- Higher sword level increases attack reach only.

## Testing Required

Run the available automated test/build command after implementation.

Add a test or validation proving an enemy with 5 HP dies after exactly 5 applications of 1 damage.

### Phase Test Checklist

- [ ] Game compiles/builds successfully.
- [ ] No console errors during startup.
- [ ] Feature works manually in the browser.
- [ ] Any automated tests or validation scripts pass.
- [ ] Notes added for any known issue.

---

# Phase 6 — Sword Level-Up from Kills

## Goal

Formalize sword progression from kills.

## Tasks

1. Create a reusable `levelUpSword` function.
2. Increase sword level by 1 when the player kills an enemy.
3. Clamp sword level to the max level.
4. Update the HUD after level-up.
5. Ensure level-up changes only sword range.
6. Ensure level-up does not change damage.
7. Ensure level-up does not reduce the number of hits required to kill.

## Suggested Logic

```js
function levelUpSword(playerData) {
  if (playerData.swordLevelIndex < SWORD_LEVELS.length - 1) {
    playerData.swordLevelIndex += 1;
  }
}
```

## Expected Output

Each kill increases sword length until the max level is reached.

## Manual Acceptance Criteria

- Kill 1 enemy: sword level goes from 1 to 2.
- Sword range increases from 45 to 60.
- Damage remains 1.
- A fresh enemy still takes exactly 5 hits to kill.
- Sword level does not go beyond the max configured level.

## Testing Required

Run the available automated test/build command after implementation.

Add or update invariant tests:

- max sword level is clamped;
- damage remains 1 after level-up;
- sword range increases as levels increase;
- enemy HP logic still requires 5 hits.

### Phase Test Checklist

- [ ] Game compiles/builds successfully.
- [ ] No console errors during startup.
- [ ] Feature works manually in the browser.
- [ ] Any automated tests or validation scripts pass.
- [ ] Notes added for any known issue.

---

# Phase 7 — Ground XP Orbs and XP-Based Sword Upgrades

## Goal

Allow players to upgrade sword level by collecting XP orbs on the ground, even without killing.

## Tasks

1. Create an XP orb group.
2. Spawn XP orbs across the arena.
3. Give each XP orb a value, defaulting to 1.
4. Add player overlap with XP orbs.
5. On pickup:
   - destroy the XP orb;
   - increase player XP;
   - check whether XP reaches the next sword level threshold;
   - upgrade sword level if the threshold is met.
6. Optionally spawn XP orbs when enemies die.
7. Update HUD after XP collection and upgrades.

## Suggested Rules

```js
const INITIAL_XP_ORB_COUNT = 15;
const XP_ORB_VALUE = 1;
```

Suggested XP level-up logic:

```js
function checkXpLevelUp(playerData) {
  const nextIndex = playerData.swordLevelIndex + 1;
  if (nextIndex >= SWORD_LEVELS.length) return;

  const nextLevel = SWORD_LEVELS[nextIndex];

  if (playerData.xp >= nextLevel.xpRequired) {
    playerData.swordLevelIndex = nextIndex;
  }
}
```

If a large XP pickup can cross multiple thresholds, use a loop instead of a single `if`.

## Expected Output

The player can collect XP orbs and upgrade sword level without killing enemies.

## Manual Acceptance Criteria

- XP orbs spawn on the ground.
- Walking over an XP orb collects it.
- XP count increases.
- Sword level upgrades when XP reaches the next threshold.
- Sword range increases after the upgrade.
- Damage remains 1.
- Enemies still take exactly 5 hits to kill.

## Testing Required

Run the available automated test/build command after implementation.

Add tests or validation for:

- XP increases on pickup;
- XP threshold increases sword level;
- sword damage remains fixed;
- max sword level is clamped.

### Phase Test Checklist

- [ ] Game compiles/builds successfully.
- [ ] No console errors during startup.
- [ ] Feature works manually in the browser.
- [ ] Any automated tests or validation scripts pass.
- [ ] Notes added for any known issue.

---

# Phase 8 — Basic Bot Movement and Pressure

## Goal

Make enemies feel like simple opponents instead of stationary targets.

## Tasks

1. Give bots simple movement behavior.
2. Start with random wandering or slow movement toward the player.
3. Ensure bots collide with walls.
4. Ensure bots stay inside world bounds.
5. Add simple contact damage only if desired, but preserve 5-hit sword kill rule.
6. Do not let bots bypass walls.

## Suggested Bot Behavior

Start simple:

- Bots wander randomly.
- Every few seconds, choose a new direction.
- Later, bots can chase nearby players.

Avoid complex AI until the core game loop is stable.

## Expected Output

Enemies move around the arena and interact with walls.

## Manual Acceptance Criteria

- Bots move without leaving the arena.
- Bots collide with player-built walls.
- Player can still hit and kill bots.
- A bot still takes exactly 5 valid sword hits to kill.
- Performance remains stable.

## Testing Required

Run the available automated test/build command after implementation.

Add validation where practical for bot HP and collision setup.

### Phase Test Checklist

- [ ] Game compiles/builds successfully.
- [ ] No console errors during startup.
- [ ] Feature works manually in the browser.
- [ ] Any automated tests or validation scripts pass.
- [ ] Notes added for any known issue.

---

# Phase 9 — Battle Royale Safe Zone

## Goal

Add battle royale pressure using a shrinking safe zone.

## Tasks

1. Add a circular or rectangular safe zone.
2. Display the safe zone boundary visually.
3. Shrink the safe zone over time.
4. Detect whether the player or bots are outside the safe zone.
5. Apply zone damage over time to entities outside the zone.
6. Ensure zone damage is separate from sword damage.
7. Keep sword combat rule unchanged: sword hits always deal 1 damage.

## Suggested Rules

```js
const ZONE_START_RADIUS = 700;
const ZONE_END_RADIUS = 100;
const ZONE_SHRINK_DURATION_MS = 180000;
const ZONE_DAMAGE_INTERVAL_MS = 1000;
const ZONE_DAMAGE = 1;
```

Zone damage may reduce HP, but sword damage must remain fixed at 1.

## Expected Output

The playable area shrinks over time, forcing movement and conflict.

## Manual Acceptance Criteria

- Safe zone is visible.
- Safe zone shrinks gradually.
- Entities outside the safe zone take damage over time.
- Sword level and sword damage are unaffected by zone behavior.
- Game remains playable.

## Testing Required

Run the available automated test/build command after implementation.

Add validation for safe-zone radius calculations if practical.

### Phase Test Checklist

- [ ] Game compiles/builds successfully.
- [ ] No console errors during startup.
- [ ] Feature works manually in the browser.
- [ ] Any automated tests or validation scripts pass.
- [ ] Notes added for any known issue.

---

# Phase 10 — Additional Buildables

## Goal

Expand building beyond walls while keeping the initial wall system stable.

## Tasks

1. Add a build mode or simple build selection.
2. Add at least one additional buildable, such as:
   - spike trap;
   - barricade;
   - healing station;
   - resource generator;
   - temporary shield.
3. Assign each buildable a resource cost.
4. Add clear placement rules.
5. Add collision or effect behavior.
6. Keep wall placement working.

## Important Constraint

Do not add buildables that change sword damage. Sword damage must remain 1.

## Expected Output

The player can choose or cycle between buildables and place them using gathered resources.

## Manual Acceptance Criteria

- At least one new buildable exists.
- New buildable has a resource cost.
- Building is blocked if resources are insufficient.
- Existing wall build remains functional.
- Sword damage remains unchanged.

## Testing Required

Run the available automated test/build command after implementation.

Add or update validation for build costs and placement rules.

### Phase Test Checklist

- [ ] Game compiles/builds successfully.
- [ ] No console errors during startup.
- [ ] Feature works manually in the browser.
- [ ] Any automated tests or validation scripts pass.
- [ ] Notes added for any known issue.

---

# Phase 11 — Game State, Win/Loss, and Restart Flow

## Goal

Add a playable match structure.

## Tasks

1. Track remaining enemies/bots.
2. Add player death condition.
3. Add win condition when the player is the last remaining combatant.
4. Add loss condition when the player dies.
5. Add restart input.
6. Display match result text.
7. Reset resources, XP, HP, sword level, entities, walls, and safe zone on restart.

## Expected Output

The game can be won, lost, and restarted.

## Manual Acceptance Criteria

- Player can win by eliminating all bots.
- Player can lose if HP reaches 0.
- Result screen or message appears.
- Restart resets the match cleanly.

## Testing Required

Run the available automated test/build command after implementation.

Add validation for reset state where practical.

### Phase Test Checklist

- [ ] Game compiles/builds successfully.
- [ ] No console errors during startup.
- [ ] Feature works manually in the browser.
- [ ] Any automated tests or validation scripts pass.
- [ ] Notes added for any known issue.

---

# Phase 12 — Refactor, Balance, and Polish

## Goal

Clean up the prototype into maintainable systems.

## Tasks

1. Move constants into a dedicated balance/config file.
2. Split game logic into modules where useful:
   - player;
   - combat;
   - resources;
   - XP;
   - building;
   - bots;
   - safe zone;
   - HUD.
3. Add or improve tests for core invariants.
4. Replace placeholder visuals where available.
5. Add basic sound effects if assets exist.
6. Improve feedback for:
   - collecting resources;
   - collecting XP;
   - failed building due to insufficient resources;
   - sword level-up;
   - enemy hit;
   - enemy death.

## Required Invariant Tests

Before considering the prototype stable, tests or validation scripts must cover these invariants:

1. `PLAYER_MAX_HP` is 5.
2. `SWORD_DAMAGE` is 1.
3. Every enemy starts with 5 HP.
4. A target with 5 HP dies after exactly 5 sword hits.
5. Sword level changes range only.
6. Killing an enemy increases sword level by 1 unless already maxed.
7. XP threshold can increase sword level.
8. Sword level cannot exceed max level.
9. Wall placement costs resources.
10. Wall placement fails with insufficient resources.

## Expected Output

A cleaner, more maintainable Phaser prototype with stable game rules.

## Testing Required

Run:

```bash
npm test
npm run build
```

If linting exists, also run:

```bash
npm run lint
```

### Phase Test Checklist

- [ ] Game compiles/builds successfully.
- [ ] No console errors during startup.
- [ ] Feature works manually in the browser.
- [ ] Any automated tests or validation scripts pass.
- [ ] Notes added for any known issue.

---

# Phase 13 — Multiplayer Preparation Only

## Goal

Prepare the codebase for future multiplayer without implementing real networking yet.

## Tasks

1. Separate input handling from game-state mutation where practical.
2. Avoid trusting client-only state for future authoritative logic.
3. Create clear entity IDs for player, bots, walls, XP, and resources.
4. Keep combat calculations deterministic and centralized.
5. Document which systems must eventually be server-authoritative.

## Future Multiplayer Rule

When multiplayer is eventually added, the server must decide:

- damage;
- deaths;
- resource counts;
- XP counts;
- wall placement;
- sword levels;
- safe-zone state;
- win/loss results.

The browser client should send inputs, not final outcomes. For example, the client may send `attack pressed`, but it should not directly decide `enemy killed`.

## Expected Output

The code is easier to migrate to multiplayer later.

## Testing Required

Run all available tests and build commands.

### Phase Test Checklist

- [ ] Game compiles/builds successfully.
- [ ] No console errors during startup.
- [ ] Feature works manually in the browser.
- [ ] Any automated tests or validation scripts pass.
- [ ] Notes added for any known issue.

---

# Final Definition of Done

The prototype is complete when:

- A player can move in a 2D arena.
- Resources spawn on the map.
- The player can collect resources.
- The player can build walls using resources.
- XP orbs spawn on the map.
- The player can collect XP orbs.
- XP can upgrade sword level.
- Enemies/bots exist.
- Sword attacks hit enemies.
- Every sword hit deals exactly 1 damage.
- Every enemy has 5 HP.
- Every enemy dies after exactly 5 sword hits.
- Killing an enemy upgrades sword level.
- Sword upgrades increase sword length/range only.
- Sword upgrades do not increase damage.
- The HUD displays HP, resources, XP, sword level, and sword range.
- The project builds successfully.
- Tests or validation scripts confirm the core invariants.
