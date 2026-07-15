# AGENT.md — Cursor Agent Instructions for Phaser Battle Royale Builder Game

## Role

You are the implementation agent for a Phaser 3 2D browser game prototype.

Follow `PLAN.md` phase by phase. Complete one phase at a time. Do not skip testing. Do not move to the next phase until the current phase has been implemented, tested, and the result has been noted.

## Project Summary

This game is a top-down 2D battle royale prototype built with Phaser.

The game combines:

1. Resource gathering and building, similar to survival/battle royale games.
2. Sword range progression inspired by EvoWars.
3. XP collection from ground pickups.
4. A strict 5-hit combat rule.

The core player experience should be:

- Move around the arena.
- Gather resources.
- Use resources to build walls and later other structures.
- Collect XP points/orbs from the ground.
- Fight enemies with a sword.
- Kill enemies to increase sword length.
- Collect enough XP to increase sword length without killing.
- Survive until the end of the match.

## Non-Negotiable Gameplay Invariants

These rules must never be broken:

```js
const PLAYER_MAX_HP = 5;
const SWORD_DAMAGE = 1;
```

Every player or bot has 5 HP by default.

Every successful sword hit deals exactly 1 damage.

Therefore, it always takes exactly 5 sword hits to kill a full-health player or bot.

Sword level must only change sword length/range.

Sword level must not change:

- sword damage;
- player max HP;
- enemy max HP;
- attack speed;
- movement speed;
- number of hits required to kill.

If a feature conflicts with these invariants, change the feature, not the invariant.

## Game Design Details

### Combat

Combat is sword-based.

The player swings a sword in the current facing direction. The attack should use a temporary hitbox, arc, rectangle, or similar Phaser-compatible collision shape.

Sword range depends on sword level.

Sword damage is always 1.

Use a per-target hit cooldown or `recentlyHit` flag so that one sword swing cannot accidentally apply multiple hits to the same target.

Recommended constants:

```js
const PLAYER_MAX_HP = 5;
const SWORD_DAMAGE = 1;
const ATTACK_COOLDOWN_MS = 500;
```

### Sword Progression

Sword progression is inspired by EvoWars, but only range changes.

Recommended sword level config:

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

On kill, increase sword level by 1 unless already at max level.

On XP threshold, increase sword level according to the configured XP requirements.

Clamp sword level to the maximum configured level.

Never increase `SWORD_DAMAGE` as a reward.

### XP Orbs

XP points/orbs should appear on the ground.

The player can collect them by walking over them.

Collecting XP should increase the player's XP total.

When XP reaches the next sword threshold, the sword level should increase even if the player has not killed anyone.

Suggested constants:

```js
const INITIAL_XP_ORB_COUNT = 15;
const XP_ORB_VALUE = 1;
```

### Resources and Building

Resources should spawn on the ground.

The player collects resources by walking over them.

Resources can be spent to place walls.

Suggested constants:

```js
const INITIAL_RESOURCE_COUNT = 20;
const RESOURCE_PICKUP_VALUE = 1;
const WALL_COST = 3;
const WALL_HP = 8;
const BUILD_COOLDOWN_MS = 250;
```

Wall rules:

- Press `B` to place a wall.
- Wall appears in front of the player based on facing direction.
- Wall costs 3 resources by default.
- Building fails if the player has fewer than 3 resources.
- Walls should collide with the player and bots.

### Battle Royale Direction

The first prototype should be local single-player with bots.

Do not implement real multiplayer until the local core loop is complete and stable.

Later, add a shrinking safe zone to create battle royale pressure.

Suggested safe-zone constants:

```js
const ZONE_START_RADIUS = 700;
const ZONE_END_RADIUS = 100;
const ZONE_SHRINK_DURATION_MS = 180000;
const ZONE_DAMAGE_INTERVAL_MS = 1000;
const ZONE_DAMAGE = 1;
```

Zone damage may damage entities, but it must not modify sword damage or sword progression rules.

## Preferred Implementation Approach

Use Phaser 3.

If the project is new, use the Phaser project generator or a Vite-based Phaser setup.

Recommended setup command if no project exists:

```bash
npm create @phaserjs/game@latest
npm install
npm run dev
```

Use TypeScript if the repository is already TypeScript or if creating a new project from scratch. Use JavaScript if the project is already JavaScript.

Do not perform a large language or framework conversion unless necessary.

Keep early visuals simple. Placeholder shapes, generated sprites, or basic colored rectangles are acceptable.

Do not block progress on art, animation, sound, menus, or final UI polish.

## Recommended File Organization

Use the existing project structure if one exists. If creating or refactoring structure, prefer something like:

```txt
src/
  main.ts
  scenes/
    GameScene.ts
  config/
    balance.ts
  systems/
    combat.ts
    resources.ts
    building.ts
    xp.ts
    bots.ts
    safeZone.ts
  entities/
    Player.ts
    Enemy.ts
  tests/
    gameRules.test.ts
```

For JavaScript projects, use `.js` equivalents.

Keep core constants centralized so tests can verify them.

## Suggested Shared Balance Config

Create or maintain a central config similar to:

```js
export const PLAYER_MAX_HP = 5;
export const SWORD_DAMAGE = 1;

export const SWORD_LEVELS = [
  { level: 1, range: 45, xpRequired: 0 },
  { level: 2, range: 60, xpRequired: 5 },
  { level: 3, range: 80, xpRequired: 12 },
  { level: 4, range: 105, xpRequired: 22 },
  { level: 5, range: 135, xpRequired: 35 },
  { level: 6, range: 170, xpRequired: 55 }
];

export const BALANCE = {
  maxHp: PLAYER_MAX_HP,
  swordDamage: SWORD_DAMAGE,
  wallCost: 3,
  wallHp: 8,
  resourcePickupValue: 1,
  xpOrbValue: 1,
  killSwordLevelGain: 1,
  attackCooldownMs: 500,
  buildCooldownMs: 250
};
```

