class PerformanceMonitor {
    constructor() {
        this.fpsHistory = [];
        this.memoryHistory = [];
        this.frameTimes = [];
        this.lastTime = performance.now();
        this.frameCount = 0;
        this.fpsUpdateInterval = null;
        this.memoryUpdateInterval = null;
        this.enabled = false;
        
        this.stats = {
            fps: 0,
            avgFps: 0,
            minFps: 60,
            maxFps: 0,
            memory: 0,
            memoryPeak: 0,
            frameTime: 0,
            avgFrameTime: 0,
            droppedFrames: 0,
            totalFrames: 0
        };
        
        this.callbacks = [];
    }

    start() {
        if (this.enabled) return;
        this.enabled = true;
        
        this.fpsUpdateInterval = setInterval(() => {
            this.stats.fps = this.frameCount * 2;
            this.fpsHistory.push(this.stats.fps);
            if (this.fpsHistory.length > 60) this.fpsHistory.shift();
            
            this.stats.avgFps = this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;
            this.stats.minFps = Math.min(this.stats.minFps, this.stats.fps);
            this.stats.maxFps = Math.max(this.stats.maxFps, this.stats.fps);
            this.frameCount = 0;
        }, 500);
        
        this.memoryUpdateInterval = setInterval(() => {
            if (performance.memory) {
                this.stats.memory = Math.round(performance.memory.usedJSHeapSize / 1024 / 1024);
                this.stats.memoryPeak = Math.max(this.stats.memoryPeak, this.stats.memory);
                this.memoryHistory.push(this.stats.memory);
                if (this.memoryHistory.length > 60) this.memoryHistory.shift();
            }
        }, 1000);
        
        this.notify();
    }

    stop() {
        this.enabled = false;
        if (this.fpsUpdateInterval) clearInterval(this.fpsUpdateInterval);
        if (this.memoryUpdateInterval) clearInterval(this.memoryUpdateInterval);
    }

    tick() {
        if (!this.enabled) return;
        
        const now = performance.now();
        const frameTime = now - this.lastTime;
        this.lastTime = now;
        
        this.frameCount++;
        this.stats.totalFrames++;
        this.stats.frameTime = frameTime;
        
        this.frameTimes.push(frameTime);
        if (this.frameTimes.length > 60) this.frameTimes.shift();
        this.stats.avgFrameTime = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
        
        if (frameTime > 16.67) {
            this.stats.droppedFrames++;
        }
        
        this.notify();
    }

    onUpdate(callback) {
        this.callbacks.push(callback);
        return () => {
            const index = this.callbacks.indexOf(callback);
            if (index > -1) this.callbacks.splice(index, 1);
        };
    }

    notify() {
        this.callbacks.forEach(cb => cb({ ...this.stats }));
    }

    getReport() {
        return {
            ...this.stats,
            fpsHistory: [...this.fpsHistory],
            memoryHistory: [...this.memoryHistory],
            frameTimeHistory: [...this.frameTimes]
        };
    }

    reset() {
        this.stats = {
            fps: 0,
            avgFps: 0,
            minFps: 60,
            maxFps: 0,
            memory: 0,
            memoryPeak: 0,
            frameTime: 0,
            avgFrameTime: 0,
            droppedFrames: 0,
            totalFrames: 0
        };
        this.fpsHistory = [];
        this.memoryHistory = [];
        this.frameTimes = [];
    }
}

class PerformanceOverlay {
    constructor(monitor) {
        this.monitor = monitor;
        this.container = null;
        this.visible = false;
    }

    init() {
        this.container = document.createElement('div');
        this.container.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: rgba(10, 10, 15, 0.9);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 12px;
            padding: 16px;
            font-family: -apple-system, BlinkMacSystemFont, monospace;
            font-size: 12px;
            color: #fff;
            z-index: 9999;
            min-width: 180px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.4);
        `;
        
        this.monitor.onUpdate(stats => this.update(stats));
        document.body.appendChild(this.container);
        this.show();
    }

    update(stats) {
        const fpsColor = stats.fps >= 55 ? '#34C759' : stats.fps >= 30 ? '#FF9500' : '#FF453A';
        const memoryColor = stats.memory < 200 ? '#34C759' : stats.memory < 400 ? '#FF9500' : '#FF453A';
        
        this.container.innerHTML = `
            <div style="margin-bottom: 8px; font-weight: 600; font-size: 13px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 8px;">
                ⚡ Performance Monitor
            </div>
            <div style="display: flex; justify-content: space-between; margin: 4px 0;">
                <span>FPS:</span>
                <span style="color: ${fpsColor}; font-weight: 600;">${Math.round(stats.fps)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin: 4px 0;">
                <span>Avg FPS:</span>
                <span style="color: ${stats.avgFps >= 55 ? '#34C759' : '#FF9500'};">${Math.round(stats.avgFps)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin: 4px 0;">
                <span>Min FPS:</span>
                <span>${Math.round(stats.minFps)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin: 4px 0;">
                <span>Memory:</span>
                <span style="color: ${memoryColor}; font-weight: 600;">${stats.memory} MB</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin: 4px 0;">
                <span>Peak Mem:</span>
                <span>${stats.memoryPeak} MB</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin: 4px 0;">
                <span>Frame Time:</span>
                <span>${stats.frameTime.toFixed(2)}ms</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin: 4px 0;">
                <span>Dropped:</span>
                <span>${stats.droppedFrames}/${stats.totalFrames}</span>
            </div>
            <div style="margin-top: 8px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 8px; font-size: 10px; color: rgba(255,255,255,0.5);">
                ${stats.fps >= 55 ? '✓ Smooth' : stats.fps >= 30 ? '⚠ Medium' : '✗ Lag'}
            </div>
        `;
    }

    show() {
        this.visible = true;
        this.container.style.display = 'block';
    }

    hide() {
        this.visible = false;
        this.container.style.display = 'none';
    }

    toggle() {
        if (this.visible) this.hide();
        else this.show();
    }
}

window.PerformanceMonitor = PerformanceMonitor;
window.PerformanceOverlay = PerformanceOverlay;