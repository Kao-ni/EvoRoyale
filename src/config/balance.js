export const PLAYER_MAX_HP = 5;
export const SWORD_DAMAGE = 1;
export const SWORD_SWING_ARC_DEGREES = 120;
export const TOOL_IDS = ["sword", "axe", "pickaxe", "build"];
export const SWORD_LEVELS = [
    { level: 1, range: 45, xpRequired: 0 },
    { level: 2, range: 60, xpRequired: 5 },
    { level: 3, range: 80, xpRequired: 12 },
    { level: 4, range: 105, xpRequired: 22 },
    { level: 5, range: 135, xpRequired: 35 },
    { level: 6, range: 170, xpRequired: 55 },
];
export const BUILDABLES = {
    wall: {
        id: "wall",
        label: "Wall",
        cost: 3,
        hp: 8,
    },
    generator: {
        id: "generator",
        label: "Generator",
        cost: 6,
        hp: 6,
        resourceIntervalMs: 6000,
        maxTreeSpawns: 5,
    },
};
export const BALANCE = {
    maxHp: PLAYER_MAX_HP,
    swordDamage: SWORD_DAMAGE,
    wallCost: BUILDABLES.wall.cost,
    wallHp: BUILDABLES.wall.hp,
    generatorCost: BUILDABLES.generator.cost,
    generatorHp: BUILDABLES.generator.hp,
    generatorResourceIntervalMs: BUILDABLES.generator.resourceIntervalMs,
    generatorMaxTreeSpawns: BUILDABLES.generator.maxTreeSpawns,
    xpOrbValue: 1,
    botKillXpValue: 3,
    treeHp: 3,
    stoneHp: 4,
    toolDamage: 1,
    toolRange: 170,
    miningCooldownMs: 450,
    treeWoodValue: 4,
    stoneRockValue: 3,
    killSwordLevelGain: 1,
    attackCooldownMs: 500,
    swordSwingArcDegrees: SWORD_SWING_ARC_DEGREES,
    buildCooldownMs: 250,
    botContactCooldownMs: 900,
    botContactDamage: 1,
    zoneDamageIntervalMs: 1000,
    zoneDamage: 1,
};
export const WORLD = {
    width: 6000,
    height: 6000,
    playerSpeed: 240,
    botSpeed: 95,
    playerRadius: 20,
    botRadius: 20,
    initialTreeCount: 150,
    initialStoneCount: 90,
    initialXpOrbCount: 90,
    initialBotCount: 50,
    wallSize: 46,
};
// Each level makes the player larger and slower.
export const LEVEL_GROWTH = {
    scalePerLevel: 0.15,
    maxScale: 2.2,
    speedPenaltyPerLevel: 0.07,
    minSpeedFactor: 0.5,
};
export const SAFE_ZONE = {
    startRadius: 3000,
    endRadius: 800,
    shrinkDurationMs: 180_000,
    // Each death rewinds the shrink timer by this much, nudging the zone back out.
    deathReliefMs: 18000,
};
