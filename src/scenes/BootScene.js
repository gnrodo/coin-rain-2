import { getDeviceManager } from '../systems/DeviceManager.js';
import { GAME_CONSTANTS } from '../config/GameConfig.js';

export class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
        this.deviceManager = getDeviceManager();
    }
    
    preload() {
        // Hide HTML loader
        const loader = document.getElementById('loader');
        if (loader) {
            loader.style.display = 'none';
        }
        
        // Since we're using geometric shapes, we don't need to load external assets
        // We'll create everything programmatically
        
        // Create loading bar
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        const progressBar = this.add.graphics();
        const progressBox = this.add.graphics();
        progressBox.fillStyle(0xffffff, 0.3);
        progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50);
        
        const loadingText = this.make.text({
            x: width / 2,
            y: height / 2 - 50,
            text: 'Iniciando juego...',
            style: {
                font: '20px monospace',
                color: '#ffffff'
            }
        });
        loadingText.setOrigin(0.5, 0.5);
        
        const percentText = this.make.text({
            x: width / 2,
            y: height / 2,
            text: '0%',
            style: {
                font: '18px monospace',
                color: '#ffffff'
            }
        });
        percentText.setOrigin(0.5, 0.5);
        
        // Simulate loading for demonstration (since we have no external assets)
        let progress = 0;
        const loadInterval = setInterval(() => {
            progress += 0.1;
            if (progress > 1) progress = 1;
            
            progressBar.clear();
            progressBar.fillStyle(0xffffff, 1);
            progressBar.fillRect(width / 2 - 150, height / 2 - 15, 300 * progress, 30);
            
            percentText.setText(parseInt(progress * 100) + '%');
            
            if (progress >= 1) {
                clearInterval(loadInterval);
                this.initializeGame();
            }
        }, 50);
    }
    
    create() {
        // Setup device change listener
        window.addEventListener('devicechange', (event) => {
            this.handleDeviceChange(event.detail);
        });
        
        // Log device info for debugging
        console.log('Device Info:', this.deviceManager.getDeviceInfo());
    }
    
    initializeGame() {
        // Initialize game systems before starting
        this.createGraphicsAssets();
        
        // Wait a moment then start the game
        this.time.delayedCall(500, () => {
            this.scene.start('GameScene');
            this.scene.start('UIScene');
        });
    }
    
    createGraphicsAssets() {
        // Create texture atlas for coins and bombs using graphics
        const graphics = this.add.graphics();
        
        // Create coin textures
        Object.entries(GAME_CONSTANTS.COINS).forEach(([key, config]) => {
            const textureKey = `coin_${key.toLowerCase()}`;
            const size = config.size;
            
            // Create render texture
            const renderTexture = this.add.renderTexture(0, 0, size * 2, size * 2);
            renderTexture.setVisible(false);
            
            // Draw coin
            graphics.clear();
            graphics.fillStyle(config.color, 1);
            graphics.fillCircle(size, size, size);
            graphics.fillStyle(0xffffff, 0.3);
            graphics.fillCircle(size - size/4, size - size/4, size/3);
            
            // Draw to render texture
            renderTexture.draw(graphics, 0, 0);
            renderTexture.saveTexture(textureKey);
        });
        
        // Create bomb texture
        const bombSize = GAME_CONSTANTS.BOMB.size;
        const bombTexture = this.add.renderTexture(0, 0, bombSize * 2, bombSize * 2);
        bombTexture.setVisible(false);
        
        graphics.clear();
        graphics.fillStyle(0x333333, 1);
        graphics.fillCircle(bombSize, bombSize, bombSize);
        graphics.fillStyle(GAME_CONSTANTS.BOMB.color, 0.8);
        graphics.fillCircle(bombSize, bombSize, bombSize * 0.8);
        graphics.fillStyle(0xffffff, 0.3);
        graphics.fillCircle(bombSize - bombSize/3, bombSize - bombSize/3, bombSize/4);
        
        bombTexture.draw(graphics, 0, 0);
        bombTexture.saveTexture('bomb');
        
        // Create mystery box texture (for unrevealed objects)
        const mysteryTexture = this.add.renderTexture(0, 0, 100, 100);
        mysteryTexture.setVisible(false);
        
        graphics.clear();
        graphics.fillStyle(0x808080, 1);
        graphics.fillRoundedRect(10, 10, 80, 80, 10);
        graphics.fillStyle(0xffffff, 0.2);
        graphics.fillRoundedRect(15, 15, 70, 70, 8);
        
        // Draw question mark
        const questionMark = this.add.text(50, 50, '?', {
            font: 'bold 48px Arial',
            color: '#ffffff'
        });
        questionMark.setOrigin(0.5);
        
        mysteryTexture.draw(graphics, 0, 0);
        mysteryTexture.draw(questionMark);
        mysteryTexture.saveTexture('mystery');
        
        // Clean up
        graphics.destroy();
        questionMark.destroy();
    }
    
    handleDeviceChange(deviceInfo) {
        // Handle device orientation or size changes
        console.log('Device changed:', deviceInfo);
        
        // Since we're using RESIZE mode, Phaser handles the canvas resize automatically
        // We just need to notify other scenes to update their elements
        
        // Update device manager's dimensions first
        this.deviceManager.calculateGameDimensions();
        
        // Notify all active scenes
        this.scene.manager.scenes.forEach(scene => {
            if (scene.scene.isActive() && scene.handleDeviceChange) {
                scene.handleDeviceChange(deviceInfo);
            }
        });
    }
}