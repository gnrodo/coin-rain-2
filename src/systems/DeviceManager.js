export class DeviceManager {
    constructor() {
        this.isMobile = false;
        this.isTablet = false;
        this.isDesktop = false;
        this.isPortrait = false;
        this.isLandscape = false;
        this.screenWidth = 0;
        this.screenHeight = 0;
        this.gameWidth = 0;
        this.gameHeight = 0;
        this.scaleFactor = 1;
        
        this.detectDevice();
        this.calculateGameDimensions();
        this.setupOrientationListeners();
    }
    
    detectDevice() {
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        
        // Detect mobile devices
        this.isMobile = /Android|iPhone|iPod/i.test(userAgent) || 
                        ('ontouchstart' in window) ||
                        (navigator.maxTouchPoints > 0);
        
        // Detect tablets
        this.isTablet = /iPad|Android(?!.*Mobile)/i.test(userAgent);
        
        // Desktop is anything that's not mobile or tablet
        this.isDesktop = !this.isMobile && !this.isTablet;
        
        // Get screen dimensions
        this.updateScreenDimensions();
    }
    
    updateScreenDimensions() {
        this.screenWidth = window.innerWidth;
        this.screenHeight = window.innerHeight;
        this.isPortrait = this.screenHeight > this.screenWidth;
        this.isLandscape = !this.isPortrait;
    }
    
    calculateGameDimensions() {
        this.updateScreenDimensions();
        
        // Base dimensions for the game
        const BASE_WIDTH = 720;
        const BASE_HEIGHT = 1280;
        
        if (this.isPortrait || this.isMobile) {
            // Portrait mode or mobile: prioritize height
            const aspectRatio = BASE_WIDTH / BASE_HEIGHT;
            
            if (this.screenHeight / this.screenWidth > BASE_HEIGHT / BASE_WIDTH) {
                // Screen is taller than our aspect ratio
                this.gameWidth = this.screenWidth;
                this.gameHeight = this.screenWidth / aspectRatio;
            } else {
                // Screen is wider than our aspect ratio
                this.gameHeight = this.screenHeight;
                this.gameWidth = this.screenHeight * aspectRatio;
            }
        } else {
            // Landscape mode: wider play area
            const aspectRatio = 16 / 9;
            
            if (this.screenWidth / this.screenHeight > aspectRatio) {
                // Screen is wider than 16:9
                this.gameHeight = this.screenHeight;
                this.gameWidth = this.screenHeight * aspectRatio;
            } else {
                // Screen is taller than 16:9
                this.gameWidth = this.screenWidth;
                this.gameHeight = this.screenWidth / aspectRatio;
            }
        }
        
        // Calculate scale factor for UI elements
        const baseScale = this.isMobile ? 720 : 1280;
        this.scaleFactor = Math.min(this.gameWidth, this.gameHeight) / baseScale;
        
        // Ensure minimum dimensions
        this.gameWidth = Math.max(320, Math.min(this.gameWidth, 2048));
        this.gameHeight = Math.max(480, Math.min(this.gameHeight, 2048));
    }
    
    setupOrientationListeners() {
        const handleResize = () => {
            this.calculateGameDimensions();
            // Dispatch custom event for game to respond
            window.dispatchEvent(new CustomEvent('devicechange', {
                detail: this.getDeviceInfo()
            }));
        };
        
        window.addEventListener('resize', handleResize);
        window.addEventListener('orientationchange', handleResize);
        
        // Handle visibility change (important for mobile)
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                handleResize();
            }
        });
    }
    
    getDeviceInfo() {
        return {
            type: this.isDesktop ? 'desktop' : (this.isTablet ? 'tablet' : 'mobile'),
            orientation: this.isPortrait ? 'portrait' : 'landscape',
            screenWidth: this.screenWidth,
            screenHeight: this.screenHeight,
            gameWidth: this.gameWidth,
            gameHeight: this.gameHeight,
            scaleFactor: this.scaleFactor,
            isMobile: this.isMobile,
            isTablet: this.isTablet,
            isDesktop: this.isDesktop,
            isPortrait: this.isPortrait,
            isLandscape: this.isLandscape,
            pixelRatio: window.devicePixelRatio || 1
        };
    }
    
    // Helper methods for responsive design
    scaleValue(value) {
        return value * this.scaleFactor;
    }
    
    getFontSize(baseSize) {
        const scaled = baseSize * this.scaleFactor;
        return Math.max(12, Math.min(scaled, baseSize * 1.5));
    }
    
    getResponsivePosition(x, y, anchorX = 0.5, anchorY = 0.5) {
        return {
            x: this.gameWidth * x,
            y: this.gameHeight * y
        };
    }
    
    // Get safe area for UI elements (avoiding notches, etc.)
    getSafeArea() {
        const padding = this.isMobile ? 20 : 10;
        return {
            left: padding,
            right: this.gameWidth - padding,
            top: padding + (this.isMobile && this.isPortrait ? 30 : 0), // Extra padding for notch
            bottom: this.gameHeight - padding - (this.isMobile ? 20 : 0),
            width: this.gameWidth - (padding * 2),
            height: this.gameHeight - (padding * 2) - (this.isMobile && this.isPortrait ? 50 : 0)
        };
    }
}

// Singleton instance
let deviceManagerInstance = null;

export function getDeviceManager() {
    if (!deviceManagerInstance) {
        deviceManagerInstance = new DeviceManager();
    }
    return deviceManagerInstance;
}