import { createGameConfig } from './config/GameConfig.js';
import { getDeviceManager } from './systems/DeviceManager.js';

// Wait for DOM to be ready
window.addEventListener('DOMContentLoaded', () => {
    // Initialize device manager first
    const deviceManager = getDeviceManager();
    
    // Create and start Phaser game
    const config = createGameConfig();
    const game = new Phaser.Game(config);
    
    // Prevent right-click context menu
    document.addEventListener('contextmenu', (e) => e.preventDefault());
    
    // Prevent scrolling on mobile
    document.addEventListener('touchmove', (e) => {
        if (e.target.closest('#phaser-game')) {
            e.preventDefault();
        }
    }, { passive: false });
    
    // Handle visibility change
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            game.scene.pause('GameScene');
        } else {
            game.scene.resume('GameScene');
        }
    });
    
    // Log initialization
    console.log('Coin Rain Game initialized');
    console.log('Device Info:', deviceManager.getDeviceInfo());
});