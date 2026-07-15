import {
  BALANCE,
  BUILDABLES,
  type BuildableId,
  PLAYER_MAX_HP,
  SAFE_ZONE,
  SWORD_DAMAGE,
  SWORD_LEVELS,
  SWORD_SWING_ARC_DEGREES,
} from "../config/balance";

export interface PlayerProgress {
  hp: number;
  resources: number;
  rocks: number;
  coins: number;
  xp: number;
  swordLevelIndex: number;
  kills: number;
}

export interface CombatTarget {
  hp: number;
  maxHp: number;
}

export function createPlayerProgress(): PlayerProgress {
  return {
    hp: PLAYER_MAX_HP,
    resources: 0,
    rocks: 0,
    coins: 0,
    xp: 0,
    swordLevelIndex: 0,
    kills: 0,
  };
}

export function createCombatTarget(): CombatTarget {
  return {
    hp: PLAYER_MAX_HP,
    maxHp: PLAYER_MAX_HP,
  };
}

export function clampSwordLevelIndex(index: number): number {
  return Math.max(0, Math.min(index, SWORD_LEVELS.length - 1));
}

export function getSwordLevel(index: number): (typeof SWORD_LEVELS)[number] {
  return SWORD_LEVELS[clampSwordLevelIndex(index)];
}

export function getSwordRange(index: number): number {
  return getSwordLevel(index).range;
}

export function levelUpSwordIndex(index: number, gain = 1): number {
  return clampSwordLevelIndex(index + gain);
}

export function levelUpSword(player: PlayerProgress): PlayerProgress {
  player.swordLevelIndex = levelUpSwordIndex(
    player.swordLevelIndex,
    BALANCE.killSwordLevelGain,
  );
  return player;
}

export function applyXp(player: PlayerProgress, value: number): PlayerProgress {
  player.xp += value;

  while (player.swordLevelIndex < SWORD_LEVELS.length - 1) {
    const nextIndex = player.swordLevelIndex + 1;
    const nextLevel = SWORD_LEVELS[nextIndex];

    if (player.xp < nextLevel.xpRequired) {
      break;
    }

    player.swordLevelIndex = nextIndex;
  }

  return player;
}

export function applySwordHit(target: CombatTarget): boolean {
  target.hp = Math.max(0, target.hp - SWORD_DAMAGE);
  return target.hp <= 0;
}

export function healCombatTarget(target: CombatTarget, fraction = 0.5): number {
  const healAmount = Math.max(1, Math.ceil(target.maxHp * fraction));
  target.hp = Math.min(target.maxHp, target.hp + healAmount);
  return target.hp;
}

export function normalizeAngleRadians(angle: number): number {
  const fullTurn = Math.PI * 2;
  return ((((angle + Math.PI) % fullTurn) + fullTurn) % fullTurn) - Math.PI;
}

export function isAngleWithinSwordSwing(
  aimAngle: number,
  targetAngle: number,
  arcDegrees = SWORD_SWING_ARC_DEGREES,
): boolean {
  const halfArcRadians = (arcDegrees * Math.PI) / 360;
  return Math.abs(normalizeAngleRadians(targetAngle - aimAngle)) <= halfArcRadians;
}

export function countSwordHitsToKill(target: CombatTarget): number {
  let hits = 0;

  while (target.hp > 0) {
    applySwordHit(target);
    hits += 1;
  }

  return hits;
}

export function canAffordWall(resources: number): boolean {
  return canAffordBuildable(resources, "wall");
}

export function spendForWall(player: PlayerProgress): boolean {
  return spendForBuildable(player, "wall");
}

export function getBuildableCost(buildableId: BuildableId): number {
  return BUILDABLES[buildableId].cost;
}

export function canAffordBuildable(
  resources: number,
  buildableId: BuildableId,
): boolean {
  return resources >= getBuildableCost(buildableId);
}

export function spendForBuildable(
  player: PlayerProgress,
  buildableId: BuildableId,
): boolean {
  const cost = getBuildableCost(buildableId);

  if (player.resources < cost) {
    return false;
  }

  player.resources -= cost;
  return true;
}

export function calculateSafeZoneRadius(elapsedMs: number): number {
  const progress = Math.max(
    0,
    Math.min(elapsedMs / SAFE_ZONE.shrinkDurationMs, 1),
  );

  return (
    SAFE_ZONE.startRadius -
    (SAFE_ZONE.startRadius - SAFE_ZONE.endRadius) * progress
  );
}

export function isOutsideSafeZone(
  x: number,
  y: number,
  centerX: number,
  centerY: number,
  radius: number,
): boolean {
  const dx = x - centerX;
  const dy = y - centerY;

  return Math.hypot(dx, dy) > radius;
}
