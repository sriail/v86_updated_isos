// V86 Emulator Controller
import V86Starter from './lib/libv86.mjs';

let emulator = null;
let startTime = null;
let metricsInterval = null;
let savedState = null;

// DOM Elements
const elements = {
    startBtn: document.getElementById('start-btn'),
    stopBtn: document.getElementById('stop-btn'),
    resetBtn: document.getElementById('reset-btn'),
    fullscreenBtn: document.getElementById('fullscreen-btn'),
    screenshotBtn: document.getElementById('screenshot-btn'),
    saveStateBtn: document.getElementById('save-state-btn'),
    restoreStateBtn: document.getElementById('restore-state-btn'),
    speedMetric: document.getElementById('speed-metric'),
    memoryMetric: document.getElementById('memory-metric'),
    ipsMetric: document.getElementById('ips-metric'),
    statusMetric: document.getElementById('status-metric'),
    uptimeMetric: document.getElementById('uptime-metric'),
    log: document.getElementById('log'),
    screenContainer: document.getElementById('screen_container')
};

// Logging function
function log(message, type = 'info') {
    const time = new Date().toLocaleTimeString();
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    entry.innerHTML = `<span class="log-time">[${time}]</span> <span class="log-message">${message}</span>`;
    elements.log.appendChild(entry);
    elements.log.scrollTop = elements.log.scrollHeight;
    
    // Keep only last 100 log entries
    while (elements.log.children.length > 100) {
        elements.log.removeChild(elements.log.firstChild);
    }
}

// Update metrics
function updateMetrics() {
    if (!emulator || !startTime) return;

    const uptime = Math.floor((Date.now() - startTime) / 1000);
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = uptime % 60;
    
    let uptimeStr = '';
    if (hours > 0) uptimeStr += `${hours}h `;
    if (minutes > 0 || hours > 0) uptimeStr += `${minutes}m `;
    uptimeStr += `${seconds}s`;
    
    elements.uptimeMetric.textContent = uptimeStr;

    // Try to get emulator stats
    try {
        const stats = emulator.get_statistics();
        if (stats) {
            // Calculate MIPS (instructions per second / 1,000,000)
            const mips = stats.instructions_per_second ? 
                (stats.instructions_per_second / 1000000).toFixed(2) : '0.00';
            elements.speedMetric.textContent = `${mips} MIPS`;
            
            // Format IPS with commas
            const ips = stats.instructions_per_second ? 
                stats.instructions_per_second.toLocaleString() : '0';
            elements.ipsMetric.textContent = ips;
        }
    } catch (e) {
        // Stats might not be available yet
    }

    // Memory usage (estimate based on emulator configuration)
    elements.memoryMetric.textContent = '128 MB';
}

// Initialize emulator
function initEmulator() {
    log('Initializing V86 emulator...');
    elements.statusMetric.textContent = 'Initializing...';

    const config = {
        wasm_path: "lib/v86.wasm",
        memory_size: 128 * 1024 * 1024, // 128MB
        vga_memory_size: 8 * 1024 * 1024, // 8MB
        screen_container: elements.screenContainer,
        bios: {
            url: "lib/seabios.bin",
        },
        vga_bios: {
            url: "lib/vgabios.bin",
        },
        // ISO Configuration
        // Download SliTaz ISO from: http://mirror.slitaz.org/iso/rolling/
        // Place the ISO file in public/iso/ directory and uncomment:
        // cdrom: {
        //     url: "iso/slitaz-rolling.iso",
        // },
        // boot_order: 0x123, // Boot from CD-ROM first
        autostart: true,
    };

    try {
        emulator = new V86Starter(config);
        
        emulator.add_listener("emulator-started", function() {
            log('Emulator started successfully');
            elements.statusMetric.textContent = 'Running';
            startTime = Date.now();
            
            // Enable controls
            elements.stopBtn.disabled = false;
            elements.resetBtn.disabled = false;
            elements.fullscreenBtn.disabled = false;
            elements.screenshotBtn.disabled = false;
            elements.saveStateBtn.disabled = false;
            if (savedState) {
                elements.restoreStateBtn.disabled = false;
            }
            elements.startBtn.disabled = true;

            // Start metrics updates
            metricsInterval = setInterval(updateMetrics, 1000);
        });

        emulator.add_listener("emulator-stopped", function() {
            log('Emulator stopped');
            elements.statusMetric.textContent = 'Stopped';
            
            if (metricsInterval) {
                clearInterval(metricsInterval);
                metricsInterval = null;
            }
        });

        emulator.add_listener("download-progress", function(e) {
            if (e.file_name && e.loaded !== undefined && e.total !== undefined) {
                const percent = ((e.loaded / e.total) * 100).toFixed(1);
                log(`Downloading ${e.file_name}: ${percent}%`);
            }
        });

        emulator.add_listener("download-error", function(e) {
            log(`Error downloading ${e.file_name || 'file'}`, 'error');
            elements.statusMetric.textContent = 'Download Error';
        });

    } catch (error) {
        log(`Error initializing emulator: ${error.message}`, 'error');
        elements.statusMetric.textContent = 'Error';
        console.error(error);
    }
}

