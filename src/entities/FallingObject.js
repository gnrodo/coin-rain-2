import { GAME_CONSTANTS } from '../config/GameConfig.js';

export class FallingObject extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'mystery');
        
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        this.scene = scene;
        this.isRevealed = false;
        this.objectType = null;
        this.value = 0;
        this.fallSpeed = 0;
        
        // Scale based on device
        const scaleFactor = scene.deviceManager.scaleFactor;
        this.setScale(scaleFactor);
        
        this.setInteractive();
        this.setupInteraction();
    }
    
    spawn(x, y, type, config) {
        this.setPosition(x, y);
        this.setActive(true);
        this.setVisible(true);
        this.isRevealed = false;
        this.objectType = type;
        
        // Set texture to mystery initially
        this.setTexture('mystery');
        
        // Set properties based on type
        if (type === 'bomb') {
            this.value = 0;
            this.config = GAME_CONSTANTS.BOMB;
        } else {
            this.config = config;
            this.value = config.value;
        }
        
        // Random fall speed
        this.fallSpeed = Phaser.Math.Between(
            GAME_CONSTANTS.GAME_MECHANICS.FALL_SPEED_MIN,
            GAME_CONSTANTS.GAME_MECHANICS.FALL_SPEED_MAX
        );
        
        this.setVelocityY(this.fallSpeed);
        
        // Add slight rotation for visual interest
        this.setAngularVelocity(Phaser.Math.Between(-50, 50));
        
        // Reset alpha
        this.setAlpha(1);
        
        const scaleFactor = this.scene.deviceManager.scaleFactor;
        this.setScale(scaleFactor * 0.8);
    }
    
    setupInteraction() {
        this.on('pointerdown', this.reveal, this);
    }
    
    reveal() {
        if (this.isRevealed || !this.active) return;
        
        this.isRevealed = true;
        
        // Change texture based on type
        if (this.objectType === 'bomb') {
            this.setTexture('bomb');
            this.scene.handleBombClick(this);
        } else {
            const textureKey = `coin_${this.objectType.toLowerCase()}`;
            this.setTexture(textureKey);
            this.scene.handleCoinClick(this);
        }
        
        // Visual feedback
        this.scene.tweens.add({
            targets: this,
            scale: this.scale * 1.2,
            duration: 100,
            yoyo: true,
            onComplete: () => {
                if (this.objectType !== 'bomb') {
                    this.deactivate();
                }
            }
        });
    }
    
    update() {
        // Check if object has fallen off screen
        if (this.y > this.scene.cameras.main.height + 100) {
            this.deactivate();
        }
    }
    
    deactivate() {
        this.setActive(false);
        this.setVisible(false);
        this.setVelocity(0, 0);
        this.setAngularVelocity(0);
    }
    
    explode() {
        // Bomb explosion effect
        const emitter = this.scene.add.particles(this.x, this.y, 'bomb', {
            speed: { min: 100, max: 200 },
            scale: { start: 0.5, end: 0 },
            blendMode: 'ADD',
            lifespan: 300,
            quantity: 10
        });
        
        this.scene.time.delayedCall(300, () => {
            emitter.destroy();
        });
        
        this.deactivate();
    }
}