Do not duplicate these constants in many files. Import them where needed.

## Testing Instructions

Testing is required after every phase.

After completing each phase, run the available commands in this order:

```bash
npm test
npm run lint
npm run build
```

Only run commands that exist in `package.json`. If `npm test` does not exist, add a minimal test setup or create a validation script for core game rules.

At minimum, the project must eventually test these invariants:

```js
expect(PLAYER_MAX_HP).toBe(5);
expect(SWORD_DAMAGE).toBe(1);
```

Also test:

- a full-health entity with 5 HP dies after exactly 5 sword hits;
- a full-health entity survives 4 sword hits;
- sword level-up increases range;
- sword level-up does not increase damage;
- XP threshold can increase sword level;
- killing an enemy can increase sword level;
- sword level cannot exceed max level;
- wall placement costs resources;
- wall placement fails without enough resources.

## Manual Browser Testing After Each Phase

In addition to automated tests, manually run the game with:

```bash
npm run dev
```

Then verify the phase acceptance criteria from `PLAN.md`.

Look for:

- startup errors;
- Phaser scene loading failures;
- broken imports;
- incorrect asset paths;
- missing collisions;
- HUD values not updating;
- sword damage accidentally scaling with level.

## Phase Execution Protocol

For every phase in `PLAN.md`, follow this protocol:

1. Read the phase goal.
2. Inspect the current implementation.
3. Make the smallest coherent set of changes needed for the phase.
4. Keep gameplay invariants intact.
5. Add or update tests where practical.
6. Run tests/build.
7. Manually verify in browser if the phase affects gameplay.
8. Record what passed and any known issues.
9. Only then proceed to the next phase.

Do not batch several phases into one large change unless explicitly instructed.

## Implementation Notes for Specific Systems

### Player Movement

Track facing direction separately from velocity.

When the player stops moving, preserve the last non-zero facing direction so sword attacks and wall placement still know which way to face.

Default facing should be right:

```js
new Phaser.Math.Vector2(1, 0)
```

### Sword Hit Detection

For the first version, distance-based hit detection is acceptable.

Example:

```js
const distance = Phaser.Math.Distance.Between(
  player.x,
  player.y,
  enemy.x,
  enemy.y
);

if (distance <= currentSwordRange + enemyRadius) {
  damageEnemy(enemy);
}
```

Later, replace this with a more accurate attack hitbox or arc if needed.

### Damage Logic

Keep damage logic centralized.

Recommended pure helper logic:

```js
export function applySwordHit(target) {
  target.hp -= SWORD_DAMAGE;
  return target.hp <= 0;
}
```

Do not write damage calculations like:

```js
// Wrong
const damage = swordLevel * 2;
```

or:

```js
// Wrong
enemy.hp -= currentSwordLevel;
```

### XP Level-Up Logic

Use a loop if one pickup can cross multiple level thresholds:

```js
while (playerData.swordLevelIndex < SWORD_LEVELS.length - 1) {
  const nextIndex = playerData.swordLevelIndex + 1;
  const nextLevel = SWORD_LEVELS[nextIndex];

  if (playerData.xp < nextLevel.xpRequired) break;

  playerData.swordLevelIndex = nextIndex;
}
```

### Kill Level-Up Logic

On a confirmed enemy kill:

```js
if (playerData.swordLevelIndex < SWORD_LEVELS.length - 1) {
  playerData.swordLevelIndex += 1;
}
```

Only trigger this once per enemy death.

### Building Logic

Before placing a wall:

1. Check resource count.
2. Check build cooldown.
3. Calculate position in front of player.
4. Create wall.
5. Subtract resources.
6. Refresh physics body if using a static physics group.

Suggested Phaser pattern:

```js
const wall = walls.create(wallX, wallY, "wall");
wall.refreshBody();
```

## Multiplayer Guidance for Later

Do not implement multiplayer during the early phases.

When multiplayer is eventually added, use server-authoritative logic.

The server must decide:

- damage;
- deaths;
- resource counts;
- XP totals;
- wall placement;
- sword levels;
- safe-zone state;
- win/loss results.

The client should send player inputs, such as:

- movement direction;
- attack pressed;
- build requested;
- build type selected.

The client should not directly decide:

- enemy died;
- player gained resources;
- player gained XP;
- player leveled up sword;
- wall was successfully placed.

This keeps the design compatible with future anti-cheat and server validation.

## Definition of Done

The implementation is acceptable when:

- The game runs in the browser.
- The player can move.
- Resources spawn and can be collected.
- The player can build walls using resources.
- XP orbs spawn and can be collected.
- XP can upgrade sword level.
- Enemies/bots spawn.
- The player can attack enemies.
- Every enemy starts with 5 HP.
- Every sword hit deals exactly 1 damage.
- A full-health enemy dies after exactly 5 sword hits.
- Killing an enemy upgrades sword level by 1.
- Sword upgrades increase sword range only.
- Sword upgrades do not increase sword damage.
- HUD displays HP, resources, XP, sword level, and sword range.
- Automated tests or validation scripts confirm the core rules.
- The project builds successfully.

## Final Reminder

The most important design rule is:

Sword level makes the sword longer, not stronger.

Never break the 5-hit kill rule.
