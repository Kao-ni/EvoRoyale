import * as Phaser from "phaser";
import { BALANCE, BUILDABLES, LEVEL_GROWTH, PLAYER_MAX_HP, SAFE_ZONE, SWORD_DAMAGE, SWORD_LEVELS, SWORD_SWING_ARC_DEGREES, WORLD, } from "../config/balance.js";
import { applySwordHit, applyXp, calculateSafeZoneRadius, createCombatTarget, createPlayerProgress, getSwordRange, isAngleWithinSwordSwing, isOutsideSafeZone, healCombatTarget, spendForBuildable, } from "../systems/rules.js";
export class GameScene extends Phaser.Scene {
    player;
    trees;
    stones;
    xpOrbs;
    walls;
    generators;
    bots;
    cursors;
    keys;
    hudPanel;
    hudLabels;
    hudValues;
    resourcePanel;
    resourceTitle;
    resourceLabels;
    resourceValues;
    toast;
    swordBlade;
    swordGuard;
    toolSprite;
    buildGhost;
    restartButton;
    safeZoneGraphics;
    dangerZoneOverlay;
    safeZoneMaskGraphics;
    safeZoneMask;
    healthBars;
    cooldownBar;
    hotbarPanel;
    hotbarTexts = [];
    buildMenuText;
    playerState = createPlayerProgress();
    facing = new Phaser.Math.Vector2(1, 0);
    primaryActionQueued = false;
    swingAngleOffset = 0;
    toolSwingOffset = 0;
    selectedTool = "sword";
    selectedBuildable = "wall";
    zoneCenter = new Phaser.Math.Vector2(WORLD.width / 2, WORLD.height / 2);
    entitySequence = 0;
    lastAttackAt = -Infinity;
    lastToolUseAt = -Infinity;
    lastBuildAt = -Infinity;
    lastBotContactAt = -Infinity;
    nextZoneDamageAt = 0;
    zoneStartAt = 0;
    currentZoneRadius = SAFE_ZONE.startRadius;
    zoneFrozen = false;
    playerSpeed = WORLD.playerSpeed;
    playerRadius = WORLD.playerRadius;
    gameOver = false;
    constructor() {
        super("GameScene");
    }
    create() {
        this.resetRuntimeState();
        this.createTextures();
        this.createWorld();
        this.createGroups();
        this.createPlayer();
        this.createSword();
        this.spawnTrees(WORLD.initialTreeCount);
        this.spawnStones(WORLD.initialStoneCount);
        this.spawnXpOrbs(WORLD.initialXpOrbCount);
        this.spawnBots(WORLD.initialBotCount);
        this.createPhysics();
        this.createInput();
        this.createHud();
        this.updateHud();
    }
    update(time, delta) {
        if (this.gameOver) {
            this.tryRestart();
            return;
        }
        this.movePlayer();
        this.updateMouseAim();
        this.updateHeldTool();
        this.updateToolSelection();
        this.updateBuildGhost();
        this.tryPrimaryAction(time);
        this.tryBuild(time);
        this.updateBots(time);
        this.updateGenerators(time);
        this.updateSafeZone(time);
        this.drawHealthBars();
        this.drawAttackCooldownBar(time);
        this.updateHud();
        if (delta > 0) {
            this.cameras.main.setLerp(0.12, 0.12);
        }
    }
    resetRuntimeState() {
        this.playerState = createPlayerProgress();
        this.facing = new Phaser.Math.Vector2(1, 0);
        this.primaryActionQueued = false;
        this.swingAngleOffset = 0;
        this.toolSwingOffset = 0;
        this.selectedTool = "sword";
        this.selectedBuildable = "wall";
        this.zoneCenter = new Phaser.Math.Vector2(WORLD.width / 2, WORLD.height / 2);
        this.entitySequence = 0;
        this.lastAttackAt = -Infinity;
        this.lastToolUseAt = -Infinity;
        this.lastBuildAt = -Infinity;
        this.lastBotContactAt = -Infinity;
        this.nextZoneDamageAt = 0;
        this.zoneStartAt = this.time.now;
        this.currentZoneRadius = SAFE_ZONE.startRadius;
        this.zoneFrozen = false;
        this.gameOver = false;
        this.restartButton = undefined;
    }
    createTextures() {
        this.createCircleTexture("player", 0x5bb3e6, 0x2d536c, WORLD.playerRadius);
        this.createCircleTexture("bot", 0xef6a52, 0x71362c, WORLD.botRadius);
        this.createCircleTexture("xp-orb", 0xffdf5d, 0x9b6a1d, 9);
        this.createTreeTextures();
        this.createStoneTextures();
        this.createToolTextures();
        this.createWallTexture();
        this.createGeneratorTexture();
    }
    createCircleTexture(key, fillColor, strokeColor, radius) {
        if (this.textures.exists(key)) {
            return;
        }
        const padding = 5;
        const size = (radius + padding) * 2;
        const center = size / 2;
        const graphics = this.make.graphics({ x: 0, y: 0 }, false);
        graphics.fillStyle(strokeColor, 1);
        graphics.fillCircle(center, center, radius + 4);
        graphics.fillStyle(fillColor, 1);
        graphics.fillCircle(center, center, radius);
        graphics.fillStyle(0xffffff, 0.38);
        graphics.fillCircle(center - radius * 0.35, center - radius * 0.42, radius * 0.22);
        graphics.generateTexture(key, size, size);
        graphics.destroy();
    }
    createTreeTextures() {
        this.drawTreeTexture("tree", false);
        this.drawTreeTexture("tree-damaged", true);
        if (!this.textures.exists("tree-stump")) {
            const graphics = this.make.graphics({ x: 0, y: 0 }, false);
            const size = 48;
            const center = size / 2;
            // Shadow
            graphics.fillStyle(0x000000, 0.15);
            graphics.fillCircle(center + 3, center + 3, 20);
            // Stump outer border
            graphics.fillStyle(0x3d3f42, 1);
            graphics.fillCircle(center, center, 20);
            // Stump wood fill
            graphics.fillStyle(0xbf8f54, 1);
            graphics.fillCircle(center, center, 16);
            // Inner ring (growth ring)
            graphics.lineStyle(3, 0x8a5a30, 0.6);
            graphics.strokeCircle(center, center, 10);
            graphics.lineStyle(2, 0x8a5a30, 0.4);
            graphics.strokeCircle(center, center, 5);
            // Tiny leaf details on the side of the stump
            graphics.fillStyle(0x3d3f42, 1);
            graphics.fillCircle(8, 32, 6);
            graphics.fillStyle(0x7ca853, 1);
            graphics.fillCircle(8, 32, 4);
            graphics.fillStyle(0x3d3f42, 1);
            graphics.fillCircle(38, 12, 5);
            graphics.fillStyle(0x91b859, 1);
            graphics.fillCircle(38, 12, 3);
            graphics.generateTexture("tree-stump", size, size);
            graphics.destroy();
        }
    }
    drawTreeTexture(key, damaged) {
        if (this.textures.exists(key)) {
            return;
        }
        const graphics = this.make.graphics({ x: 0, y: 0 }, false);
        const size = 160;
        const center = size / 2;
        // 1. Shadow underneath
        graphics.fillStyle(0x000000, 0.15);
        graphics.fillCircle(center + 8, center + 8, 72);
        // 2. Outer/Largest circle
        graphics.fillStyle(0x3d3f42, 1);
        graphics.fillCircle(center, center, 72);
        graphics.fillStyle(0x7ca853, 1);
        graphics.fillCircle(center, center, 62);
        // 3. Middle circle (offset slightly to the top-left for 3D depth)
        const midX = center - 5;
        const midY = center - 5;
        graphics.fillStyle(0x3d3f42, 1);
        graphics.fillCircle(midX, midY, 50);
        graphics.fillStyle(0x91b859, 1);
        graphics.fillCircle(midX, midY, 40);
        // 4. Inner/Smallest circle (offset further to the top-left)
        const innerX = center - 10;
        const innerY = center - 10;
        graphics.fillStyle(0x3d3f42, 1);
        graphics.fillCircle(innerX, innerY, 28);
        graphics.fillStyle(0xa6d368, 1);
        graphics.fillCircle(innerX, innerY, 18);
        // 5. Specular highlight (light reflection) on the top-left of the inner circle
        graphics.fillStyle(0xffffff, 0.18);
        graphics.fillCircle(innerX - 6, innerY - 6, 8);
        // If damaged, add some cool, clean vector cracks on the tree
        if (damaged) {
            graphics.lineStyle(8, 0x3d3f42, 1);
            graphics.lineBetween(innerX, innerY, innerX - 36, innerY - 36);
            graphics.lineBetween(innerX - 36, innerY - 36, innerX - 48, innerY - 24);
            graphics.lineBetween(innerX + 12, innerY - 12, innerX + 44, innerY - 44);
        }
        graphics.generateTexture(key, size, size);
        graphics.destroy();
    }
    createStoneTextures() {
        this.drawStoneTexture("stone", false);
        this.drawStoneTexture("stone-cracked", true);
        if (!this.textures.exists("stone-rubble")) {
            const graphics = this.make.graphics({ x: 0, y: 0 }, false);
            graphics.fillStyle(0x39463f, 1);
            graphics.fillEllipse(30, 29, 46, 22);
            graphics.fillStyle(0x66736c, 1);
            graphics.fillCircle(18, 22, 10);
            graphics.fillCircle(31, 20, 13);
            graphics.fillCircle(44, 25, 8);
            graphics.fillStyle(0xb7c0b8, 0.75);
            graphics.fillCircle(26, 14, 4);
            graphics.generateTexture("stone-rubble", 60, 42);
            graphics.destroy();
        }
    }
    drawStoneTexture(key, cracked) {
        if (this.textures.exists(key)) {
            return;
        }
        const graphics = this.make.graphics({ x: 0, y: 0 }, false);
        const size = 128;
        const center = size / 2;
        // Flat ground shadow
        graphics.fillStyle(0x28312c, 0.20);
        graphics.fillEllipse(center, center + 12, 110, 86);
        // Dark stone backing
        graphics.fillStyle(0x39463f, 1);
        graphics.fillEllipse(center, center + 6, 110, 86);
        // Main stone circle
        graphics.fillStyle(0x596762, 1);
        graphics.fillCircle(center, center - 2, 52);
        // Mid stone circle
        graphics.fillStyle(cracked ? 0x76817b : 0x87938c, 1);
        graphics.fillCircle(center - 12, center - 12, 32);
        // Highlight stone circle
        graphics.fillStyle(0xb7c0b8, 0.82);
        graphics.fillCircle(center - 24, center - 24, 12);
        if (cracked) {
            graphics.lineStyle(8, 0x2f3934, 1);
            graphics.lineBetween(center, center - 42, center - 8, center - 10);
            graphics.lineBetween(center - 8, center - 10, center + 14, center + 6);
            graphics.lineBetween(center + 14, center + 6, center + 4, center + 44);
            graphics.lineStyle(4, 0xd9e0da, 0.75);
            graphics.lineBetween(center + 6, center - 36, center - 2, center - 10);
        }
        graphics.lineStyle(8, 0x39463f, 1);
        graphics.strokeCircle(center, center - 2, 52);
        graphics.generateTexture(key, size, size);
        graphics.destroy();
    }
    createToolTextures() {
        if (!this.textures.exists("axe-tool")) {
            const graphics = this.make.graphics({ x: 0, y: 0 }, false);
            // Wooden shaft running along the tool, head at the far (+x) end.
            graphics.fillStyle(0x5a3a1f, 1);
            graphics.fillRoundedRect(12, 23, 66, 8, 4);
            graphics.fillStyle(0x8a5a30, 1);
            graphics.fillRoundedRect(15, 24, 58, 3, 2);
            // Single-bit axe head: poll block near the shaft, flared curved blade.
            graphics.fillStyle(0x6c757b, 1);
            graphics.fillRoundedRect(66, 15, 11, 24, 3);
            graphics.fillStyle(0x9aa5ab, 1);
            graphics.beginPath();
            graphics.moveTo(74, 7);
            graphics.lineTo(86, 10);
            graphics.lineTo(94, 22);
            graphics.lineTo(86, 34);
            graphics.lineTo(74, 37);
            graphics.lineTo(76, 22);
            graphics.closePath();
            graphics.fillPath();
            // Bevel highlight along the cutting edge.
            graphics.fillStyle(0xdfe6e9, 1);
            graphics.beginPath();
            graphics.moveTo(86, 12);
            graphics.lineTo(92, 22);
            graphics.lineTo(86, 32);
            graphics.lineTo(84, 22);
            graphics.closePath();
            graphics.fillPath();
            graphics.lineStyle(2, 0x3f474b, 1);
            graphics.beginPath();
            graphics.moveTo(74, 7);
            graphics.lineTo(86, 10);
            graphics.lineTo(94, 22);
            graphics.lineTo(86, 34);
            graphics.lineTo(74, 37);
            graphics.strokePath();
            graphics.generateTexture("axe-tool", 96, 52);
            graphics.destroy();
        }
        if (!this.textures.exists("pickaxe-tool")) {
            const graphics = this.make.graphics({ x: 0, y: 0 }, false);
            // Wooden shaft.
            graphics.fillStyle(0x5a3a1f, 1);
            graphics.fillRoundedRect(12, 23, 62, 8, 4);
            graphics.fillStyle(0x8a5a30, 1);
            graphics.fillRoundedRect(15, 24, 54, 3, 2);
            // Pick head mounted at the end: two spikes fanning up and down and
            // curving forward, with an eye where the head meets the shaft.
            graphics.fillStyle(0x9aa5ab, 1);
            graphics.fillTriangle(66, 24, 78, 21, 84, 3);
            graphics.fillTriangle(66, 30, 78, 33, 84, 51);
            graphics.fillStyle(0xdfe6e9, 1);
            graphics.fillTriangle(70, 24, 76, 23, 82, 7);
            graphics.fillTriangle(70, 30, 76, 31, 82, 47);
            graphics.fillStyle(0x565f64, 1);
            graphics.fillCircle(72, 27, 6);
            graphics.fillStyle(0x6c757b, 1);
            graphics.fillCircle(72, 27, 3);
            graphics.lineStyle(2, 0x3f474b, 1);
            graphics.strokeTriangle(66, 24, 78, 21, 84, 3);
            graphics.strokeTriangle(66, 30, 78, 33, 84, 51);
            graphics.generateTexture("pickaxe-tool", 96, 52);
            graphics.destroy();
        }
        if (!this.textures.exists("wood-chip")) {
            this.createChipTexture("wood-chip", 0xb06e35, 0x6d421f);
        }
        if (!this.textures.exists("stone-chip")) {
            this.createChipTexture("stone-chip", 0x8d9992, 0x39463f);
        }
    }
    createChipTexture(key, fillColor, strokeColor) {
        const graphics = this.make.graphics({ x: 0, y: 0 }, false);
        if (key === "wood-chip") {
            graphics.fillStyle(strokeColor, 1);
            graphics.fillCircle(8, 8, 7);
            graphics.fillStyle(fillColor, 1);
            graphics.fillCircle(8, 8, 5);
        }
        else {
            graphics.fillStyle(fillColor, 1);
            graphics.fillTriangle(3, 2, 13, 5, 7, 14);
            graphics.lineStyle(2, strokeColor, 0.9);
            graphics.strokeTriangle(3, 2, 13, 5, 7, 14);
        }
        graphics.generateTexture(key, 16, 16);
        graphics.destroy();
    }
    createWallTexture() {
        if (this.textures.exists("wall")) {
            return;
        }
        const size = WORLD.wallSize;
        const graphics = this.make.graphics({ x: 0, y: 0 }, false);
        graphics.fillStyle(0x5a351f, 1);
        graphics.fillRoundedRect(0, 0, size, size, 7);
        graphics.fillStyle(0x9c6b37, 1);
        graphics.fillRoundedRect(5, 5, size - 10, size - 10, 5);
        graphics.lineStyle(3, 0x5a351f, 1);
        graphics.lineBetween(8, 16, size - 8, 16);
        graphics.lineBetween(8, 30, size - 8, 30);
        graphics.lineBetween(17, 7, 17, size - 7);
        graphics.lineBetween(31, 7, 31, size - 7);
        graphics.generateTexture("wall", size, size);
        graphics.destroy();
    }
    createGeneratorTexture() {
        if (this.textures.exists("generator")) {
            return;
        }
        const size = WORLD.wallSize;
        const center = size / 2;
        const graphics = this.make.graphics({ x: 0, y: 0 }, false);
        graphics.fillStyle(0x4e321f, 1);
        graphics.fillRoundedRect(1, 1, size - 2, size - 2, 8);
        graphics.fillStyle(0x7a4b25, 1);
        graphics.fillRoundedRect(6, 7, size - 12, size - 14, 6);
        graphics.fillStyle(0xf0c85b, 1);
        graphics.fillCircle(center, center, 13);
        graphics.lineStyle(4, 0x4e321f, 1);
        graphics.strokeCircle(center, center, 14);
        graphics.lineStyle(3, 0x9b6a1d, 1);
        graphics.lineBetween(center - 8, center, center + 8, center);
        graphics.lineBetween(center, center - 8, center, center + 8);
        graphics.generateTexture("generator", size, size);
        graphics.destroy();
    }
    createWorld() {
        this.physics.world.setBounds(0, 0, WORLD.width, WORLD.height);
        this.cameras.main.setBounds(0, 0, WORLD.width, WORLD.height);
        this.cameras.main.setBackgroundColor(0x8dc46a);
        const background = this.add.graphics();
        background.setDepth(-10);
        background.fillStyle(0x8dc46a, 1);
        background.fillRect(0, 0, WORLD.width, WORLD.height);
        background.lineStyle(2, 0x6fa94f, 0.34);
        for (let x = 0; x <= WORLD.width; x += 120) {
            background.lineBetween(x, 0, x, WORLD.height);
        }
        for (let y = 0; y <= WORLD.height; y += 120) {
            background.lineBetween(0, y, WORLD.width, y);
        }
        background.lineStyle(3, 0x5f9745, 0.42);
        for (let x = 0; x <= WORLD.width; x += 600) {
            background.lineBetween(x, 0, x, WORLD.height);
        }
        for (let y = 0; y <= WORLD.height; y += 600) {
            background.lineBetween(0, y, WORLD.width, y);
        }
        for (let i = 0; i < 360; i += 1) {
            const x = Phaser.Math.Between(24, WORLD.width - 24);
            const y = Phaser.Math.Between(24, WORLD.height - 24);
            const color = Phaser.Math.RND.pick([0x7ab85a, 0x77b255, 0x9ad071]);
            background.fillStyle(color, 0.45);
            background.fillRoundedRect(x, y, Phaser.Math.Between(16, 32), 5, 3);
        }
        for (let i = 0; i < 34; i += 1) {
            const x = Phaser.Math.Between(60, WORLD.width - 60);
            const y = Phaser.Math.Between(60, WORLD.height - 60);
            background.fillStyle(0x77935f, 1);
            background.fillCircle(x, y, Phaser.Math.Between(12, 21));
            background.fillStyle(0xa7b387, 1);
            background.fillCircle(x - 3, y - 4, Phaser.Math.Between(7, 13));
        }
    }
    createGroups() {
        this.trees = this.physics.add.staticGroup();
        this.stones = this.physics.add.staticGroup();
        this.xpOrbs = this.physics.add.staticGroup();
        this.walls = this.physics.add.staticGroup();
        this.generators = this.physics.add.staticGroup();
        this.bots = this.physics.add.group();
        this.dangerZoneOverlay = this.add.graphics().setDepth(20);
        this.safeZoneMaskGraphics = this.make.graphics({ x: 0, y: 0 }, false);
        this.safeZoneMask = this.safeZoneMaskGraphics.createGeometryMask();
        this.safeZoneMask.invertAlpha = true;
        this.dangerZoneOverlay.setMask(this.safeZoneMask);
        this.safeZoneGraphics = this.add.graphics().setDepth(23);
        this.healthBars = this.add.graphics().setDepth(22);
        this.cooldownBar = this.add.graphics().setDepth(24);
    }
    createPlayer() {
        this.player = this.physics.add
            .sprite(WORLD.width / 2, WORLD.height / 2, "player")
            .setDepth(15)
            .setCollideWorldBounds(true);
        this.player.body.setCircle(WORLD.playerRadius, 5, 5);
        this.tagEntity(this.player, "player");
        // Give the player a combat target so bots can attack them
        this.player.setData("combat", createCombatTarget());
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        this.applyLevelGrowth();
    }
    // Grows the player and slows them down based on their current level.
    applyLevelGrowth() {
        const level = this.playerState.swordLevelIndex;
        const scale = Math.min(1 + level * LEVEL_GROWTH.scalePerLevel, LEVEL_GROWTH.maxScale);
        this.player.setScale(scale);
        // Grow the collision hitbox to match the visual size. Arcade circle bodies
        // don't scale with setScale, so re-set the circle at the scaled radius. The
        // offset keeps it centered (frameCenter - radius); at scale 1 this reduces
        // to the original setCircle(playerRadius, 5, 5).
        this.playerRadius = WORLD.playerRadius * scale;
        const frameCenter = WORLD.playerRadius + 5;
        const bodyOffset = frameCenter - this.playerRadius;
        this.player.body.setCircle(this.playerRadius, bodyOffset, bodyOffset);
        const speedFactor = Math.max(1 - level * LEVEL_GROWTH.speedPenaltyPerLevel, LEVEL_GROWTH.minSpeedFactor);
        this.playerSpeed = WORLD.playerSpeed * speedFactor;
        this.player.body.setMaxVelocity(this.playerSpeed);
    }
    createSword() {
        const range = getSwordRange(this.playerState.swordLevelIndex);
        this.swordBlade = this.add
            .rectangle(0, 0, range, 12, 0xf4e7b5, 1)
            .setOrigin(0, 0.5)
            .setStrokeStyle(3, 0x4d3b2b, 0.95)
            .setDepth(16);
        this.swordGuard = this.add
            .rectangle(0, 0, 10, 28, 0x8f6137, 1)
            .setOrigin(0.5)
            .setStrokeStyle(3, 0x4d3b2b, 0.95)
            .setDepth(17);
        this.toolSprite = this.add
            .image(0, 0, "axe-tool")
            .setOrigin(0.18, 0.5)
            .setDepth(17)
            .setVisible(false);
        this.buildGhost = this.add.graphics().setDepth(9).setVisible(false);
        this.updateHeldTool();
    }
    createPhysics() {
        this.physics.add.collider(this.player, this.trees);
        this.physics.add.collider(this.player, this.stones);
        this.physics.add.collider(this.player, this.walls);
        this.physics.add.collider(this.player, this.generators);
        this.physics.add.collider(this.bots, this.trees);
        this.physics.add.collider(this.bots, this.stones);
        this.physics.add.collider(this.bots, this.walls);
        this.physics.add.collider(this.bots, this.generators);
        this.physics.add.collider(this.bots, this.bots);
        this.physics.add.collider(this.player, this.bots, this.handleBotContact, undefined, this);
        this.physics.add.overlap(this.player, this.xpOrbs, this.collectXp, undefined, this);
    }
    createInput() {
        const keyboard = this.input.keyboard;
        if (!keyboard) {
            const stubKey = { isDown: false };
            this.cursors = {
                left: stubKey,
                right: stubKey,
                up: stubKey,
                down: stubKey,
                space: stubKey,
            };
            this.keys = {
                w: stubKey,
                a: stubKey,
                s: stubKey,
                d: stubKey,
                b: stubKey,
                one: stubKey,
                two: stubKey,
                three: stubKey,
                four: stubKey,
                q: stubKey,
                e: stubKey,
                r: stubKey,
            };
            return;
        }
        this.cursors = keyboard.createCursorKeys();
        this.keys = {
            w: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
            a: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
            s: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
            d: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
            b: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.B),
            one: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE),
            two: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO),
            three: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.THREE),
            four: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.FOUR),
            q: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q),
            e: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E),
            r: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R),
        };
        this.input.on("pointerdown", (pointer) => {
            if (!this.gameOver && pointer.leftButtonDown()) {
                this.primaryActionQueued = true;
            }
        });
    }
    createHud() {
        this.hudPanel = this.add.graphics().setScrollFactor(0).setDepth(49);
        this.hudPanel.fillStyle(0x26351f, 0.86);
        this.hudPanel.fillRoundedRect(14, 14, 280, 130, 8);
        this.hudPanel.lineStyle(2, 0xf3d35e, 0.78);
        this.hudPanel.strokeRoundedRect(14, 14, 280, 130, 8);
        this.hudPanel.fillStyle(0x1a2518, 0.42);
        this.hudPanel.fillRoundedRect(22, 48, 264, 86, 6);
        this.add
            .text(26, 23, "EvoRoyale", {
            fontFamily: "Arial, sans-serif",
            fontSize: "19px",
            fontStyle: "bold",
            color: "#ffe69a",
            stroke: "#162114",
            strokeThickness: 4,
            padding: { x: 2, y: 2 },
        })
            .setScrollFactor(0)
            .setDepth(50);
        this.hudLabels = this.add
            .text(30, 58, "", {
            fontFamily: "Arial, sans-serif",
            fontSize: "13px",
            color: "#bcd2a5",
            lineSpacing: 12,
            padding: { x: 2, y: 2 },
        })
            .setScrollFactor(0)
            .setDepth(50);
        this.hudValues = this.add
            .text(276, 58, "", {
            fontFamily: "Arial, sans-serif",
            fontSize: "13px",
            color: "#fff3cf",
            lineSpacing: 12,
            align: "right",
            padding: { x: 2, y: 2 },
        })
            .setScrollFactor(0)
            .setDepth(50)
            .setOrigin(1, 0);
        this.resourcePanel = this.add.graphics().setScrollFactor(0).setDepth(49);
        this.resourceTitle = this.add
            .text(0, 23, "Resources", {
            fontFamily: "Arial, sans-serif",
            fontSize: "18px",
            fontStyle: "bold",
            color: "#ffe69a",
            stroke: "#162114",
            strokeThickness: 4,
            padding: { x: 2, y: 2 },
        })
            .setScrollFactor(0)
            .setDepth(50);
        this.resourceLabels = this.add
            .text(0, 58, "", {
            fontFamily: "Arial, sans-serif",
            fontSize: "13px",
            color: "#bcd2a5",
            lineSpacing: 12,
            padding: { x: 2, y: 2 },
        })
            .setScrollFactor(0)
            .setDepth(50);
        this.resourceValues = this.add
            .text(0, 58, "", {
            fontFamily: "Arial, sans-serif",
            fontSize: "13px",
            color: "#fff3cf",
            lineSpacing: 12,
            align: "right",
            padding: { x: 2, y: 2 },
        })
            .setScrollFactor(0)
            .setDepth(50)
            .setOrigin(1, 0);
        this.hotbarPanel = this.add.graphics().setScrollFactor(0).setDepth(55);
        this.hotbarTexts = ["1\nSword", "2\nAxe", "3\nPick", "4\nBuild"].map((label) => this.add
            .text(0, 0, label, {
            fontFamily: "Arial, sans-serif",
            fontSize: "14px",
            fontStyle: "bold",
            color: "#fff3cf",
            align: "center",
            lineSpacing: 5,
            padding: { x: 3, y: 3 },
        })
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(56));
        this.buildMenuText = this.add
            .text(0, 0, "", {
            fontFamily: "Arial, sans-serif",
            fontSize: "14px",
            color: "#ffe69a",
            stroke: "#162114",
            strokeThickness: 4,
            align: "center",
            padding: { x: 4, y: 3 },
        })
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(56);
        this.toast = this.add
            .text(26, 154, "", {
            fontFamily: "Arial, sans-serif",
            fontSize: "16px",
            color: "#fff2b5",
            stroke: "#24331f",
            strokeThickness: 4,
        })
            .setScrollFactor(0)
            .setDepth(50)
            .setAlpha(0);
    }
    spawnTrees(count) {
        for (let i = 0; i < count; i += 1) {
            const point = this.getRandomArenaPoint(120);
            this.spawnTree(point.x, point.y);
        }
    }
    spawnTree(x, y) {
        const tree = this.trees.create(x, y, "tree");
        this.tagEntity(tree, "tree");
        tree.setDepth(8);
        tree.setData("hp", BALANCE.treeHp);
        tree.setData("maxHp", BALANCE.treeHp);
        tree.setData("resourceValue", BALANCE.treeWoodValue);
        tree.setData("harvested", false);
        tree.refreshBody();
        const body = tree.body;
        body.setCircle(72, 8, 8);
    }
    spawnStones(count) {
        for (let i = 0; i < count; i += 1) {
            const point = this.getRandomArenaPoint(120);
            this.spawnStone(point.x, point.y);
        }
    }
    spawnStone(x, y) {
        const stone = this.stones.create(x, y, "stone");
        this.tagEntity(stone, "stone");
        stone.setDepth(7);
        stone.setData("hp", BALANCE.stoneHp);
        stone.setData("maxHp", BALANCE.stoneHp);
        stone.setData("resourceValue", BALANCE.stoneRockValue);
        stone.setData("harvested", false);
        stone.refreshBody();
        const body = stone.body;
        // Make the stone hitbox a bit smaller (radius 44, centered)
        body.setCircle(44, 20, 20);
    }
    spawnXpOrbs(count) {
        for (let i = 0; i < count; i += 1) {
            const point = this.getRandomArenaPoint(90);
            this.spawnXpOrb(point.x, point.y, BALANCE.xpOrbValue);
        }
    }
    spawnXpOrb(x, y, value) {
        const orb = this.xpOrbs.create(x, y, "xp-orb");
        this.tagEntity(orb, "xp-orb");
        orb.setData("value", value);
        orb.refreshBody();
    }
    spawnBots(count) {
        for (let i = 0; i < count; i += 1) {
            const point = this.getRandomArenaPoint(220);
            const bot = this.bots.create(point.x, point.y, "bot");
            bot.setDepth(14);
            bot.setCollideWorldBounds(true);
            bot.body.setCircle(WORLD.botRadius, 5, 5);
            this.tagEntity(bot, "bot");
            bot.setData("combat", createCombatTarget());
            // Give each bot a player-like progress object so they can level, hold resources, etc.
            bot.setData("progress", createPlayerProgress());
            // Seed bots with a small amount of resources so they can build
            bot.setData("progress", { ...bot.getData("progress"), resources: 1 });
            bot.setData("direction", Phaser.Math.RandomXY(new Phaser.Math.Vector2(), 1));
            bot.setData("detAt", 0);
            bot.setData("dead", false);
            bot.setData("lastAttackAt", -Infinity);
            bot.setData("lastToolUseAt", -Infinity);
            bot.setData("selectedTool", "sword");
            // visual tool sprite for bot (hidden by default)
            const botTool = this.add
                .image(bot.x, bot.y, "axe-tool")
                .setOrigin(0.18, 0.5)
                .setDepth(17)
                .setVisible(false);
            bot.setData("toolSprite", botTool);
            bot.setData("equippedTool", "sword");
            bot.setData("toolSwingOffset", 0);
        }
    }
    getRandomArenaPoint(padding) {
        return new Phaser.Math.Vector2(Phaser.Math.Between(padding, WORLD.width - padding), Phaser.Math.Between(padding, WORLD.height - padding));
    }
    // Apply level growth for a bot when its sword level increases
    // Apply visual changes when a bot's sword level increases. Pass prevIndex (previous level) so growth only runs on level-up.
    applyBotLevelGrowth(bot, progress, prevIndex) {
        const previous = typeof prevIndex === 'number' ? prevIndex : progress.swordLevelIndex;
        const level = progress.swordLevelIndex;
        // Only apply visual growth if level actually increased
        if (level <= previous) {
            return;
        }
        const scale = Math.min(1 + level * LEVEL_GROWTH.scalePerLevel, LEVEL_GROWTH.maxScale);
        bot.setScale(scale);
        // Grow collision hitbox for bot
        const botRadius = WORLD.botRadius * scale;
        const frameCenter = WORLD.botRadius + 5;
        const bodyOffset = frameCenter - botRadius;
        try {
            bot.body.setCircle(botRadius, bodyOffset, bodyOffset);
        }
        catch (e) {
            // ignore; some runtimes may not allow immediate body set
        }
        // Also grow the visual tool sprite if present so tools scale with the bot
        const botTool = bot.getData("toolSprite");
        if (botTool) {
            const baseW = 92;
            const baseH = 50;
            botTool.setDisplaySize(Math.round(baseW * scale), Math.round(baseH * scale));
        }
        this.popText(bot.x, bot.y - 56, "Lv up", "#f9df68");
    }
    // Bot mining helper — bots will damage nearby mineables when in range and cooldown allows
    tryBotMineTarget(time, bot, group, targetType) {
        const lastToolUseAt = bot.getData("lastToolUseAt") ?? -Infinity;
        if (time - lastToolUseAt < BALANCE.miningCooldownMs) {
            return;
        }
        // Find the closest valid target near the bot
        let closest;
        let closestDistance = Number.POSITIVE_INFINITY;
        const dir = bot.getData("direction") ?? new Phaser.Math.Vector2(1, 0);
        const aimAngle = dir.angle();
        group.children.each((child) => {
            const target = child;
            if (!target.active) {
                return true;
            }
            const toTarget = new Phaser.Math.Vector2(target.x - bot.x, target.y - bot.y);
            const distance = toTarget.length();
            if (distance > BALANCE.toolRange || distance >= closestDistance) {
                return true;
            }
            if (distance > WORLD.botRadius + 12 && !isAngleWithinSwordSwing(aimAngle, toTarget.angle(), 95)) {
                return true;
            }
            closest = target;
            closestDistance = distance;
            return true;
        });
        if (!closest)
            return;
        // Equip correct tool for this mining action so visuals show
        const equip = targetType === "stone" ? "pickaxe" : "axe";
        bot.setData("equippedTool", equip);
        // clear equipped tool shortly after
        this.time.delayedCall(250, () => {
            if (bot.active)
                bot.setData("equippedTool", undefined);
        });
        bot.setData("lastToolUseAt", time);
        const hp = closest.getData("hp") - BALANCE.toolDamage;
        closest.setData("hp", hp);
        // Visuals: chips and hit animation
        this.emitMiningChips(closest.x, closest.y, targetType, hp <= 0 ? 12 : 7);
        this.animateMineableHit(closest, targetType);
        this.popText(closest.x, closest.y - 30, `-${BALANCE.toolDamage}`, "#fff2b5");
        if (hp > 0) {
            this.updateMineableDamageTexture(closest, targetType, hp);
            return;
        }
        if (closest.getData("harvested")) {
            return;
        }
        closest.setData("harvested", true);
        const x = closest.x;
        const y = closest.y;
        const value = closest.getData("resourceValue");
        closest.destroy();
        this.showBrokenMineable(x, y, targetType);
        const progress = bot.getData("progress");
        if (targetType === "tree") {
            progress.resources += value ?? 0;
            this.popText(bot.x, bot.y - 46, `+${value} wood`, "#f6dc8e");
        }
        else if (targetType === "stone") {
            progress.rocks += value ?? 0;
            this.popText(bot.x, bot.y - 46, `+${value} rocks`, "#d8e1dc");
        }
        else {
            // wall destroyed — no resources
            this.popText(bot.x, bot.y - 46, `Wall destroyed`, "#ffd7b0");
        }
    }
    pickBotTool(bot, progress) {
        const playerThreat = this.getClosestLivingTarget(bot, this.player.x, this.player.y, this.playerRadius, BALANCE.toolRange);
        const botThreat = this.getClosestLivingBot(bot, BALANCE.toolRange);
        if ((playerThreat && playerThreat.distance <= BALANCE.toolRange + WORLD.botRadius + this.playerRadius) ||
            (botThreat && botThreat.distance <= BALANCE.toolRange + WORLD.botRadius * 2)) {
            return "sword";
        }
        if (progress.resources >= BUILDABLES.wall.cost && Math.random() < 0.18) {
            return "build";
        }
        const treeTarget = this.getClosestMineableInRange(bot, this.trees);
        const stoneTarget = this.getClosestMineableInRange(bot, this.stones);
        if (progress.resources < BUILDABLES.wall.cost && treeTarget && stoneTarget) {
            return treeTarget.distance <= stoneTarget.distance ? "axe" : "pickaxe";
        }
        if (treeTarget) {
            return "axe";
        }
        if (stoneTarget) {
            return "pickaxe";
        }
        return "sword";
    }
    getClosestMineableInRange(bot, group) {
        let closest;
        group.children.each((child) => {
            const target = child;
            if (!target.active) {
                return true;
            }
            const distance = Phaser.Math.Distance.Between(bot.x, bot.y, target.x, target.y);
            if (distance > BALANCE.toolRange || (closest && distance >= closest.distance)) {
                return true;
            }
            closest = { target, distance };
            return true;
        });
        return closest;
    }
    getClosestLivingTarget(bot, x, y, radius, maxDistance) {
        const distance = Phaser.Math.Distance.Between(bot.x, bot.y, x, y);
        if (distance > maxDistance || distance > radius + WORLD.botRadius + this.playerRadius) {
            return undefined;
        }
        return { distance };
    }
    getClosestLivingBot(bot, maxDistance) {
        let closest;
        this.bots.children.each((child) => {
            const other = child;
            if (other === bot || !other.active || other.getData("dead")) {
                return true;
            }
            const distance = Phaser.Math.Distance.Between(bot.x, bot.y, other.x, other.y);
            if (distance > maxDistance || (closest && distance >= closest.distance)) {
                return true;
            }
            closest = { target: other, distance };
            return true;
        });
        return closest;
    }
    tagEntity(entity, entityType) {
        this.entitySequence += 1;
        entity.setData("entityId", `${entityType}-${this.entitySequence}`);
        entity.setData("entityType", entityType);
    }
    movePlayer() {
        const direction = new Phaser.Math.Vector2(0, 0);
        if (this.cursors.left?.isDown || this.keys.a.isDown) {
            direction.x -= 1;
        }
        if (this.cursors.right?.isDown || this.keys.d.isDown) {
            direction.x += 1;
        }
        if (this.cursors.up?.isDown || this.keys.w.isDown) {
            direction.y -= 1;
        }
        if (this.cursors.down?.isDown || this.keys.s.isDown) {
            direction.y += 1;
        }
        if (direction.lengthSq() > 0) {
            direction.normalize();
            this.player.setVelocity(direction.x * this.playerSpeed, direction.y * this.playerSpeed);
            return;
        }
        this.player.setVelocity(0, 0);
    }
    updateMouseAim() {
        const pointer = this.input.activePointer;
        pointer.updateWorldPoint(this.cameras.main);
        const aim = new Phaser.Math.Vector2(pointer.worldX - this.player.x, pointer.worldY - this.player.y);
        if (aim.lengthSq() <= 4) {
            return;
        }
        this.facing.copy(aim.normalize());
        this.player.setRotation(this.facing.angle());
    }
    // Shows a snapped preview square where the next structure will land, tinted
    // green when placeable and red when blocked or unaffordable.
    updateBuildGhost() {
        if (this.selectedTool !== "build") {
            this.buildGhost.setVisible(false);
            return;
        }
        const position = this.getBuildPosition();
        const buildable = BUILDABLES[this.selectedBuildable];
        const blocked = this.isBuildPositionBlocked(position.x, position.y) ||
            this.playerState.resources < buildable.cost;
        const color = blocked ? 0xe0492f : 0x54d18a;
        const half = WORLD.wallSize / 2;
        this.buildGhost.setVisible(true).clear();
        this.buildGhost.fillStyle(color, 0.25);
        this.buildGhost.fillRect(position.x - half, position.y - half, WORLD.wallSize, WORLD.wallSize);
        this.buildGhost.lineStyle(2, color, 0.95);
        this.buildGhost.strokeRect(position.x - half, position.y - half, WORLD.wallSize, WORLD.wallSize);
    }
    updateHeldTool() {
        if (this.selectedTool === "sword") {
            const range = getSwordRange(this.playerState.swordLevelIndex);
            const angle = this.facing.angle() + this.swingAngleOffset;
            const swordDirection = new Phaser.Math.Vector2(Math.cos(angle), Math.sin(angle));
            const baseX = this.player.x + swordDirection.x * (this.playerRadius - 2);
            const baseY = this.player.y + swordDirection.y * (this.playerRadius - 2);
            this.toolSprite.setVisible(false);
            this.swordBlade
                .setVisible(true)
                .setPosition(baseX, baseY)
                .setRotation(angle)
                .setDisplaySize(range, 12);
            this.swordGuard
                .setVisible(true)
                .setPosition(baseX, baseY)
                .setRotation(angle + Math.PI / 2);
            return;
        }
        this.swordBlade.setVisible(false);
        this.swordGuard.setVisible(false);
        if (this.selectedTool !== "axe" && this.selectedTool !== "pickaxe") {
            this.toolSprite.setVisible(false);
            return;
        }
        const textureKey = this.selectedTool === "axe" ? "axe-tool" : "pickaxe-tool";
        const angle = this.facing.angle() + this.toolSwingOffset;
        const toolDirection = new Phaser.Math.Vector2(Math.cos(angle), Math.sin(angle));
        const baseX = this.player.x + toolDirection.x * (this.playerRadius - 6);
        const baseY = this.player.y + toolDirection.y * (this.playerRadius - 6);
        if (this.toolSprite.texture.key !== textureKey) {
            this.toolSprite.setTexture(textureKey);
        }
        this.toolSprite
            .setVisible(true)
            .setPosition(baseX, baseY)
            .setRotation(angle)
            .setDisplaySize(92, 50);
    }
    trySwordAttack(time) {
        if (time - this.lastAttackAt < BALANCE.attackCooldownMs) {
            return;
        }
        this.lastAttackAt = time;
        const range = getSwordRange(this.playerState.swordLevelIndex);
        const aimAngle = this.facing.angle();
        this.showSwordSwing(range, aimAngle);
        this.bots.children.each((child) => {
            const bot = child;
            if (!bot.active || bot.getData("dead")) {
                return true;
            }
            if (this.isInSwordSwing(bot, range, aimAngle)) {
                this.damageBotWithSword(bot);
            }
            return true;
        });
    }
    showSwordSwing(range, aimAngle) {
        const halfArc = Phaser.Math.DegToRad(SWORD_SWING_ARC_DEGREES / 2);
        const arc = this.add.graphics().setDepth(13);
        const outerRadius = this.playerRadius + range + WORLD.botRadius;
        const steps = 14;
        arc.fillStyle(0xf4e7b5, 0.22);
        arc.lineStyle(4, 0xf4e7b5, 0.68);
        arc.beginPath();
        arc.moveTo(this.player.x, this.player.y);
        for (let i = 0; i <= steps; i += 1) {
            const angle = aimAngle - halfArc + (halfArc * 2 * i) / steps;
            arc.lineTo(this.player.x + Math.cos(angle) * outerRadius, this.player.y + Math.sin(angle) * outerRadius);
        }
        arc.closePath();
        arc.fillPath();
        arc.strokePath();
        this.swingAngleOffset = -halfArc;
        this.tweens.addCounter({
            from: -halfArc,
            to: halfArc,
            duration: 180,
            ease: "Sine.easeInOut",
            onUpdate: (tween) => {
                this.swingAngleOffset = tween.getValue() ?? 0;
            },
            onComplete: () => {
                this.swingAngleOffset = 0;
            },
        });
        this.tweens.add({
            targets: arc,
            alpha: 0,
            duration: 180,
            ease: "Quad.easeOut",
            onComplete: () => arc.destroy(),
        });
    }
    isInSwordSwing(target, range, aimAngle) {
        const toTarget = new Phaser.Math.Vector2(target.x - this.player.x, target.y - this.player.y);
        const distance = toTarget.length();
        if (distance > this.playerRadius + range + WORLD.botRadius) {
            return false;
        }
        if (distance <= this.playerRadius + WORLD.botRadius + 6) {
            return true;
        }
        toTarget.normalize();
        return isAngleWithinSwordSwing(aimAngle, toTarget.angle());
    }
    damageBotWithSword(bot) {
        const combat = bot.getData("combat");
        const died = applySwordHit(combat);
        const now = this.time.now;
        // When hit by the player, become aggressive toward the player for a short time
        bot.setData("agroTarget", "player");
        bot.setData("detAt", now + 3500);
        bot.setData("lastAttackedAt", now);
        // React immediately by steering toward the player
        bot.setData("direction", new Phaser.Math.Vector2(this.player.x - bot.x, this.player.y - bot.y).normalize());
        bot.setTint(0xffffff);
        this.time.delayedCall(90, () => {
            if (bot.active) {
                bot.clearTint();
            }
        });
        this.popText(bot.x, bot.y - 28, `-${SWORD_DAMAGE}`, "#fff2b5");
        if (died) {
            this.healPlayerOnKill();
            this.killBot(bot, {
                progress: this.playerState,
                x: this.player.x,
                y: this.player.y,
            });
        }
    }
    killBot(bot, reward) {
        if (bot.getData("dead")) {
            return;
        }
        bot.setData("dead", true);
        bot.disableBody(true, true);
        this.shiftZoneBackOnDeath();
        for (let i = 0; i < 3; i += 1) {
            this.spawnXpOrb(bot.x + Phaser.Math.Between(-18, 18), bot.y + Phaser.Math.Between(-18, 18), BALANCE.xpOrbValue);
        }
        if (reward) {
            const previousRange = getSwordRange(reward.progress.swordLevelIndex);
            reward.progress.kills += 1;
            applyXp(reward.progress, BALANCE.botKillXpValue);
            this.popText(reward.x, reward.y - 48, `+${BALANCE.botKillXpValue} XP`, "#ffe564");
            if (getSwordRange(reward.progress.swordLevelIndex) > previousRange) {
                this.applyLevelGrowth();
                if (reward.progress === this.playerState) {
                    this.popText(this.player.x, this.player.y - 68, "Level up", "#f9df68");
                }
            }
        }
        if (this.getRemainingBots() === 0) {
            this.endGame(true);
        }
    }
    tryMineTarget(time, group, targetType) {
        if (time - this.lastToolUseAt < BALANCE.miningCooldownMs) {
            return;
        }
        const target = this.findMineableTarget(group);
        if (!target) {
            if (targetType === "tree")
                this.showToast("Aim at a tree");
            else if (targetType === "stone")
                this.showToast("Aim at stone");
            else
                this.showToast("Aim at a wall");
            return;
        }
        const hp = target.getData("hp") - BALANCE.toolDamage;
        this.lastToolUseAt = time;
        target.setData("hp", hp);
        this.showToolStrike(targetType, target, hp <= 0);
        this.popText(target.x, target.y - 30, `-${BALANCE.toolDamage}`, "#fff2b5");
        if (hp > 0) {
            this.updateMineableDamageTexture(target, targetType, hp);
            return;
        }
        if (target.getData("harvested")) {
            return;
        }
        target.setData("harvested", true);
        const x = target.x;
        const y = target.y;
        target.destroy();
        this.showBrokenMineable(x, y, targetType);
        // Trees/stones grant resources, walls do not
        if (targetType === "tree") {
            const value = target.getData("resourceValue");
            this.playerState.resources += value;
            this.popText(this.player.x, this.player.y - 46, `+${value} wood`, "#f6dc8e");
            return;
        }
        if (targetType === "stone") {
            const value = target.getData("resourceValue");
            this.playerState.rocks += value;
            this.popText(this.player.x, this.player.y - 46, `+${value} rocks`, "#d8e1dc");
            return;
        }
        // wall: no resources, just a destruction pop
        this.popText(this.player.x, this.player.y - 46, `Wall destroyed`, "#ffd7b0");
    }
    findMineableTarget(group) {
        let closest;
        let closestDistance = Number.POSITIVE_INFINITY;
        const aimAngle = this.facing.angle();
        group.children.each((child) => {
            const target = child;
            if (!target.active) {
                return true;
            }
            const toTarget = new Phaser.Math.Vector2(target.x - this.player.x, target.y - this.player.y);
            const distance = toTarget.length();
            if (distance > BALANCE.toolRange || distance >= closestDistance) {
                return true;
            }
            if (distance > this.playerRadius + 12 &&
                !isAngleWithinSwordSwing(aimAngle, toTarget.angle(), 95)) {
                return true;
            }
            closest = target;
            closestDistance = distance;
            return true;
        });
        return closest;
    }
    updateMineableDamageTexture(target, targetType, hp) {
        const maxHp = target.getData("maxHp");
        if (hp > maxHp / 2) {
            return;
        }
        if (targetType === "tree") {
            target.setTexture("tree-damaged");
        }
        else if (targetType === "stone") {
            target.setTexture("stone-cracked");
        }
        else {
            // wall: no alternate texture available, use a quick tint to indicate damage
            target.setTint(0xbb8b63);
        }
        target.refreshBody();
    }
    showToolStrike(targetType, target, willBreak) {
        const color = targetType === "tree" ? 0xf1c36f : targetType === "stone" ? 0xd8e1dc : 0x8b5a2b;
        const angle = this.facing.angle();
        const arc = this.add.graphics().setDepth(13);
        this.playToolSwing(targetType);
        arc.lineStyle(8, color, 0.72);
        arc.beginPath();
        arc.arc(this.player.x, this.player.y, BALANCE.toolRange + this.playerRadius, angle - 0.62, angle + 0.32, false);
        arc.strokePath();
        this.tweens.add({
            targets: arc,
            alpha: 0,
            duration: 150,
            ease: "Quad.easeOut",
            onComplete: () => arc.destroy(),
        });
        this.emitMiningChips(target.x, target.y, targetType, willBreak ? 12 : 7);
        if (!willBreak) {
            this.animateMineableHit(target, targetType);
        }
    }
    playToolSwing(targetType) {
        const backSwing = targetType === "tree" ? -0.95 : -0.72;
        const followThrough = targetType === "tree" ? 0.45 : 0.36;
        // walls behave like stone for swing feel
        this.toolSwingOffset = backSwing;
        this.tweens.addCounter({
            from: backSwing,
            to: followThrough,
            duration: 120,
            ease: "Quad.easeIn",
            onUpdate: (tween) => {
                this.toolSwingOffset = tween.getValue() ?? 0;
            },
            onComplete: () => {
                this.tweens.addCounter({
                    from: followThrough,
                    to: 0,
                    duration: 100,
                    ease: "Back.easeOut",
                    onUpdate: (tween) => {
                        this.toolSwingOffset = tween.getValue() ?? 0;
                    },
                    onComplete: () => {
                        this.toolSwingOffset = 0;
                    },
                });
            },
        });
    }
    animateMineableHit(target, targetType) {
        const angle = targetType === "tree" ? -5 : 4;
        this.tweens.killTweensOf(target);
        target.setTint(0xffffff);
        target.setAngle(angle);
        target.setScale(1.07, targetType === "tree" ? 0.97 : 1.03);
        this.tweens.add({
            targets: target,
            angle: 0,
            scaleX: 1,
            scaleY: 1,
            duration: 140,
            ease: "Back.easeOut",
            onComplete: () => {
                if (target.active) {
                    target.clearTint();
                }
            },
        });
    }
    emitMiningChips(x, y, targetType, count) {
        const key = targetType === "tree" || targetType === "wall" ? "wood-chip" : "stone-chip";
        const baseAngle = this.facing.angle();
        for (let i = 0; i < count; i += 1) {
            const chip = this.add
                .image(x, y, key)
                .setDepth(18)
                .setScale(Phaser.Math.FloatBetween(0.72, 1.18))
                .setRotation(Phaser.Math.FloatBetween(0, Math.PI * 2));
            const angle = baseAngle + Math.PI + Phaser.Math.FloatBetween(-1.1, 1.1);
            const distance = Phaser.Math.Between(18, targetType === "tree" ? 52 : 42);
            this.tweens.add({
                targets: chip,
                x: x + Math.cos(angle) * distance,
                y: y + Math.sin(angle) * distance,
                alpha: 0,
                rotation: chip.rotation + Phaser.Math.FloatBetween(-2.4, 2.4),
                duration: Phaser.Math.Between(260, 430),
                ease: "Quad.easeOut",
                onComplete: () => chip.destroy(),
            });
        }
    }
    showBrokenMineable(x, y, targetType) {
        let key = "stone-rubble";
        let yOffset = 6;
        let depth = 5;
        if (targetType === "tree") {
            key = "tree-stump";
            yOffset = 10;
            depth = 6;
        }
        else if (targetType === "wall") {
            // reuse stone rubble for walls for a quick visual
            key = "stone-rubble";
            yOffset = 4;
            depth = 6;
        }
        const remnant = this.add
            .image(x, y + yOffset, key)
            .setDepth(depth)
            .setAlpha(0.95);
        this.tweens.add({
            targets: remnant,
            alpha: 0,
            scale: 1.08,
            duration: 1400,
            delay: 500,
            ease: "Sine.easeIn",
            onComplete: () => remnant.destroy(),
        });
    }
    updateToolSelection() {
        if (Phaser.Input.Keyboard.JustDown(this.keys.one)) {
            this.selectedTool = "sword";
        }
        if (Phaser.Input.Keyboard.JustDown(this.keys.two)) {
            this.selectedTool = "axe";
        }
        if (Phaser.Input.Keyboard.JustDown(this.keys.three)) {
            this.selectedTool = "pickaxe";
        }
        if (Phaser.Input.Keyboard.JustDown(this.keys.four)) {
            this.selectedTool = "build";
        }
        if (this.selectedTool === "build" && Phaser.Input.Keyboard.JustDown(this.keys.q)) {
            this.cycleBuildable();
        }
        if (this.selectedTool === "build" && Phaser.Input.Keyboard.JustDown(this.keys.e)) {
            this.cycleBuildable();
        }
    }
    tryPrimaryAction(time) {
        if (!this.primaryActionQueued) {
            return;
        }
        this.primaryActionQueued = false;
        if (this.selectedTool === "sword") {
            this.trySwordAttack(time);
            return;
        }
        if (this.selectedTool === "axe") {
            // Prefer hitting a wall if one is in range/aim, otherwise hit trees
            const wallTarget = this.findMineableTarget(this.walls);
            if (wallTarget) {
                this.tryMineTarget(time, this.walls, "wall");
            }
            else {
                this.tryMineTarget(time, this.trees, "tree");
            }
            return;
        }
        if (this.selectedTool === "pickaxe") {
            this.tryMineTarget(time, this.stones, "stone");
            return;
        }
        this.tryBuild(time, true);
    }
    cycleBuildable() {
        this.selectedBuildable =
            this.selectedBuildable === "wall" ? "generator" : "wall";
        this.showToast(`Build: ${BUILDABLES[this.selectedBuildable].label}`);
    }
    tryBuild(time, requested = false) {
        const keyboardRequested = Phaser.Input.Keyboard.JustDown(this.keys.b);
        if (!requested && !keyboardRequested) {
            return;
        }
        if (keyboardRequested && this.selectedTool !== "build") {
            this.selectedTool = "build";
        }
        if (time - this.lastBuildAt < BALANCE.buildCooldownMs) {
            return;
        }
        this.lastBuildAt = time;
        const buildable = BUILDABLES[this.selectedBuildable];
        if (!spendForBuildable(this.playerState, this.selectedBuildable)) {
            this.showToast(`Need ${buildable.cost} wood`);
            return;
        }
        const position = this.getBuildPosition();
        if (this.isBuildPositionBlocked(position.x, position.y)) {
            this.playerState.resources += buildable.cost;
            this.showToast("Blocked");
            return;
        }
        this.placeBuildable(position.x, position.y, this.selectedBuildable);
        this.popText(position.x, position.y - 28, `-${buildable.cost}`, "#ffe5a4");
    }
    getBuildPosition() {
        const rawX = this.player.x + this.facing.x * 72;
        const rawY = this.player.y + this.facing.y * 72;
        const snappedX = Phaser.Math.Snap.To(rawX, WORLD.wallSize);
        const snappedY = Phaser.Math.Snap.To(rawY, WORLD.wallSize);
        return new Phaser.Math.Vector2(Phaser.Math.Clamp(snappedX, WORLD.wallSize, WORLD.width - WORLD.wallSize), Phaser.Math.Clamp(snappedY, WORLD.wallSize, WORLD.height - WORLD.wallSize));
    }
    isBuildPositionBlocked(x, y) {
        const structures = [
            ...this.walls.children.entries,
            ...this.generators.children.entries,
            ...this.trees.children.entries,
            ...this.stones.children.entries,
        ];
        return structures.some((structure) => {
            return Phaser.Math.Distance.Between(x, y, structure.x, structure.y) < WORLD.wallSize;
        });
    }
    placeBuildable(x, y, buildableId) {
        if (buildableId === "wall") {
            const wall = this.walls.create(x, y, "wall");
            this.tagEntity(wall, "wall");
            wall.setDepth(9);
            wall.setData("hp", BUILDABLES.wall.hp);
            wall.refreshBody();
            return;
        }
        const generator = this.generators.create(x, y, "generator");
        this.tagEntity(generator, "generator");
        generator.setDepth(10);
        generator.setData("hp", BUILDABLES.generator.hp);
        generator.setData("nextResourceAt", this.time.now + BUILDABLES.generator.resourceIntervalMs);
        generator.setData("remainingTreeSpawns", BUILDABLES.generator.maxTreeSpawns);
        generator.refreshBody();
    }
    updateGenerators(time) {
        this.generators.children.each((child) => {
            const generator = child;
            if (!generator.active) {
                return true;
            }
            const nextResourceAt = generator.getData("nextResourceAt");
            const remainingTreeSpawns = generator.getData("remainingTreeSpawns") ?? 0;
            if (time < nextResourceAt || remainingTreeSpawns <= 0) {
                return true;
            }
            const spawnPoint = this.getGeneratorSpawnPoint(generator);
            this.spawnTree(spawnPoint.x, spawnPoint.y);
            generator.setData("remainingTreeSpawns", remainingTreeSpawns - 1);
            generator.setData("nextResourceAt", time + BUILDABLES.generator.resourceIntervalMs);
            this.popText(generator.x, generator.y - 34, "+tree", "#8fd169");
            return true;
        });
    }
    getGeneratorSpawnPoint(generator) {
        const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        const distance = Phaser.Math.Between(54, 78);
        return new Phaser.Math.Vector2(Phaser.Math.Clamp(generator.x + Math.cos(angle) * distance, WORLD.wallSize, WORLD.width - WORLD.wallSize), Phaser.Math.Clamp(generator.y + Math.sin(angle) * distance, WORLD.wallSize, WORLD.height - WORLD.wallSize));
    }
    updateBots(time) {
        this.bots.children.each((child) => {
            const bot = child;
            if (!bot.active || bot.getData("dead")) {
                return true;
            }
            // Ensure bot has progress
            const progress = bot.getData("progress") ?? createPlayerProgress();
            bot.setData("progress", progress);
            const selectedTool = this.pickBotTool(bot, progress);
            bot.setData("selectedTool", selectedTool);
            // --- Combat and tool actions ---
            const lastAttackAt = bot.getData("lastAttackAt") ?? -Infinity;
            const attackReady = time - lastAttackAt >= BALANCE.attackCooldownMs;
            if (selectedTool === "sword" && attackReady) {
                const botRange = getSwordRange(progress.swordLevelIndex);
                // Attack player if in range
                const distToPlayer = Phaser.Math.Distance.Between(bot.x, bot.y, this.player.x, this.player.y);
                if (distToPlayer <= botRange + WORLD.botRadius + this.playerRadius) {
                    bot.setData("lastAttackAt", time);
                    // show bot wielding sword briefly
                    bot.setData("equippedTool", "sword");
                    // clear equipped tool shortly after swinging
                    this.time.delayedCall(300, () => {
                        if (bot.active)
                            bot.setData("equippedTool", undefined);
                    });
                    this.damagePlayer(SWORD_DAMAGE);
                    this.popText(this.player.x, this.player.y - 28, `-${SWORD_DAMAGE}`, "#fff2b5");
                    if (this.playerState.hp <= 0) {
                        this.healBotAfterKill(bot);
                    }
                }
                // Attack nearest bot
                if (time - bot.getData("lastAttackAt") >= BALANCE.attackCooldownMs) {
                    this.bots.children.each((maybe) => {
                        const other = maybe;
                        if (other === bot || !other.active || other.getData("dead")) {
                            return true;
                        }
                        const d = Phaser.Math.Distance.Between(bot.x, bot.y, other.x, other.y);
                        if (d <= botRange + WORLD.botRadius * 2) {
                            bot.setData("lastAttackAt", time);
                            bot.setData("equippedTool", "sword");
                            const combat = other.getData("combat");
                            const died = applySwordHit(combat);
                            // Mark the victim as recently attacked so it will chase the attacker
                            other.setData("lastAttackedAt", time);
                            other.setData("agroTarget", bot);
                            other.setData("detAt", time + 4200);
                            // Make the victim steer toward its attacker immediately
                            other.setData("direction", new Phaser.Math.Vector2(bot.x - other.x, bot.y - other.y).normalize());
                            this.popText(other.x, other.y - 28, `-${SWORD_DAMAGE}`, "#fff2b5");
                            other.setTint(0xffffff);
                            this.time.delayedCall(90, () => {
                                if (other.active)
                                    other.clearTint();
                            });
                            // clear equipped tool after a short time so visuals don't stick
                            this.time.delayedCall(300, () => {
                                if (bot.active)
                                    bot.setData("equippedTool", undefined);
                            });
                            if (died) {
                                this.killBot(other, {
                                    progress,
                                    x: bot.x,
                                    y: bot.y,
                                });
                                this.healBotAfterKill(bot);
                                const prevIndex = progress.swordLevelIndex;
                                if (progress.swordLevelIndex > prevIndex) {
                                    this.applyBotLevelGrowth(bot, progress, prevIndex);
                                }
                            }
                            return false; // stop searching
                        }
                        return true;
                    });
                }
            }
            // --- Mining / Building decisions ---
            const retargetAt = bot.getData("retargetAt");
            if (time >= retargetAt) {
                if (selectedTool === "build") {
                    const direction = bot.getData("direction");
                    const rawX = bot.x + direction.x * 72;
                    const rawY = bot.y + direction.y * 72;
                    const snappedX = Phaser.Math.Snap.To(rawX, WORLD.wallSize);
                    const snappedY = Phaser.Math.Snap.To(rawY, WORLD.wallSize);
                    const buildX = Phaser.Math.Clamp(snappedX, WORLD.wallSize, WORLD.width - WORLD.wallSize);
                    const buildY = Phaser.Math.Clamp(snappedY, WORLD.wallSize, WORLD.height - WORLD.wallSize);
                    if (!this.isBuildPositionBlocked(buildX, buildY) && spendForBuildable(progress, "wall")) {
                        this.placeBuildable(buildX, buildY, "wall");
                        this.popText(buildX, buildY - 28, `-${BUILDABLES.wall.cost}`, "#ffe5a4");
                    }
                }
                bot.setData("direction", this.pickBotDirection(bot));
                bot.setData("retargetAt", time + Phaser.Math.Between(900, 2100));
            }
            if (selectedTool === "build") {
                // building bots don't mine on the same frame; they alternate like players do
            }
            else if (selectedTool === "axe") {
                this.tryBotMineTarget(time, bot, this.walls, "wall");
                this.tryBotMineTarget(time, bot, this.trees, "tree");
            }
            else if (selectedTool === "pickaxe") {
                this.tryBotMineTarget(time, bot, this.stones, "stone");
            }
            // Move according to current direction
            const direction = bot.getData("direction");
            bot.setVelocity(direction.x * WORLD.botSpeed, direction.y * WORLD.botSpeed);
            if (direction.lengthSq() > 0) {
                bot.setRotation(direction.angle());
            }
            // Update bot tool visual (follow bot)
            const botTool = bot.getData("toolSprite");
            const equipped = bot.getData("equippedTool");
            if (botTool) {
                if (selectedTool === "build") {
                    botTool.setVisible(false);
                }
                else if (equipped === "axe" || equipped === "pickaxe") {
                    const textureKey = equipped === "axe" ? "axe-tool" : "pickaxe-tool";
                    const angle = direction.angle() + (bot.getData("toolSwingOffset") ?? 0);
                    const scale = bot.scaleX ?? 1;
                    const baseX = bot.x + Math.cos(angle) * (WORLD.botRadius * scale - 6);
                    const baseY = bot.y + Math.sin(angle) * (WORLD.botRadius * scale - 6);
                    if (botTool.texture.key !== textureKey) {
                        botTool.setTexture(textureKey);
                    }
                    const baseW = 92;
                    const baseH = 50;
                    botTool
                        .setVisible(true)
                        .setPosition(baseX, baseY)
                        .setRotation(angle)
                        .setDisplaySize(Math.round(baseW * scale), Math.round(baseH * scale));
                }
                else {
                    botTool.setVisible(false);
                }
            }
            return true;
        });
    }
    pickBotDirection(bot) {
        const now = this.time.now;
        // helper: does moving along dir by lookahead put us outside safe zone?
        const willExitSafeZone = (dir, lookahead = 220) => {
            const fx = bot.x + dir.x * lookahead;
            const fy = bot.y + dir.y * lookahead;
            return isOutsideSafeZone(fx, fy, this.zoneCenter.x, this.zoneCenter.y, this.currentZoneRadius);
        };
        // 1) If bot has a temporary aggro target (set when attacked), prefer it
        const agro = bot.getData("agroTarget");
        const detAt = bot.getData("detAt") ?? 0;
        if (agro && now < detAt) {
            // agro === "player" or a reference to another bot (DynamicSprite)
            if (agro === "player") {
                const dir = new Phaser.Math.Vector2(this.player.x - bot.x, this.player.y - bot.y).normalize();
                // avoid charging out of the safe zone — fallback to moving inward
                if (willExitSafeZone(dir)) {
                    return this.zoneCenter.clone().subtract(new Phaser.Math.Vector2(bot.x, bot.y)).normalize();
                }
                return dir;
            }
            // If agro is an object (another bot), chase it if still valid
            if (agro && typeof agro.x === "number" && agro.active) {
                const target = agro;
                const dir = new Phaser.Math.Vector2(target.x - bot.x, target.y - bot.y).normalize();
                if (willExitSafeZone(dir)) {
                    return this.zoneCenter.clone().subtract(new Phaser.Math.Vector2(bot.x, bot.y)).normalize();
                }
                return dir;
            }
        }
        // 2) If outside safe zone, move back to center
        const outsideZone = isOutsideSafeZone(bot.x, bot.y, this.zoneCenter.x, this.zoneCenter.y, this.currentZoneRadius);
        if (outsideZone) {
            return this.zoneCenter.clone().subtract(new Phaser.Math.Vector2(bot.x, bot.y)).normalize();
        }
        // 3) Look for nearest threat (player or other bot) within detection radius and chase
        const detectionRadius = 600;
        let nearest = null;
        // player
        const pd = Phaser.Math.Distance.Between(bot.x, bot.y, this.player.x, this.player.y);
        if (pd <= detectionRadius) {
            nearest = { obj: this.player, d: pd };
        }
        // other bots
        this.bots.children.each((child) => {
            const other = child;
            if (!other.active || other.getData("dead") || other === bot)
                return true;
            const d = Phaser.Math.Distance.Between(bot.x, bot.y, other.x, other.y);
            if (d > detectionRadius)
                return true;
            if (!nearest || d < nearest.d)
                nearest = { obj: other, d };
            return true;
        });
        if (nearest) {
            const dir = new Phaser.Math.Vector2(nearest.obj.x - bot.x, nearest.obj.y - bot.y).normalize();
            // if chasing that target would take the bot outside the safe zone, instead move toward the zone center (safer)
            if (willExitSafeZone(dir)) {
                return this.zoneCenter.clone().subtract(new Phaser.Math.Vector2(bot.x, bot.y)).normalize();
            }
            return dir;
        }
        // 4) Slightly smarter player interest: if player is relatively close, chase but avoid suicide
        const playerDistance = Phaser.Math.Distance.Between(bot.x, bot.y, this.player.x, this.player.y);
        if (playerDistance < 390) {
            const dir = new Phaser.Math.Vector2(this.player.x - bot.x, this.player.y - bot.y).normalize();
            if (willExitSafeZone(dir)) {
                return this.zoneCenter.clone().subtract(new Phaser.Math.Vector2(bot.x, bot.y)).normalize();
            }
            return dir;
        }
        // 5) Default: random wander but bias away from leaving the safe zone
        for (let i = 0; i < 6; i += 1) {
            const candidate = Phaser.Math.RandomXY(new Phaser.Math.Vector2(), 1);
            if (!willExitSafeZone(candidate))
                return candidate;
        }
        // Fallback: move toward center
        return this.zoneCenter.clone().subtract(new Phaser.Math.Vector2(bot.x, bot.y)).normalize();
    }
    // Every death nudges the shrink timer backwards so the zone expands a little.
    // Capped at the current time so relief never grows the zone past its start.
    shiftZoneBackOnDeath() {
        if (this.zoneFrozen) {
            return;
        }
        this.zoneStartAt = Math.min(this.time.now, this.zoneStartAt + SAFE_ZONE.deathReliefMs);
    }
    updateSafeZone(time) {
        if (!this.zoneFrozen) {
            this.currentZoneRadius = calculateSafeZoneRadius(time - this.zoneStartAt);
        }
        this.safeZoneMaskGraphics.clear();
        this.safeZoneMaskGraphics.fillStyle(0xffffff, 1);
        this.safeZoneMaskGraphics.fillCircle(this.zoneCenter.x, this.zoneCenter.y, this.currentZoneRadius);
        this.dangerZoneOverlay.clear();
        this.dangerZoneOverlay.fillStyle(0xb92828, 0.28);
        this.dangerZoneOverlay.fillRect(0, 0, WORLD.width, WORLD.height);
        this.safeZoneGraphics.clear();
        this.safeZoneGraphics.lineStyle(8, 0xf8efb5, 0.95);
        this.safeZoneGraphics.strokeCircle(this.zoneCenter.x, this.zoneCenter.y, this.currentZoneRadius);
        this.safeZoneGraphics.lineStyle(2, 0x375e30, 0.8);
        this.safeZoneGraphics.strokeCircle(this.zoneCenter.x, this.zoneCenter.y, Math.max(8, this.currentZoneRadius - 10));
        if (time < this.nextZoneDamageAt) {
            return;
        }
        this.nextZoneDamageAt = time + BALANCE.zoneDamageIntervalMs;
        if (isOutsideSafeZone(this.player.x, this.player.y, this.zoneCenter.x, this.zoneCenter.y, this.currentZoneRadius)) {
            this.damagePlayer(BALANCE.zoneDamage);
        }
        this.bots.children.each((child) => {
            const bot = child;
            if (!bot.active || bot.getData("dead")) {
                return true;
            }
            if (isOutsideSafeZone(bot.x, bot.y, this.zoneCenter.x, this.zoneCenter.y, this.currentZoneRadius)) {
                const combat = bot.getData("combat");
                combat.hp = Math.max(0, combat.hp - BALANCE.zoneDamage);
                if (combat.hp <= 0) {
                    this.killBot(bot, null);
                }
            }
            return true;
        });
    }
    handleBotContact = () => {
        if (this.gameOver) {
            return;
        }
        const now = this.time.now;
        if (now - this.lastBotContactAt < BALANCE.botContactCooldownMs) {
            return;
        }
        this.lastBotContactAt = now;
        this.damagePlayer(BALANCE.botContactDamage);
    };
    damagePlayer(amount) {
        this.playerState.hp = Math.max(0, this.playerState.hp - amount);
        const combat = this.player.getData("combat");
        if (combat) {
            combat.hp = this.playerState.hp;
        }
        this.cameras.main.shake(100, 0.004);
        this.player.setTint(0xffffff);
        this.time.delayedCall(90, () => {
            if (this.player.active) {
                this.player.clearTint();
            }
        });
        if (this.playerState.hp <= 0) {
            this.endGame(false);
        }
    }
    healPlayerOnKill() {
        const combat = this.player.getData("combat");
        if (!combat) {
            return;
        }
        healCombatTarget(combat);
        this.playerState.hp = combat.hp;
        this.popText(this.player.x, this.player.y - 44, "+HP", "#9ff08a");
    }
    healBotAfterKill(bot) {
        const combat = bot.getData("combat");
        if (!combat) {
            return;
        }
        healCombatTarget(combat);
        this.popText(bot.x, bot.y - 44, "+HP", "#9ff08a");
    }
    collectXp = (_playerObject, xpObject) => {
        const orb = xpObject;
        const value = orb.getData("value");
        const previousRange = getSwordRange(this.playerState.swordLevelIndex);
        orb.destroy();
        applyXp(this.playerState, value);
        this.popText(this.player.x, this.player.y - 36, `+${value} XP`, "#ffe564");
        if (getSwordRange(this.playerState.swordLevelIndex) > previousRange) {
            this.applyLevelGrowth();
            this.popText(this.player.x, this.player.y - 56, "Range up", "#f9df68");
        }
    };
    drawHealthBars() {
        this.healthBars.clear();
        this.bots.children.each((child) => {
            const bot = child;
            if (!bot.active || bot.getData("dead")) {
                return true;
            }
            const combat = bot.getData("combat");
            const width = 46;
            const fillWidth = width * (combat.hp / combat.maxHp);
            const x = bot.x - width / 2;
            const y = bot.y - 38;
            this.healthBars.fillStyle(0x4d3527, 0.88);
            this.healthBars.fillRoundedRect(x, y, width, 8, 4);
            this.healthBars.fillStyle(0xf3d35e, 1);
            this.healthBars.fillRoundedRect(x + 2, y + 2, Math.max(0, fillWidth - 4), 4, 2);
            return true;
        });
    }
    drawAttackCooldownBar(time) {
        const width = 58;
        const height = 8;
        const x = this.player.x - width / 2;
        const y = this.player.y - this.playerRadius - 26;
        const healthY = y - 15;
        const healthRatio = Phaser.Math.Clamp(this.playerState.hp / PLAYER_MAX_HP, 0, 1);
        const remainingMs = Math.max(0, this.lastAttackAt + BALANCE.attackCooldownMs - time);
        const remainingRatio = Phaser.Math.Clamp(remainingMs / BALANCE.attackCooldownMs, 0, 1);
        const readyRatio = 1 - remainingRatio;
        const isReady = readyRatio === 1;
        this.cooldownBar.clear();
        this.cooldownBar.fillStyle(0x3c1f1d, 0.9);
        this.cooldownBar.fillRoundedRect(x, healthY, width, height, 4);
        this.cooldownBar.lineStyle(2, 0x24331f, 0.95);
        this.cooldownBar.strokeRoundedRect(x, healthY, width, height, 4);
        this.cooldownBar.fillStyle(0x74d26a, 1);
        this.cooldownBar.fillRoundedRect(x + 2, healthY + 2, Math.max(0, (width - 4) * healthRatio), height - 4, 3);
        this.cooldownBar.fillStyle(0x1e2b1a, 0.86);
        this.cooldownBar.fillRoundedRect(x, y, width, height, 4);
        this.cooldownBar.lineStyle(2, 0x24331f, 0.95);
        this.cooldownBar.strokeRoundedRect(x, y, width, height, 4);
        this.cooldownBar.fillStyle(isReady ? 0x8fd169 : 0xf3d35e, 1);
        this.cooldownBar.fillRoundedRect(x + 2, y + 2, Math.max(0, (width - 4) * readyRatio), height - 4, 3);
    }
    updateHud() {
        const sword = SWORD_LEVELS[this.playerState.swordLevelIndex];
        const nextLevel = SWORD_LEVELS[this.playerState.swordLevelIndex + 1];
        const xpLine = nextLevel
            ? `XP ${this.playerState.xp}/${nextLevel.xpRequired}`
            : `XP ${this.playerState.xp}/MAX`;
        this.hudLabels.setText(["XP", "Level", "Bots"].join("\n"));
        this.hudValues.setText([
            xpLine.replace("XP ", ""),
            `Lv ${sword.level}`,
            `${this.getRemainingBots()}`,
        ].join("\n"));
        this.updateResourceHud();
        this.updateHotbar();
    }
    updateHotbar() {
        const slots = [
            { id: "sword", label: "1\nSword" },
            { id: "axe", label: "2\nAxe" },
            { id: "pickaxe", label: "3\nPick" },
            { id: "build", label: "4\nBuild" },
        ];
        const slotWidth = 74;
        const slotHeight = 58;
        const gap = 10;
        const totalWidth = slots.length * slotWidth + (slots.length - 1) * gap;
        const startX = this.cameras.main.width / 2 - totalWidth / 2;
        const y = this.cameras.main.height - slotHeight - 18;
        this.hotbarPanel.clear();
        slots.forEach((slot, index) => {
            const x = startX + index * (slotWidth + gap);
            const selected = this.selectedTool === slot.id;
            this.hotbarPanel.fillStyle(selected ? 0x3f5e33 : 0x26351f, 0.9);
            this.hotbarPanel.fillRoundedRect(x, y, slotWidth, slotHeight, 8);
            this.hotbarPanel.lineStyle(2, selected ? 0xffe69a : 0x5f9745, 0.92);
            this.hotbarPanel.strokeRoundedRect(x, y, slotWidth, slotHeight, 8);
            this.hotbarTexts[index].setText(slot.label);
            this.hotbarTexts[index].setPosition(x + slotWidth / 2, y + slotHeight / 2);
            this.hotbarTexts[index].setColor(selected ? "#ffe69a" : "#fff3cf");
        });
        if (this.selectedTool !== "build") {
            this.buildMenuText.setText("");
            return;
        }
        const buildable = BUILDABLES[this.selectedBuildable];
        this.buildMenuText
            .setText(`Build: ${buildable.label} (${buildable.cost} wood)  Q/E`)
            .setPosition(this.cameras.main.width / 2, y - 22);
    }
    updateResourceHud() {
        const width = 198;
        const height = 122;
        const x = this.cameras.main.width - width - 14;
        const y = 14;
        this.resourcePanel.clear();
        this.resourcePanel.fillStyle(0x26351f, 0.86);
        this.resourcePanel.fillRoundedRect(x, y, width, height, 8);
        this.resourcePanel.lineStyle(2, 0xf3d35e, 0.78);
        this.resourcePanel.strokeRoundedRect(x, y, width, height, 8);
        this.resourcePanel.fillStyle(0x1a2518, 0.42);
        this.resourcePanel.fillRoundedRect(x + 8, y + 36, width - 16, height - 44, 6);
        this.resourceTitle.setPosition(x + 12, y + 9);
        this.resourceLabels.setPosition(x + 16, y + 48);
        this.resourceValues.setPosition(x + width - 16, y + 48);
        this.resourceLabels.setText(["Rocks", "Coins", "Wood"].join("\n"));
        this.resourceValues.setText([
            `${this.playerState.rocks}`,
            `${this.playerState.coins}`,
            `${this.playerState.resources}`,
        ].join("\n"));
    }
    getRemainingBots() {
        return this.bots.children.entries.filter((child) => {
            const bot = child;
            return bot.active && !bot.getData("dead");
        }).length;
    }
    popText(x, y, message, color) {
        const text = this.add
            .text(x, y, message, {
            fontFamily: "Arial, sans-serif",
            fontSize: "17px",
            color,
            stroke: "#24331f",
            strokeThickness: 4,
        })
            .setOrigin(0.5)
            .setDepth(40);
        this.tweens.add({
            targets: text,
            y: y - 32,
            alpha: 0,
            duration: 650,
            ease: "Quad.easeOut",
            onComplete: () => text.destroy(),
        });
    }
    showToast(message) {
        this.toast.setText(message).setAlpha(1);
        this.tweens.killTweensOf(this.toast);
        this.tweens.add({
            targets: this.toast,
            alpha: 0,
            duration: 900,
            ease: "Quad.easeOut",
        });
    }
    endGame(won) {
        if (this.gameOver) {
            return;
        }
        this.gameOver = true;
        this.zoneFrozen = true;
        this.player.setVelocity(0, 0);
        this.bots.setVelocity(0, 0);
        this.cooldownBar.clear();
        const centerX = this.cameras.main.width / 2;
        const centerY = this.cameras.main.height / 2;
        this.add
            .text(centerX, centerY - 34, won ? "VICTORY" : "DEFEAT", {
            fontFamily: "Arial, sans-serif",
            fontSize: "48px",
            color: won ? "#fff0a8" : "#ffd3c4",
            stroke: "#24331f",
            strokeThickness: 8,
        })
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(80);
        this.restartButton = this.add
            .text(centerX, centerY + 34, "Restart", {
            fontFamily: "Arial, sans-serif",
            fontSize: "24px",
            color: "#24331f",
            backgroundColor: "#f7de8a",
            padding: { x: 18, y: 10 },
        })
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(80)
            .setInteractive({ useHandCursor: true });
        this.restartButton.on("pointerdown", () => this.scene.restart());
    }
    tryRestart() {
        if (Phaser.Input.Keyboard.JustDown(this.keys.r)) {
            this.scene.restart();
        }
    }
}
