import { getDeviceManager } from '../systems/DeviceManager.js';
import { GAME_CONSTANTS } from '../config/GameConfig.js';
import { FallingObject } from '../entities/FallingObject.js';

export class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        this.deviceManager = getDeviceManager();
        this.objectPool = [];
        this.spawnTimer = null;
        this.currentSpawnRate = GAME_CONSTANTS.GAME_MECHANICS.INITIAL_SPAWN_RATE;
        this.isNightMode = false;
        this.streak = 0;
        this.score = 0;
        this.lives = GAME_CONSTANTS.GAME_MECHANICS.INITIAL_LIVES;
        this.multiplier = 1;
    }
    
    create() {
        this.setupBackground();
        this.createObjectPool();
        this.startSpawning();
        this.setupInput();
    }
    
    setupBackground() {
        const { gameWidth, gameHeight } = this.deviceManager.getDeviceInfo();
        
        // Create gradient background
        this.backgroundGraphics = this.add.graphics();
        this.updateBackground(false);
    }
    
    updateBackground(night = false) {
        const { gameWidth, gameHeight } = this.deviceManager.getDeviceInfo();
        const colors = night ? 
            GAME_CONSTANTS.VISUALS.NIGHT_BACKGROUND : 
            GAME_CONSTANTS.VISUALS.DAY_BACKGROUND;
        
        this.backgroundGraphics.clear();
        
        // Create gradient effect
        const color1 = Phaser.Display.Color.HexStringToColor(colors[0]);
        const color2 = Phaser.Display.Color.HexStringToColor(colors[1]);
        
        for (let i = 0; i < 100; i++) {
            const color = Phaser.Display.Color.Interpolate.ColorWithColor(
                color1, color2, 100, i
            );
            const hex = Phaser.Display.Color.GetColor(color.r, color.g, color.b);
            this.backgroundGraphics.fillStyle(hex, 1);
            this.backgroundGraphics.fillRect(0, (gameHeight / 100) * i, gameWidth, gameHeight / 100 + 1);
        }
        
        // Add stars for night mode
        if (night) {
            for (let i = 0; i < 50; i++) {
                const x = Phaser.Math.Between(0, gameWidth);
                const y = Phaser.Math.Between(0, gameHeight / 2);
                const size = Phaser.Math.Between(1, 3);
                const alpha = Phaser.Math.FloatBetween(0.3, 1);
                
                this.backgroundGraphics.fillStyle(0xffffff, alpha);
                this.backgroundGraphics.fillCircle(x, y, size);
            }
        }
    }
    
    createObjectPool() {
        const poolSize = 20;
        for (let i = 0; i < poolSize; i++) {
            const obj = new FallingObject(this, 0, 0);
            obj.setActive(false);
            obj.setVisible(false);
            this.objectPool.push(obj);
        }
    }
    
    startSpawning() {
        this.spawnTimer = this.time.addEvent({
            delay: this.currentSpawnRate,
            callback: this.spawnObject,
            callbackScope: this,
            loop: true
        });
    }
    
    spawnObject() {
        const inactiveObject = this.objectPool.find(obj => !obj.active);
        if (!inactiveObject) return;
        
        const { gameWidth } = this.deviceManager.getDeviceInfo();
        const safeArea = this.deviceManager.getSafeArea();
        
        // Random x position within safe area
        const x = Phaser.Math.Between(safeArea.left + 50, safeArea.right - 50);
        const y = -50;
        
        // Determine object type based on probabilities
        const random = Math.random();
        let cumulativeProbability = 0;
        let selectedType = null;
        let selectedConfig = null;
        
        // First check if it's a bomb
        if (random < GAME_CONSTANTS.BOMB.probability) {
            selectedType = 'bomb';
            selectedConfig = GAME_CONSTANTS.BOMB;
        } else {
            // It's a coin, determine which type
            const coinRandom = Math.random();
            let coinCumulative = 0;
            
            for (const [key, config] of Object.entries(GAME_CONSTANTS.COINS)) {
                coinCumulative += config.probability;
                if (coinRandom <= coinCumulative) {
                    selectedType = key;
                    selectedConfig = config;
                    break;
                }
            }
        }
        
        inactiveObject.spawn(x, y, selectedType, selectedConfig);
    }
    
    setupInput() {
        // Input is handled directly on objects
    }
    
    handleCoinClick(coin) {
        // Update score
        const points = coin.value * this.multiplier;
        this.score += points;
        
        // Update streak
        this.streak++;
        
        // Check for bonus mode activation
        if (this.streak >= GAME_CONSTANTS.GAME_MECHANICS.STREAK_BONUS_THRESHOLD && !this.isNightMode) {
            this.activateNightMode();
        }
        
        // Show floating text
        this.showFloatingText(coin.x, coin.y, `+${points}`, 0xFFD700);
        
        // Create particle effect
        this.createCoinParticles(coin.x, coin.y);
        
        // Update UI
        this.events.emit('updateScore', this.score);
        this.events.emit('updateStreak', this.streak);
        
        // Increase difficulty slightly
        if (this.currentSpawnRate > GAME_CONSTANTS.GAME_MECHANICS.MIN_SPAWN_RATE) {
            this.currentSpawnRate -= 10;
            this.spawnTimer.delay = this.currentSpawnRate;
        }
    }
    
    handleBombClick(bomb) {
        // Lose a life
        this.lives--;
        
        // Reset streak
        this.streak = 0;
        
        // Deactivate night mode if active
        if (this.isNightMode) {
            this.deactivateNightMode();
        }
        
        // Visual feedback
        bomb.explode();
        this.cameras.main.shake(200, 0.02);
        this.showFloatingText(bomb.x, bomb.y, '-1 VIDA', 0xFF0000);
        
        // Update UI
        this.events.emit('updateLives', this.lives);
        this.events.emit('updateStreak', this.streak);
        
        // Check game over
        if (this.lives <= 0) {
            this.gameOver();
        }
    }
    
    activateNightMode() {
        this.isNightMode = true;
        this.multiplier = GAME_CONSTANTS.GAME_MECHANICS.NIGHT_MODE_MULTIPLIER;
        
        // Animate background change
        this.tweens.add({
            targets: this.backgroundGraphics,
            alpha: 0,
            duration: 500,
            onComplete: () => {
                this.updateBackground(true);
                this.tweens.add({
                    targets: this.backgroundGraphics,
                    alpha: 1,
                    duration: 500
                });
            }
        });
        
        // Show bonus message
        this.showBonusMessage('¡MODO BONUS X5 ACTIVADO!');
        this.events.emit('bonusModeActivated');
    }
    
    deactivateNightMode() {
        this.isNightMode = false;
        this.multiplier = 1;
        
        // Animate background change
        this.tweens.add({
            targets: this.backgroundGraphics,
            alpha: 0,
            duration: 500,
            onComplete: () => {
                this.updateBackground(false);
                this.tweens.add({
                    targets: this.backgroundGraphics,
                    alpha: 1,
                    duration: 500
                });
            }
        });
        
        this.events.emit('bonusModeDeactivated');
    }
    
    showFloatingText(x, y, text, color) {
        const floatingText = this.add.text(x, y, text, {
            font: `bold ${24 * this.deviceManager.scaleFactor}px Arial`,
            color: `#${color.toString(16).padStart(6, '0')}`
        });
        floatingText.setOrigin(0.5);
        floatingText.setDepth(GAME_CONSTANTS.UI.Z_INDEXES.FLOATING_TEXT);
        
        this.tweens.add({
            targets: floatingText,
            y: y - 50,
            alpha: 0,
            duration: 1000,
            onComplete: () => floatingText.destroy()
        });
    }
    
    showBonusMessage(text) {
        const { gameWidth, gameHeight } = this.deviceManager.getDeviceInfo();
        const message = this.add.text(gameWidth / 2, gameHeight / 2, text, {
            font: `bold ${36 * this.deviceManager.scaleFactor}px Arial`,
            color: '#FFD700',
            stroke: '#000000',
            strokeThickness: 4
        });
        message.setOrigin(0.5);
        message.setDepth(GAME_CONSTANTS.UI.Z_INDEXES.UI + 10);
        message.setScale(0);
        
        this.tweens.add({
            targets: message,
            scale: 1,
            duration: 500,
            ease: 'Back.easeOut',
            hold: 1000,
            yoyo: true,
            onComplete: () => message.destroy()
        });
    }
    
    createCoinParticles(x, y) {
        const particles = [];
        const colors = GAME_CONSTANTS.VISUALS.PARTICLE_COLORS.COIN;
        
        for (let i = 0; i < 10; i++) {
            const particle = this.add.circle(x, y, 3, colors[i % colors.length]);
            particle.setDepth(GAME_CONSTANTS.UI.Z_INDEXES.PARTICLES);
            particles.push(particle);
            
            const angle = (Math.PI * 2 / 10) * i;
            const distance = Phaser.Math.Between(30, 60);
            
            this.tweens.add({
                targets: particle,
                x: x + Math.cos(angle) * distance,
                y: y + Math.sin(angle) * distance,
                alpha: 0,
                scale: 0,
                duration: 500,
                onComplete: () => particle.destroy()
            });
        }
    }
    
    gameOver() {
        // Stop spawning
        if (this.spawnTimer) {
            this.spawnTimer.destroy();
        }
        
        // Deactivate all objects
        this.objectPool.forEach(obj => obj.deactivate());
        
        // Show game over message
        const { gameWidth, gameHeight } = this.deviceManager.getDeviceInfo();
        
        const overlay = this.add.rectangle(0, 0, gameWidth, gameHeight, 0x000000, 0.7);
        overlay.setOrigin(0);
        overlay.setDepth(1000);
        
        const gameOverText = this.add.text(gameWidth / 2, gameHeight / 2 - 50, 'GAME OVER', {
            font: `bold ${48 * this.deviceManager.scaleFactor}px Arial`,
            color: '#FF0000'
        });
        gameOverText.setOrigin(0.5);
        gameOverText.setDepth(1001);
        
        const scoreText = this.add.text(gameWidth / 2, gameHeight / 2 + 20, `Puntuación Final: ${this.score}`, {
            font: `bold ${32 * this.deviceManager.scaleFactor}px Arial`,
            color: '#FFFFFF'
        });
        scoreText.setOrigin(0.5);
        scoreText.setDepth(1001);
        
        const restartButton = this.add.text(gameWidth / 2, gameHeight / 2 + 100, 'REINICIAR', {
            font: `bold ${28 * this.deviceManager.scaleFactor}px Arial`,
            color: '#00FF00',
            backgroundColor: '#000000',
            padding: { x: 20, y: 10 }
        });
        restartButton.setOrigin(0.5);
        restartButton.setDepth(1001);
        restartButton.setInteractive();
        
        restartButton.on('pointerdown', () => {
            this.scene.restart();
            this.scene.restart('UIScene');
        });
    }
    
    update() {
        // Update active objects
        this.objectPool.forEach(obj => {
            if (obj.active) {
                obj.update();
            }
        });
    }
    
    handleDeviceChange(deviceInfo) {
        // Resize game elements based on new device info
        this.cameras.main.setSize(deviceInfo.gameWidth, deviceInfo.gameHeight);
        this.updateBackground(this.isNightMode);
    }
}