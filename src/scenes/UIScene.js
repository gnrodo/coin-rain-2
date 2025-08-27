import { getDeviceManager } from '../systems/DeviceManager.js';
import { GAME_CONSTANTS } from '../config/GameConfig.js';

export class UIScene extends Phaser.Scene {
    constructor() {
        super({ key: 'UIScene' });
        this.deviceManager = getDeviceManager();
        this.score = 0;
        this.lives = GAME_CONSTANTS.GAME_MECHANICS.INITIAL_LIVES;
        this.streak = 0;
        this.isBonusMode = false;
    }
    
    create() {
        this.setupUI();
        this.setupEventListeners();
    }
    
    setupUI() {
        const safeArea = this.deviceManager.getSafeArea();
        const scaleFactor = this.deviceManager.scaleFactor;
        
        // Score display
        this.scoreText = this.add.text(safeArea.left + 10, safeArea.top + 10, 'Puntos: 0', {
            font: `bold ${24 * scaleFactor}px Arial`,
            color: '#FFFFFF',
            stroke: '#000000',
            strokeThickness: 3
        });
        this.scoreText.setDepth(GAME_CONSTANTS.UI.Z_INDEXES.UI);
        
        // Lives display
        this.livesContainer = this.add.container(safeArea.right - 120 * scaleFactor, safeArea.top + 10);
        this.livesHearts = [];
        this.updateLivesDisplay();
        
        // Streak display
        this.streakText = this.add.text(safeArea.left + 10, safeArea.top + 50, 'Racha: 0', {
            font: `${20 * scaleFactor}px Arial`,
            color: '#FFD700',
            stroke: '#000000',
            strokeThickness: 2
        });
        this.streakText.setDepth(GAME_CONSTANTS.UI.Z_INDEXES.UI);
        
        // Multiplier display (hidden initially)
        this.multiplierText = this.add.text(safeArea.left + 10, safeArea.top + 85, 'x5', {
            font: `bold ${28 * scaleFactor}px Arial`,
            color: '#FF00FF',
            stroke: '#000000',
            strokeThickness: 3
        });
        this.multiplierText.setDepth(GAME_CONSTANTS.UI.Z_INDEXES.UI);
        this.multiplierText.setVisible(false);
        
        // Bonus mode indicator
        this.bonusIndicator = this.add.container(this.cameras.main.centerX, safeArea.top + 50);
        const bonusBg = this.add.rectangle(0, 0, 200 * scaleFactor, 40 * scaleFactor, 0x4B0082, 0.8);
        bonusBg.setStrokeStyle(2, 0xFFD700);
        const bonusText = this.add.text(0, 0, 'MODO BONUS', {
            font: `bold ${18 * scaleFactor}px Arial`,
            color: '#FFD700'
        });
        bonusText.setOrigin(0.5);
        this.bonusIndicator.add([bonusBg, bonusText]);
        this.bonusIndicator.setDepth(GAME_CONSTANTS.UI.Z_INDEXES.UI);
        this.bonusIndicator.setVisible(false);
    }
    
    updateLivesDisplay() {
        // Clear existing hearts
        this.livesHearts.forEach(heart => heart.destroy());
        this.livesHearts = [];
        
        const scaleFactor = this.deviceManager.scaleFactor;
        
        // Create hearts for remaining lives
        for (let i = 0; i < this.lives; i++) {
            const heart = this.add.text(-i * 35 * scaleFactor, 0, '❤️', {
                font: `${28 * scaleFactor}px Arial`
            });
            heart.setOrigin(0.5);
            this.livesContainer.add(heart);
            this.livesHearts.push(heart);
        }
        
        // Add empty hearts for lost lives
        for (let i = this.lives; i < GAME_CONSTANTS.GAME_MECHANICS.INITIAL_LIVES; i++) {
            const emptyHeart = this.add.text(-i * 35 * scaleFactor, 0, '🖤', {
                font: `${28 * scaleFactor}px Arial`
            });
            emptyHeart.setOrigin(0.5);
            emptyHeart.setAlpha(0.5);
            this.livesContainer.add(emptyHeart);
            this.livesHearts.push(emptyHeart);
        }
    }
    
    setupEventListeners() {
        const gameScene = this.scene.get('GameScene');
        
        gameScene.events.on('updateScore', (score) => {
            this.score = score;
            this.scoreText.setText(`Puntos: ${score}`);
            
            // Animate score change
            this.tweens.add({
                targets: this.scoreText,
                scale: 1.2,
                duration: 100,
                yoyo: true
            });
        });
        
        gameScene.events.on('updateLives', (lives) => {
            this.lives = lives;
            this.updateLivesDisplay();
            
            // Animate hearts
            if (lives < GAME_CONSTANTS.GAME_MECHANICS.INITIAL_LIVES) {
                this.cameras.main.flash(200, 255, 0, 0, false);
            }
        });
        
        gameScene.events.on('updateStreak', (streak) => {
            this.streak = streak;
            this.streakText.setText(`Racha: ${streak}`);
            
            // Highlight streak when close to bonus
            if (streak === GAME_CONSTANTS.GAME_MECHANICS.STREAK_BONUS_THRESHOLD - 1) {
                this.streakText.setColor('#FFFF00');
                this.tweens.add({
                    targets: this.streakText,
                    scale: 1.1,
                    duration: 500,
                    yoyo: true,
                    repeat: -1
                });
            } else if (streak === 0) {
                this.streakText.setColor('#FFD700');
                this.tweens.killTweensOf(this.streakText);
                this.streakText.setScale(1);
            }
        });
        
        gameScene.events.on('bonusModeActivated', () => {
            this.isBonusMode = true;
            this.multiplierText.setVisible(true);
            this.bonusIndicator.setVisible(true);
            
            // Animate bonus mode UI
            this.tweens.add({
                targets: [this.multiplierText, this.bonusIndicator],
                scale: 1.1,
                duration: 500,
                yoyo: true,
                repeat: -1
            });
            
            // Change UI colors for night mode
            this.scoreText.setColor('#FFD700');
        });
        
        gameScene.events.on('bonusModeDeactivated', () => {
            this.isBonusMode = false;
            this.multiplierText.setVisible(false);
            this.bonusIndicator.setVisible(false);
            
            // Stop animations
            this.tweens.killTweensOf([this.multiplierText, this.bonusIndicator]);
            
            // Reset UI colors
            this.scoreText.setColor('#FFFFFF');
        });
    }
    
    handleDeviceChange(deviceInfo) {
        // Reposition UI elements based on new safe area
        const safeArea = this.deviceManager.getSafeArea();
        const scaleFactor = this.deviceManager.scaleFactor;
        
        this.scoreText.setPosition(safeArea.left + 10, safeArea.top + 10);
        this.scoreText.setFontSize(24 * scaleFactor);
        
        this.livesContainer.setPosition(safeArea.right - 120 * scaleFactor, safeArea.top + 10);
        
        this.streakText.setPosition(safeArea.left + 10, safeArea.top + 50);
        this.streakText.setFontSize(20 * scaleFactor);
        
        this.multiplierText.setPosition(safeArea.left + 10, safeArea.top + 85);
        this.multiplierText.setFontSize(28 * scaleFactor);
        
        this.bonusIndicator.setPosition(this.cameras.main.centerX, safeArea.top + 50);
        
        this.updateLivesDisplay();
    }
}