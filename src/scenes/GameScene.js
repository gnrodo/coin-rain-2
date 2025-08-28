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
        // Celestial bodies
        this.celestialContainer = null;
        this.sun = null;
        this.moon = null;
    }
    
    create() {
        this.setupBackground();
        this.createCelestialBodies();
        this.createObjectPool();
        this.startSpawning();
        this.setupInput();
    }
    
    setupBackground() {
        const { gameWidth, gameHeight } = this.deviceManager.getDeviceInfo();
        
        // Create gradient background
        this.backgroundGraphics = this.add.graphics();
        this.backgroundGraphics.setDepth(0); // Ensure background is at the bottom
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
    
    createCelestialBodies() {
        const { gameWidth, gameHeight } = this.deviceManager.getDeviceInfo();
        const scaleFactor = this.deviceManager.scaleFactor;
        const safeArea = this.deviceManager.getSafeArea();
        
        // Create container for celestial bodies
        this.celestialContainer = this.add.container(0, 0);
        this.celestialContainer.setDepth(1); // Above background but behind falling objects
        
        // Create Sun
        this.createSun(safeArea.right - 80 * scaleFactor, safeArea.top + 80 * scaleFactor, scaleFactor);
        
        // Create Moon
        this.createMoon(safeArea.left + 80 * scaleFactor, safeArea.top + 80 * scaleFactor, scaleFactor);
        
        // Initially show sun, hide moon
        this.sun.setAlpha(1);
        this.moon.setAlpha(0);
        this.moon.setY(this.moon.y - 200 * scaleFactor); // Position moon above screen
    }
    
    createSun(x, y, scaleFactor) {
        const sunContainer = this.add.container(x, y);
        const radius = 40 * scaleFactor;
        
        // Sun body with gradient
        const sunBody = this.add.graphics();
        
        // Create radial gradient effect
        for (let i = radius; i > 0; i--) {
            const progress = 1 - (i / radius);
            const color = Phaser.Display.Color.Interpolate.ColorWithColor(
                { r: 255, g: 215, b: 0 },  // Gold center
                { r: 255, g: 165, b: 0 },  // Orange edge
                1, progress
            );
            sunBody.fillStyle(Phaser.Display.Color.GetColor(color.r, color.g, color.b), 1);
            sunBody.fillCircle(0, 0, i);
        }
        
        // Create sun rays
        const raysContainer = this.add.container(0, 0);
        const numRays = 12;
        
        for (let i = 0; i < numRays; i++) {
            const angle = (Math.PI * 2 / numRays) * i;
            const ray = this.add.graphics();
            
            // Draw triangular ray
            ray.fillStyle(0xFFD700, 0.8);
            ray.beginPath();
            ray.moveTo(0, 0);
            
            const rayLength = radius * 1.8;
            const rayWidth = radius * 0.3;
            
            const x1 = Math.cos(angle - 0.1) * radius;
            const y1 = Math.sin(angle - 0.1) * radius;
            const x2 = Math.cos(angle + 0.1) * radius;
            const y2 = Math.sin(angle + 0.1) * radius;
            const x3 = Math.cos(angle) * rayLength;
            const y3 = Math.sin(angle) * rayLength;
            
            ray.lineTo(x1, y1);
            ray.lineTo(x3, y3);
            ray.lineTo(x2, y2);
            ray.closePath();
            ray.fillPath();
            
            raysContainer.add(ray);
        }
        
        sunContainer.add(raysContainer);
        sunContainer.add(sunBody);
        
        // Add slow rotation animation to rays
        this.tweens.add({
            targets: raysContainer,
            rotation: Math.PI * 2,
            duration: 60000,
            repeat: -1,
            ease: 'Linear'
        });
        
        // Add subtle pulsing animation
        this.tweens.add({
            targets: sunContainer,
            scale: { from: 1, to: 1.1 },
            duration: 3000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        this.celestialContainer.add(sunContainer);
        this.sun = sunContainer;
    }
    
    createMoon(x, y, scaleFactor) {
        const moonContainer = this.add.container(x, y);
        const radius = 35 * scaleFactor;
        
        // Moon body
        const moonBody = this.add.graphics();
        
        // Create moon with gradient
        for (let i = radius; i > 0; i--) {
            const progress = 1 - (i / radius);
            const color = Phaser.Display.Color.Interpolate.ColorWithColor(
                { r: 240, g: 240, b: 240 },  // Light silver
                { r: 200, g: 200, b: 220 },  // Bluish silver edge
                1, progress * 0.5
            );
            moonBody.fillStyle(Phaser.Display.Color.GetColor(color.r, color.g, color.b), 1);
            moonBody.fillCircle(0, 0, i);
        }
        
        // Add craters
        const numCraters = 5;
        for (let i = 0; i < numCraters; i++) {
            const craterX = Phaser.Math.Between(-radius * 0.5, radius * 0.5);
            const craterY = Phaser.Math.Between(-radius * 0.5, radius * 0.5);
            const craterRadius = Phaser.Math.Between(3, 8) * scaleFactor;
            
            moonBody.fillStyle(0xC0C0C0, 0.3);
            moonBody.fillCircle(craterX, craterY, craterRadius);
        }
        
        // Create moon glow
        const glowGraphics = this.add.graphics();
        glowGraphics.fillStyle(0xB0C4DE, 0.3);
        for (let i = 0; i < 3; i++) {
            glowGraphics.fillCircle(0, 0, radius + (i * 10 * scaleFactor));
            glowGraphics.setAlpha(0.3 - (i * 0.1));
        }
        
        moonContainer.add(glowGraphics);
        moonContainer.add(moonBody);
        
        // Add glow pulsing animation
        this.tweens.add({
            targets: glowGraphics,
            alpha: { from: 0.3, to: 0.6 },
            duration: 4000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        // Add subtle floating animation
        this.tweens.add({
            targets: moonContainer,
            y: y + 10 * scaleFactor,
            duration: 5000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        this.celestialContainer.add(moonContainer);
        this.moon = moonContainer;
    }
    
    animateCelestialTransition(isNight) {
        const scaleFactor = this.deviceManager.scaleFactor;
        const { gameHeight } = this.deviceManager.getDeviceInfo();
        
        if (isNight) {
            // Transition to night: sun goes down, moon comes up
            this.tweens.add({
                targets: this.sun,
                y: gameHeight + 100,
                alpha: 0,
                duration: 500,
                ease: 'Cubic.easeIn'
            });
            
            this.tweens.add({
                targets: this.moon,
                y: this.deviceManager.getSafeArea().top + 80 * scaleFactor,
                alpha: 1,
                duration: 500,
                ease: 'Cubic.easeOut',
                delay: 250
            });
        } else {
            // Transition to day: moon goes down, sun comes up
            this.tweens.add({
                targets: this.moon,
                y: gameHeight + 100,
                alpha: 0,
                duration: 500,
                ease: 'Cubic.easeIn'
            });
            
            this.tweens.add({
                targets: this.sun,
                y: this.deviceManager.getSafeArea().top + 80 * scaleFactor,
                alpha: 1,
                duration: 500,
                ease: 'Cubic.easeOut',
                delay: 250
            });
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
        
        // Animate background change and celestial transition
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
        
        // Animate celestial transition
        this.animateCelestialTransition(true);
        
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
        
        // Animate celestial transition back to day
        this.animateCelestialTransition(false);
        
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
        // Update device manager info
        this.deviceManager.calculateGameDimensions();
        const newScaleFactor = this.deviceManager.scaleFactor;
        const safeArea = this.deviceManager.getSafeArea();
        
        // Update camera bounds
        this.cameras.main.setSize(deviceInfo.gameWidth, deviceInfo.gameHeight);
        
        // Update background
        this.updateBackground(this.isNightMode);
        
        // Reposition celestial bodies
        if (this.sun && this.moon) {
            // Update sun position
            this.sun.setPosition(
                safeArea.right - 80 * newScaleFactor,
                this.isNightMode ? deviceInfo.gameHeight + 100 : safeArea.top + 80 * newScaleFactor
            );
            
            // Update moon position
            this.moon.setPosition(
                safeArea.left + 80 * newScaleFactor,
                this.isNightMode ? safeArea.top + 80 * newScaleFactor : -200 * newScaleFactor
            );
            
            // Update scale of celestial bodies
            this.sun.setScale(newScaleFactor / this.deviceManager.scaleFactor * this.sun.scale);
            this.moon.setScale(newScaleFactor / this.deviceManager.scaleFactor * this.moon.scale);
        }
        
        // Update active falling objects
        this.objectPool.forEach(obj => {
            if (obj.active) {
                // Maintain relative position
                const relativeX = obj.x / this.cameras.main.width;
                const relativeY = obj.y / this.cameras.main.height;
                
                // Update position based on new dimensions
                obj.setPosition(
                    relativeX * deviceInfo.gameWidth,
                    relativeY * deviceInfo.gameHeight
                );
                
                // Update scale
                obj.setScale(newScaleFactor * 0.8);
            }
        });
        
        // Update spawn area boundaries for future spawns
        if (this.spawnTimer) {
            // Timer continues with updated boundaries (handled in spawnObject method)
        }
    }
}