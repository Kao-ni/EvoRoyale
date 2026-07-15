import { BALANCE, BUILDABLES, PLAYER_MAX_HP, SAFE_ZONE, SWORD_DAMAGE, SWORD_LEVELS, SWORD_SWING_ARC_DEGREES, } from "../config/balance.js";
export function createPlayerProgress() {
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
export function createCombatTarget() {
    return {
        hp: PLAYER_MAX_HP,
        maxHp: PLAYER_MAX_HP,
    };
}
export function clampSwordLevelIndex(index) {
    return Math.max(0, Math.min(index, SWORD_LEVELS.length - 1));
}
export function getSwordLevel(index) {
    return SWORD_LEVELS[clampSwordLevelIndex(index)];
}
export function getSwordRange(index) {
    return getSwordLevel(index).range;
}
export function levelUpSwordIndex(index, gain = 1) {
    return clampSwordLevelIndex(index + gain);
}
export function levelUpSword(player) {
    player.swordLevelIndex = levelUpSwordIndex(player.swordLevelIndex, BALANCE.killSwordLevelGain);
    return player;
}
export function applyXp(player, value) {
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
export function applySwordHit(target) {
    target.hp = Math.max(0, target.hp - SWORD_DAMAGE);
    return target.hp <= 0;
}
export function healCombatTarget(target, fraction = 0.5) {
    const healAmount = Math.max(1, Math.ceil(target.maxHp * fraction));
    target.hp = Math.min(target.maxHp, target.hp + healAmount);
    return target.hp;
}
export function normalizeAngleRadians(angle) {
    const fullTurn = Math.PI * 2;
    return ((((angle + Math.PI) % fullTurn) + fullTurn) % fullTurn) - Math.PI;
}
export function isAngleWithinSwordSwing(aimAngle, targetAngle, arcDegrees = SWORD_SWING_ARC_DEGREES) {
    const halfArcRadians = (arcDegrees * Math.PI) / 360;
    return Math.abs(normalizeAngleRadians(targetAngle - aimAngle)) <= halfArcRadians;
}
export function countSwordHitsToKill(target) {
    let hits = 0;
    while (target.hp > 0) {
        applySwordHit(target);
        hits += 1;
    }
    return hits;
}
export function canAffordWall(resources) {
    return canAffordBuildable(resources, "wall");
}
export function spendForWall(player) {
    return spendForBuildable(player, "wall");
}
export function getBuildableCost(buildableId) {
    return BUILDABLES[buildableId].cost;
}
export function canAffordBuildable(resources, buildableId) {
    return resources >= getBuildableCost(buildableId);
}
export function spendForBuildable(player, buildableId) {
    const cost = getBuildableCost(buildableId);
    if (player.resources < cost) {
        return false;
    }
    player.resources -= cost;
    return true;
}
export function calculateSafeZoneRadius(elapsedMs) {
    const progress = Math.max(0, Math.min(elapsedMs / SAFE_ZONE.shrinkDurationMs, 1));
    return (SAFE_ZONE.startRadius -
        (SAFE_ZONE.startRadius - SAFE_ZONE.endRadius) * progress);
}
export function isOutsideSafeZone(x, y, centerX, centerY, radius) {
    const dx = x - centerX;
    const dy = y - centerY;
    return Math.hypot(dx, dy) > radius;
}
