import { getDeviceManager } from '../systems/DeviceManager.js';
import { BootScene } from '../scenes/BootScene.js';
import { GameScene } from '../scenes/GameScene.js';
import { UIScene } from '../scenes/UIScene.js';

export function createGameConfig() {
    const deviceManager = getDeviceManager();
    const deviceInfo = deviceManager.getDeviceInfo();
    
    return {
        type: Phaser.AUTO,
        parent: 'phaser-game',
        width: deviceInfo.gameWidth,
        height: deviceInfo.gameHeight,
        backgroundColor: '#87CEEB',
        scale: {
            mode: Phaser.Scale.FIT,
            autoCenter: Phaser.Scale.CENTER_BOTH,
            width: deviceInfo.gameWidth,
            height: deviceInfo.gameHeight
        },
        physics: {
            default: 'arcade',
            arcade: {
                gravity: { y: 0 },
                debug: false
            }
        },
        scene: [BootScene, GameScene, UIScene],
        input: {
            activePointers: 3,
            touch: {
                target: null,
                capture: false
            }
        },
        render: {
            antialias: true,
            pixelArt: false,
            roundPixels: false,
            transparent: false
        },
        fps: {
            target: 60,
            forceSetTimeOut: false
        }
    };
}

// Game constants
export const GAME_CONSTANTS = {
    // Coin types and values
    COINS: {
        BRONZE: { value: 10, color: 0xCD7F32, probability: 0.35, size: 30 },
        SILVER: { value: 25, color: 0xC0C0C0, probability: 0.25, size: 35 },
        GOLD: { value: 50, color: 0xFFD700, probability: 0.20, size: 40 },
        PLATINUM: { value: 100, color: 0xE5E4E2, probability: 0.15, size: 45 },
        DIAMOND: { value: 500, color: 0xB9F2FF, probability: 0.05, size: 50 }
    },
    
    // Bomb properties
    BOMB: {
        color: 0xFF0000,
        probability: 0.25, // 25% chance to spawn a bomb
        size: 40,
        damage: 1
    },
    
    // Game mechanics
    GAME_MECHANICS: {
        INITIAL_LIVES: 3,
        INITIAL_SPAWN_RATE: 1000, // ms between spawns
        MIN_SPAWN_RATE: 300,
        SPAWN_RATE_DECREASE: 50, // Decrease spawn rate every level
        FALL_SPEED_MIN: 200,
        FALL_SPEED_MAX: 400,
        STREAK_BONUS_THRESHOLD: 3,
        NIGHT_MODE_MULTIPLIER: 5
    },
    
    // Visual settings
    VISUALS: {
        DAY_BACKGROUND: ['#87CEEB', '#98D8C8'],
        NIGHT_BACKGROUND: ['#0C1445', '#2C3E50'],
        PARTICLE_COLORS: {
            COIN: [0xFFD700, 0xFFF8DC, 0xF0E68C],
            BOMB: [0xFF4500, 0xFF6347, 0xDC143C]
        },
        TRANSITION_DURATION: 1000
    },
    
    // UI settings
    UI: {
        FONT_FAMILY: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        COLORS: {
            PRIMARY: '#FFFFFF',
            SECONDARY: '#FFD700',
            DANGER: '#FF4444',
            SUCCESS: '#44FF44'
        },
        Z_INDEXES: {
            BACKGROUND: 0,
            FALLING_OBJECTS: 10,
            PARTICLES: 20,
            UI: 30,
            FLOATING_TEXT: 40
        }
    }
};

// Helper function to get responsive values
export function getResponsiveValue(baseValue, deviceManager) {
    return deviceManager.scaleValue(baseValue);
}