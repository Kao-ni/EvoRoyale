import { describe, expect, it } from "vitest";
import {
  BALANCE,
  BUILDABLES,
  PLAYER_MAX_HP,
  SWORD_DAMAGE,
  SWORD_LEVELS,
  SWORD_SWING_ARC_DEGREES,
} from "../config/balance";
import {
  applySwordHit,
  applyXp,
  calculateSafeZoneRadius,
  canAffordWall,
  countSwordHitsToKill,
  createCombatTarget,
  createPlayerProgress,
  getBuildableCost,
  getSwordRange,
  healCombatTarget,
  isAngleWithinSwordSwing,
  levelUpSword,
  spendForBuildable,
  spendForWall,
} from "../systems/rules";

describe("EvoRoyale rule invariants", () => {
  it("keeps HP and sword damage fixed", () => {
    expect(PLAYER_MAX_HP).toBe(5);
    expect(SWORD_DAMAGE).toBe(1);
    expect(BALANCE.maxHp).toBe(5);
    expect(BALANCE.swordDamage).toBe(1);
  });

  it("starts secondary resource counters at zero", () => {
    const player = createPlayerProgress();

    expect(player.rocks).toBe(0);
    expect(player.coins).toBe(0);
    expect(player.resources).toBe(0);
  });

  it("requires exactly five sword hits to kill a full-health target", () => {
    const target = createCombatTarget();

    for (let i = 0; i < 4; i += 1) {
      expect(applySwordHit(target)).toBe(false);
    }

    expect(target.hp).toBe(1);
    expect(applySwordHit(target)).toBe(true);
    expect(target.hp).toBe(0);
    expect(countSwordHitsToKill(createCombatTarget())).toBe(5);
  });

  it("heals half of a target's max health after a kill", () => {
    const target = createCombatTarget();
    target.hp = 1;

    healCombatTarget(target);

    expect(target.hp).toBe(4);
  });

  it("increases sword range without increasing damage", () => {
    const player = createPlayerProgress();
    const startRange = getSwordRange(player.swordLevelIndex);

    levelUpSword(player);

    expect(getSwordRange(player.swordLevelIndex)).toBeGreaterThan(startRange);
    expect(SWORD_DAMAGE).toBe(1);
  });

  it("clamps sword level at the configured maximum", () => {
    const player = createPlayerProgress();

    for (let i = 0; i < 20; i += 1) {
      levelUpSword(player);
    }

    expect(player.swordLevelIndex).toBe(SWORD_LEVELS.length - 1);
  });

  it("allows XP thresholds to increase sword level", () => {
    const player = createPlayerProgress();

    applyXp(player, 12);

    expect(player.xp).toBe(12);
    expect(SWORD_LEVELS[player.swordLevelIndex].level).toBe(3);
    expect(SWORD_DAMAGE).toBe(1);
  });

  it("bot kill XP contributes to XP without direct level-up from zero", () => {
    const player = createPlayerProgress();

    applyXp(player, BALANCE.botKillXpValue);

    expect(player.xp).toBe(BALANCE.botKillXpValue);
    expect(SWORD_LEVELS[player.swordLevelIndex].level).toBe(1);
    expect(SWORD_DAMAGE).toBe(1);
  });

  it("charges resources for walls and blocks unaffordable builds", () => {
    const player = createPlayerProgress();

    expect(canAffordWall(player.resources)).toBe(false);
    expect(spendForWall(player)).toBe(false);

    player.resources = BALANCE.wallCost;

    expect(spendForWall(player)).toBe(true);
    expect(player.resources).toBe(0);
  });

  it("supports additional buildables without changing sword damage", () => {
    const player = createPlayerProgress();

    expect(getBuildableCost("generator")).toBe(BUILDABLES.generator.cost);
    expect(spendForBuildable(player, "generator")).toBe(false);

    player.resources = BUILDABLES.generator.cost;

    expect(spendForBuildable(player, "generator")).toBe(true);
    expect(player.resources).toBe(0);
    expect(SWORD_DAMAGE).toBe(1);
  });

  it("shrinks the safe zone without touching sword damage", () => {
    const initialRadius = calculateSafeZoneRadius(0);
    const laterRadius = calculateSafeZoneRadius(90_000);

    expect(laterRadius).toBeLessThan(initialRadius);
    expect(SWORD_DAMAGE).toBe(1);
  });

  it("uses a 120-degree sword swing arc", () => {
    expect(SWORD_SWING_ARC_DEGREES).toBe(120);
    expect(isAngleWithinSwordSwing(0, Math.PI / 3)).toBe(true);
    expect(isAngleWithinSwordSwing(0, -Math.PI / 3)).toBe(true);
    expect(isAngleWithinSwordSwing(0, PhaserMathDegreesToRadians(61))).toBe(false);
  });
});

function PhaserMathDegreesToRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}
