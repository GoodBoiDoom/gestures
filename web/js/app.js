// Lo-Fi Music Player App
class LoFiMusicPlayer {
    constructor() {
        this.audio = document.getElementById('audio-player');
        this.isPlaying = false;
        this.currentTrackIndex = 0;
        this.volume = 0.7;
        
        // Track data
        this.tracks = [
            {
                title: "Midnight Coffee",
                artist: "Chill Beats Collective",
                duration: "3:45",
                src: "assets/audio/midnight-coffee.mp3"
            },
            {
                title: "Rainy Window",
                artist: "Lofi Dreams",
                duration: "4:12",
                src: "assets/audio/rainy-window.mp3"
            },
            {
                title: "Cosmic Drift",
                artist: "Space Vibes",
                duration: "5:23",
                src: "assets/audio/cosmic-drift.mp3"
            },
            {
                title: "Forest Stream",
                artist: "Nature Sounds Co.",
                duration: "4:56",
                src: "assets/audio/forest-stream.mp3"
            }
        ];
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.setupAudio();
        this.createParticles();
        this.updateTrackInfo();
        
        // Set initial volume
        this.audio.volume = this.volume;
        document.querySelector('.volume-slider').value = this.volume * 100;
    }
    
    setupEventListeners() {
        // Play/pause button
        document.getElementById('play-pause-btn').addEventListener('click', () => {
            this.togglePlayPause();
        });
        
        // Previous/next buttons
        document.getElementById('prev-btn').addEventListener('click', () => {
            this.previousTrack();
        });
        
        document.getElementById('next-btn').addEventListener('click', () => {
            this.nextTrack();
        });
        
        // Volume control
        document.querySelector('.volume-slider').addEventListener('input', (e) => {
            this.setVolume(e.target.value / 100);
        });
        
        // Progress bar click
        document.querySelector('.progress-bar').addEventListener('click', (e) => {
            this.seekTo(e);
        });
        
        // Scene selector buttons
        document.querySelectorAll('.scene-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.switchScene(btn.dataset.scene);
                this.updateActiveSceneBtn(btn);
            });
        });
        
        // Track list items
        document.querySelectorAll('.track-item').forEach((item, index) => {
            item.addEventListener('click', () => {
                this.selectTrack(index);
            });
        });
        
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            this.handleKeyboard(e);
        });
        
        // Touch controls for mobile
        this.setupTouchControls();
    }
    
    setupAudio() {
        // Audio event listeners
        this.audio.addEventListener('loadedmetadata', () => {
            this.updateDuration();
        });
        
        this.audio.addEventListener('timeupdate', () => {
            this.updateProgress();
        });
        
        this.audio.addEventListener('ended', () => {
            this.nextTrack();
        });
        
        this.audio.addEventListener('canplay', () => {
            // Audio is ready to play
            this.updateDuration();
        });
        
        this.audio.addEventListener('error', (e) => {
            console.log('Audio error:', e);
            // Handle audio loading errors gracefully
            this.showNotification('Unable to load audio track');
        });
    }
    
    togglePlayPause() {
        const playBtn = document.getElementById('play-pause-btn');
        
        if (this.isPlaying) {
            this.audio.pause();
            playBtn.textContent = '▶️';
            this.isPlaying = false;
            this.pauseAnimations();
        } else {
            this.audio.play().catch(e => {
                console.log('Playback failed:', e);
                this.showNotification('Playback failed. Click to try again.');
            });
            playBtn.textContent = '⏸️';
            this.isPlaying = true;
            this.resumeAnimations();
        }
    }
    
    previousTrack() {
        this.currentTrackIndex = (this.currentTrackIndex - 1 + this.tracks.length) % this.tracks.length;
        this.loadTrack();
    }
    
    nextTrack() {
        this.currentTrackIndex = (this.currentTrackIndex + 1) % this.tracks.length;
        this.loadTrack();
    }
    
    selectTrack(index) {
        this.currentTrackIndex = index;
        this.loadTrack();
        this.updateActiveTrackItem();
    }
    
    loadTrack() {
        const track = this.tracks[this.currentTrackIndex];
        this.audio.src = track.src;
        this.updateTrackInfo();
        this.updateActiveTrackItem();
        
        if (this.isPlaying) {
            this.audio.play().catch(e => {
                console.log('Auto-play failed:', e);
            });
        }
    }
    
    updateTrackInfo() {
        const track = this.tracks[this.currentTrackIndex];
        document.querySelector('.track-title').textContent = track.title;
        document.querySelector('.track-artist').textContent = track.artist;
    }
    
    updateActiveTrackItem() {
        document.querySelectorAll('.track-item').forEach((item, index) => {
            item.classList.toggle('active', index === this.currentTrackIndex);
        });
    }
    
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        this.audio.volume = this.volume;
        
        // Update volume icon
        const volumeIcon = document.querySelector('.volume-icon');
        if (this.volume === 0) {
            volumeIcon.textContent = '🔇';
        } else if (this.volume < 0.5) {
            volumeIcon.textContent = '🔉';
        } else {
            volumeIcon.textContent = '🔊';
        }
    }
    
    seekTo(e) {
        const progressBar = e.currentTarget;
        const rect = progressBar.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        const seekTime = percent * this.audio.duration;
        
        if (!isNaN(seekTime)) {
            this.audio.currentTime = seekTime;
        }
    }
    
    updateProgress() {
        if (this.audio.duration) {
            const percent = (this.audio.currentTime / this.audio.duration) * 100;
            document.querySelector('.progress-fill').style.width = `${percent}%`;
            
            // Update current time display
            document.querySelector('.current-time').textContent = this.formatTime(this.audio.currentTime);
        }
    }
    
    updateDuration() {
        if (this.audio.duration) {
            document.querySelector('.total-time').textContent = this.formatTime(this.audio.duration);
        }
    }
    
    formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';
        
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    
    switchScene(sceneId) {
        // Remove active class from all scenes
        document.querySelectorAll('.background-scene').forEach(scene => {
            scene.classList.remove('active');
        });
        
        // Add active class to selected scene
        document.getElementById(sceneId).classList.add('active');
        
        // Trigger scene-specific effects
        this.triggerSceneEffects(sceneId);
    }
    
    updateActiveSceneBtn(activeBtn) {
        document.querySelectorAll('.scene-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        activeBtn.classList.add('active');
    }
    
    triggerSceneEffects(sceneId) {
        // Add temporary visual effects when switching scenes
        const overlay = document.querySelector('.particles-overlay');
        overlay.style.animation = 'none';
        overlay.offsetHeight; // Trigger reflow
        overlay.style.animation = 'particles 15s linear infinite';
        
        // Scene-specific audio effects could be added here
        switch(sceneId) {
            case 'rainfall-scene':
                this.showNotification('🌧️ Rainfall vibes activated');
                break;
            case 'space-scene':
                this.showNotification('🌌 Cosmic journey initiated');
                break;
            case 'waterfall-scene':
                this.showNotification('💧 Nature sounds flowing');
                break;
        }
    }
    
    handleKeyboard(e) {
        switch(e.code) {
            case 'Space':
                e.preventDefault();
                this.togglePlayPause();
                break;
            case 'ArrowLeft':
                e.preventDefault();
                this.previousTrack();
                break;
            case 'ArrowRight':
                e.preventDefault();
                this.nextTrack();
                break;
            case 'ArrowUp':
                e.preventDefault();
                this.setVolume(this.volume + 0.1);
                document.querySelector('.volume-slider').value = this.volume * 100;
                break;
            case 'ArrowDown':
                e.preventDefault();
                this.setVolume(this.volume - 0.1);
                document.querySelector('.volume-slider').value = this.volume * 100;
                break;
            case 'Digit1':
                this.switchScene('rainfall-scene');
                break;
            case 'Digit2':
                this.switchScene('space-scene');
                break;
            case 'Digit3':
                this.switchScene('waterfall-scene');
                break;
        }
    }
    
    setupTouchControls() {
        let touchStartX = 0;
        let touchStartY = 0;
        
        document.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        });
        
        document.addEventListener('touchend', (e) => {
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            const deltaX = touchEndX - touchStartX;
            const deltaY = touchEndY - touchStartY;
            
            // Swipe detection
            if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
                if (deltaX > 0) {
                    this.nextTrack(); // Swipe right - next track
                } else {
                    this.previousTrack(); // Swipe left - previous track
                }
            }
        });
    }
    
    createParticles() {
        // Create floating particles for ambient effects
        const particlesContainer = document.querySelector('.particles-overlay');
        
        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div');
            particle.style.position = 'absolute';
            particle.style.width = Math.random() * 4 + 1 + 'px';
            particle.style.height = particle.style.width;
            particle.style.backgroundColor = 'rgba(238, 226, 220, 0.3)';
            particle.style.borderRadius = '50%';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.top = Math.random() * 100 + '%';
            particle.style.pointerEvents = 'none';
            particle.style.animation = `float ${5 + Math.random() * 10}s ease-in-out infinite`;
            particle.style.animationDelay = Math.random() * 5 + 's';
            
            particlesContainer.appendChild(particle);
        }
    }
    
    pauseAnimations() {
        document.querySelector('.pixel-art-cover').style.animationPlayState = 'paused';
    }
    
    resumeAnimations() {
        document.querySelector('.pixel-art-cover').style.animationPlayState = 'running';
    }
    
    showNotification(message) {
        // Create a temporary notification
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(233, 69, 96, 0.9);
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 10px;
            font-family: var(--font-tech);
            font-size: 0.9rem;
            z-index: 1000;
            animation: slideIn 0.3s ease-out;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-in forwards';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
}

