import * as Phaser from "phaser";
import "./styles.css";
import { GameScene } from "./scenes/GameScene";

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: "game",
  backgroundColor: "#8dc46a",
  physics: {
    default: "arcade",
    arcade: {
      debug: false,
      gravity: { x: 0, y: 0 },
    },
  },
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1280,
    height: 720,
  },
  scene: [GameScene],
};

let game: Phaser.Game | undefined;

const menu = document.getElementById("menu");
const form = document.getElementById("play-form") as HTMLFormElement | null;
const playButton = document.getElementById("play-btn") as HTMLButtonElement | null;
const nameInput = document.getElementById("name-input") as HTMLInputElement | null;
const launchStatus = document.getElementById("launch-status") as HTMLParagraphElement | null;

function setLaunchStatus(message = ""): void {
  if (launchStatus) {
    launchStatus.textContent = message;
  }
}

function destroyGame(): void {
  game?.destroy(true);
  game = undefined;
}

// Restore a previously used name so returning players see it.
if (nameInput) {
  nameInput.value = localStorage.getItem("evoroyale.name") ?? "";
  nameInput.focus();
  nameInput.select();
}

function startGame(): void {
  if (game) {
    destroyGame();
  }

  const playerName = nameInput?.value.trim() || "Player";
  localStorage.setItem("evoroyale.name", playerName);
  (window as unknown as { evoPlayerName?: string }).evoPlayerName = playerName;
  setLaunchStatus("");

  try {
    // Fade the menu out, then boot the game underneath it.
    menu?.classList.add("is-hiding");
    window.setTimeout(() => menu?.remove(), 400);

    game = new Phaser.Game(config);
  } catch (error) {
    game = undefined;
    menu?.classList.remove("is-hiding");
    setLaunchStatus(
      error instanceof Error ? error.message : "Unable to start the game.",
    );
    throw error;
  }
}

form?.addEventListener("submit", (event) => {
  event.preventDefault();
  startGame();
});

playButton?.addEventListener("click", (event) => {
  event.preventDefault();
  startGame();
});

(window as unknown as { startEvoRoyale?: () => void }).startEvoRoyale = startGame;