// Stop emulator
function stopEmulator() {
    if (emulator) {
        log('Stopping emulator...');
        emulator.stop();
        
        // Disable controls
        elements.stopBtn.disabled = true;
        elements.resetBtn.disabled = true;
        elements.fullscreenBtn.disabled = true;
        elements.screenshotBtn.disabled = true;
        elements.saveStateBtn.disabled = true;
        elements.restoreStateBtn.disabled = true;
        elements.startBtn.disabled = false;
        
        elements.statusMetric.textContent = 'Stopped';
        
        if (metricsInterval) {
            clearInterval(metricsInterval);
            metricsInterval = null;
        }
    }
}

// Reset emulator
function resetEmulator() {
    if (emulator) {
        log('Resetting emulator...');
        emulator.restart();
        startTime = Date.now();
        elements.statusMetric.textContent = 'Restarting...';
    }
}

// Toggle fullscreen
function toggleFullscreen() {
    const elem = elements.screenContainer;
    
    if (!document.fullscreenElement) {
        elem.requestFullscreen().then(() => {
            log('Entered fullscreen mode');
        }).catch(err => {
            log(`Error entering fullscreen: ${err.message}`, 'error');
        });
    } else {
        document.exitFullscreen().then(() => {
            log('Exited fullscreen mode');
        });
    }
}

// Take screenshot
function takeScreenshot() {
    if (emulator) {
        try {
            const screenshot = emulator.screen_make_screenshot();
            const canvas = screenshot.toDataURL("image/png");
            
            // Create download link
            const link = document.createElement('a');
            link.download = `v86-screenshot-${Date.now()}.png`;
            link.href = canvas;
            link.click();
            
            log('Screenshot saved');
        } catch (error) {
            log(`Error taking screenshot: ${error.message}`, 'error');
        }
    }
}

// Save state
function saveState() {
    if (emulator) {
        log('Saving emulator state...');
        emulator.save_state(function(error, state) {
            if (error) {
                log(`Error saving state: ${error}`, 'error');
            } else {
                savedState = state;
                elements.restoreStateBtn.disabled = false;
                log(`State saved (${(state.byteLength / 1024).toFixed(2)} KB)`);
            }
        });
    }
}

// Restore state
function restoreState() {
    if (emulator && savedState) {
        log('Restoring emulator state...');
        emulator.restore_state(savedState);
        log('State restored');
    }
}

// Event Listeners
elements.startBtn.addEventListener('click', initEmulator);
elements.stopBtn.addEventListener('click', stopEmulator);
elements.resetBtn.addEventListener('click', resetEmulator);
elements.fullscreenBtn.addEventListener('click', toggleFullscreen);
elements.screenshotBtn.addEventListener('click', takeScreenshot);
elements.saveStateBtn.addEventListener('click', saveState);
elements.restoreStateBtn.addEventListener('click', restoreState);

// Handle fullscreen change
document.addEventListener('fullscreenchange', () => {
    if (document.fullscreenElement) {
        elements.fullscreenBtn.innerHTML = `
            <svg class="icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/>
            </svg>
            Exit Fullscreen
        `;
    } else {
        elements.fullscreenBtn.innerHTML = `
            <svg class="icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
            </svg>
            Fullscreen
        `;
    }
});

// Initial log message
log('V86 Emulator ready. BIOS files loaded.');
log('To run SliTaz 5.0:');
log('1. Download SliTaz ISO from: http://mirror.slitaz.org/iso/rolling/');
log('2. Place ISO in public/iso/ directory');
log('3. Update app.js configuration (uncomment cdrom section)');
log('4. Click "Start" to begin');

// Update status
elements.statusMetric.textContent = 'Ready';