// Utility functions for enhanced visual effects
class VisualEffects {
    static addGlowEffect(element) {
        element.style.filter = 'drop-shadow(0 0 10px rgba(233, 69, 96, 0.5))';
        setTimeout(() => {
            element.style.filter = '';
        }, 300);
    }
    
    static createRipple(e) {
        const button = e.currentTarget;
        const rect = button.getBoundingClientRect();
        const ripple = document.createElement('span');
        const radius = Math.max(rect.width, rect.height);
        
        ripple.style.cssText = `
            width: ${radius}px;
            height: ${radius}px;
            left: ${e.clientX - rect.left - radius / 2}px;
            top: ${e.clientY - rect.top - radius / 2}px;
            position: absolute;
            border-radius: 50%;
            background: rgba(238, 226, 220, 0.3);
            transform: scale(0);
            animation: ripple 0.6s linear;
            pointer-events: none;
        `;
        
        button.style.position = 'relative';
        button.style.overflow = 'hidden';
        button.appendChild(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, 600);
    }
}

// Add CSS for notifications and ripple effect
const additionalStyles = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    @keyframes ripple {
        from { transform: scale(0); opacity: 1; }
        to { transform: scale(2); opacity: 0; }
    }
`;

// Inject additional styles
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = new LoFiMusicPlayer();
    
    // Add ripple effect to all buttons
    document.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', VisualEffects.createRipple);
    });
    
    // Add glow effect to interactive elements
    document.querySelectorAll('.track-item, .scene-btn').forEach(item => {
        item.addEventListener('mouseenter', () => {
            VisualEffects.addGlowEffect(item);
        });
    });
    
    // Loading screen fade out
    setTimeout(() => {
        document.body.style.opacity = '0';
        document.body.offsetHeight; // Trigger reflow
        document.body.style.transition = 'opacity 1s ease-in-out';
        document.body.style.opacity = '1';
    }, 100);
    
    console.log('Lo-Fi Music Player initialized! 🎵');
    console.log('Keyboard controls:');
    console.log('- Space: Play/Pause');
    console.log('- Arrow Left/Right: Previous/Next track');
    console.log('- Arrow Up/Down: Volume control');
    console.log('- 1/2/3: Switch scenes');
});