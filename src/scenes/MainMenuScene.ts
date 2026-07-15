import * as Phaser from "phaser";

export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super("MainMenu");
  }

  create(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Background
    this.cameras.main.setBackgroundColor("#8dc46a");

    // Title
    const title = this.add.text(width / 2, height / 2 - 120, "EvoRoyale", {
      fontSize: "64px",
      fontFamily: "Arial",
      color: "#ffffff",
      fontStyle: "bold",
    });
    title.setOrigin(0.5, 0.5);

    // Subtitle
    const subtitle = this.add.text(width / 2, height / 2 - 40, "Survival Royale with AI", {
      fontSize: "24px",
      fontFamily: "Arial",
      color: "#f5f5dc",
    });
    subtitle.setOrigin(0.5, 0.5);

    // Play Button
    const playButtonBg = this.add.rectangle(width / 2, height / 2 + 60, 200, 60, 0x54d18a);
    const playButtonText = this.add.text(width / 2, height / 2 + 60, "Play", {
      fontSize: "32px",
      fontFamily: "Arial",
      color: "#000000",
      fontStyle: "bold",
    });
    playButtonText.setOrigin(0.5, 0.5);

    // Make button interactive
    playButtonBg.setInteractive({ useHandCursor: true });
    playButtonBg.on("pointerover", () => {
      playButtonBg.setFillStyle(0x7dde9b);
    });
    playButtonBg.on("pointerout", () => {
      playButtonBg.setFillStyle(0x54d18a);
    });
    playButtonBg.on("pointerdown", () => {
      this.scene.start("GameScene");
    });

    // Instructions
    const instructions = this.add.text(width / 2, height / 2 + 160, 
      "WASD: Move | Mouse: Aim | Click: Attack | E: Mine | Q: Build", {
      fontSize: "14px",
      fontFamily: "Arial",
      color: "#cccccc",
    });
    instructions.setOrigin(0.5, 0.5);
  }
}
