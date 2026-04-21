class ImageOptimizer {
    constructor() {
        this.cache = new Map();
        this.preloadQueue = [];
        this.preloadInProgress = false;
        this.maxConcurrent = 3;
        this.currentLoading = 0;
    }

    compressImage(file, maxWidth = 1200, maxHeight = 1200, quality = 0.8) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let { width, height } = img;
                
                if (width > maxWidth || height > maxHeight) {
                    const ratio = Math.min(maxWidth / width, maxHeight / height);
                    width = Math.round(width * ratio);
                    height = Math.round(height * ratio);
                }
                
                canvas.width = width;
                canvas.height = height;
                
                const ctx = canvas.getContext('2d');
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(img, 0, 0, width, height);
                
                const compressedUrl = canvas.toDataURL('image/jpeg', quality);
                URL.revokeObjectURL(img.src);
                resolve({
                    url: compressedUrl,
                    width,
                    height,
                    originalSize: file.size,
                    compressedSize: this.getBase64Size(compressedUrl)
                });
            };
            
            img.onerror = () => {
                URL.revokeObjectURL(img.src);
                reject(new Error('Failed to load image'));
            };
            
            img.src = URL.createObjectURL(file);
        });
    }

    getBase64Size(base64) {
        const data = base64.split(',')[1];
        return Math.round((data.length * 3) / 4);
    }

    async preloadImages(imageUrls, options = {}) {
        const { 
            priority = 'high', 
            maxCount = 10, 
            onProgress = () => {} 
        } = options;
        
        const urlsToLoad = imageUrls.slice(0, maxCount);
        this.preloadQueue = [...this.preloadQueue, ...urlsToLoad];
        
        if (!this.preloadInProgress) {
            await this.processPreloadQueue(onProgress);
        }
    }

    async processPreloadQueue(onProgress) {
        this.preloadInProgress = true;
        
        while (this.preloadQueue.length > 0) {
            const batch = this.preloadQueue.splice(0, this.maxConcurrent);
            const promises = batch.map(url => this.loadAndCache(url));
            
            await Promise.all(promises);
            onProgress(1 - this.preloadQueue.length / (batch.length + this.preloadQueue.length));
        }
        
        this.preloadInProgress = false;
    }

    loadAndCache(url) {
        return new Promise((resolve) => {
            if (this.cache.has(url)) {
                resolve(this.cache.get(url));
                return;
            }
            
            const img = new Image();
            img.onload = () => {
                this.cache.set(url, img);
                resolve(img);
            };
            img.onerror = () => {
                resolve(null);
            };
            img.src = url;
        });
    }

    getFromCache(url) {
        return this.cache.get(url);
    }

    clearCache() {
        this.cache.clear();
    }

    async createThumbnail(url, size = 200) {
        return new Promise((resolve) => {
            const cached = this.cache.get(`thumb_${url}_${size}`);
            if (cached) {
                resolve(cached);
                return;
            }
            
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const scale = size / Math.max(img.width, img.height);
                const width = Math.round(img.width * scale);
                const height = Math.round(img.height * scale);
                
                canvas.width = width;
                canvas.height = height;
                
                const ctx = canvas.getContext('2d');
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(img, 0, 0, width, height);
                
                const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.7);
                this.cache.set(`thumb_${url}_${size}`, thumbnailUrl);
                resolve(thumbnailUrl);
            };
            img.onerror = () => {
                resolve(url);
            };
            img.src = url;
        });
    }

    estimateMemoryUsage(images) {
        let totalBytes = 0;
        images.forEach(img => {
            if (img.url.startsWith('data:')) {
                totalBytes += this.getBase64Size(img.url);
            } else {
                totalBytes += img.width * img.height * 4;
            }
        });
        return Math.round(totalBytes / 1024 / 1024);
    }
}

class LazyLoader {
    constructor(options = {}) {
        this.options = {
            rootMargin: '200px',
            threshold: 0.1,
            loadCallback: () => {},
            errorCallback: () => {},
            ...options
        };
        
        this.observer = null;
        this.observedElements = new Map();
    }

    init() {
        if ('IntersectionObserver' in window) {
            this.observer = new IntersectionObserver(
                this.handleIntersection.bind(this),
                this.options
            );
        }
    }

    observe(element, data) {
        if (this.observer) {
            this.observedElements.set(element, data);
            this.observer.observe(element);
        } else {
            this.loadImage(element, data);
        }
    }

    unobserve(element) {
        if (this.observer) {
            this.observer.unobserve(element);
            this.observedElements.delete(element);
        }
    }

    disconnect() {
        if (this.observer) {
            this.observer.disconnect();
            this.observedElements.clear();
        }
    }

    handleIntersection(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const element = entry.target;
                const data = this.observedElements.get(element);
                if (data) {
                    this.loadImage(element, data);
                    this.unobserve(element);
                }
            }
        });
    }

    async loadImage(element, data) {
        try {
            const img = new Image();
            
            if (data.thumbnail) {
                element.src = data.thumbnail;
            }
            
            img.onload = () => {
                element.src = data.src;
                this.options.loadCallback(element, data);
            };
            
            img.onerror = () => {
                if (data.fallback) {
                    element.src = data.fallback;
                }
                this.options.errorCallback(element, data);
            };
            
            img.src = data.src;
        } catch (error) {
            this.options.errorCallback(element, data, error);
        }
    }
}

window.ImageOptimizer = ImageOptimizer;
window.LazyLoader = LazyLoader;